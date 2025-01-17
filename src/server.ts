import { app } from "./app";
import { Elysia } from 'elysia'

const port = 3000;

await app.listen(port);

function getProtocol(app: Elysia): string {
  // Bun utiliza la propiedad `.secure` para indicar si una conexión es segura (HTTPS)
 if ((app.server as any)?.secure) {   
    return "https";
  } else {
    return "http";
  }
}

console.log(
  `🦊 Elysia is running at ${getProtocol(app)}://${app.server?.hostname}:${app.server?.port}`
);