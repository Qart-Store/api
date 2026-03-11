import compression from "compression";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import env from "./config/env";
import errorHandler from "./middlewares/error-handler.middleware";
import notFoundHandler from "./middlewares/not-found.middleware";
import productRouter from "./routes/product.route";
import { sendSuccess } from "./utils/api-response";

const app = express();

app.set("trust proxy", 1);

app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true,
  }),
);
app.use(helmet());
app.use(compression());
app.use(cookieParser());
app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

app.get("/health", (_req, res) => {
  return sendSuccess(
    res,
    "API is running",
    { environment: env.NODE_ENV },
    200,
    "ok",
  );
});

app.use("/api/products", productRouter);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
