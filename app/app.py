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
from packages.crypto import login_attempt
from packages.obtain_cbf_image_data import obtain_cbf_image_data
import glob
import sys
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
     resources={r"/*": {"origins": FRONTEND_ORIGIN}},
     supports_credentials=True,
     allow_headers=["Content-Type", "X-CSRFToken"],
     expose_headers=["Content-Type", "X-CSRFToken"])

app.config['SECRET_KEY'] = SECRET_KEY
csrf = CSRFProtect(app)

@app.route("/csrf-token", methods=["GET"])
def csrf_token():
    token = generate_csrf()
    return jsonify({"csrf_token": token})

@app.route("/grid-config", methods=['POST'])
def grid_config_batch():
    data = request.get_json()
    image_path = data.get("firstImagePath")
    indexes = data.get("indexes", [])
    imgs_to_be_found = sorted(glob.glob(image_path.replace(FIRST_IMAGE_PATTERN, f'*{FILE_TYPE}')))
    all_arrays = []
    print(indexes)
    for idx in indexes:
        try:
            img = imgs_to_be_found[int(idx)]
        except IndexError as e:
            img = imgs_to_be_found[0]
            print(e)
        content = cbf.read(img)
        numpy_array = content.data[::-1, :]
        numpy_array = np.array(numpy_array, dtype=np.int16)
        all_arrays.append(numpy_array)

    combined = np.stack(all_arrays)  # Shape: (n, rows, cols)
    data_bytes = combined.tobytes()
    response = make_response(data_bytes)
    response.headers['Content-Type'] = 'application/octet-stream'
    response.headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, max-age=0'
    response.headers['X-Shape'] = f"{combined.shape[0]},{combined.shape[1]},{combined.shape[2]}"
    return response

@app.route("/metadata", methods=['POST'])
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

@app.route('/index_image/<index>', methods=['POST'])
def index_image(index):
    data = request.get_json()
    image_path = data.get('firstImagePath')
    imgs_to_be_found = sorted(glob.glob(image_path.replace(FIRST_IMAGE_PATTERN, f'*{FILE_TYPE}')))
    try:
        img = imgs_to_be_found[int(index)]
    except IndexError:
        img = imgs_to_be_found[0]
    print(img)
    spots_data = return_spots_data(img)
    x_values, y_values, intensity_values, a, b, c, alpha, beta, gamma = spots_data
    return jsonify({'x_values': x_values,
                    'y_values' : y_values,
                    'intensity_values' : intensity_values,
                    'a': a,
                    'b': b,
                    'c': c,
                    'alpha': alpha,
                    'beta': beta,
                    'gamma': gamma,})

@app.route('/login', methods=['POST'])
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

@app.route("/list_files", methods=["POST"])
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
            elif relative_path != "":
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

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(APP_PORT))
