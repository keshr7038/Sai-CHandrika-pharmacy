require('dotenv').config();
const express = require('express');
const authRoutes = require('./routes/auth.cjs');
const paymentsRoutes = require('./routes/payments.cjs');
const aiRoutes = require('./routes/ai.cjs');

const app = express();
const PORT = process.env.PORT || 5000;

// Custom CORS Middleware
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-razorpay-signature');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Middleware to parse incoming JSON bodies (with raw body preservation for webhooks)
app.use(express.json({
  verify: (req, res, buf) => {
    req.rawBody = buf.toString();
  }
}));

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/ai', aiRoutes);

// Root check route
app.get('/', (req, res) => {
  res.json({ status: 'ok', service: 'Sai Chandrika Pharmacy POS Server' });
});

// Global Exception Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Exception:', err);
  res.status(500).json({ success: false, error: 'Internal server error occurred.' });
});

// Start Server if run directly
if (require.main === module || !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`🚀 Sai Chandrika Pharmacy POS Server is running on port ${PORT}`);
  });
}

module.exports = app;
