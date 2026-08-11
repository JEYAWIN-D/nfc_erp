import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

import routes from "./routes";

const app = express();

app.use(cors());

app.use(express.json());

app.use(helmet());
app.use('/api/v1/iot', rateLimit({ windowMs: 60_000, max: 60 }));
app.use('/api/v1/qc-checks', rateLimit({ windowMs: 60_000, max: 60 }));

app.use("/api/v1", routes);

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

export default app;