import app from "./app";
import config from "./config";
import { prisma } from "./lib/prisma";

const port = config.port;

async function main() {
  try {
    await prisma.$connect();
    console.log("Prisma is successfully connected.");
    app.listen(port, () => {
      console.log(`The server is listening at ${port}.`);
    });
  } catch (error) {
    console.error("The error is starting: ", error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

main();
