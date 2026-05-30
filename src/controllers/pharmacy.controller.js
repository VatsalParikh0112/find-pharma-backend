const Pharmacy = require('../models/Pharmacy');

const MAX_DISTANCE_METERS = 20000; // 20 km

const geocodePostalCode = async (postalCode) => {
  const url = `https://nominatim.openstreetmap.org/search?postalcode=${encodeURIComponent(postalCode)}&country=US&format=json&limit=1`;
  const response = await fetch(url, {
    headers: { 'User-Agent': 'FindMyPharma/1.0' },
    signal: AbortSignal.timeout(5000),
  });
  if (!response.ok) return null;
  const data = await response.json();
  if (!data.length) return null;
  return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
};

// GET /api/pharmacies?lat=35.96&lng=-83.92
// GET /api/pharmacies?postalCode=37919
const getPharmacies = async (req, res) => {
  try {
    const { lat, lng, postalCode } = req.query;

    let coords = null;

    if (lat && lng) {
      coords = { lat: parseFloat(lat), lng: parseFloat(lng) };
    } else if (postalCode) {
      coords = await geocodePostalCode(postalCode.trim());
      if (!coords) {
        return res.status(404).json({
          success: false,
          message: `No location found for postal code "${postalCode}". Please check and try again.`,
        });
      }
    } else {
      return res.status(400).json({
        success: false,
        message: 'Provide either lat & lng or a postalCode to search nearby pharmacies.',
      });
    }

    const pharmacies = await Pharmacy.aggregate([
      {
        $geoNear: {
          near: { type: 'Point', coordinates: [coords.lng, coords.lat] },
          distanceField: 'distanceMeters',
          maxDistance: MAX_DISTANCE_METERS,
          spherical: true,
          query: { isActive: true },
        },
      },
      {
        $addFields: {
          distanceMiles: { $round: [{ $divide: ['$distanceMeters', 1609.34] }, 1] },
        },
      },
      { $sort: { distanceMeters: 1 } },
    ]);

    res.json({ success: true, pharmacies, searchLocation: coords });
  } catch (err) {
    console.error('Get pharmacies error:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { getPharmacies };
