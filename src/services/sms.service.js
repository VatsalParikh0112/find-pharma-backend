const sendOtpSms = async (phone, otp) => {
  console.log(`[SMS OTP] ${phone} → ${otp}`);

  const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER } = process.env;
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
    console.warn('[SMS] Twilio credentials not set, skipping SMS');
    return;
  }

  try {
    const twilio = require('twilio')(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
    await twilio.messages.create({
      body: `Your FindMy Pharma OTP is ${otp}. Valid for 10 minutes. Do not share it with anyone.`,
      from: TWILIO_PHONE_NUMBER,
      to: phone,
    });
    console.log(`[SMS] OTP sent to ${phone}`);
  } catch (err) {
    console.error('[SMS] Twilio error:', err.message);
  }
};

module.exports = { sendOtpSms };
