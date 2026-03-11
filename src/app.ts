import compression from "compression";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import env from "./config/env";
import errorHandler from "./middlewares/error-handler";
import notFoundHandler from "./middlewares/not-found";

const app = express();

app.set("trust proxy", 1);

app.use(
	cors({
		origin: env.CLIENT_URL,
		credentials: true,
	})
);
app.use(helmet());
app.use(compression());
app.use(cookieParser());
app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

app.get("/health", (_req, res) => {
	res.status(200).json({
		success: true,
		message: "API is running",
		environment: env.NODE_ENV,
	});
});

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
