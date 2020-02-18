// Load the project's dependencies:
const fastify = require("fastify");
const fastifyCors = require("fastify-cors");
const { Client } = require("pg");

// Setup the database connection:
const client = new Client({
  connectionString: process.env.PGSTRING
});

// Setup the Fastify instance & plugins:
const server = fastify({ logger: true });
server.register(fastifyCors, {});

server.get("/:uname", async (request, reply) => {
  if (!request.params.uname) {
    reply.code(404).send("Data not available");
    return;
  }

  const sql = "SELECT * FROM cv_data WHERE id = $1";
  const result = await client.query(sql, [request.params.uname]);

  if (!result.rowCount) {
    reply.code(404).send("The username was not found");
    return;
  }

  reply.send(result.rows[0].data);
});

server.post("/:uname", async (request, reply) => {
  if (!request.params.uname) {
    reply.code(404).send("Data not available");
    return;
  }

  const sql = `
    INSERT INTO cv_data VALUES ($1, $2)
    ON CONFLICT ON CONSTRAINT cv_data_pkey DO
    UPDATE SET data = EXCLUDED.data
    RETURNING data
    `;
  const values = [request.params.uname, request.body];
  const result = await client.query(sql, values);
  reply.send(result.rows[0].data);
});

(async () => {
  try {
    await client.connect();

    // ensure that the TODOS table exists
    // NOTE: "if not exists"
    await client.query(`
      CREATE TABLE IF NOT EXISTS cv_data (
        id VARCHAR(20) PRIMARY KEY,
        data JSONB NOT NULL DEFAULT '{}'
      );
    `);

    // start the server
    await server.listen(process.env.PORT || 8080, "0.0.0.0");

    console.info("App started correctly");
  } catch (err) {
    console.error(`Boot Error: ${err.message}`);
  }
})();
