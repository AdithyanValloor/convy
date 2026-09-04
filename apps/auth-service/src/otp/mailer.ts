/** OTP email sender. */

import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  // Swap this for a custom SMTP transport if delivery moves off Gmail.
  service: "gmail",
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

export const sendOtpEmail = async (
  email: string,
  otp: string,
): Promise<void> => {
  await transporter.sendMail({
    from: `"Convy" <${process.env.MAIL_USER}>`,
    to: email,
    subject: "Your Convy verification code",
    text: `Your Convy verification code is ${otp}. It expires in 10 minutes. Do not share this code with anyone.`,
    html: `
      <div style="font-family: Arial, sans-serif; color: #1a1a1a; max-width: 600px; margin: 0 auto;">
        <h2>Your Convy verification code</h2>

        <p>Hi,</p>

        <p>Use the verification code below to continue with your Convy account:</p>

        <div
          style="
            margin: 24px 0;
            padding: 16px 24px;
            background: #f4f4f5;
            border-radius: 8px;
            font-size: 32px;
            font-weight: bold;
            letter-spacing: 6px;
            text-align: center;
          "
        >
          ${otp}
        </div>

        <p>This code will expire in <strong>10 minutes</strong>.</p>

        <p style="color: #666;">
          For your security, please do not share this code with anyone.
          Convy will never ask you for your verification code.
        </p>

        <p style="color: #666;">
          If you didn't request this code, you can safely ignore this email.
        </p>

        <br />

        <p>
          — <strong>The Convy Team</strong>
        </p>
      </div>
    `,
  });
};