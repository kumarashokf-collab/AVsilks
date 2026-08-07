"use strict";

const path = require("node:path");
const dotenv = require("dotenv");

const envPath = path.join(
  __dirname,
  ".env.server.local"
);

const dotenvResult = dotenv.config({
  path: envPath,
});

if (dotenvResult.error) {
  throw new Error(
    "Unable to load backend/.env.server.local"
  );
}

const app = require("./app");

const parsedPort = Number.parseInt(
  process.env.PORT || "8080",
  10
);

if (
  !Number.isInteger(parsedPort)
  || parsedPort < 1
  || parsedPort > 65535
) {
  throw new Error(
    "PORT must be an integer between 1 and 65535"
  );
}

app.listen(parsedPort, "0.0.0.0", () => {
  console.log(
    `AVsilks API running on http://localhost:${parsedPort}`
  );
});
