const nodemailer = require('nodemailer');

const createTransporter = () => {
  const { EMAIL_USER, EMAIL_PASS } = process.env;

  if (!EMAIL_USER || !EMAIL_PASS) {
    throw new Error('Email service is not configured.');
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user: EMAIL_USER, pass: EMAIL_PASS },
  });
};

const sendOtpEmail = async (email, otp) => {
  const transporter = createTransporter();

  await transporter.sendMail({
    from: `"FindMy Pharma" <${process.env.EMAIL_USER}>`,
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
};

/**
 * Confirms to the patient that their medicine request reached the pharmacy.
 * They'll get a second email once the pharmacy responds.
 */
const sendRequestConfirmationEmail = async (email, { patientName, medicineName, pharmacyName }) => {
  const transporter = createTransporter();

  await transporter.sendMail({
    from: `"FindMy Pharma" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Your medicine request has been sent',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#064e3b;border-radius:16px;color:white;">
        <h2 style="margin:0 0 8px;color:#34d399;">FindMy Pharma</h2>
        <p style="color:rgba(255,255,255,0.85);margin:0 0 20px;">Hi ${patientName || 'there'},</p>
        <p style="color:rgba(255,255,255,0.7);margin:0 0 20px;line-height:1.6;">
          Your request for <strong style="color:#6ee7b7;">${medicineName}</strong> has been sent to
          <strong style="color:#6ee7b7;">${pharmacyName}</strong>.
        </p>
        <div style="background:rgba(255,255,255,0.1);border-radius:12px;padding:16px 20px;line-height:1.6;color:rgba(255,255,255,0.85);">
          Once the pharmacy responds, we'll send you a confirmation email with their decision.
          You can also track the status anytime in your <strong>History</strong> page.
        </div>
        <p style="color:rgba(255,255,255,0.5);font-size:13px;margin:20px 0 0;">
          Thank you for using FindMy Pharma.
        </p>
      </div>
    `,
  });
};

module.exports = { sendOtpEmail, sendRequestConfirmationEmail };
