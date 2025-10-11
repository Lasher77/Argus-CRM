const nodemailer = require('nodemailer');
const env = require('../config/env');

const smtpHost = env.SMTP_HOST;
const smtpPort = env.SMTP_PORT ? Number(env.SMTP_PORT) : 587;
const smtpSecure = env.SMTP_SECURE ? env.SMTP_SECURE === 'true' : smtpPort === 465;
const smtpUser = env.SMTP_USER;
const smtpPass = env.SMTP_PASSWORD;

const transporter = smtpHost
  ? nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure,
      auth: smtpUser && smtpPass ? { user: smtpUser, pass: smtpPass } : undefined,
    })
  : null;

const defaultFrom = env.SMTP_FROM || smtpUser;

const sendMail = async (options) => {
  if (!transporter) {
    throw new Error('SMTP-Transporter ist nicht initialisiert (SMTP_HOST fehlt)');
  }

  const mailOptions = {
    from: options.from || defaultFrom,
    to: options.to,
    cc: options.cc,
    bcc: options.bcc,
    subject: options.subject,
    text: options.text,
    html: options.html,
    attachments: options.attachments,
  };

  return transporter.sendMail(mailOptions);
};

module.exports = {
  sendMail,
};
