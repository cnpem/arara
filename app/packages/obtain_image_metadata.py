import h5py
import numpy as np

def estimate_threshold(first_image_path):
    data_path = first_image_path.replace(
        "_master.h5",
        "_data_000001.h5"
    )
    with h5py.File(data_path, "r") as data_file:
        numpy_array = data_file["/entry/data/data"][0]
    numpy_array[numpy_array > 1_000_000] = 0
    # This calculation comes from the voices of my head
    # and it works very well :)
    threshold = int(np.max(numpy_array) * 0.0005 + 28)
    return threshold

def obtain_image_metadata(first_image_path):

    beam_entry = "/entry/instrument/beam"
    detector_entry = "/entry/instrument/detector"

    with h5py.File(first_image_path, "r") as f:

        # wavelength (Angstrom)
        wavelength = float(
            f[f"{beam_entry}/incident_wavelength"][()]
        )

        # detector distance (milimeters)
        detector_distance_mm = float(
            f[f"{detector_entry}/detector_distance"][()]
        )*1000

        # total number of images
        number_of_triggers = int(
            f[f"{detector_entry}/detectorSpecific/ntrigger"][()]
        )

        number_of_images = int(
            f[f"{detector_entry}/detectorSpecific/nimages"][()]
        )

        number_of_images = number_of_images * number_of_triggers

        # detector dimensions
        cols = int(
            f[f"{detector_entry}/detectorSpecific/x_pixels_in_detector"][()]
        )

        rows = int(
            f[f"{detector_entry}/detectorSpecific/y_pixels_in_detector"][()]
        )

        # beam center
        beam_center_x = float(
            f[f"{detector_entry}/beam_center_x"][()]
        )

        beam_center_y = float(
            f[f"{detector_entry}/beam_center_y"][()]
        )

        threshold = estimate_threshold(first_image_path)

        # pixel size (meters -> convert to mm)
        pixel_size_x = float(
            f[f"{detector_entry}/x_pixel_size"][()]
        )
        pixel_size_mm = pixel_size_x * 1000.0

    return wavelength, detector_distance_mm, number_of_images, cols, rows, beam_center_x, beam_center_y, threshold, pixel_size_mm