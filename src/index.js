/**
 * FASTIFY PLUGINS & CORS
 * ==================================================
 *
 * ## What do I need?
 * Before you star,t you should obtain a "Postgres connection string".
 * If you don't know what that is, google it :-)
 *
 * You can get a free Postgres instance following this article:
 * https://marcopeg.com/2019/setup-free-postgres
 *
 * ## Sandbox Settings
 *
 * Once you have that piece of info, you should fork this sandbox
 * into your account and configure it by setting up a "SECRET KEY"
 * named "PGSTRING" in the "Server Control Panel" from the left
 * hand toolbar.
 */

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

server.get("/", async (request, reply) => {
  const sql = "SELECT * FROM todos";
  const result = await client.query(sql);
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
