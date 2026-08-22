import nodemailer from "nodemailer";

const createTransporter = () => {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass,
    },
  });
};

export const sendWelcomeEmail = async ({ name, email }) => {
  const transporter = createTransporter();

  if (!transporter) {
    console.warn(
      "Welcome email skipped: SMTP configuration is missing."
    );
    return;
  }

  const from =
    process.env.EMAIL_FROM ||
    process.env.SMTP_USER;

  await transporter.sendMail({
    from,
    to: email,
    subject: "Welcome to Our Store",
    text: `Hello ${name},

Welcome to our store!

Your account has been created successfully.

Thank you for joining us.`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>Welcome to Our Store, ${name}!</h2>

        <p>
          Your account has been created successfully.
        </p>

        <p>
          Thank you for joining us.
        </p>
      </div>
    `,
  });
};

export default {
  sendWelcomeEmail,
};