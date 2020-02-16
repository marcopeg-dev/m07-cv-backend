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
  const sql = "SELECT * FROM cv_data WHERE id = $1";
  const result = await client.query(sql, [request.params.uname]);

  if (!result.rowCount) {
    reply.code(404).send("Not found");
    return;
  }

  reply.send(result.rows);
});

server.post("/", async (request, reply) => {
  const sql = "INSERT INTO todos (text) VALUES ($1)";
  const values = [request.body.text];
  const result = await client.query(sql, values);
  reply.send(result);
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
    await server.listen(8080);

    console.info("App started correctly");
  } catch (err) {
    console.error(`Boot Error: ${err.message}`);
  }
})();
