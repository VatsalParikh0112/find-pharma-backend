const sendOtpSms = async (phone, otp) => {
  console.log(`[SMS OTP] ${phone} → ${otp}`);

  const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER } = process.env;

  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
    throw new Error('Twilio credentials are not configured. Please set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER in your environment variables.');
  }

  const twilio = require('twilio')(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
  await twilio.messages.create({
    body: `Your FindMy Pharma OTP is ${otp}. Valid for 10 minutes. Do not share it with anyone.`,
    from: TWILIO_PHONE_NUMBER,
    to: phone,
  });

  console.log(`[SMS] OTP sent to ${phone}`);
};

module.exports = { sendOtpSms };
