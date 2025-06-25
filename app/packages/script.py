import subprocess
import os
GON_AXES = '-1,0,0'

def get_dials_script(point_data_path, opt_inputs):

    # add optional 
    extra_inputs_import = ''
    if opt_inputs['image_range']:
        extra_inputs_import += f'image_range={opt_inputs["image_range"][0]},{opt_inputs["image_range"][1]}'

    # write script lines
    script = [
        f'#!/bin/bash\n'
        f'\n'
        f'dials.import {point_data_path} geometry.goniometer.axes={GON_AXES} {extra_inputs_import}\n'
        f'dials.find_spots imported.expt\n'
        f'dials.index imported.expt strong.refl\n'
    ]
    return script

def run_subprocess(proc_command, a, b, c, alpha, beta, gamma, space_group):
    proc = subprocess.Popen(proc_command, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    for line in proc.stdout:
        line = line.decode('utf-8').replace('\n', '')
        print(line)
        if 'Unit cell:' in line:
            line = line.split()
            a = line[2].split('(')[1].replace(')', '')
            b = line[3].split('(')[0].replace(')', '')
            c = line[4].split('(')[0].replace(')', '')
            alpha = line[5].split('(')[0].replace(')', '')
            beta = line[6].split('(')[0].replace(')', '')
            gamma = line[7].split('(')[0].replace(')', '')
        if 'Space group:' in line:
            space_group = line.split('Space group:')[1].replace('\n', '')
    proc.wait()
    return a, b, c, alpha, beta, gamma, space_group

def obtain_spot_values():
    with open('xds/SPOT.XDS', 'r') as f:
        lines = f.readlines()

    x_values = []
    y_values = []
    intensity_values = []
    for line in lines:
        splitted_line = line.split()
        x_values.append(splitted_line[0])
        y_values.append(splitted_line[1])
        intensity_values.append(splitted_line[3])

    return x_values, y_values, intensity_values

def verify_sg_values(a, b, c, alpha, beta, gamma, space_group):
    if a <= 0 or b <= 0 or c <= 0:
        return False
    if not (0 < alpha <= 180 and 0 < beta <= 180 and 0 < gamma <= 180):
        return False
    if not isinstance(space_group, int) or space_group <= 0:
        return False
    return True

def return_spots_data(first_image_path):
    point_data_path = first_image_path
    a = 0
    b = 0
    c = 0
    alpha = 0
    beta = 0
    gamma = 0
    space_group = 0
    ucel_list = [a, b, c, alpha, beta, gamma]

    opt_inputs = {"ucel" : ucel_list, "usgn" : space_group, "image_range" : []}

    script = get_dials_script(point_data_path, opt_inputs)

    with open('find_spots/script_file.sh', 'w') as f:
        for item in script:
            f.write(item)

    proc_command = ['bash', 'find_spots/script_file.sh']
    a, b, c, alpha, beta, gamma, space_group = run_subprocess(proc_command, a, b, c, alpha, beta, gamma, space_group)

    proc_command = ['dials.export', 'strong.refl', 'format=xds']
    a, b, c, alpha, beta, gamma,space_group = run_subprocess(proc_command, a, b, c, alpha, beta, gamma, space_group)

    data = obtain_spot_values()
    x_values, y_values, intensity_values = data

    return x_values, y_values, intensity_values, a, b, c, alpha, beta, gamma, space_group
