require('dotenv').config();

const mongoose = require('mongoose');
const PharmacyUser = require('./models/PharmacyUser');
const Pharmacy = require('./models/Pharmacy');
const Otp = require('./models/Otp');

// Removes the two demo pharmacy accounts (and their listings + pending OTPs) so
// you can register them live during a demo. Edit these as needed.
const TEST_EMAILS = ['parikhvatsal75@gmail.com', 'poojanparikh03@gmail.com'];
const TEST_PHONES = ['+919979500578', '+917990876497'];

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const users = await PharmacyUser.find({ email: { $in: TEST_EMAILS } }, '_id email');
    const ids = users.map(u => u._id);

    const listings = await Pharmacy.deleteMany({ owner: { $in: ids } });
    const accounts = await PharmacyUser.deleteMany({ _id: { $in: ids } });
    const otps = await Otp.deleteMany({
      target: { $in: [...TEST_EMAILS, ...TEST_PHONES] },
    });

    console.log(`🗑️  Removed ${accounts.deletedCount} pharmacy account(s): ${users.map(u => u.email).join(', ') || '(none)'}`);
    console.log(`🗑️  Removed ${listings.deletedCount} pharmacy listing(s)`);
    console.log(`🗑️  Removed ${otps.deletedCount} pending OTP(s)`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌ Cleanup error:', err.message);
    process.exit(1);
  }
};

run();
