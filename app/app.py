from flask import Flask, send_from_directory, jsonify, Response, request, make_response
from flask_wtf.csrf import CSRFProtect, generate_csrf, CSRFError
from flask_cors import CORS
import glob
import cbf
import os
import numpy as np
import time
import subprocess
from packages.script import return_spots_data
from packages.XDS_find_spots import XDS_find_spots
from packages.crypto import login_attempt
from packages.obtain_cbf_image_data import obtain_cbf_image_data
import glob
import sys
import json
from dotenv import load_dotenv
load_dotenv()

app = Flask(__name__)

BASE_DIR = os.getenv('BASE_DIR')
API_URL = os.getenv('API_URL')
APP_PORT = os.getenv('APP_PORT')
SECRET_KEY = os.getenv('SECRET_KEY')
FRONTEND_ORIGIN = os.getenv('FRONTEND_ORIGIN')
FILE_TYPE = '.cbf'
FIRST_IMAGE_PATTERN = '00001.cbf'

CORS(app,
     resources={r"/*": {"origins": "*"}},
     supports_credentials=True,
     allow_headers=["Content-Type", "X-CSRFToken"],
     expose_headers=["Content-Type", "X-CSRFToken"])

app.config['SECRET_KEY'] = SECRET_KEY
csrf = CSRFProtect(app)

@app.route("/api/csrf-token", methods=["GET"])
def csrf_token():
    token = generate_csrf()
    return jsonify({"csrf_token": token})

@app.route("/api/grid-config", methods=['POST'])
def grid_config_batch():
    data = request.get_json()
    image_path = data.get("firstImagePath")
    indexes = data.get("indexes", [])
    print(indexes)
    sum_images_value = data.get("currentSumImagesValue", 1)
    print(sum_images_value)

    imgs_to_be_found = sorted(glob.glob(image_path.replace(FIRST_IMAGE_PATTERN, f'*{FILE_TYPE}')))

    needed_indices = set()
    for idx in indexes:
        for i in range(sum_images_value):
            needed_indices.add(idx + i)

    needed_indices = [item for item in needed_indices if item < len(imgs_to_be_found)]
    image_cache = {}
    for i in needed_indices:
        try:
            image_cache[i] = cbf.read(imgs_to_be_found[i]).data[::-1, :].astype(np.int16)
        except IndexError as e:
            print(f"Index {i} out of bounds: {e}")
        except Exception as e:
            print(f"Error reading image {i}: {e}")

    fallback_image = None
    try:
        fallback_image = cbf.read(imgs_to_be_found[0]).data[::-1, :].astype(np.int16)
    except Exception as e:
        print(f"Error loading fallback image: {e}")

    if fallback_image is None:
        raise RuntimeError("No valid image available for fallback or base array.")

    all_arrays = []
    for idx in indexes:
        sum_of_arrays = np.zeros_like(fallback_image, dtype=np.int16)
        for i in range(sum_images_value):
            sub_idx = idx + i
            if sub_idx == len(imgs_to_be_found):
                break
            sum_of_arrays += image_cache.get(sub_idx, fallback_image)
        all_arrays.append(sum_of_arrays)

    combined = np.stack(all_arrays)  # Shape: (n, rows, cols)
    data_bytes = combined.tobytes()
    response = make_response(data_bytes)
    response.headers['Content-Type'] = 'application/octet-stream'
    response.headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, max-age=0'
    response.headers['X-Shape'] = f"{combined.shape[0]},{combined.shape[1]},{combined.shape[2]}"
    return response

@app.route("/api/metadata", methods=['POST'])
def metadata():    
    data = request.get_json()
    first_image_path = data.get('firstImagePath')
    cbf_image_metadata = obtain_cbf_image_data(first_image_path, FIRST_IMAGE_PATTERN, FILE_TYPE)
    wavelength, detector_distance, number_of_images, cols, rows, beam_center_x, beam_center_y, threshold, pixel_size_mm = cbf_image_metadata
    return jsonify({'wavelength' : wavelength,
                    'detector_distance' : detector_distance, 
                    'number_of_images' : number_of_images,
                    'cols' : cols, 
                    'rows' : rows,
                    'beam_center_x' : beam_center_x,
                    'beam_center_y' : beam_center_y,
                    'threshold' : threshold,
                    'pixel_size_mm': pixel_size_mm})

@app.route('/api/index_image/<index>', methods=['POST'])
def index_image(index):
    data = request.get_json()
    image_path = data.get('firstImagePath')
    imgs_to_be_found = sorted(glob.glob(image_path.replace(FIRST_IMAGE_PATTERN, f'*{FILE_TYPE}')))
    try:
        img = imgs_to_be_found[int(index)]
    except IndexError:
        img = imgs_to_be_found[0]
    spots_data = return_spots_data(img)
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

@app.route('/find_spots_XDS/<index>', methods=['POST'])
def find_spots_XDS(index):
    data = request.get_json()
    image_path = data.get('firstImagePath')
    imgs_to_be_found = sorted(glob.glob(image_path.replace(FIRST_IMAGE_PATTERN, f'*{FILE_TYPE}')))
    try:
        img = imgs_to_be_found[int(index)]
    except IndexError:
        img = imgs_to_be_found[0]
    spots_data = XDS_find_spots(img)
    x_values, y_values, intensity_values = spots_data
    return jsonify({'x_values': x_values,
                    'y_values' : y_values,
                    'intensity_values' : intensity_values})

@app.route('/api/login', methods=['POST'])
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
                if os.path.isdir(entry_path) or entry_path.endswith(FIRST_IMAGE_PATTERN):
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

@app.route('/api/plot_data', methods=['POST'])
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
        print(e)
        return jsonify({
            'x': [],
            'groups': [],
        })

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(APP_PORT), debug=True)
