require('dotenv').config();

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');

const createAuthRouter = require('./routes/auth.routes');
const pharmacyPortalRoutes = require('./routes/pharmacyPortal.routes');
const adminRoutes = require('./routes/admin.routes');
const createSupportRouter = require('./routes/support.routes');
const pharmacyRequestRoutes = require('./routes/pharmacyRequest.routes');
const pharmacyRoutes = require('./routes/pharmacy.routes');
const requestRoutes = require('./routes/request.routes');
const searchRoutes = require('./routes/search.routes');
const insuranceRoutes = require('./routes/insurance.routes');
const healthProfileRoutes = require('./routes/healthProfile.routes');

const app = express();

const allowedOrigins = [
  'https://find-pharmacy-three.vercel.app', // patient portal (Vercel)
  'https://pharmacy-portal-two.vercel.app', // pharmacy portal (Vercel)
  'https://admin-portal-inky-theta.vercel.app', // admin portal (Vercel)
  'http://localhost:4200', // patient portal (dev)
  'http://localhost:4300', // admin portal (dev)
  process.env.FRONTEND_URL,
].filter(Boolean);

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    // Allow preview deployments of all three frontends.
    const vercelPreviewRegex =
      /^https:\/\/.*(find-pharmacy|pharmacy-portal|admin-portal).*\.vercel\.app$/;

    if (vercelPreviewRegex.test(origin)) {
      return callback(null, true);
    }

    console.log('❌ Blocked by CORS:', origin);

    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },

  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};

app.use(cors(corsOptions));

app.options(/.*/, cors(corsOptions));

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Credentials', 'true');
  next();
});

app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());

let isConnected = false;

const connectDB = async () => {
  if (isConnected || mongoose.connection.readyState >= 1) {
    return;
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI);

    isConnected = true;

    console.log('✅ MongoDB Connected');
  } catch (error) {
    console.error('❌ MongoDB Error:', error.message);
    throw error;
  }
};

app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Database connection failed',
      error: error.message,
    });
  }
});

app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Find My Pharmacy Backend Running 🚀',
  });
});

app.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

app.get('/test', (req, res) => {
  res.json({
    success: true,
    origin: req.headers.origin,
  });
});

app.use('/api/auth', createAuthRouter('patient'));
app.use('/api/pharmacy/auth', createAuthRouter('pharmacy'));
app.use('/api/pharmacy/requests', pharmacyRequestRoutes);
app.use('/api/pharmacy', pharmacyPortalRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/support', createSupportRouter('patient'));
app.use('/api/pharmacy/support', createSupportRouter('pharmacy'));
app.use('/api/pharmacies', pharmacyRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/searches', searchRoutes);
app.use('/api/insurance', insuranceRoutes);
app.use('/api/health-profile', healthProfileRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err.stack);

  res.status(500).json({
    success: false,
    message: err.message || 'Internal server error',
  });
});

if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  connectDB()
    .then(() => {
      app.listen(PORT, () => {
        console.log(`🚀 Server running on port ${PORT}`);
      });
    })
    .catch(error => {
      console.error('❌ Failed to start server:', error.message);
      process.exit(1);
    });
}

module.exports = app;
