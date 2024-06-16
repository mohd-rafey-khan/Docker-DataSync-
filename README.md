# DataSync Docker

**DataSync Docker** is a robust solution for seamless data migration and synchronization from a source table hosted on a local machine to a target database within a Docker container. This project automates the creation of tables in the target database to match the schema of the source tables and inserts data only if it doesn't already exist, ensuring data consistency and integrity.

## Features

- **Automated Table Creation:** Dynamically replicates the schema of source tables in the target database.
- **Conditional Data Insertion:** Inserts records into the target table only if they are not already present, preventing duplicates.
- **Dockerized Node.js App:** The core functionality is encapsulated within a Docker container, ensuring portability and ease of deployment.
- **Efficient Network Management:** Utilizes Docker's networking features to establish secure connections between the local machine and the containerized database.

## Prerequisites

- Docker
- Node.js
- A source database on your local machine

## Setup

1. **Clone the repository:**
    ```bash
    git clone https://github.com/mohd-rafey-khan/Docker-DataSync-.git
    cd DataSyncDocker
    ```

2. **Build the Docker image:**
    ```bash
    docker build -t datasync-docker .
    ```

3. **Run the Docker container:**
    ```bash
    docker run -d --name datasync-docker-container -p 3306:3306 datasync-docker
    ```

4. **Configure environment variables:**
    Create a `.env` file in the root directory and add the following:
    ```env
    # add your table name
    SOURCE_TABLE=add_table_name_from_source_local_machine_db
    DESTINATION_TABLE=add_table_name_you_want_to_create_in_docker_db

    # source local machine postgres cred
    DB_HOST=xxx.xx.x.x
    DB_PORT=5432
    DB_USER=postgres
    DB_PASSWORD=*****
    DB_NAME=add_your_db_name_local_machine

    # destination docker postgres cred
    # if docker containers are in same network then it can connect by using name simply
    DOCKER_DB_HOST=mypostgres
    DOCKER_DB_PORT=5432
    DOCKER_DB_USER=postgres
    DOCKER_DB_PASSWORD=root
    DOCKER_DB_NAME=add_your_db_name_docker_container
    ```

5. **Start the Node.js application:**
    ```bash
    docker exec -it datasync-docker-container node /app/index.js
    ```

## Usage

Once the Docker container is running and the Node.js application is started, the application will automatically:
1. Connect to the source database on your local machine.
2. Create tables in the target database to match the schema of the source tables.
3. Insert data into the target tables only if it doesn't already exist.

## Contributing

Feel free to submit issues and pull requests. Contributions are welcome!

## Contact

For more information, contact [khan123rafey@gmail.com](mailto:khan123rafey@gmail.com).
