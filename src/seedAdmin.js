require('dotenv').config();

const mongoose = require('mongoose');
const Admin = require('./models/Admin');

// Creates (or resets the password of) the admin account used to review
// pharmacy verification requests. Configure via env or use the defaults below.
const EMAIL = (process.env.ADMIN_LOGIN_EMAIL || 'admin@findmypharma.com').toLowerCase();
const PASSWORD = process.env.ADMIN_LOGIN_PASSWORD || 'admin12345';

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    let admin = await Admin.findOne({ email: EMAIL }).select('+password');
    if (admin) {
      admin.password = PASSWORD; // re-hashed by the pre-save hook
      await admin.save();
      console.log(`🔁 Updated admin password for ${EMAIL}`);
    } else {
      admin = await Admin.create({ email: EMAIL, password: PASSWORD, name: 'Admin' });
      console.log(`✅ Created admin ${EMAIL}`);
    }

    console.log(`\n   Login email:    ${EMAIL}\n   Login password: ${PASSWORD}\n`);
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌ Admin seed error:', err.message);
    process.exit(1);
  }
};

run();
