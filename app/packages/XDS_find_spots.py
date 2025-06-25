import json

def load_results(file_name):
    with open(file_name, 'r') as json_file:
        data = json.load(json_file)
    return data

def XDS_find_spots(first_image_path):
    
    file_name = '/'.join(first_image_path.split('/')[0:-1]) + '/.find_spots/json_spot_data.json'
    data = []
    x_values, y_values, intensity_values = [], [], []
    
    results = load_results(file_name)
    for cbfimg, spot_positions in results.items():
        if cbfimg == first_image_path:
            data = spot_positions
            break

    for item in data:
        x_values.append(item[0])
        y_values.append(item[1])
        intensity_values.append(item[2])

    return x_values, y_values, intensity_values
