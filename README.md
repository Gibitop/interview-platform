## Usage

Generate JWT keys
```bash
./tools/generate-jwt-keys.sh
```

Build all room images
```bash
docker compose -f ./docker-compose.insiders.yml build
```

Build and start the application
```bash
docker compose up
```


## Security

Currently we expose the host's docker socket to the backend container. This means that if the backend container is compromised, the attacker will effectively have root access to the host machine \
[More info](https://www.lvh.io/posts/dont-expose-the-docker-socket-not-even-to-a-container/)

For this reason
> [!CAUTION]
> **FOR PRODUCTION, USE THIS INSIDE A VIRTUAL MACHINE OR ON AN ISOLATED SERVER**

In future there is a plan to move to resolve this issue, but additional research is needed.


## Scalability

Currently horizontal scaling is not supported. This should not be a problem for most users, who want to use the system for technical interviews in their own company

However horizontal scaling through kubernetes might be supported in the future
