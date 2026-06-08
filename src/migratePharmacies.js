require('dotenv').config();

const mongoose = require('mongoose');
const Pharmacy = require('./models/Pharmacy');

// One-off migration: make the seeded demo pharmacies (the ones with no owner
// account) visible in patient search by marking them approved + active.
// Real, registered pharmacies have an `owner` and are left untouched, so their
// admin verification status is preserved.
const run = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const res = await Pharmacy.updateMany(
      { owner: { $exists: false } },
      { $set: { verificationStatus: 'approved', accountStatus: 'active', isActive: true } },
    );

    console.log(`✅ Updated ${res.modifiedCount} demo pharmacies to approved/active`);
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration error:', err.message);
    process.exit(1);
  }
};

run();
