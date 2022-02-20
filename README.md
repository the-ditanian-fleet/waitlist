# waitlist containers

A fork of [The Ditanian Fleet Waitlist](https://github.com/the-ditanian-fleet/waitlist) with added docker-compose support and default [Traefik](https://traefik.io/) reverse proxy.
This docker-compose setup runs by default with a local sqlite db. MySQL is supported by the backend, but not tested with docker-compose.

1. [Installation](#installation)
1. [Using Traefik](#using-traefik)
1. [Development](#development)

## Installation

**Prerequisites**:
* [docker](https://docs.docker.com/)
* [docker-compose](https://docs.docker.com/)

> **Note**: The Docker-compose file uses Compose v3.8, so requires Docker Engine 19.03.0+



1. **Create an API-Key**
    * Go the [Eve Online Developer portal](https://developers.eveonline.com/)
    * After signing in go to "MANAGE APPLICATIONS" → "CREATE NEW APPLICATION"
    * Choose a name for your application (e.g. "Waitlist Production")
    * Enter a Description for this installation
    * Change "CONNECTION TYPE" to "Authentication & API Access"
    * Add the following "PERMISSIONS":
      ```
        publicData
        esi-skills.read_skills.v1
        esi-clones.read_implants.v1
        esi-fleets.read_fleet.v1
        esi-fleets.write_fleet.v1
        esi-ui.open_window.v1
      ```
    * Set your "CALLBACK URL" to `https://[YOUR_DOMAIN]/auth/cb`


1. **Clone the repo**
    ```shell
    git clone --recurse-submodules https://github.com/fleischsalatinspace/waitlist.git

1. **Copy `backend/config.example.toml` to `backend/config.toml` and edit to your liking
   * Generate new secrets with `openssl rand -hex 32`
   * Change `token_secret` and `secret` to a new one

1. **Create a *.env* file (copy .env.example) and make sure every config option has an entry.**
    ```shell
    CONTAINER_NAME="waitlist" # docker container name prefix
    DOMAIN="waitlist.mycooldomain.local" # The domain you will be using
    SSE_SECRET="<<sse.secret from backend/config.toml>>" # sse "secret" value from backend/config.toml 

1. **Build & Run it**
    ```shell
    ./pre-flight.sh
    docker network create web && docker-compose up -d --build
    ```
    * Display live container logs with `docker-compose logs -t -f`
    * Stop containers with `docker-compose down`

1. **Open the http://< your-domain >/ page.**
   * Accept invalid TLS certificate
   * Login with your character and check if everything works

1. **Adding first admin**
   * Get shell in backend container `docker-compose exec backend sh -c "/bin/sh"`
   * Temporary installation of sqlite3 client `apk add sqlite`
   * Connect to sqlite db `sqlite3 wl-dev.sqlite`
   * Display at least once logged in characters `select * from character;`
   * Copy the `character_id` of your character and execute `insert into admins (character_id,level) values ('YOURCHARACTERID','council');`
   * Your logged in character should now see at the top of the website `Fleet, FC, Search`
   * Exit sqlite3 client with `.quit` and exit shell with CTRL+C or `exit`

1. **When everything works, configure Traefik correctly for production**
    * Remove the commented lines in Traefik service definition  in `docker-compose.yml`

> Hint: If you need to make changes, perform your edits first, then do `docker-compose down` to bring down the project, and then `docker-compose up --build -d` to rebuild the containers and run them again.

1. **Adding waitlists**
   * Currently, there is no way to initiate a new waitlist via UI. So use this SQL `insert into waitlist (id,name,is_open,is_archived) values ('1','NAMEOFYOURWAITLIST','0','0');`
### Using Traefik

To keep things simple, the structure of this project assumes that you will use Traefik to provide access to your Pathfinder docker container and nothing else. As such, Traefik containers start and stop with the Pathfinder containers.

If you want to run other services in docker on the same host that also need to be exposed to the web, you should strongly consider splitting Traefik into a separate project with its own docker-compose file. This will allow you to take pathfinder project offline for maintenance without affecting other containers that rely on Traefik.



## Development

* Setting up a local dev environment of this project is quite messy because of the sse-server
* TO-DO: docs

## License
This project is licensed under the MIT License - see the [LICENSE.txt](LICENSE.txt) file for details
