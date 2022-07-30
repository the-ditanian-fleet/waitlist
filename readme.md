# The Ditanian Fleet Waitlist
The official incursion waitlist for The Ditanian Fleet, Eve Online's premier armour HQ incursion community. Features include ESI fleet invites, skill checking, as well as fit checking, a doctrine page, and community guides. 


#### Development Setup
**[Please see the contributing guidelines before making any commits.](./.github/contributing.md)**

We highly recommend you use WSL for development as it simplifies working with the `backend` code. This readme is written using Ubuntu but it should cover the basics for most Linux distros, if you haven't got WSL setup see [Installing WSL | Microsoft Docs](https://docs.microsoft.com/en-us/windows/wsl/install).

[Visual Studio Code](https://code.visualstudio.com/) users can use the plugin [Remote - WSL](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-wsl) to edit  code inside of WSL from their native windows VS Code install.


##### 1. Required Software: 
Check that node, npm, sqlite3, and cargo are installed on your system: 
```
sudo apt install nodejs npm sqlite3 cargo
```

##### 2. Register an ESI Application
Register an Eve Swagger API application at [https://developers.eveonline.com](https://developers.eveonline.com) with an eligible player account.

| Setting      | Value |
| ---: | :---  |
| Callback URL | `https://<domain>.<tld>/auth/cb` |
| Scopes       | `esi-skills.read_skills.v1 esi-fleets.read_fleet.v1 esi-fleets.write_fleet.v1 esi-ui.open_window.v1 esi-clones.read_implants.v1` |

 _* Valid account: You will need to agree to the [Developer License Agreement](https://developers.eveonline.com/license-agreement). Your account must have a valid credit card that has been used to pay for at least on month of Omega._

 _*\* Never share your secret key, commit it to a repo, or make it public!_

##### 3. Setup Waitlist Services
The Waitlist has three services (see below). Before starting the front end, both the back end and SSE server should be running. 
| Service Name | Language |  Purpose | 
| ------------ | -------- | ------- |
| [`backend/`](./tree/main/backend) | Rust | Handles business logic, ESI and database calls, and provides an API for the front end. |
| [`frontend/`](./tree/main/frontend) | JavaScript (React) | Provides a UI that consumes the API provided by the backend. |
| [`the-ditanian-fleet/sse-server`](/the-ditanian-fleet/sse-server) | Rust | A service that broadcasts server driven events to UI clients |


###### Setup and run the SSE Server
1. Clone the repo [`the-ditanian-fleet/sse-server`](/the-ditanian-fleet/sse-server)
2. Build a Docker image
3. Generate a secret key using `openssl rand -hex 32` and copy it somewhere safe. This key is needed to start the SSE server and the backend process
4. Start the docker image. **You must** pass the secret key from step three as `SSE_SECRET`

<details>
   <summary>CLI Prompts</summary>
   
   ```
   git clone https://github.com/the-ditanian-fleet/sse-server
   docker build . -t tdf/sse
   openssl rand -hex 32
   docker run --env SSE_SECRET=<secret> tdf/sse
   ```
</details>

###### Setup and run the Backend
1. Navigate to the `backend/` directory
2. Create a config.toml file and populate the environment variables:
   * Use `openssl rand -hex 32` to generate a new app `token_secret`
   * ESI `client_id` and `client_secret` values come from step 2
   * SSE `secret` should be the same as the `SSE_SECRET` used when launching the SSE server
3. Run the `shrink-sde.sh` script
4. Create a sqlite database called `waitlist.sqlite`
5. Copy the SQL queries from `sql/sqlite.sql` into the sqlite3 terminal and execute them
6. Set environment variables using export: `DATABASE_ENGINE=sqlite` and `DATABASE_URL=${DATABASE_ENGINE}:/waitlist.sqlite` 
7. Compile the code using `cargo build --release --no-default-features --features=${DATABASE_ENGINE}`
8. Run the server
9. Click on login and complete the SSO workflow with at least one character
10. Insert a record in the `Admins` table to give yourself `council` permissions
11. Navigate to the Fleet page and "ESI re-auth as FC"

<details>
   <summary>CLI Prompts</summary>
   
   ```
   # Setup app (steps 1-3)
   cd backend/
   cp config.example.toml config.toml & nano config.toml
   sh shrink-sde.sh

   # Setup Database (step 4-5)
   sqlite3 waitlist.sqlite
   .database
   ## Copy the SQL queries from `sql/sqlite.sql` here and press Enter
   ## Quit the shell using Ctrl+D
   
   # Start backend (step 6-8)
   export DATABASE_ENGINE=sqlite
   export DATABASE_URL=sqlite:./waitlist.sqlite
   cargo build --release --no-default-features --features=sqlite
   cargo run

   # Final things (step 9-11)
   sqlite3 waitlist.sqlite
   INSERT INTO Admins (<character_id>, 'council');
   ## Quit the shell using Ctrl+D
   npm run start
   ```
</details>


###### Setup and run front end
1. Navigate to the `frontend/` directory
2. Install NPM dependencies
2. Build the React Code
3. Start the server

<details>
   <summary>CLI Prompts</summary>
   
   ```
   cd frontend/
   npm install
   npm run build
   npm run start
   ```
</details>
