import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import path from "path";
import { fileURLToPath } from "url";
import router from "./routes";
import { logger } from "./lib/logger";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

app.use("/api", router);

// Serve static files from the built frontend
const staticPath = path.join(__dirname, "../../cinefy/dist/public");
app.use(express.static(staticPath));

// For all non-API routing (client-side routing fallbacks), send index.html
app.get("*path", (req, res) => {
  if (req.path.startsWith("/api")) {
    res.status(404).json({ error: "API endpoint not found" });
    return;
  }
  res.sendFile(path.join(staticPath, "index.html"));
});

export default app;
