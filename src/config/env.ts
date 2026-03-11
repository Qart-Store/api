import dotenv from "dotenv";

dotenv.config();

const env = {
  NODE_ENV: process.env.NODE_ENV ?? "development",
  PORT: Number(process.env.PORT) || 4000,
  CLIENT_URL: process.env.CLIENT_URL ?? "http://localhost:3000",
  JWT_SECRET: process.env.JWT_SECRET ?? "dev_jwt_secret_change_me",
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN ?? "7d",
  ADMIN_API_KEY: process.env.ADMIN_API_KEY ?? "dev_admin_api_key_change_me",
} as const;

export default env;
