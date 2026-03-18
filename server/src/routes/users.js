const express = require('express');
const router = express.Router();
const { authenticateUser } = require('../middleware/auth');
const { supabaseAdmin } = require('../services/supabase');

router.use(authenticateUser);

/**
 * GET /api/v1/users/me/preferences
 */
router.get('/me/preferences', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('user_preferences')
      .select('*')
      .eq('user_id', req.user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 is 'Row not found'
      throw error;
    }

    // Return preferences if they exist, otherwise return empty object
    res.json(data || {});
  } catch (err) {
    console.error('Get Prefs Error:', err);
    res.status(500).json({ error: 'Failed to fetch preferences' });
  }
});

/**
 * PUT /api/v1/users/me/preferences
 */
router.put('/me/preferences', async (req, res) => {
  const {
    keywords,
    locations,
    remote_only,
    sources,
    email_enabled,
    telegram_enabled,
    telegram_chat_id,
  } = req.body;

  // --- Validation Block ---
  const errors = [];

  const validateArray = (arr, name) => {
    if (arr !== undefined && !Array.isArray(arr)) {
      errors.push(`${name} must be an array of strings.`);
    } else if (Array.isArray(arr) && arr.length > 50) {
      errors.push(`Too many ${name}. Limit is 50 items.`);
    }
  };

  validateArray(keywords, 'keywords');
  validateArray(locations, 'locations');
  validateArray(sources, 'sources');

  const validateBool = (val, name) => {
    if (val !== undefined && typeof val !== 'boolean') {
      errors.push(`${name} must be a boolean (true/false).`);
    }
  };

  validateBool(remote_only, 'remote_only');
  validateBool(email_enabled, 'email_enabled');
  validateBool(telegram_enabled, 'telegram_enabled');

  if (telegram_enabled && !telegram_chat_id) {
    errors.push(
      'telegram_chat_id is required if Telegram notifications are enabled.',
    );
  }

  if (errors.length > 0) {
    return res
      .status(400)
      .json({ error: 'Validation failed', details: errors });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('user_preferences')
      .upsert(
        {
          user_id: req.user.id,
          keywords: keywords ?? [],
          locations: locations ?? [],
          remote_only: remote_only ?? false,
          sources: sources ?? [],
          email_enabled: email_enabled ?? false,
          telegram_enabled: telegram_enabled ?? false,
          telegram_chat_id: telegram_chat_id || null,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id',
        },
      )
      .select()
      .single();

    if (error) throw error;

    res.json(data);
  } catch (err) {
    console.error('Update Prefs Error:', err);
    res.status(500).json({
      error: 'Failed to update preferences',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
  }
});

/**
 * POST /api/v1/users/me/telegram
 * Link Telegram Chat ID
 */
router.post('/me/telegram', async (req, res) => {
  const { telegram_chat_id } = req.body;

  if (!telegram_chat_id) {
    return res.status(400).json({ error: 'Chat ID is required' });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('user_preferences')
      .update({
        telegram_chat_id,
        telegram_enabled: true,
        updated_at: new Date(),
      })
      .eq('user_id', req.user.id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error('Link Telegram Error:', err);
    res.status(500).json({ error: 'Failed to link Telegram' });
  }
});

/**
 * DELETE /api/v1/users/me/telegram
 * Disconnect Telegram
 */
router.delete('/me/telegram', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('user_preferences')
      .update({
        telegram_chat_id: null,
        telegram_enabled: false,
        updated_at: new Date(),
      })
      .eq('user_id', req.user.id)
      .select()
      .single();

    if (error) throw error;
    res.json({ message: 'Telegram disconnected', data });
  } catch (err) {
    console.error('Disconnect Telegram Error:', err);
    res.status(500).json({ error: 'Failed to disconnect Telegram' });
  }
});

module.exports = router;
