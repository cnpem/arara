from Crypto.Cipher import PKCS1_OAEP, PKCS1_v1_5
from Crypto.PublicKey import RSA
from Crypto.Random import get_random_bytes
from urllib import request as urllib_request
import base64
import json
import math
import ssl
import sys

def create_rsa_cipher(key_data):
    key = RSA.import_key(key_data)
    return PKCS1_OAEP.new(key)

def request_json(post_data, public_key_api):
    cipher = create_rsa_cipher(public_key_api)
    enc_data = {}

    # Loop through all values in the dictionary
    for key, value in post_data.items():

        # Convert the value from string to binary
        if not isinstance(value, str):
            value_str = str(value)
        else:
            value_str = value
        val_buffer_utf8 = value_str.encode('utf-8')

        # Divide the string for encryption if it is too long
        iterations = math.ceil(len(val_buffer_utf8)/150)
        enc_data[key] = []

        # Loop through all the string divisions
        for num in range(0, iterations):
            it_pos = 150*num

            # Encrypt a part of the string
            enc_val = cipher.encrypt(val_buffer_utf8[it_pos:it_pos+150])

            # Store the value's string
            enc_data[key].append(enc_val)

    return enc_data

def decrypt_values_in_dict(response_dict, cipher):
    response_data = {}

    # Loop through all values in the response dictionary
    for key, value_list in response_dict.items():
        response_data[key] = ""

        # Loop through the value list
        for enc_val in value_list:

            # Decrypt the value
            decripted_value = cipher.decrypt(enc_val)
            real_val = decripted_value.decode("utf-8")

            # Store the decrypted value
            response_data[key] += real_val

    return response_data

def response_json(response_data, private_key):
    cipher = create_rsa_cipher(private_key)

    # Decode received data from binary to string
    data_url_str = response_data.decode('latin-1')

    # Convert the string to dictionary
    data_url = eval(data_url_str)

    response_data = decrypt_values_in_dict(data_url, cipher)

    return response_data

def generate_keys():
    new_key = RSA.generate(2048)

    private_key = new_key.exportKey("PEM")
    private_key = private_key.decode("utf-8")

    public_key = new_key.public_key().exportKey("PEM")
    public_key = public_key.decode("utf-8")

    return private_key, public_key

def communicate_with_server(email, password, API_URL):
    try:
        private_key, public_key = generate_keys()
        post_data = {"email":email, "password":password, "public_key":public_key}
        public_key_api = open("keys/public_key.pem").read()
        enc_data = request_json(post_data, public_key_api)
        url = API_URL
        req = urllib_request.Request(url, data=str(enc_data).encode('latin-1'))
        # Safe to use default context: running on Python 3.10+
        context = ssl.create_default_context()
        resp = urllib_request.urlopen(req, context=context)
        response = resp.read()
        return response_json(response, private_key)
    except Exception as e:
        print('')
        print('Exception in login_attempt:')
        print(e)
        _, _, exc_tb = sys.exc_info()
        print('Error line in login_attempt.py:', exc_tb.tb_lineno)
        print('')

def login_attempt(username, password, API_URL):
    response_dict_from_server = communicate_with_server(username, password, API_URL)
    if response_dict_from_server['isLogged'] == 'True':
        authentication_was_successfull = True
        user_proposals = response_dict_from_server['proposals']
        user_proposals = [] if user_proposals == '[]' else user_proposals.strip('][').split(', ')
        for i in range(len(user_proposals)):
            user_proposals[i] = user_proposals[i].replace("'", "")
    else:
        user_proposals = []

    print(username, authentication_was_successfull)
    return user_proposals, authentication_was_successfull
