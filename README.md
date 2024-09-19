# Interview platform

## Table of contents
- [Interview platform](#interview-platform)
  - [Table of contents](#table-of-contents)
  - [Production usage](#production-usage)
  - [Development](#development)
    - [Common](#common)
    - [Web](#web)
    - [Backend](#backend)
    - [Insider](#insider)
  - [Local usage](#local-usage)
  - [Security](#security)
  - [Scalability](#scalability)


## Production usage

<!-- TODO: Write about global .env file -->

Generate JWT keys
```bash
./tools/generate-jwt-keys.sh
```

Build all room images
```bash
DOMAIN='localhost' docker-compose -f ./docker-compose.insiders.yml build
```

Build and start the application with https in prod
```bash
DOMAIN='domain name' LET_ENCRYPT_EMAIL='your email' docker-compose -f ./docker-compose.prod.yml up
```

## Development

### Common

1. Generate JWT keys
    ```bash
    ./tools/generate-jwt-keys.sh
    ```

### Web

1. Go to the `web` directory
    ```bash
    cd web
    ```
2. Install dependecies
    ```bash
    npm install
    ```
3. Start dev server
    ```bash
    npm run dev
    ```

> [!NOTE]
> In dev mode you can only connect to one instance of `insider`

### Backend

1. Go to the `backend` directory
    ```bash
    cd backend
    ```
2. Install dependecies
    ```bash
    npm install
    ```
3. Launch docker daemon
4. Create a Postgres DB
5. Create a `.env` file like this
    ```bash
    NODE_ENV='development'
    DATABASE_URL='postgres://<postgres user>:<postgres password>@<postgres host>:<postgres port>/<postgres db name>'
    DOCKER_SOCKET_PATH='<path to your docker socket, ususally: /var/run/docker.sock>'
    HASHING_SECRET_HEX='<output of openssl rand -hex 32>'
    REGISTRATION_OPEN='true'
    ```
6. Run DB migration
    ```bash
    npm run drizzle-migrate
    ```
7. Start dev server
    ```bash
    npm run dev
    ```

> [!NOTE]
> You can prototype DB changes using
> ```bash
> npm run drizzle-push
> ```
> Before committing, run
> ```bash
> npm run drizzle-generate
> ```
> To save your changes as a DB migration file


### Insider

1. Go to the `insider` directory
    ```bash
    cd web
    ```
2. Install dependecies
    ```bash
    npm install
    ```
3. Start dev server
    ```bash
    npm run dev
    ```

## Local usage

Generate JWT keys
```bash
./tools/generate-jwt-keys.sh
```

Build all room images
```bash
docker-compose -f ./docker-compose.insiders.yml build
```

Build main services
```bash
docker-compose build
```

Start the application with http on localhost
```bash
docker-compose up
```


## Security

Currently we expose the host's docker socket to the backend container and to the [traefik](https://traefik.io/traefik/) container. This means that if the backend container is compromised, the attacker will effectively have root access to the host machine \
[Why this is dangerous](https://www.lvh.io/posts/dont-expose-the-docker-socket-not-even-to-a-container/) \
[Traefik docs on this matter](https://doc.traefik.io/traefik/providers/docker/#docker-api-access)

For this reason
> [!CAUTION]
> **FOR PRODUCTION, USE THIS INSIDE A VIRTUAL MACHINE OR ON AN ISOLATED SERVER**

In future there is a plan to move to resolve this issue, but additional research is needed.


## Scalability

Currently horizontal scaling is not supported. This should not be a problem for most users, who want to use the system for technical interviews in their own company

However horizontal scaling through kubernetes might be supported in the future
