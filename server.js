const express = require('express');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

// Middleware to parse JSON bodies
app.use(express.json());

// Generate JWT for App Store Connect API
const generateJWT = () => {
  // Instead of reading from file, use environment variable
  const privateKey = process.env.APP_STORE_CONNECT_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error('APP_STORE_CONNECT_PRIVATE_KEY environment variable is not set');
  }

  const token = jwt.sign({
    aud: "appstoreconnect-v1"
  }, privateKey, {
    algorithm: 'ES256',
    expiresIn: '300s',
    issuer: process.env.APP_STORE_CONNECT_ISSUER_ID,
    header: {
      alg: 'ES256',
      kid: process.env.APP_STORE_CONNECT_KEY_ID,
    },
  });
  
  return token.replace(/[\r\n]+/g, '');
};

// Example route for verifying promotional offers
app.post('/api/verify-promotion', async (req, res) => {
  const { promoId } = req.body;

  try {
    const token = generateJWT();
    const response = await axios.post('https://api.appstoreconnect.apple.com/v1/promotions/verify', {
      promoId: 'to3',  // Include the relevant promotional ID and any other necessary data
    }, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.data.valid) {
      res.json({ success: true, message: 'Promotion is valid' });
    } else {
      res.json({ success: false, message: 'Invalid promotion' });
    }
  } catch (error) {
    console.error('Error verifying promotion:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Example route for restoring purchases
app.post('/api/restore-purchases', async (req, res) => {
  const { userId } = req.body;

  // Add logic to handle restoring purchases here...

  res.json({ success: true, message: 'Purchases restored' });
});

app.post('/api/subscribe', async (req, res) => {
  try {
    const token = generateJWT();
    // Implement App Store subscription validation
    const response = await axios.post('https://api.appstoreconnect.apple.com/v1/subscriptions', {
      // Add subscription data
    }, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    res.json({ success: true, message: 'Subscription activated' });
  } catch (error) {
    console.error('Subscription error:', error);
    res.status(500).json({ success: false, message: 'Subscription failed' });
  }
});

app.post('/api/verify-subscription', async (req, res) => {
  const { receipt, platform } = req.body;

  try {
    // For testing, use sandbox URL
    const verificationEndpoint = 'https://sandbox.itunes.apple.com/verifyReceipt';
    
    const response = await axios.post(verificationEndpoint, {
      'receipt-data': receipt,
      'password': process.env.APP_STORE_SHARED_SECRET, // Add this to your .env file
      'exclude-old-transactions': true
    });

    // Check receipt validity
    if (response.data.status === 0) { // 0 indicates valid receipt
      const latestReceipt = response.data.latest_receipt_info[0];
      const isValid = new Date(latestReceipt.expires_date) > new Date();
      
      res.json({
        success: true,
        isValid,
        expiryDate: latestReceipt.expires_date,
        productId: latestReceipt.product_id
      });
    } else {
      res.json({ 
        success: false, 
        message: `Invalid receipt (status: ${response.data.status})` 
      });
    }
  } catch (error) {
    console.error('Subscription verification error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Verification failed',
      error: error.message 
    });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

