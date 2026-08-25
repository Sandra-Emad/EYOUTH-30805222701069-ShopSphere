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

/**
 * Verify SMTP connection.
 *
 * Returns false when SMTP configuration is missing,
 * instead of crashing the application.
 */
export const verifyEmailConnection = async () => {
  const transporter = createTransporter();

  if (!transporter) {
    console.warn(
      "Email service verification skipped: SMTP configuration is missing."
    );

    return false;
  }

  await transporter.verify();

  return true;
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
    subject: "Welcome to ShopSphere",
    text: `Hello ${name},

Welcome to ShopSphere!

Your account has been created successfully.

Thank you for joining us.`,
    html: `
      <div
        style="
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #111827;
        "
      >
        <h2>Welcome to ShopSphere, ${name}!</h2>

        <p>
          Your account has been created successfully.
        </p>

        <p>
          Thank you for joining ShopSphere.
        </p>
      </div>
    `,
  });
};

export default {
  sendWelcomeEmail,
  verifyEmailConnection,
};