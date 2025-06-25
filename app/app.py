from flask import Flask, send_from_directory, jsonify, Response, request, make_response
from flask_wtf.csrf import CSRFProtect, generate_csrf, CSRFError
from flask_cors import CORS
from flask_compress import Compress
import gzip
import hdf5plugin
import h5py
import threading
from diskcache import Cache
import glob
import time
import os
import numpy as np
from packages.script import return_spots_data
from packages.XDS_find_spots import XDS_find_spots
from packages.crypto import login_attempt
from packages.obtain_image_metadata import obtain_image_metadata
import sys
import json
from dotenv import load_dotenv
import uuid
from concurrent.futures import ThreadPoolExecutor

cache_dir = os.path.join(os.path.dirname(__file__), 'frame_cache')
disk_cache = Cache(cache_dir, size_limit=10 * 1024 * 1024 * 1024)

prefetch_pool = ThreadPoolExecutor(
    max_workers=8
)

dataset_managers = {}
registry_lock = threading.Lock()

load_dotenv()

app = Flask(__name__)
app.config["COMPRESS_ALGORITHM"] = ["gzip"]
app.config["COMPRESS_LEVEL"] = 6
app.config["COMPRESS_MIN_SIZE"] = 500
Compress(app)

BASE_DIR = os.getenv('BASE_DIR')
API_URL = os.getenv('API_URL')
APP_PORT = os.getenv('APP_PORT')
SECRET_KEY = os.getenv('SECRET_KEY')
FRONTEND_ORIGIN = os.getenv('FRONTEND_ORIGIN')
os.environ["HDF5_PLUGIN_PATH"] = hdf5plugin.PLUGIN_PATH
FILE_TYPE = 'master.h5'

CORS(app,
     resources={r"/*": {"origins": "*"}},
     supports_credentials=True,
     allow_headers=["Content-Type", "X-CSRFToken"],
     expose_headers=["Content-Type", "X-CSRFToken"])

app.config['SECRET_KEY'] = SECRET_KEY
csrf = CSRFProtect(app)


IDLE_TIMEOUT = 30 * 60
CLEANUP_PERIOD = 5 * 60

def cleanup_idle_managers():
    while True:
        time.sleep(CLEANUP_PERIOD)
        now = time.time()
        with registry_lock:
            expired = []
            for session_id, manager in dataset_managers.items():
                idle_time = now - manager.last_access
                if idle_time > IDLE_TIMEOUT:
                    expired.append(session_id)
            for session_id in expired:
                manager = dataset_managers.pop(session_id)
                print(
                    f"Removing idle session "
                    f"{session_id}"
                )
                manager.close()

cleanup_thread = threading.Thread(
    target=cleanup_idle_managers,
    daemon=True,
)
cleanup_thread.start()

@app.route("/api/csrf-token", methods=["GET"])
def csrf_token():
    token = generate_csrf()
    return jsonify({"csrf_token": token})

class DatasetManager:

    def __init__(self):
        self._files = []
        self._datasets = []
        self._offsets = []
        self._path = None
        self._total_frames = 0
        self.last_access = time.time()
        self._lock = threading.Lock()

    def open(self, master_path: str):
        with self._lock:

            if self._path == master_path:
                return

            for f in self._files:
                try:
                    f.close()
                except Exception:
                    pass

            self._files = []
            self._datasets = []
            self._offsets = []
            self._total_frames = 0

            data_paths = sorted(
                glob.glob(
                    master_path.replace(
                        "_master.h5",
                        "_data_*.h5"
                    )
                )
            )

            print("Opening data files:")
            for p in data_paths:
                print(f"  {p}")

            cumulative = 0

            for path in data_paths:
                f = h5py.File(
                    path,
                    "r",
                    libver="latest",
                    swmr=True,
                )

                ds = f["/entry/data/data"]

                self._files.append(f)
                self._datasets.append(ds)
                self._offsets.append(cumulative)

                cumulative += ds.shape[0]

            self._total_frames = cumulative
            self._path = master_path

            print(f"Total frames: {self._total_frames}")

            disk_cache.evict(tag='frames')

    def locate_frame(self, idx: int):
        if idx < 0 or idx >= self._total_frames:
            raise IndexError(
                f"Frame {idx} outside valid range "
                f"[0, {self._total_frames - 1}]"
            )

        for dataset, start in zip(
            self._datasets,
            self._offsets
        ):
            end = start + dataset.shape[0]

            if start <= idx < end:
                local_idx = idx - start
                return dataset, local_idx

        raise IndexError(idx)

    def get_frames(self, start_idx: int, count: int):
        if count < 1:
            raise ValueError("count must be >= 1")

        remaining = count
        current = start_idx

        chunks = []

        while remaining > 0 and current < self._total_frames:

            dataset, local_idx = self.locate_frame(current)

            available = dataset.shape[0] - local_idx

            take = min(available, remaining)

            chunks.append(
                dataset[
                    local_idx:
                    local_idx + take
                ]
            )

            current += take
            remaining -= take

        if not chunks:
            raise IndexError(
                f"Frame {start_idx} outside dataset"
            )

        return np.concatenate(chunks, axis=0)
    
    def touch(self):
        self.last_access = time.time()
    
    def close(self):
        with self._lock:

            print("Closing DatasetManager")

            for f in self._files:
                try:
                    f.close()
                except Exception as e:
                    print(e)

            self._files = []
            self._datasets = []
            self._offsets = []
            self._total_frames = 0
            self._path = None

            disk_cache.evict(tag='frames')

    @property
    def total_frames(self):
        return self._total_frames

    @property
    def lock(self):
        return self._lock

def prefetch_one(session_id, idx, sum_value):
    try:
        get_frame(
            session_id,
            idx,
            sum_value
        )
    except Exception:
        pass

prefetch_lock = threading.Lock()

prefetch_state = {
    "session_id": None,
    "start_idx": None,
    "sum_value": None,
    "step_value": None,
}

def prefetch_worker():

    while True:

        with prefetch_lock:
            if prefetch_state["start_idx"] is None:
                state = None
            else:
                state = prefetch_state.copy()
                prefetch_state["start_idx"] = None

        if state is None:
            time.sleep(0.1)
            continue

        print(
            f"Prefetch starting "
            f"(idx={state['start_idx']}, "
            f"sum={state['sum_value']}, "
            f"step={state['step_value']})"
        )

        last_idx = state["start_idx"]

        BATCH_SIZE = 36

        for batch_start in range(0, 1800, BATCH_SIZE):

            with prefetch_lock:
                current_state = prefetch_state.copy()

            if (
                current_state["session_id"] is not None
                and (
                    current_state["session_id"]
                    != state["session_id"]
                    or current_state["sum_value"]
                    != state["sum_value"]
                    or current_state["step_value"]
                    != state["step_value"]
                )
            ):
                print("Prefetch interrupted")
                break

            futures = []

            for j in range(BATCH_SIZE):

                i = batch_start + j

                idx = (
                    state["start_idx"]
                    + i * state["step_value"]
                )

                futures.append(
                    prefetch_pool.submit(
                        prefetch_one,
                        state["session_id"],
                        idx,
                        state["sum_value"]
                    )
                )

            for future in futures:
                future.result()

        print(
            f"Prefetch finished "
            f"(last_idx={last_idx})"
        )

prefetch_thread = threading.Thread(
    target=prefetch_worker,
    daemon=True,
)

prefetch_thread.start()

def get_or_create_manager(session_id=None):
    with registry_lock:
        if session_id is None:
            session_id = str(uuid.uuid4())
            dataset_managers[session_id] = DatasetManager()
        if session_id not in dataset_managers:
            dataset_managers[session_id] = DatasetManager()
        manager = dataset_managers[session_id]
        manager.touch()
        return session_id, manager

@app.route("/api/metadata", methods=["POST"])
@csrf.exempt
def metadata():
    data = request.get_json()
    master_path = data.get("firstImagePath")
    image_metadata = obtain_image_metadata(master_path)
    (
        wavelength,
        detector_distance,
        number_of_images,
        cols,
        rows,
        beam_center_x,
        beam_center_y,
        threshold,
        pixel_size_mm,
    ) = image_metadata
    session_id = data.get("session_id")
    session_id, manager = get_or_create_manager(
        session_id
    )
    manager.touch()
    manager.open(master_path)
    return jsonify(
        {
            "session_id": session_id,
            "wavelength": wavelength,
            "detector_distance": detector_distance,
            "number_of_images": number_of_images,
            "cols": cols,
            "rows": rows,
            "beam_center_x": beam_center_x,
            "beam_center_y": beam_center_y,
            "threshold": threshold,
            "pixel_size_mm": pixel_size_mm,
        }
    )

@disk_cache.memoize(tag='frames')
def get_frame(session_id: str, idx: int, sum_value: int) -> np.ndarray:
    manager = dataset_managers[session_id]
    manager.touch()
    with manager.lock:
        frames = manager.get_frames(
            idx,
            sum_value
        )
    image = frames.mean(axis=0, dtype=np.float32)
    image[image > 1_000_000] = 0
    return image[::-1, :].astype(np.uint8)

@app.route("/api/frame/<session_id>/<int:idx>/<int:sum_value>/<int:step_value>")
@csrf.exempt
def frame(session_id, idx, sum_value, step_value):

    image = get_frame(
        session_id,
        idx,
        sum_value
    )

    with prefetch_lock:

        changed = (
            prefetch_state["session_id"]
            != session_id
            or
            prefetch_state["sum_value"]
            != sum_value
            or
            prefetch_state["step_value"]
            != step_value
        )

        if changed:

            print(
                "Prefetch configuration changed:"
                f" session={session_id}"
                f" sum={sum_value}"
                f" step={step_value}"
            )

            prefetch_state["session_id"] = (
                session_id
            )

            prefetch_state["sum_value"] = (
                sum_value
            )

            prefetch_state["step_value"] = (
                step_value
            )

        prefetch_state["start_idx"] = (
            idx + step_value
        )

    compressed = gzip.compress(
        image.tobytes(),
        compresslevel=2
    )

    response = Response(
        compressed,
        mimetype="application/octet-stream"
    )

    response.headers[
        "Content-Encoding"
    ] = "gzip"

    return response

@app.route('/api/login', methods=['POST'])
@csrf.exempt
def login():
    try:
        data = request.get_json()
        username = data.get('username')
        password = data.get('password')
        user_proposals, authentication_was_successfull = login_attempt(username, password, API_URL)

        if authentication_was_successfull:
            if len(user_proposals) > 0:
                message = 'Login successfull'
                return jsonify({'success': True, 'message': message, 'proposals' : user_proposals})
            else:
                message = 'This user is not associated with any proposals in the MANACÁ beamline.\nIf you were recently registered in a proposal, please contact beamline staff.'
                return jsonify({'success': False, 'message': message, 'proposals' : user_proposals})
        else:
            message = 'Invalid credentials.'
            return jsonify({'success': False, 'message': message, 'proposals' : user_proposals})
    except Exception as e:
        print('Exception in login_attempt:')
        print(e)
        _, _, exc_tb = sys.exc_info()
        print('Error line in app.py:', exc_tb.tb_lineno)
        print('')
        return jsonify({'success': False, 'message': 'An error occurred during login. Please contact beamline staff.'})

@app.route("/api/list_files", methods=["POST"])
@csrf.exempt
def list_files():
    data = request.get_json()
    relative_path = data.get("current_path")
    proposals = data.get("proposals")
    full_path = os.path.join(BASE_DIR, relative_path)

    if os.path.commonprefix([os.path.realpath(full_path), BASE_DIR]) != BASE_DIR:
        return jsonify({"error": f"This file is not in {BASE_DIR}"}), 403

    try:
        ls_command_output = os.listdir(full_path)
        files = []

        for entry in ls_command_output:
            if entry in proposals and relative_path == "":
                entry_path = os.path.join(full_path, entry)
                files.append({
                    "name": entry,
                    "is_dir": os.path.isdir(entry_path),
                    "path": os.path.relpath(entry_path, BASE_DIR)
                })
            elif (relative_path != "") and not (entry.startswith(".")) :
                entry_path = os.path.join(full_path, entry)
                if os.path.isdir(entry_path) or entry_path.endswith(FILE_TYPE):
                    files.append({
                        "name": entry,
                        "is_dir": os.path.isdir(entry_path),
                        "path": os.path.relpath(entry_path, BASE_DIR)
                    })

        files = sorted(files, key=lambda f: f["name"].lower())
        return jsonify({"files": files})
    except Exception as e:
        print('Error while trying to ls files:')
        print(e)
        _, _, exc_tb = sys.exc_info()
        print('Error line in app.py:', exc_tb.tb_lineno)
        print('')
        return jsonify({"error": str(e)}), 500
    
@app.route('/api/index_image/<index>', methods=['POST'])
@csrf.exempt
def index_image(index):
    data = request.get_json()
    image_path = data.get('firstImagePath')
    spots_data = return_spots_data(image_path)
    x_values, y_values, intensity_values, a, b, c, alpha, beta, gamma, space_group = spots_data
    return jsonify({'x_values': x_values,
                    'y_values' : y_values,
                    'intensity_values' : intensity_values,
                    'a': a,
                    'b': b,
                    'c': c,
                    'alpha': alpha,
                    'beta': beta,
                    'gamma': gamma,
                    'space_group': space_group})

@app.route('/api/find_spots_XDS/<index>', methods=['POST'])
@csrf.exempt
def find_spots_XDS(index):
    data = request.get_json()
    image_path = data.get('firstImagePath')
    spots_data = XDS_find_spots(image_path)
    x_values, y_values, intensity_values = spots_data
    return jsonify({'x_values': x_values,
                    'y_values' : y_values,
                    'intensity_values' : intensity_values})

@app.route('/api/plot_data', methods=['POST'])
@csrf.exempt
def plot_data():

    try:
        data = request.get_json()
        first_image_path = data.get('firstImagePath')
        resolutions = data.get('resolutionValues')
        bin_size = data.get('binSize')
        bin_size = int(bin_size)
        resolutions = sorted(resolutions)
        file_name = '/'.join(first_image_path.split('/')[0:-1]) + '/.find_spots/json_spot_data.json'

        with open(file_name, 'r') as f:
            data = json.load(f)

        image_keys = sorted(data.keys())
        image_keys = sorted([cbfimg for cbfimg in image_keys if first_image_path[0:-9] in cbfimg])
        group_counts_per_image = []

        for key in image_keys:
            image_data = data[key]
            group_counts = [0, 0, 0, 0, 0]

            for point in image_data:
                c = point[3]
                if resolutions[0] <= c < resolutions[1]:
                    group_counts[0] += 1
                elif resolutions[1] <= c < resolutions[2]:
                    group_counts[1] += 1
                elif resolutions[2] <= c < resolutions[3]:
                    group_counts[2] += 1
                elif resolutions[3] <= c < resolutions[4]:
                    group_counts[3] += 1
                elif resolutions[4] >= 4:
                    group_counts[4] += 1

            group_counts_per_image.append(group_counts)

        counts_array = np.array(group_counts_per_image)

        num_images = counts_array.shape[0]
        num_bins = num_images // bin_size + (num_images % bin_size > 0)

        binned_means = []
        x_values = []
        for i in range(num_bins):
            start = i * bin_size
            end = (i + 1) * bin_size
            bin_mean = counts_array[start:end].mean(axis=0).tolist()
            binned_means.append(bin_mean)
            x_values.append(i * bin_size + 1)

        binned_means = np.array(binned_means).T.tolist()

        return jsonify({
            'x': x_values,
            'groups': binned_means,
        })

    except Exception as e:
        print('Error while trying to plot data:')
        print(e)
        _, _, exc_tb = sys.exc_info()
        print('Error line in app.py:', exc_tb.tb_lineno)
        print('')
        return jsonify({
            'x': [],
            'groups': [],
        })

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(APP_PORT))
