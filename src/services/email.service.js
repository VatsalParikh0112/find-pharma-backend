const nodemailer = require('nodemailer');

const sendOtpEmail = async (email, otp) => {
  console.log(`[OTP] ${email} → ${otp}`);

  const { EMAIL_USER, EMAIL_PASS } = process.env;

  if (!EMAIL_USER || !EMAIL_PASS) {
    throw new Error('Email credentials are not configured. Please set EMAIL_USER and EMAIL_PASS in your environment variables.');
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASS,
    },
  });

  await transporter.sendMail({
    from: `"FindMy Pharma" <${EMAIL_USER}>`,
    to: email,
    subject: 'Your FindMy Pharma OTP',
    html: `
      <div style="font-family:sans-serif;max-width:420px;margin:0 auto;padding:32px;background:#064e3b;border-radius:16px;color:white;">
        <h2 style="margin:0 0 8px;color:#34d399;">FindMy Pharma</h2>
        <p style="color:rgba(255,255,255,0.7);margin:0 0 24px;">Use the OTP below to continue.</p>
        <div style="background:rgba(255,255,255,0.1);border-radius:12px;padding:20px;text-align:center;letter-spacing:10px;font-size:32px;font-weight:bold;color:#6ee7b7;">
          ${otp}
        </div>
        <p style="color:rgba(255,255,255,0.5);font-size:13px;margin:20px 0 0;">
          This OTP expires in <strong>10 minutes</strong>. Do not share it with anyone.
        </p>
      </div>
    `,
  });

  console.log(`[Email] OTP sent to ${email}`);
};

module.exports = { sendOtpEmail };
