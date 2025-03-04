# Defaults
NODE_ENV='production'
DOCKER_SOCKET_PATH='/var/run/docker.sock'
HASHING_SECRET_HEX=$(openssl rand -hex 32)
REGISTRATION_OPEN='false'
DOMAIN='127.0.0.1'
PORT='4000'
INSIDER_JWT_PUBLIC_KEY_PATH="$(pwd)/keys/jwt-public-key.pem"


# Override defaults if necessary

if [ -f /var/run/docker.sock ]; then
    echo Docker socket at /var/run/docker.sock not found. Please fill it in by hand
    DOCKER_SOCKET_PATH=''
fi

read -p "Should registration be open? [y/N] " -n 1 -r
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo
    REGISTRATION_OPEN='true'
fi

read -p "What host should the app use? [127.0.0.1] " -r
if [ ! -z "$REPLY" ]; then
    DOMAIN="$REPLY"
fi

read -p "What host port the app use? [4000] " -r
if [ ! -z "$REPLY" ]; then
    PORT="$REPLY"
fi


# If file exists add separator to the end
if [ -f .env ]; then
    echo .env file already exists. Appending to the end
    echo '' >> .env
fi


# Write to the .env file
echo "NODE_ENV='$NODE_ENV'" >> .env
echo "DOCKER_SOCKET_PATH='$DOCKER_SOCKET_PATH'" >> .env
echo "HASHING_SECRET_HEX='$HASHING_SECRET_HEX'" >> .env
echo "REGISTRATION_OPEN='$REGISTRATION_OPEN'" >> .env
echo "DOMAIN='$DOMAIN'" >> .env
echo "PORT='$PORT'" >> .env
echo "INSIDER_JWT_PUBLIC_KEY_PATH='$INSIDER_JWT_PUBLIC_KEY_PATH'" >> .env
echo "INSIDER_WORKING_DIRECTORY='/interview'" >> .env
echo "INSIDER_START_ACTIVE_FILE_NAME='readme.txt'" >> .env
echo "INSIDER_PERSISTENCE_DIRECTORY_PATH='/persistence'" >> .env
