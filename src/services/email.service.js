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

/**
 * Notifies the admin that a pharmacy submitted its details for verification,
 * with one-click approve / reject links.
 */
const sendPharmacyVerificationEmail = async (adminEmail, { pharmacy, approveUrl, rejectUrl }) => {
  const transporter = createTransporter();

  const addr = pharmacy.address || {};
  const fullAddress = [addr.street, addr.city, addr.state, addr.pincode]
    .filter(Boolean)
    .join(', ');

  await transporter.sendMail({
    from: `"FindMy Pharma" <${process.env.EMAIL_USER}>`,
    to: adminEmail,
    subject: `Pharmacy verification request — ${pharmacy.name}`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px;background:#064e3b;border-radius:16px;color:white;">
        <h2 style="margin:0 0 8px;color:#34d399;">FindMy Pharma — Admin</h2>
        <p style="color:rgba(255,255,255,0.7);margin:0 0 20px;">A pharmacy has requested verification.</p>
        <div style="background:rgba(255,255,255,0.1);border-radius:12px;padding:16px 20px;line-height:1.7;color:rgba(255,255,255,0.9);">
          <div><strong>Name:</strong> ${pharmacy.name}</div>
          <div><strong>Email:</strong> ${pharmacy.email || '—'}</div>
          <div><strong>Phone:</strong> ${pharmacy.phone || '—'}</div>
          <div><strong>Address:</strong> ${fullAddress || '—'}</div>
          <div><strong>Hours:</strong> ${pharmacy.openingHours || '—'}</div>
          <div style="margin-top:10px;border-top:1px solid rgba(255,255,255,0.15);padding-top:10px;">
            <strong>NPI:</strong> ${pharmacy.npiNumber || '—'}
            ${
              pharmacy.npiVerified
                ? ` <span style="color:#6ee7b7;">✓ verified in NPPES${
                    pharmacy.npiRegistryName ? ` as “${pharmacy.npiRegistryName}”` : ''
                  }</span>`
                : ''
            }
          </div>
          <div><strong>State license:</strong> ${pharmacy.stateLicenseNumber || '—'} (${
            pharmacy.licenseState || '—'
          })</div>
        </div>
        <div style="margin:24px 0 8px;display:flex;gap:12px;">
          <a href="${approveUrl}" style="display:inline-block;background:#10b981;color:white;text-decoration:none;padding:12px 24px;border-radius:10px;font-weight:bold;">Approve</a>
          <a href="${rejectUrl}" style="display:inline-block;background:#ef4444;color:white;text-decoration:none;padding:12px 24px;border-radius:10px;font-weight:bold;">Reject</a>
        </div>
        <p style="color:rgba(255,255,255,0.5);font-size:13px;margin:20px 0 0;">
          These links are valid for 7 days.
        </p>
      </div>
    `,
  });
};

/** Tells the pharmacy whether their verification was approved or rejected. */
const sendPharmacyStatusEmail = async (email, { pharmacyName, status, reason }) => {
  const transporter = createTransporter();

  const approved = status === 'approved';

  await transporter.sendMail({
    from: `"FindMy Pharma" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: approved
      ? 'Your pharmacy has been verified 🎉'
      : 'Update on your pharmacy verification',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#064e3b;border-radius:16px;color:white;">
        <h2 style="margin:0 0 8px;color:#34d399;">FindMy Pharma</h2>
        <p style="color:rgba(255,255,255,0.85);margin:0 0 20px;">Hi ${pharmacyName || 'there'},</p>
        <div style="background:rgba(255,255,255,0.1);border-radius:12px;padding:16px 20px;line-height:1.6;color:rgba(255,255,255,0.85);">
          ${
            approved
              ? 'Your pharmacy has been <strong style="color:#6ee7b7;">verified</strong>. You can now sign in to the pharmacy portal and your listing is visible to patients.'
              : `Your pharmacy verification was <strong style="color:#fca5a5;">not approved</strong>.${
                  reason ? ` Reason: ${reason}.` : ''
                } You can update your details and resubmit from the portal.`
          }
        </div>
        <p style="color:rgba(255,255,255,0.5);font-size:13px;margin:20px 0 0;">
          Thank you for using FindMy Pharma.
        </p>
      </div>
    `,
  });
};

/** Account / billing notices to a pharmacy: warning, disabled, or reactivated. */
const sendPharmacyAccountEmail = async (email, { pharmacyName, kind, reason }) => {
  const transporter = createTransporter();

  const copy = {
    warned: {
      subject: 'Action needed on your FindMy Pharma account',
      heading: 'Account warning',
      color: '#fbbf24',
      body: `This is a notice regarding your pharmacy account.${
        reason ? ` ${reason}.` : ''
      } Please resolve this to avoid your listing being disabled.`,
    },
    disabled: {
      subject: 'Your FindMy Pharma listing has been disabled',
      heading: 'Account disabled',
      color: '#fca5a5',
      body: `Your pharmacy listing has been disabled and is no longer visible to patients.${
        reason ? ` Reason: ${reason}.` : ''
      } Please contact support to restore it.`,
    },
    reactivated: {
      subject: 'Your FindMy Pharma listing is active again',
      heading: 'Account reactivated',
      color: '#6ee7b7',
      body: 'Your pharmacy listing has been reactivated and is visible to patients again.',
    },
  }[kind];

  await transporter.sendMail({
    from: `"FindMy Pharma" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: copy.subject,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#064e3b;border-radius:16px;color:white;">
        <h2 style="margin:0 0 8px;color:#34d399;">FindMy Pharma</h2>
        <p style="color:rgba(255,255,255,0.85);margin:0 0 16px;">Hi ${pharmacyName || 'there'},</p>
        <h3 style="color:${copy.color};margin:0 0 12px;">${copy.heading}</h3>
        <div style="background:rgba(255,255,255,0.1);border-radius:12px;padding:16px 20px;line-height:1.6;color:rgba(255,255,255,0.85);">
          ${copy.body}
        </div>
      </div>
    `,
  });
};

/** Admin reply to a support ticket. */
const sendSupportReplyEmail = async (email, { name, subject, response }) => {
  const transporter = createTransporter();

  await transporter.sendMail({
    from: `"FindMy Pharma Support" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `Re: ${subject}`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#064e3b;border-radius:16px;color:white;">
        <h2 style="margin:0 0 8px;color:#34d399;">FindMy Pharma Support</h2>
        <p style="color:rgba(255,255,255,0.85);margin:0 0 16px;">Hi ${name || 'there'},</p>
        <div style="background:rgba(255,255,255,0.1);border-radius:12px;padding:16px 20px;line-height:1.6;color:rgba(255,255,255,0.85);white-space:pre-line;">
          ${response}
        </div>
        <p style="color:rgba(255,255,255,0.5);font-size:13px;margin:20px 0 0;">
          Regarding: ${subject}
        </p>
      </div>
    `,
  });
};

module.exports = {
  sendOtpEmail,
  sendRequestConfirmationEmail,
  sendPharmacyVerificationEmail,
  sendPharmacyStatusEmail,
  sendPharmacyAccountEmail,
  sendSupportReplyEmail,
};
