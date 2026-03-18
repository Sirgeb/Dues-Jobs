const express = require('express');
const router = express.Router();
const OTPService = require('../services/OTPService');
const { supabaseAdmin } = require('../services/supabase');

/**
 * POST /api/v1/auth/send-otp
 * Send OTP to email (no authentication required)
 * Body: { email }
 */
router.post('/send-otp', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }

  try {
    const result = await OTPService.sendOTP(email);

    if (!result.success) {
      return res.status(429).json({ error: result.message });
    }

    res.json({
      success: true,
      message: result.message,
      expiresIn: 15 * 60, // 15 minutes in seconds
    });
  } catch (err) {
    console.error('Send OTP Error:', err);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
});

/**
 * POST /api/v1/auth/verify-otp
 * Verify OTP code (no authentication required)
 * Body: { email, code }
 */
router.post('/verify-otp', async (req, res) => {
  const { email, code } = req.body;

  if (!email || !code) {
    return res.status(400).json({ error: 'Email and code are required' });
  }

  if (code.length !== 6 || !/^\d+$/.test(code)) {
    return res.status(400).json({ error: 'Invalid OTP format' });
  }

  try {
    const result = await OTPService.verifyOTP(email, code);

    if (!result.success) {
      return res.status(400).json({ error: result.message });
    }

    res.json({
      success: true,
      message: result.message,
    });
  } catch (err) {
    console.error('Verify OTP Error:', err);
    res.status(500).json({ error: 'Failed to verify OTP' });
  }
});

/**
 * POST /api/v1/auth/resend-otp
 * Resend OTP to email (no authentication required)
 * Body: { email }
 */
router.post('/resend-otp', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    const result = await OTPService.resendOTP(email);

    if (!result.success) {
      return res.status(429).json({ error: result.message });
    }

    res.json({
      success: true,
      message: result.message,
      expiresIn: 15 * 60, // 15 minutes in seconds
    });
  } catch (err) {
    console.error('Resend OTP Error:', err);
    res.status(500).json({ error: 'Failed to resend OTP' });
  }
});

module.exports = router;
