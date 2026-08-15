import app from "./app.js";
import config from "./config/index.js";
import { prisma } from "./lib/prisma.js";

const port = config.port;

// if (config.node_env !== "production") {

//   async function main() {
//     try {
//       await prisma.$connect();
//       console.log("Prisma is successfully connected.");
//       app.listen(port, () => {
//         console.log(`The server is listening at ${port}.`);
//       });
//     } catch (error) {
//       console.error("The error is starting: ", error);
//       await prisma.$disconnect();
//       process.exit(1);
//     }
//   }
//   main();
// }

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





