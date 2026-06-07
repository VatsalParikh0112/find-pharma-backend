require('dotenv').config();

const mongoose = require('mongoose');
const Pharmacy = require('./models/Pharmacy');

// GeoJSON: coordinates = [longitude, latitude]
const pharmacies = [
  // ── Downtown / Fort Sanders (37902, 37916) ──────────────────────────────
  {
    name: 'CVS Pharmacy',
    phone: '+18659152101',
    address: { street: '800 N Gay St', city: 'Knoxville', state: 'TN', pincode: '37902' },
    location: { type: 'Point', coordinates: [-83.9188, 35.9614] },
    openingHours: 'Mon–Fri: 8:00 AM – 9:00 PM, Sat–Sun: 9:00 AM – 6:00 PM',
  },
  {
    name: 'City Pharmacy',
    phone: '+18659152102',
    address: { street: '422 S Gay St', city: 'Knoxville', state: 'TN', pincode: '37902' },
    location: { type: 'Point', coordinates: [-83.9201, 35.9576] },
    openingHours: 'Mon–Sat: 9:00 AM – 7:00 PM',
  },
  {
    name: 'University Pharmacy',
    phone: '+18659152103',
    address: { street: '1924 Cumberland Ave', city: 'Knoxville', state: 'TN', pincode: '37916' },
    location: { type: 'Point', coordinates: [-83.9331, 35.9563] },
    openingHours: 'Mon–Fri: 8:00 AM – 8:00 PM, Sat: 10:00 AM – 4:00 PM',
  },
  {
    name: 'Walgreens',
    phone: '+18659152104',
    address: { street: '1603 Cumberland Ave', city: 'Knoxville', state: 'TN', pincode: '37916' },
    location: { type: 'Point', coordinates: [-83.9299, 35.9558] },
    openingHours: 'Mon–Sun: 24 Hours',
  },
  {
    name: 'Rite Aid Pharmacy',
    phone: '+18659152105',
    address: { street: '614 Clinch Ave', city: 'Knoxville', state: 'TN', pincode: '37902' },
    location: { type: 'Point', coordinates: [-83.9242, 35.9607] },
    openingHours: 'Mon–Fri: 9:00 AM – 8:00 PM, Sat–Sun: 9:00 AM – 5:00 PM',
  },
  {
    name: 'Downtown Drug Store',
    phone: '+18659152106',
    address: { street: '710 Market St', city: 'Knoxville', state: 'TN', pincode: '37902' },
    location: { type: 'Point', coordinates: [-83.9141, 35.9621] },
    openingHours: 'Mon–Fri: 8:30 AM – 6:00 PM',
  },
  {
    name: 'Medical Arts Pharmacy',
    phone: '+18659152107',
    address: { street: '1901 Clinch Ave', city: 'Knoxville', state: 'TN', pincode: '37916' },
    location: { type: 'Point', coordinates: [-83.9284, 35.9574] },
    openingHours: 'Mon–Fri: 9:00 AM – 6:00 PM, Sat: 9:00 AM – 2:00 PM',
  },
  {
    name: 'Kroger Pharmacy',
    phone: '+18659152108',
    address: { street: '3804 Chapman Hwy', city: 'Knoxville', state: 'TN', pincode: '37920' },
    location: { type: 'Point', coordinates: [-83.9278, 35.9395] },
    openingHours: 'Mon–Fri: 9:00 AM – 9:00 PM, Sat–Sun: 10:00 AM – 6:00 PM',
  },

  // ── North Knox / Broadway (37917, 37918) ────────────────────────────────
  {
    name: 'HealthMart Pharmacy',
    phone: '+18659152109',
    address: { street: '215 W Baxter Ave', city: 'Knoxville', state: 'TN', pincode: '37917' },
    location: { type: 'Point', coordinates: [-83.9357, 35.9783] },
    openingHours: 'Mon–Sat: 8:30 AM – 8:00 PM',
  },
  {
    name: 'CVS Pharmacy',
    phone: '+18659152110',
    address: { street: '4700 N Broadway St', city: 'Knoxville', state: 'TN', pincode: '37918' },
    location: { type: 'Point', coordinates: [-83.943, 35.994] },
    openingHours: 'Mon–Fri: 8:00 AM – 9:00 PM, Sat–Sun: 9:00 AM – 6:00 PM',
  },
  {
    name: 'Walgreens',
    phone: '+18659152111',
    address: { street: '3500 N Broadway St', city: 'Knoxville', state: 'TN', pincode: '37917' },
    location: { type: 'Point', coordinates: [-83.9409, 35.9853] },
    openingHours: 'Mon–Sun: 24 Hours',
  },
  {
    name: 'Publix Pharmacy',
    phone: '+18659152112',
    address: { street: '4321 N Broadway St', city: 'Knoxville', state: 'TN', pincode: '37918' },
    location: { type: 'Point', coordinates: [-83.9422, 35.9906] },
    openingHours: 'Mon–Fri: 9:00 AM – 8:00 PM, Sat: 9:00 AM – 6:00 PM',
  },
  {
    name: 'Broadway Pharmacy',
    phone: '+18659152113',
    address: { street: '2814 N Broadway St', city: 'Knoxville', state: 'TN', pincode: '37917' },
    location: { type: 'Point', coordinates: [-83.9388, 35.9797] },
    openingHours: 'Mon–Sat: 9:00 AM – 7:00 PM',
  },
  {
    name: 'Kroger Pharmacy',
    phone: '+18659152114',
    address: { street: '3025 Tazewell Pike', city: 'Knoxville', state: 'TN', pincode: '37918' },
    location: { type: 'Point', coordinates: [-83.9381, 36.029] },
    openingHours: 'Mon–Fri: 9:00 AM – 9:00 PM, Sat–Sun: 10:00 AM – 6:00 PM',
  },
  {
    name: 'Family Drug Store',
    phone: '+18659152115',
    address: { street: '3800 Tarpon Ave', city: 'Knoxville', state: 'TN', pincode: '37912' },
    location: { type: 'Point', coordinates: [-83.9591, 35.9888] },
    openingHours: 'Mon–Sat: 8:00 AM – 7:00 PM',
  },
  {
    name: 'North Knox Pharmacy',
    phone: '+18659152116',
    address: { street: '5200 N Broadway St', city: 'Knoxville', state: 'TN', pincode: '37918' },
    location: { type: 'Point', coordinates: [-83.9453, 36.0012] },
    openingHours: 'Mon–Fri: 8:00 AM – 8:00 PM, Sat: 9:00 AM – 5:00 PM',
  },

  // ── West Knox / Bearden / Kingston Pike (37919) ─────────────────────────
  {
    name: 'Publix Pharmacy',
    phone: '+18659152117',
    address: { street: '8049 Kingston Pike', city: 'Knoxville', state: 'TN', pincode: '37919' },
    location: { type: 'Point', coordinates: [-84.069, 35.9479] },
    openingHours: 'Mon–Fri: 9:00 AM – 8:00 PM, Sat: 9:00 AM – 6:00 PM',
  },
  {
    name: 'Walmart Pharmacy',
    phone: '+18659152118',
    address: { street: '7600 Kingston Pike', city: 'Knoxville', state: 'TN', pincode: '37919' },
    location: { type: 'Point', coordinates: [-84.0518, 35.9491] },
    openingHours: 'Mon–Fri: 9:00 AM – 7:00 PM, Sat: 9:00 AM – 7:00 PM',
  },
  {
    name: 'CVS Pharmacy',
    phone: '+18659152119',
    address: { street: '6550 Kingston Pike', city: 'Knoxville', state: 'TN', pincode: '37919' },
    location: { type: 'Point', coordinates: [-84.0283, 35.9456] },
    openingHours: 'Mon–Fri: 8:00 AM – 10:00 PM, Sat–Sun: 9:00 AM – 6:00 PM',
  },
  {
    name: 'Walgreens',
    phone: '+18659152120',
    address: { street: '7501 Kingston Pike', city: 'Knoxville', state: 'TN', pincode: '37919' },
    location: { type: 'Point', coordinates: [-84.0566, 35.9446] },
    openingHours: 'Mon–Sun: 24 Hours',
  },
  {
    name: 'Kroger Pharmacy',
    phone: '+18659152121',
    address: { street: '4832 Western Ave', city: 'Knoxville', state: 'TN', pincode: '37919' },
    location: { type: 'Point', coordinates: [-83.9929, 35.9488] },
    openingHours: 'Mon–Fri: 9:00 AM – 9:00 PM, Sat–Sun: 10:00 AM – 6:00 PM',
  },
  {
    name: 'Medicine Shoppe',
    phone: '+18659152122',
    address: { street: '6430 Papermill Dr', city: 'Knoxville', state: 'TN', pincode: '37919' },
    location: { type: 'Point', coordinates: [-84.0267, 35.9512] },
    openingHours: 'Mon–Fri: 9:00 AM – 6:00 PM',
  },
  {
    name: 'Bearden Pharmacy',
    phone: '+18659152123',
    address: { street: '3900 Kingston Pike', city: 'Knoxville', state: 'TN', pincode: '37919' },
    location: { type: 'Point', coordinates: [-83.9843, 35.9523] },
    openingHours: 'Mon–Sat: 9:00 AM – 7:00 PM',
  },
  {
    name: 'Target Pharmacy',
    phone: '+18659152124',
    address: { street: '6800 Kingston Pike', city: 'Knoxville', state: 'TN', pincode: '37919' },
    location: { type: 'Point', coordinates: [-84.0321, 35.9463] },
    openingHours: 'Mon–Sat: 8:00 AM – 9:00 PM, Sun: 8:00 AM – 8:00 PM',
  },
  {
    name: 'Good Neighbor Pharmacy',
    phone: '+18659152125',
    address: { street: '5200 Kingston Pike', city: 'Knoxville', state: 'TN', pincode: '37919' },
    location: { type: 'Point', coordinates: [-84.0001, 35.9472] },
    openingHours: 'Mon–Fri: 9:00 AM – 6:00 PM, Sat: 9:00 AM – 2:00 PM',
  },
  {
    name: 'Rite Aid Pharmacy',
    phone: '+18659152126',
    address: { street: '5600 Kingston Pike', city: 'Knoxville', state: 'TN', pincode: '37919' },
    location: { type: 'Point', coordinates: [-84.0073, 35.9467] },
    openingHours: 'Mon–Fri: 9:00 AM – 8:00 PM, Sat–Sun: 9:00 AM – 5:00 PM',
  },

  // ── Farragut / Far West Knox (37922, 37934) ─────────────────────────────
  {
    name: 'CVS Pharmacy',
    phone: '+18659152127',
    address: { street: '11255 Kingston Pike', city: 'Farragut', state: 'TN', pincode: '37934' },
    location: { type: 'Point', coordinates: [-84.1401, 35.9153] },
    openingHours: 'Mon–Fri: 8:00 AM – 9:00 PM, Sat–Sun: 9:00 AM – 6:00 PM',
  },
  {
    name: 'Walgreens',
    phone: '+18659152128',
    address: { street: '10720 Kingston Pike', city: 'Farragut', state: 'TN', pincode: '37922' },
    location: { type: 'Point', coordinates: [-84.1188, 35.8956] },
    openingHours: 'Mon–Sun: 24 Hours',
  },
  {
    name: 'Kroger Pharmacy',
    phone: '+18659152129',
    address: { street: '11624 Kingston Pike', city: 'Farragut', state: 'TN', pincode: '37934' },
    location: { type: 'Point', coordinates: [-84.149, 35.9135] },
    openingHours: 'Mon–Fri: 9:00 AM – 9:00 PM, Sat–Sun: 10:00 AM – 6:00 PM',
  },
  {
    name: 'Publix Pharmacy',
    phone: '+18659152130',
    address: { street: '11726 Kingston Pike', city: 'Farragut', state: 'TN', pincode: '37934' },
    location: { type: 'Point', coordinates: [-84.1512, 35.9119] },
    openingHours: 'Mon–Fri: 9:00 AM – 8:00 PM, Sat: 9:00 AM – 6:00 PM',
  },
  {
    name: 'Costco Pharmacy',
    phone: '+18659152131',
    address: { street: '11250 Parkside Dr', city: 'Farragut', state: 'TN', pincode: '37934' },
    location: { type: 'Point', coordinates: [-84.1372, 35.9168] },
    openingHours: 'Mon–Fri: 10:00 AM – 8:30 PM, Sat: 9:30 AM – 6:00 PM, Sun: 10:00 AM – 6:00 PM',
  },
  {
    name: "Sam's Club Pharmacy",
    phone: '+18659152132',
    address: { street: '10810 Kingston Pike', city: 'Farragut', state: 'TN', pincode: '37922' },
    location: { type: 'Point', coordinates: [-84.121, 35.8968] },
    openingHours: 'Mon–Fri: 9:00 AM – 7:00 PM, Sat: 9:00 AM – 6:00 PM',
  },
  {
    name: 'Target Pharmacy',
    phone: '+18659152133',
    address: { street: '11520 Parkside Dr', city: 'Farragut', state: 'TN', pincode: '37934' },
    location: { type: 'Point', coordinates: [-84.1455, 35.9145] },
    openingHours: 'Mon–Sat: 8:00 AM – 9:00 PM, Sun: 8:00 AM – 8:00 PM',
  },
  {
    name: 'Rite Aid Pharmacy',
    phone: '+18659152134',
    address: { street: '11028 Kingston Pike', city: 'Farragut', state: 'TN', pincode: '37922' },
    location: { type: 'Point', coordinates: [-84.1251, 35.8978] },
    openingHours: 'Mon–Fri: 9:00 AM – 8:00 PM, Sat–Sun: 9:00 AM – 5:00 PM',
  },
  {
    name: 'Farragut Pharmacy',
    phone: '+18659152135',
    address: { street: '209 Village Green Blvd', city: 'Farragut', state: 'TN', pincode: '37934' },
    location: { type: 'Point', coordinates: [-84.1328, 35.9141] },
    openingHours: 'Mon–Fri: 9:00 AM – 6:00 PM, Sat: 9:00 AM – 1:00 PM',
  },

  // ── South Knox / Chapman Hwy (37920) ────────────────────────────────────
  {
    name: 'Walgreens',
    phone: '+18659152136',
    address: { street: '6016 Chapman Hwy', city: 'Knoxville', state: 'TN', pincode: '37920' },
    location: { type: 'Point', coordinates: [-83.9095, 35.9479] },
    openingHours: 'Mon–Sun: 24 Hours',
  },
  {
    name: 'CVS Pharmacy',
    phone: '+18659152137',
    address: { street: '5200 Chapman Hwy', city: 'Knoxville', state: 'TN', pincode: '37920' },
    location: { type: 'Point', coordinates: [-83.9143, 35.9458] },
    openingHours: 'Mon–Fri: 8:00 AM – 10:00 PM, Sat–Sun: 9:00 AM – 6:00 PM',
  },
  {
    name: 'Rite Aid Pharmacy',
    phone: '+18659152138',
    address: { street: '3100 Chapman Hwy', city: 'Knoxville', state: 'TN', pincode: '37920' },
    location: { type: 'Point', coordinates: [-83.9232, 35.9383] },
    openingHours: 'Mon–Fri: 9:00 AM – 8:00 PM, Sat–Sun: 9:00 AM – 5:00 PM',
  },
  {
    name: 'South Knoxville Pharmacy',
    phone: '+18659152139',
    address: { street: '1800 Chapman Hwy', city: 'Knoxville', state: 'TN', pincode: '37920' },
    location: { type: 'Point', coordinates: [-83.9261, 35.9337] },
    openingHours: 'Mon–Sat: 9:00 AM – 7:00 PM',
  },
  {
    name: 'Kroger Pharmacy',
    phone: '+18659152140',
    address: { street: '4800 Chapman Hwy', city: 'Knoxville', state: 'TN', pincode: '37920' },
    location: { type: 'Point', coordinates: [-83.9175, 35.9434] },
    openingHours: 'Mon–Fri: 9:00 AM – 9:00 PM, Sat–Sun: 10:00 AM – 6:00 PM',
  },

  // ── East Knox / Strawberry Plains (37914, 37871) ─────────────────────────
  {
    name: 'CVS Pharmacy',
    phone: '+18659152141',
    address: { street: '5700 Rutledge Pike', city: 'Knoxville', state: 'TN', pincode: '37914' },
    location: { type: 'Point', coordinates: [-83.8669, 35.9992] },
    openingHours: 'Mon–Fri: 8:00 AM – 9:00 PM, Sat–Sun: 9:00 AM – 6:00 PM',
  },
  {
    name: 'Walgreens',
    phone: '+18659152142',
    address: { street: '4515 Asheville Hwy', city: 'Knoxville', state: 'TN', pincode: '37914' },
    location: { type: 'Point', coordinates: [-83.8762, 35.9866] },
    openingHours: 'Mon–Sun: 24 Hours',
  },
  {
    name: 'Kroger Pharmacy',
    phone: '+18659152143',
    address: { street: '4200 Rutledge Pike', city: 'Knoxville', state: 'TN', pincode: '37914' },
    location: { type: 'Point', coordinates: [-83.8893, 35.9868] },
    openingHours: 'Mon–Fri: 9:00 AM – 9:00 PM, Sat–Sun: 10:00 AM – 6:00 PM',
  },
  {
    name: 'East Knox Pharmacy',
    phone: '+18659152144',
    address: { street: '2800 Magnolia Ave', city: 'Knoxville', state: 'TN', pincode: '37914' },
    location: { type: 'Point', coordinates: [-83.9042, 35.9745] },
    openingHours: 'Mon–Sat: 9:00 AM – 7:00 PM',
  },
  {
    name: 'Rite Aid Pharmacy',
    phone: '+18659152145',
    address: {
      street: '8801 Strawberry Plains Pike',
      city: 'Knoxville',
      state: 'TN',
      pincode: '37871',
    },
    location: { type: 'Point', coordinates: [-83.7879, 36.0012] },
    openingHours: 'Mon–Fri: 9:00 AM – 8:00 PM, Sat–Sun: 9:00 AM – 5:00 PM',
  },
  {
    name: 'Family Pharmacy',
    phone: '+18659152146',
    address: {
      street: '4515 Strawberry Plains Pike',
      city: 'Knoxville',
      state: 'TN',
      pincode: '37871',
    },
    location: { type: 'Point', coordinates: [-83.8143, 35.9877] },
    openingHours: 'Mon–Sat: 8:30 AM – 7:00 PM',
  },

  // ── Northwest Knox / Karns / Hardin Valley (37931) ──────────────────────
  {
    name: 'CVS Pharmacy',
    phone: '+18659152147',
    address: { street: '8500 Hardin Valley Rd', city: 'Knoxville', state: 'TN', pincode: '37931' },
    location: { type: 'Point', coordinates: [-84.0892, 36.0231] },
    openingHours: 'Mon–Fri: 8:00 AM – 9:00 PM, Sat–Sun: 9:00 AM – 6:00 PM',
  },
  {
    name: 'Walgreens',
    phone: '+18659152148',
    address: { street: '7825 Oak Ridge Hwy', city: 'Knoxville', state: 'TN', pincode: '37931' },
    location: { type: 'Point', coordinates: [-84.0614, 36.0154] },
    openingHours: 'Mon–Sun: 24 Hours',
  },
  {
    name: 'Kroger Pharmacy',
    phone: '+18659152149',
    address: { street: '8745 Hardin Valley Rd', city: 'Knoxville', state: 'TN', pincode: '37931' },
    location: { type: 'Point', coordinates: [-84.0924, 36.0243] },
    openingHours: 'Mon–Fri: 9:00 AM – 9:00 PM, Sat–Sun: 10:00 AM – 6:00 PM',
  },
  {
    name: 'Publix Pharmacy',
    phone: '+18659152150',
    address: { street: '7330 Oak Ridge Hwy', city: 'Knoxville', state: 'TN', pincode: '37931' },
    location: { type: 'Point', coordinates: [-84.0534, 36.0122] },
    openingHours: 'Mon–Fri: 9:00 AM – 8:00 PM, Sat: 9:00 AM – 6:00 PM',
  },
  {
    name: 'Hardin Valley Pharmacy',
    phone: '+18659152151',
    address: { street: '8310 Hardin Valley Rd', city: 'Knoxville', state: 'TN', pincode: '37931' },
    location: { type: 'Point', coordinates: [-84.0874, 36.0216] },
    openingHours: 'Mon–Fri: 9:00 AM – 6:00 PM, Sat: 9:00 AM – 1:00 PM',
  },
  {
    name: 'Target Pharmacy',
    phone: '+18659152152',
    address: { street: '7550 Oak Ridge Hwy', city: 'Knoxville', state: 'TN', pincode: '37931' },
    location: { type: 'Point', coordinates: [-84.0572, 36.0134] },
    openingHours: 'Mon–Sat: 8:00 AM – 9:00 PM, Sun: 8:00 AM – 8:00 PM',
  },

  // ── Halls / Powell (37938) ───────────────────────────────────────────────
  {
    name: 'CVS Pharmacy',
    phone: '+18659152153',
    address: { street: '4730 E Emory Rd', city: 'Powell', state: 'TN', pincode: '37938' },
    location: { type: 'Point', coordinates: [-83.9436, 36.0634] },
    openingHours: 'Mon–Fri: 8:00 AM – 9:00 PM, Sat–Sun: 9:00 AM – 6:00 PM',
  },
  {
    name: 'Walgreens',
    phone: '+18659152154',
    address: { street: '7609 Maynardville Pike', city: 'Knoxville', state: 'TN', pincode: '37938' },
    location: { type: 'Point', coordinates: [-83.9281, 36.0532] },
    openingHours: 'Mon–Sun: 24 Hours',
  },
  {
    name: 'Kroger Pharmacy',
    phone: '+18659152155',
    address: { street: '5201 Maynardville Pike', city: 'Knoxville', state: 'TN', pincode: '37918' },
    location: { type: 'Point', coordinates: [-83.9262, 36.0398] },
    openingHours: 'Mon–Fri: 9:00 AM – 9:00 PM, Sat–Sun: 10:00 AM – 6:00 PM',
  },
  {
    name: 'Halls Pharmacy',
    phone: '+18659152156',
    address: { street: '4101 E Emory Rd', city: 'Powell', state: 'TN', pincode: '37938' },
    location: { type: 'Point', coordinates: [-83.9482, 36.0513] },
    openingHours: 'Mon–Sat: 8:30 AM – 7:00 PM',
  },
  {
    name: 'Powell Drug Store',
    phone: '+18659152157',
    address: { street: '3700 E Emory Rd', city: 'Powell', state: 'TN', pincode: '37938' },
    location: { type: 'Point', coordinates: [-83.9511, 36.0466] },
    openingHours: 'Mon–Fri: 9:00 AM – 7:00 PM, Sat: 9:00 AM – 4:00 PM',
  },
  {
    name: 'Walmart Pharmacy',
    phone: '+18659152158',
    address: { street: '6100 Maynardville Pike', city: 'Knoxville', state: 'TN', pincode: '37918' },
    location: { type: 'Point', coordinates: [-83.927, 36.045] },
    openingHours: 'Mon–Fri: 9:00 AM – 7:00 PM, Sat: 9:00 AM – 7:00 PM',
  },

  // ── Maryville / Alcoa (37701, 37801, 37804) ─────────────────────────────
  {
    name: 'CVS Pharmacy',
    phone: '+18659172201',
    address: {
      street: '235 W Lamar Alexander Pkwy',
      city: 'Maryville',
      state: 'TN',
      pincode: '37801',
    },
    location: { type: 'Point', coordinates: [-83.9813, 35.7567] },
    openingHours: 'Mon–Fri: 8:00 AM – 9:00 PM, Sat–Sun: 9:00 AM – 6:00 PM',
  },
  {
    name: 'Walgreens',
    phone: '+18659172202',
    address: { street: '107 E Broadway Ave', city: 'Maryville', state: 'TN', pincode: '37801' },
    location: { type: 'Point', coordinates: [-83.9706, 35.7571] },
    openingHours: 'Mon–Sun: 24 Hours',
  },
  {
    name: 'Publix Pharmacy',
    phone: '+18659172203',
    address: {
      street: '318 E Lamar Alexander Pkwy',
      city: 'Maryville',
      state: 'TN',
      pincode: '37804',
    },
    location: { type: 'Point', coordinates: [-83.9653, 35.7601] },
    openingHours: 'Mon–Fri: 9:00 AM – 8:00 PM, Sat: 9:00 AM – 6:00 PM',
  },
  {
    name: 'Kroger Pharmacy',
    phone: '+18659172204',
    address: {
      street: '1105 W Lamar Alexander Pkwy',
      city: 'Maryville',
      state: 'TN',
      pincode: '37801',
    },
    location: { type: 'Point', coordinates: [-83.9914, 35.7542] },
    openingHours: 'Mon–Fri: 9:00 AM – 9:00 PM, Sat–Sun: 10:00 AM – 6:00 PM',
  },
  {
    name: 'Walmart Pharmacy',
    phone: '+18659172205',
    address: {
      street: '215 E Lamar Alexander Pkwy',
      city: 'Maryville',
      state: 'TN',
      pincode: '37804',
    },
    location: { type: 'Point', coordinates: [-83.9717, 35.7585] },
    openingHours: 'Mon–Fri: 9:00 AM – 7:00 PM, Sat: 9:00 AM – 7:00 PM',
  },
  {
    name: 'Rite Aid Pharmacy',
    phone: '+18659172206',
    address: { street: '405 High St', city: 'Maryville', state: 'TN', pincode: '37801' },
    location: { type: 'Point', coordinates: [-83.9718, 35.7548] },
    openingHours: 'Mon–Fri: 9:00 AM – 8:00 PM, Sat–Sun: 9:00 AM – 5:00 PM',
  },
  {
    name: 'Maryville Drug',
    phone: '+18659172207',
    address: { street: '501 S Washington St', city: 'Maryville', state: 'TN', pincode: '37801' },
    location: { type: 'Point', coordinates: [-83.9723, 35.7531] },
    openingHours: 'Mon–Sat: 9:00 AM – 6:00 PM',
  },
  {
    name: 'Good Neighbor Pharmacy',
    phone: '+18659172208',
    address: { street: '612 W Broadway Ave', city: 'Maryville', state: 'TN', pincode: '37801' },
    location: { type: 'Point', coordinates: [-83.9788, 35.7556] },
    openingHours: 'Mon–Fri: 9:00 AM – 6:00 PM, Sat: 9:00 AM – 1:00 PM',
  },
  {
    name: 'Alcoa Pharmacy',
    phone: '+18659172209',
    address: { street: '300 Milton St', city: 'Alcoa', state: 'TN', pincode: '37701' },
    location: { type: 'Point', coordinates: [-83.9726, 35.7892] },
    openingHours: 'Mon–Sat: 8:30 AM – 7:00 PM',
  },
  {
    name: 'Family Drug',
    phone: '+18659172210',
    address: { street: '201 E Alcoa Hwy', city: 'Alcoa', state: 'TN', pincode: '37701' },
    location: { type: 'Point', coordinates: [-83.9712, 35.7876] },
    openingHours: 'Mon–Sat: 9:00 AM – 7:00 PM',
  },

  // ── Oak Ridge (37830) ────────────────────────────────────────────────────
  {
    name: 'CVS Pharmacy',
    phone: '+18654812301',
    address: { street: '510 Oak Ridge Turnpike', city: 'Oak Ridge', state: 'TN', pincode: '37830' },
    location: { type: 'Point', coordinates: [-84.2693, 36.0103] },
    openingHours: 'Mon–Fri: 8:00 AM – 9:00 PM, Sat–Sun: 9:00 AM – 6:00 PM',
  },
  {
    name: 'Walgreens',
    phone: '+18654812302',
    address: {
      street: '1055 Oak Ridge Turnpike',
      city: 'Oak Ridge',
      state: 'TN',
      pincode: '37830',
    },
    location: { type: 'Point', coordinates: [-84.2712, 36.0124] },
    openingHours: 'Mon–Sun: 24 Hours',
  },
  {
    name: 'Kroger Pharmacy',
    phone: '+18654812303',
    address: {
      street: '1245 Oak Ridge Turnpike',
      city: 'Oak Ridge',
      state: 'TN',
      pincode: '37830',
    },
    location: { type: 'Point', coordinates: [-84.2739, 36.0147] },
    openingHours: 'Mon–Fri: 9:00 AM – 9:00 PM, Sat–Sun: 10:00 AM – 6:00 PM',
  },
  {
    name: 'Oak Ridge Pharmacy',
    phone: '+18654812304',
    address: { street: '200 S Illinois Ave', city: 'Oak Ridge', state: 'TN', pincode: '37830' },
    location: { type: 'Point', coordinates: [-84.2652, 36.0101] },
    openingHours: 'Mon–Sat: 9:00 AM – 6:00 PM',
  },
  {
    name: 'Target Pharmacy',
    phone: '+18654812305',
    address: { street: '351 S Illinois Ave', city: 'Oak Ridge', state: 'TN', pincode: '37830' },
    location: { type: 'Point', coordinates: [-84.2659, 36.0074] },
    openingHours: 'Mon–Sat: 8:00 AM – 9:00 PM, Sun: 8:00 AM – 8:00 PM',
  },
  {
    name: 'Rite Aid Pharmacy',
    phone: '+18654812306',
    address: { street: '178 Oak Ridge Turnpike', city: 'Oak Ridge', state: 'TN', pincode: '37830' },
    location: { type: 'Point', coordinates: [-84.2678, 36.0086] },
    openingHours: 'Mon–Fri: 9:00 AM – 8:00 PM, Sat–Sun: 9:00 AM – 5:00 PM',
  },
  {
    name: 'Good Health Pharmacy',
    phone: '+18654812307',
    address: { street: '700 S Tulane Ave', city: 'Oak Ridge', state: 'TN', pincode: '37830' },
    location: { type: 'Point', coordinates: [-84.2621, 36.0061] },
    openingHours: 'Mon–Sat: 9:00 AM – 7:00 PM',
  },
  {
    name: 'Jackson Square Pharmacy',
    phone: '+18654812308',
    address: { street: '78 E Tennessee Ave', city: 'Oak Ridge', state: 'TN', pincode: '37830' },
    location: { type: 'Point', coordinates: [-84.2598, 36.0133] },
    openingHours: 'Mon–Fri: 8:30 AM – 6:00 PM, Sat: 9:00 AM – 2:00 PM',
  },
  {
    name: 'Medical Center Pharmacy',
    phone: '+18654812309',
    address: { street: '990 Oak Ridge Turnpike', city: 'Oak Ridge', state: 'TN', pincode: '37830' },
    location: { type: 'Point', coordinates: [-84.2725, 36.0115] },
    openingHours: 'Mon–Fri: 9:00 AM – 7:00 PM',
  },
  {
    name: 'Walmart Pharmacy',
    phone: '+18654812310',
    address: { street: '130 Warehouse Rd', city: 'Oak Ridge', state: 'TN', pincode: '37830' },
    location: { type: 'Point', coordinates: [-84.268, 36.0052] },
    openingHours: 'Mon–Fri: 9:00 AM – 7:00 PM, Sat: 9:00 AM – 7:00 PM',
  },

  // ── Lenoir City (37771) ──────────────────────────────────────────────────
  {
    name: 'CVS Pharmacy',
    phone: '+18658882401',
    address: { street: '805 Highway 321 N', city: 'Lenoir City', state: 'TN', pincode: '37771' },
    location: { type: 'Point', coordinates: [-84.2531, 35.7964] },
    openingHours: 'Mon–Fri: 8:00 AM – 9:00 PM, Sat–Sun: 9:00 AM – 6:00 PM',
  },
  {
    name: 'Walgreens',
    phone: '+18658882402',
    address: { street: '700 Highway 321 N', city: 'Lenoir City', state: 'TN', pincode: '37771' },
    location: { type: 'Point', coordinates: [-84.2519, 35.7952] },
    openingHours: 'Mon–Sun: 24 Hours',
  },
  {
    name: 'Kroger Pharmacy',
    phone: '+18658882403',
    address: { street: '916 Highway 321 N', city: 'Lenoir City', state: 'TN', pincode: '37771' },
    location: { type: 'Point', coordinates: [-84.2553, 35.7978] },
    openingHours: 'Mon–Fri: 9:00 AM – 9:00 PM, Sat–Sun: 10:00 AM – 6:00 PM',
  },
  {
    name: 'Lenoir City Pharmacy',
    phone: '+18658882404',
    address: { street: '102 E Broadway', city: 'Lenoir City', state: 'TN', pincode: '37771' },
    location: { type: 'Point', coordinates: [-84.2524, 35.7934] },
    openingHours: 'Mon–Sat: 9:00 AM – 6:00 PM',
  },
  {
    name: 'Family Drug',
    phone: '+18658882405',
    address: { street: '1200 Highway 321 N', city: 'Lenoir City', state: 'TN', pincode: '37771' },
    location: { type: 'Point', coordinates: [-84.2569, 35.8002] },
    openingHours: 'Mon–Sat: 8:30 AM – 7:00 PM',
  },

  // ── Clinton / Anderson County (37716) ───────────────────────────────────
  {
    name: 'CVS Pharmacy',
    phone: '+18654572501',
    address: {
      street: '307 N Charles Seivers Blvd',
      city: 'Clinton',
      state: 'TN',
      pincode: '37716',
    },
    location: { type: 'Point', coordinates: [-84.1332, 36.1023] },
    openingHours: 'Mon–Fri: 8:00 AM – 9:00 PM, Sat–Sun: 9:00 AM – 6:00 PM',
  },
  {
    name: 'Walgreens',
    phone: '+18654572502',
    address: {
      street: '415 N Charles Seivers Blvd',
      city: 'Clinton',
      state: 'TN',
      pincode: '37716',
    },
    location: { type: 'Point', coordinates: [-84.1344, 36.1038] },
    openingHours: 'Mon–Sun: 24 Hours',
  },
  {
    name: 'Kroger Pharmacy',
    phone: '+18654572503',
    address: {
      street: '901 N Charles Seivers Blvd',
      city: 'Clinton',
      state: 'TN',
      pincode: '37716',
    },
    location: { type: 'Point', coordinates: [-84.1382, 36.1092] },
    openingHours: 'Mon–Fri: 9:00 AM – 9:00 PM, Sat–Sun: 10:00 AM – 6:00 PM',
  },
  {
    name: 'Clinton Pharmacy',
    phone: '+18654572504',
    address: { street: '110 W Main St', city: 'Clinton', state: 'TN', pincode: '37716' },
    location: { type: 'Point', coordinates: [-84.131, 36.1019] },
    openingHours: 'Mon–Sat: 9:00 AM – 6:00 PM',
  },
  {
    name: 'Anderson County Drug',
    phone: '+18654572505',
    address: { street: '205 E Branch St', city: 'Clinton', state: 'TN', pincode: '37716' },
    location: { type: 'Point', coordinates: [-84.1298, 36.1026] },
    openingHours: 'Mon–Fri: 9:00 AM – 7:00 PM, Sat: 9:00 AM – 3:00 PM',
  },

  // ── Sevierville / Pigeon Forge (37862, 37863, 37876) ─────────────────────
  {
    name: 'CVS Pharmacy',
    phone: '+18654532601',
    address: { street: '1131 Parkway', city: 'Sevierville', state: 'TN', pincode: '37862' },
    location: { type: 'Point', coordinates: [-83.5619, 35.8676] },
    openingHours: 'Mon–Fri: 8:00 AM – 9:00 PM, Sat–Sun: 9:00 AM – 6:00 PM',
  },
  {
    name: 'Walgreens',
    phone: '+18654532602',
    address: { street: '1720 Parkway', city: 'Sevierville', state: 'TN', pincode: '37862' },
    location: { type: 'Point', coordinates: [-83.558, 35.8629] },
    openingHours: 'Mon–Sun: 24 Hours',
  },
  {
    name: 'Kroger Pharmacy',
    phone: '+18654532603',
    address: {
      street: '536 Winfield Dunn Pkwy',
      city: 'Sevierville',
      state: 'TN',
      pincode: '37876',
    },
    location: { type: 'Point', coordinates: [-83.5738, 35.8831] },
    openingHours: 'Mon–Fri: 9:00 AM – 9:00 PM, Sat–Sun: 10:00 AM – 6:00 PM',
  },
  {
    name: 'Sevierville Pharmacy',
    phone: '+18654532604',
    address: { street: '305 N Court Ave', city: 'Sevierville', state: 'TN', pincode: '37862' },
    location: { type: 'Point', coordinates: [-83.5666, 35.8677] },
    openingHours: 'Mon–Sat: 9:00 AM – 6:00 PM',
  },
  {
    name: 'Pigeon Forge Drug',
    phone: '+18654532605',
    address: { street: '2848 Parkway', city: 'Pigeon Forge', state: 'TN', pincode: '37863' },
    location: { type: 'Point', coordinates: [-83.5537, 35.7918] },
    openingHours: 'Mon–Sat: 8:30 AM – 8:00 PM',
  },
  {
    name: 'Rite Aid Pharmacy',
    phone: '+18654532606',
    address: { street: '1302 Parkway', city: 'Sevierville', state: 'TN', pincode: '37862' },
    location: { type: 'Point', coordinates: [-83.5598, 35.8659] },
    openingHours: 'Mon–Fri: 9:00 AM – 8:00 PM, Sat–Sun: 9:00 AM – 5:00 PM',
  },
  {
    name: 'Walmart Pharmacy',
    phone: '+18654532607',
    address: { street: '1414 Parkway', city: 'Sevierville', state: 'TN', pincode: '37862' },
    location: { type: 'Point', coordinates: [-83.5567, 35.8641] },
    openingHours: 'Mon–Fri: 9:00 AM – 7:00 PM, Sat: 9:00 AM – 7:00 PM',
  },

  // ── Morristown / Hamblen County (37814) ─────────────────────────────────
  {
    name: 'CVS Pharmacy',
    phone: '+18239872701',
    address: {
      street: '2901 W Andrew Johnson Hwy',
      city: 'Morristown',
      state: 'TN',
      pincode: '37814',
    },
    location: { type: 'Point', coordinates: [-83.3021, 36.2143] },
    openingHours: 'Mon–Fri: 8:00 AM – 9:00 PM, Sat–Sun: 9:00 AM – 6:00 PM',
  },
  {
    name: 'Walgreens',
    phone: '+18239872702',
    address: {
      street: '2560 W Andrew Johnson Hwy',
      city: 'Morristown',
      state: 'TN',
      pincode: '37814',
    },
    location: { type: 'Point', coordinates: [-83.2978, 36.2121] },
    openingHours: 'Mon–Sun: 24 Hours',
  },
  {
    name: 'Kroger Pharmacy',
    phone: '+18239872703',
    address: {
      street: '3100 W Andrew Johnson Hwy',
      city: 'Morristown',
      state: 'TN',
      pincode: '37814',
    },
    location: { type: 'Point', coordinates: [-83.3054, 36.2157] },
    openingHours: 'Mon–Fri: 9:00 AM – 9:00 PM, Sat–Sun: 10:00 AM – 6:00 PM',
  },
  {
    name: 'Walmart Pharmacy',
    phone: '+18239872704',
    address: {
      street: '3465 W Andrew Johnson Hwy',
      city: 'Morristown',
      state: 'TN',
      pincode: '37814',
    },
    location: { type: 'Point', coordinates: [-83.3102, 36.2185] },
    openingHours: 'Mon–Fri: 9:00 AM – 7:00 PM, Sat: 9:00 AM – 7:00 PM',
  },
  {
    name: 'Morristown Medical Pharmacy',
    phone: '+18239872705',
    address: { street: '203 W Main St', city: 'Morristown', state: 'TN', pincode: '37814' },
    location: { type: 'Point', coordinates: [-83.2951, 36.2108] },
    openingHours: 'Mon–Sat: 9:00 AM – 6:00 PM',
  },
  {
    name: 'Hamblen County Drug',
    phone: '+18239872706',
    address: { street: '715 E 1st North St', city: 'Morristown', state: 'TN', pincode: '37814' },
    location: { type: 'Point', coordinates: [-83.2897, 36.2126] },
    openingHours: 'Mon–Fri: 9:00 AM – 7:00 PM, Sat: 9:00 AM – 3:00 PM',
  },

  // ── Jefferson City (37760) ───────────────────────────────────────────────
  {
    name: 'CVS Pharmacy',
    phone: '+18654752801',
    address: {
      street: '1501 W Old Hwy 11E',
      city: 'Jefferson City',
      state: 'TN',
      pincode: '37760',
    },
    location: { type: 'Point', coordinates: [-83.4943, 36.1218] },
    openingHours: 'Mon–Fri: 8:00 AM – 9:00 PM, Sat–Sun: 9:00 AM – 6:00 PM',
  },
  {
    name: 'Jefferson City Pharmacy',
    phone: '+18654752802',
    address: { street: '203 E Old Hwy 11E', city: 'Jefferson City', state: 'TN', pincode: '37760' },
    location: { type: 'Point', coordinates: [-83.4897, 36.1224] },
    openingHours: 'Mon–Sat: 9:00 AM – 6:00 PM',
  },
  {
    name: 'Rite Aid Pharmacy',
    phone: '+18654752803',
    address: { street: '800 W Old Hwy 11E', city: 'Jefferson City', state: 'TN', pincode: '37760' },
    location: { type: 'Point', coordinates: [-83.4915, 36.1213] },
    openingHours: 'Mon–Fri: 9:00 AM – 8:00 PM, Sat–Sun: 9:00 AM – 5:00 PM',
  },

  // ── Additional Knox / Surrounding fills ─────────────────────────────────
  {
    name: 'Rite Aid Pharmacy',
    phone: '+18659152159',
    address: { street: '4620 Western Ave', city: 'Knoxville', state: 'TN', pincode: '37921' },
    location: { type: 'Point', coordinates: [-83.9908, 35.9892] },
    openingHours: 'Mon–Fri: 9:00 AM – 8:00 PM, Sat–Sun: 9:00 AM – 5:00 PM',
  },
  {
    name: 'Sunset Pharmacy',
    phone: '+18659152160',
    address: { street: '3318 Sutherland Ave', city: 'Knoxville', state: 'TN', pincode: '37919' },
    location: { type: 'Point', coordinates: [-83.9763, 35.9522] },
    openingHours: 'Mon–Sat: 9:00 AM – 7:00 PM',
  },
  {
    name: 'Walmart Pharmacy',
    phone: '+18659152161',
    address: { street: '4611 Lonas Dr', city: 'Knoxville', state: 'TN', pincode: '37909' },
    location: { type: 'Point', coordinates: [-83.9982, 35.9613] },
    openingHours: 'Mon–Fri: 9:00 AM – 7:00 PM, Sat: 9:00 AM – 7:00 PM',
  },
  {
    name: 'Fountain City Pharmacy',
    phone: '+18659152162',
    address: { street: '5115 N Broadway St', city: 'Knoxville', state: 'TN', pincode: '37918' },
    location: { type: 'Point', coordinates: [-83.9438, 35.9975] },
    openingHours: 'Mon–Sat: 9:00 AM – 7:00 PM',
  },
  {
    name: 'Knox Community Pharmacy',
    phone: '+18659152163',
    address: { street: '1301 Eastmoreland Ave', city: 'Knoxville', state: 'TN', pincode: '37917' },
    location: { type: 'Point', coordinates: [-83.9213, 35.9706] },
    openingHours: 'Mon–Fri: 9:00 AM – 6:00 PM, Sat: 9:00 AM – 1:00 PM',
  },
  {
    name: 'Costco Pharmacy',
    phone: '+18659152164',
    address: { street: '200 N Peters Rd', city: 'Knoxville', state: 'TN', pincode: '37922' },
    location: { type: 'Point', coordinates: [-84.0864, 35.9383] },
    openingHours: 'Mon–Fri: 10:00 AM – 8:30 PM, Sat: 9:30 AM – 6:00 PM, Sun: 10:00 AM – 6:00 PM',
  },
  {
    name: "Sam's Club Pharmacy",
    phone: '+18659152165',
    address: { street: '150 Moss Grove Blvd', city: 'Knoxville', state: 'TN', pincode: '37922' },
    location: { type: 'Point', coordinates: [-84.0831, 35.9368] },
    openingHours: 'Mon–Fri: 9:00 AM – 7:00 PM, Sat: 9:00 AM – 6:00 PM',
  },
  {
    name: 'Inskip Pharmacy',
    phone: '+18659152166',
    address: { street: '4319 Inskip Rd', city: 'Knoxville', state: 'TN', pincode: '37912' },
    location: { type: 'Point', coordinates: [-83.9653, 36.0012] },
    openingHours: 'Mon–Sat: 9:00 AM – 6:00 PM',
  },
  {
    name: 'Target Pharmacy',
    phone: '+18659152167',
    address: { street: '200 Lovell Rd', city: 'Knoxville', state: 'TN', pincode: '37934' },
    location: { type: 'Point', coordinates: [-84.1025, 35.9288] },
    openingHours: 'Mon–Sat: 8:00 AM – 9:00 PM, Sun: 8:00 AM – 8:00 PM',
  },
  {
    name: 'Kroger Pharmacy',
    phone: '+18659152168',
    address: { street: '9225 Kingston Pike', city: 'Knoxville', state: 'TN', pincode: '37922' },
    location: { type: 'Point', coordinates: [-84.0882, 35.9233] },
    openingHours: 'Mon–Fri: 9:00 AM – 9:00 PM, Sat–Sun: 10:00 AM – 6:00 PM',
  },
  {
    name: 'Walgreens',
    phone: '+18659152169',
    address: { street: '1712 Magnolia Ave', city: 'Knoxville', state: 'TN', pincode: '37917' },
    location: { type: 'Point', coordinates: [-83.9191, 35.9712] },
    openingHours: 'Mon–Sun: 24 Hours',
  },
  {
    name: 'CVS Pharmacy',
    phone: '+18659152170',
    address: { street: '501 S Peters Rd', city: 'Knoxville', state: 'TN', pincode: '37922' },
    location: { type: 'Point', coordinates: [-84.0801, 35.9241] },
    openingHours: 'Mon–Fri: 8:00 AM – 9:00 PM, Sat–Sun: 9:00 AM – 6:00 PM',
  },
];

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    await Pharmacy.deleteMany({});
    console.log('🗑️  Cleared existing pharmacies');

    const docs = pharmacies.map(p => ({ ...p, isActive: true, verificationStatus: 'approved' }));
    await Pharmacy.insertMany(docs);
    console.log(`✅ Seeded ${docs.length} pharmacies across East Tennessee`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed error:', err.message);
    process.exit(1);
  }
};

seed();
