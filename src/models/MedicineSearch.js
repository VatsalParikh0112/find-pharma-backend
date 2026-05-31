const mongoose = require('mongoose');

const medicineSearchSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    medicines: [
      {
        name: { type: String, required: true, trim: true },
        strength: { type: String, trim: true },
        formType: { type: String, trim: true },
        genericBrandPref: { type: String, trim: true },
      },
    ],
    location: {
      lat: Number,
      lng: Number,
    },
    postalCode: {
      type: String,
      trim: true,
    },
    resultsCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model('MedicineSearch', medicineSearchSchema);
