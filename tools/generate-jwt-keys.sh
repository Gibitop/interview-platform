#! /usr/bin/env bash

# This script generate a RSA private key and a public key in PEM format
# The private key is used by backend to sign the JWT token
# The public key is used by insider to verify the JWT token

# Both keys will be generated in the current directory
# The private key will be name jwt-private-key.pem
# The public key will be name jwt-public-key.pem

# After the generation is finished the keys will be moved to the correct location
# The private key will be moved to the backend folder
# The public key will be moved to the insider folder

# This script requires bash and openssl to be installed

# Generate the private key
openssl genrsa -out jwt-private-key.pem 2048

# Generate the public key
openssl rsa -in jwt-private-key.pem -pubout -out jwt-public-key.pem

# Move the keys to the correct location
mv jwt-private-key.pem backend
mv jwt-public-key.pem insider
