import nodemailer from "nodemailer";
import env from "./env.js";

const hasAuth = Boolean(env.SMTP_USER) && Boolean(env.SMTP_PASS);

const mailTransporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_SECURE,
  auth: hasAuth
    ? {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
      }
    : undefined,
});

export default mailTransporter;
