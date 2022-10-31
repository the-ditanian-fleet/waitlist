# The Ditanian Fleet Waitlist
The official incursion waitlist for The Ditanian Fleet, Eve Online's premier armour HQ incursion community. Features include ESI fleet invites, skill checking, fit checking, a doctrine page, and community guides. 


### Contributing
Report bugs by opening a GitHub issue, or send a message to a TDF HQ FC. Security issues should be reported to an FC directly. 

#### A One-Time Change
If you only want to make a one-time contribution, have a chat with the FC team. We will discuss your idea, any potential issues and may make some requests. After our chat, fork the repository and get to work.

#### Regular Contributions
If you want to make regular contributions, please reach out to Reoze or Lyari on Discord.

#### Creating a Pull Request
Once you think you are ready, please check:
* the backend and front end still compile
* your code works as expected
* other features your changes might affect still work correctly

_If you aren't sure about the expected behaviour, talk to an FC._

---

Then you can create a pull request against upstream/main. Remember to include:
* A title that describes your change - example "Updated announcement system"
* A description that describes the rational for change, any additional context (if applicable), and any steps that other developers need to take - example "Run migration 006"


We will review your pull request and let you know what happens. 

👍🎉 Thanks for taking the time to contribute! 🎉👍

### Development Setup
We recommend you use WSL for development as it simplifies working with the `backend` code. This readme is written using Ubuntu but it should cover the basics for most Linux distros, if you haven't got WSL setup see [Installing WSL | Microsoft Docs](https://docs.microsoft.com/en-us/windows/wsl/install).

[Visual Studio Code](https://code.visualstudio.com/) users can use the plugin [Remote - WSL](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-wsl) to edit  code inside of WSL from their native windows VS Code install.


##### 1. Required Software: 
Check that mysql-server, nodejs, npm, sqlite3, and cargo are installed on your system: 
```
sudo apt install mysql-server nodejs npm sqlite3 cargo
```

##### 2. Register an ESI Application
Register an Eve Swagger API application at [https://developers.eveonline.com](https://developers.eveonline.com) with an eligible player account.

| Setting      | Value |
| ---: | :---  |
| Callback URL | `http://localhost:3000/auth/cb` |
| Scopes       | `publicData esi-skills.read_skills.v1 esi-clones.read_implants.v1 esi-fleets.read_fleet.v1 esi-fleets.write_fleet.v1 esi-ui.open_window.v1 esi-search.search_structures.v1` |

 _* Valid account: You will need to agree to the [Developer License Agreement](https://developers.eveonline.com/license-agreement). Your account must have a valid credit card that has been used to pay for at least one month of Omega._

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
4. Start the docker image. **You must** pass the secret key from step three as an environment variable called `SSE_SECRET`

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
4. Login to mysql, and create a database called `waitlist`
5. Copy the SQL queries from `sql/mysql.sql` into the mysql terminal and execute them
6. Set environment variables using export: `DATABASE_ENGINE=mysql` and `DATABASE_URL=mysql://usrname:passwd@localhost/waitlist?ssl-mode=disabled` 
7. Compile the code using `cargo build --release --no-default-features --features=mysql`
8. Run the server
9. Run the frontend (see section below)
10. Click on login and complete the SSO workflow with at least one character
11. Insert a record in the `admin` table to give yourself `council` permissions
12. Navigate to the Fleet page and "ESI re-auth as FC"

<details>
   <summary>CLI Prompts</summary>
   
   ```
   # Setup app (steps 1-3)
   cd backend/
   cp config.example.toml config.toml & nano config.toml
   sh shrink-sde.sh

   # Setup Database (step 4-5)
   mysql -u root -p
   CREATE DATABASE IF NOT EXISTS waitlist;
   use waitlist;
   
   # Now copy and paste and run the mysql.sql script

   
   # Start backend (step 6-8)
   export DATABASE_ENGINE=mysql
   export DATABASE_URL=mysql://usrname:passwd@localhost/waitlist?ssl-mode=disabled
   cargo build --release --no-default-features --features=mysql
   cargo run

   # Now build and run frontend in a separate shell (step 9, also see section below)

   # Final things (step 10-12)
   mysql -u root -p
   use waitlist;
   INSERT INTO admin (character_id, role, granted_at, granted_by_id)
   SELECT
       id AS character_id,
       'council' AS role,
       CURRENT_TIMESTAMP() AS granted_at,
       id AS granted_by_id
   FROM `character` WHERE name = 'YOUR CHARACTER NAME';
   ## Quit the shell using 'exit;'
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