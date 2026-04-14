import express, { type Express, type Request, type Response } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import { createReadStream } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import router from "./routes";
import { logger } from "./lib/logger";

// Resolve Unicode.html relative to this source file: src/ → .. → api-server → .. → artifacts → .. → workspace root
const __dirname = dirname(fileURLToPath(import.meta.url));
const UNICODE_HTML = resolve(__dirname, "..", "..", "..", "Unicode.html");

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get(["/", "/unicode"], (_req: Request, res: Response) => {
  res.setHeader("Content-Type", "text/html; charset=UTF-8");
  createReadStream(UNICODE_HTML).pipe(res);
});

app.use("/api", router);

export default app;
