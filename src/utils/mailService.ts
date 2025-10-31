// services/mailService.ts
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import { generateEmailTemplate } from "../utils/emailTemplate";

dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sendMail = async ({
  to,
  subject,
  title,
  body,
}: {
  to: string;
  subject: string;
  title: string;
  body: string; // HTML body
}) => {
  try {
    const html = generateEmailTemplate(title, body);

    await transporter.sendMail({
      from: `"Task Manager" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    });

    console.log(`Email sent to ${to}`);
  } catch (error) {
    console.error("Error sending email:", error);
  }
};
