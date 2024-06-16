const express = require('express');
const { Pool } = require('pg');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

// Create an instance of an Express application
const app = express();

// Define a port number
const port = 3000;

// Create a new Pool instance to connect to PostgreSQL
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

// Create a new Pool instance to connect to PostgreSQL
const dockerPool = new Pool({
  host: process.env.DOCKER_DB_HOST,
  port: process.env.DOCKER_DB_PORT,
  user: process.env.DOCKER_DB_USER,
  password: process.env.DOCKER_DB_PASSWORD,
  database: process.env.DOCKER_DB_NAME
});

const buildConnectionWithDockerPostgres = async () => {
  try {
    var clientDOCKER = await dockerPool.connect();
    console.log("Connection to docker postgres Build..");
    return clientDOCKER;
  } catch (err) {
    console.error(err);
  }
}

const checkAndCreateTable = async (client,clientdoc) => {
  const sourceTable = process.env.SOURCE_TABLE;
  const destinationTable = process.env.DESTINATION_TABLE;
  
  // Check if destination table exists
  const checkTableQuery = `
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public'
      AND table_name = '${destinationTable}'
    );
  `;

  // Check table existence
  const result = await client.query(checkTableQuery);
  const exists = result.rows[0].exists;

  if (!exists) {
    console.log("Table does not exist. Creating table...");

    // Get the schema of the source table
    const getSourceTableSchemaQuery = `
      SELECT column_name, data_type, character_maximum_length
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = '${sourceTable}';
    `;
    
    const sourceSchemaResult = await client.query(getSourceTableSchemaQuery);

    const columns = sourceSchemaResult.rows.map(row => {
      let columnDefinition = `${row.column_name} ${row.data_type}`;
      if (row.character_maximum_length) {
        columnDefinition += `(${row.character_maximum_length})`;
      }
      return columnDefinition;
    }).join(", ");

    // Create table if it doesn't exist
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS ${destinationTable} (${columns});
    `;

    await clientdoc.query(createTableQuery);
  } else {
    console.log("Table already exists.");
  }
};


const insertRecords = async (clientdoc, records) => {
  const destinationTable = process.env.DESTINATION_TABLE;

  // Get the schema of the destination table to dynamically create the insert query
  const getDestinationTableSchemaQuery = `
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = '${destinationTable}';
  `;

  const schemaResult = await clientdoc.query(getDestinationTableSchemaQuery);
  const columns = schemaResult.rows.map(row => row.column_name);
  const columnNames = columns.join(', ');

  // Build the values part of the insert query
  const values = records.map(record => {
    const recordValues = columns.map(column => {
      const value = record[column];
      if (typeof value === 'string') {
        return `'${value.replace(/'/g, "''")}'`; // Escape single quotes
      } else if (value === null || value === undefined) {
        return 'NULL';
      } else {
        return value;
      }
    }).join(', ');
    return `(${recordValues})`;
  }).join(', ');

  // Insert records into the destination table
  const insertQuery = `
    INSERT INTO ${destinationTable} (${columnNames}) VALUES ${values};
  `;

  await clientdoc.query(insertQuery);
};


app.get('/', async (req, res) => {
  console.log("Connecting to the machine localhost DB....");
  let clientLocal, clientDOCKER;
  
  try {
    // Connect to local database
    clientLocal = await pool.connect();
    const resultLocal = await clientLocal.query(`SELECT * FROM ${process.env.SOURCE_TABLE}`);
    const records = resultLocal.rows;
    clientLocal.release();

    // Build connection to docker postgres DB
    console.log("Connecting to the docker postgres DB....");
    clientDOCKER = await buildConnectionWithDockerPostgres();

    // Check and create table if not exists
    await checkAndCreateTable(clientLocal,clientDOCKER);

    // Insert records from users_field
    await insertRecords(clientDOCKER, records);

    res.send("Data inserted successfully");
    clientDOCKER.release();
  } catch (err) {
    console.error(err);
    res.send("Error " + err);
    if (clientLocal) clientLocal.release();
    if (clientDOCKER) clientDOCKER.release();
  }
});

// Start the server and listen on the defined port
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
