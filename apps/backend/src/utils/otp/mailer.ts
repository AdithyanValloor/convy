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

export const sendOtpEmail = async (email: string, otp: string) => {
  await transporter.sendMail({
    from: `"Convy" <${process.env.MAIL_USER}>`,
    to: email,
    subject: "Your verification code",
    // Keep the template minimal so the code stays easy to read on all clients.
    html: `
      <p>Your OTP is <strong>${otp}</strong>.</p>
      <p>It expires in 10 minutes. Do not share it with anyone.</p>
    `,
  });
};
