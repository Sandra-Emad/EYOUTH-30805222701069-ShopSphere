import { jest } from "@jest/globals";

const sendMail = jest.fn();

const createTransport = jest.fn(() => ({
  sendMail,
}));

jest.unstable_mockModule("nodemailer", () => ({
  default: {
    createTransport,
  },
}));

const {
  sendWelcomeEmail,
} = await import("../../src/services/email.service.js");

describe("Email Service", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    delete process.env.SMTP_HOST;
    delete process.env.SMTP_USER;
    delete process.env.SMTP_PASS;

    delete process.env.EMAIL_FROM;
    delete process.env.SMTP_PORT;
  });

  test("should skip email when SMTP configuration is missing", async () => {
    await sendWelcomeEmail({
      name: "Test User",
      email: "test@example.com",
    });

    expect(createTransport).not.toHaveBeenCalled();

    expect(sendMail).not.toHaveBeenCalled();
  });

  test("should create SMTP transporter when configuration exists", async () => {
    process.env.SMTP_HOST = "smtp.example.com";
    process.env.SMTP_PORT = "587";
    process.env.SMTP_USER = "test@example.com";
    process.env.SMTP_PASS = "password123";

    await sendWelcomeEmail({
      name: "Test User",
      email: "test@example.com",
    });

    expect(createTransport).toHaveBeenCalledTimes(1);

    expect(createTransport).toHaveBeenCalledWith({
      host: "smtp.example.com",
      port: 587,
      secure: false,
      auth: {
        user: "test@example.com",
        pass: "password123",
      },
    });
  });

  test("should send welcome email", async () => {
    process.env.SMTP_HOST = "smtp.example.com";
    process.env.SMTP_PORT = "587";
    process.env.SMTP_USER = "test@example.com";
    process.env.SMTP_PASS = "password123";

    process.env.EMAIL_FROM = "no-reply@example.com";

    await sendWelcomeEmail({
      name: "Test User",
      email: "test@example.com",
    });

    expect(sendMail).toHaveBeenCalledTimes(1);

    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        from: "no-reply@example.com",
        to: "test@example.com",
        subject: "Welcome to Our Store",
      })
    );
  });

  test("should use SMTP user as sender when EMAIL_FROM is missing", async () => {
    process.env.SMTP_HOST = "smtp.example.com";
    process.env.SMTP_PORT = "587";
    process.env.SMTP_USER = "sender@example.com";
    process.env.SMTP_PASS = "password123";

    await sendWelcomeEmail({
      name: "Another User",
      email: "another@example.com",
    });

    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        from: "sender@example.com",
        to: "another@example.com",
        subject: "Welcome to Our Store",
      })
    );
  });

  test("should use secure SMTP connection on port 465", async () => {
    process.env.SMTP_HOST = "smtp.example.com";
    process.env.SMTP_PORT = "465";
    process.env.SMTP_USER = "sender@example.com";
    process.env.SMTP_PASS = "password123";

    await sendWelcomeEmail({
      name: "Secure User",
      email: "secure@example.com",
    });

    expect(createTransport).toHaveBeenCalledWith({
      host: "smtp.example.com",
      port: 465,
      secure: true,
      auth: {
        user: "sender@example.com",
        pass: "password123",
      },
    });
  });

  test("should reject when sending email fails", async () => {
    process.env.SMTP_HOST = "smtp.example.com";
    process.env.SMTP_PORT = "587";
    process.env.SMTP_USER = "sender@example.com";
    process.env.SMTP_PASS = "password123";

    sendMail.mockRejectedValueOnce(
      new Error("SMTP error")
    );

    await expect(
      sendWelcomeEmail({
        name: "Failed User",
        email: "failed@example.com",
      })
    ).rejects.toThrow("SMTP error");
  });
});