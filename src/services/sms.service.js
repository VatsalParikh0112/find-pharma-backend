const sendOtpSms = async (phone, otp) => {
  // Demo mode: skip the real SMS (Twilio trial can't reach all numbers).
  // The matching fixed code is accepted in otp.controller's verifyOtpRecord.
  if (process.env.OTP_DEMO_MODE === 'true') {
    console.log(`[OTP_DEMO_MODE] SMS skipped for ${phone} — use code 123456`);
    return;
  }

  const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER } = process.env;

  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
    throw new Error('SMS service is not configured.');
  }

  const twilio = require('twilio')(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
  await twilio.messages.create({
    body: `Your FindMy Pharma OTP is ${otp}. Valid for 10 minutes. Do not share it with anyone.`,
    from: TWILIO_PHONE_NUMBER,
    to: phone,
  });
};

module.exports = { sendOtpSms };
