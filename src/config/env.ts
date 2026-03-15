import dotenv from "dotenv";

const environment = process.env.NODE_ENV || "development";

const envFile = `.env.${environment}`;

dotenv.config({ path: envFile });

const env = {
  NODE_ENV: process.env.NODE_ENV ?? "development",
  PORT: Number(process.env.PORT) || 4000,
  CLIENT_URL: process.env.CLIENT_URL ?? "http://localhost:3000",
  JWT_SECRET: process.env.JWT_SECRET ?? "dev_jwt_secret_change_me",
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN ?? "7d",
  ADMIN_API_KEY: process.env.ADMIN_API_KEY ?? "dev_admin_api_key_change_me",
  PAYSTACK_BASE_URL: process.env.PAYSTACK_BASE_URL ?? "https://api.paystack.co",
  PAYSTACK_SECRET_KEY: process.env.PAYSTACK_SECRET_KEY ?? "",
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME ?? "",
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY ?? "",
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET ?? "",
  SMTP_HOST: process.env.SMTP_HOST ?? "localhost",
  SMTP_PORT: Number(process.env.SMTP_PORT) || 587,
  SMTP_SECURE: process.env.SMTP_SECURE === "true",
  SMTP_USER: process.env.SMTP_USER ?? "",
  SMTP_PASS: process.env.SMTP_PASS ?? "",
  SMTP_FROM: process.env.SMTP_FROM ?? "no-reply@qart-store.local",
} as const;

export default env;
