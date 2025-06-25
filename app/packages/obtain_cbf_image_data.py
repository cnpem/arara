import cbf
import numpy as np
import subprocess
import glob
import re

def obtain_cbf_image_data(first_image_path, FIRST_IMAGE_PATTERN, FILE_TYPE):

    with subprocess.Popen(['head', '-n', '40', first_image_path], universal_newlines=True, stdout=subprocess.PIPE, stderr=subprocess.STDOUT) as proc:
        for line in proc.stdout:
            if 'Detector_distance' in line:
                distance_line = line
            if 'Wavelength' in line:
                wavelength_line = line
            if 'Beam_xy' in line:
                beam_xy_line = line
            if 'Pixel_size' in line:
                match = re.search(r'Pixel_size\s+([\d.eE+-]+)\s*m\s*x\s*([\d.eE+-]+)\s*m', line)
                if match:
                    pixel_size_mm = round(float(match.group(1))*1000, 3)
                else:
                    pixel_size_mm = 0.172

    distance_line = distance_line.split('Detector_distance')[1]
    distance_string = distance_line.split(' ')[1]
    detector_distance = float(distance_string)*1000 #milimeters

    wavelength_line = wavelength_line.split('Wavelength')[1]
    wavelength_string = wavelength_line.split(' ')[1]
    wavelength = float(wavelength_string)

    beam_xy_line = beam_xy_line.split('Beam_xy')[1]
    beam_xy_line = beam_xy_line.split('(')[1].split(')')[0]
    beam_xy_line = beam_xy_line.split(',')
    beam_center_x = beam_xy_line[0].strip()
    beam_center_y = beam_xy_line[1].strip()

    content = cbf.read(first_image_path)
    numpy_array = content.data
    cols = len(numpy_array)
    rows = len(numpy_array[0])
    threshold = int(np.max(numpy_array)*0.0005 + 28)

    number_of_images = len(glob.glob(first_image_path.replace(FIRST_IMAGE_PATTERN, f'*{FILE_TYPE}')))

    return wavelength, detector_distance, number_of_images, cols, rows, beam_center_x, beam_center_y, threshold, pixel_size_mm