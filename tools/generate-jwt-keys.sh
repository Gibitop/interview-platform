#! /usr/bin/env bash

# This script generate a RSA private key and a public key in PEM format
# The private key is used by backend to sign the JWT token
# The public key is used by insider to verify the JWT token

# Both keys will be generated in the keys directory
# The private key will be name jwt-private-key.pem
# The public key will be name jwt-public-key.pem

# After the generation is finished the keys will be symlinked to the correct locations
# The private key will be symlinked to the backend folder
# The public key will be symlinked to the insider folder

# This script requires bash and openssl to be installed

PRIVATE_KEY_FILENAME="jwt-private-key.pem"
PUBLIC_KEY_FILENAME="jwt-public-key.pem"


read -p "This script will rewrite existing keys. Do you want to continue? [y/N] " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]] then
    rm -f ./keys/$PRIVATE_KEY_FILENAME
    rm -f ./keys/$PUBLIC_KEY_FILENAME
    rm -f ./backend/$PRIVATE_KEY_FILENAME
    rm -f ./insider/$PUBLIC_KEY_FILENAME

    mkdir -p keys
    cd keys

    # Generate the private key
    openssl genrsa -out $PRIVATE_KEY_FILENAME 2048

    # Generate the public key
    openssl rsa -in $PRIVATE_KEY_FILENAME -pubout -out $PUBLIC_KEY_FILENAME

    # Move the keys to the correct location
    ln -s ../keys/$PRIVATE_KEY_FILENAME ../backend/$PRIVATE_KEY_FILENAME
    ln -s ../keys/$PUBLIC_KEY_FILENAME ../insider/$PUBLIC_KEY_FILENAME
fi
