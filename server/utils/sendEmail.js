import nodemailer from 'nodemailer';
import logger from './logger.js';

const transporter = () => nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: +process.env.SMTP_PORT,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});

const base = (body) => `<!DOCTYPE html><html><body style="font-family:sans-serif;max-width:600px;margin:auto;padding:24px">
  <div style="background:linear-gradient(135deg,#6366f1,#7c3aed);padding:24px;border-radius:12px 12px 0 0;text-align:center">
    <h1 style="color:#fff;margin:0;font-size:22px">Nexus</h1></div>
  <div style="background:#fff;border:1px solid #e5e7eb;border-top:none;padding:32px;border-radius:0 0 12px 12px">${body}</div>
</body></html>`;

const btn = (url, label) =>
  `<a href="${url}" style="display:inline-block;padding:12px 28px;background:#6366f1;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;margin:20px 0">${label}</a>`;

const templates = {
  verifyEmail:     (name, url) => ({ subject: 'Verify your Nexus email',
    html: base(`<h2>Welcome, ${name}!</h2><p>Please verify your email to get started.</p>${btn(url,'Verify Email')}<p style="color:#9ca3af;font-size:13px">Link expires in 24 hours.</p>`) }),
  resetPassword:   (name, url) => ({ subject: 'Reset your Nexus password',
    html: base(`<h2>Password Reset</h2><p>Hi ${name}, click below to reset your password.</p>${btn(url,'Reset Password')}<p style="color:#9ca3af;font-size:13px">Expires in 10 minutes.</p>`) }),
  passwordChanged: (name)      => ({ subject: 'Your password was changed',
    html: base(`<h2>Password Changed</h2><p>Hi ${name}, your password was updated. If this wasn't you, contact support immediately.</p>`) }),
};

export const sendEmail = async ({ to, template, data }) => {
  try {
    const { subject, html } = templates[template](...data);
    const info = await transporter().sendMail({
      from: `"${process.env.FROM_NAME}" <${process.env.FROM_EMAIL}>`,
      to, subject, html,
    });
    logger.info(`Email sent: ${info.messageId}`);
  } catch (e) {
    logger.error(`Email error: ${e.message}`);
    throw new Error('Email could not be sent');
  }
};
