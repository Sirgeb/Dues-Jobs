const express = require('express');
const router = express.Router();
const { authenticateUser } = require('../middleware/auth');
const { supabaseAdmin } = require('../services/supabase');

// Middleware for all jobs routes
router.use(authenticateUser);

/**
 * GET /api/v1/jobs
 * Returns user's matched jobs, paginated and filtered.
 */
router.get('/', async (req, res) => {
  const {
    status,
    source,
    keyword,
    page = 1,
    limit = 20,
    days,
    use_prefs,
  } = req.query;
  const offset = (page - 1) * limit;

  try {
    // Join user_jobs with jobs
    // Use !inner join if source is provided to force a hard filter on the joined table
    let selectString = source ? '*, job:jobs!inner(*)' : '*, job:jobs(*)';

    let query = supabaseAdmin
      .from('user_jobs')
      .select(selectString, { count: 'exact' })
      .eq('user_id', req.user.id);

    // --- PREFERENCE FILTERING ---
    if (use_prefs === 'true') {
      const { data: prefs } = await supabaseAdmin
        .from('user_preferences')
        .select('keywords, locations, remote_only')
        .eq('user_id', req.user.id)
        .single();

      if (prefs) {
        if (prefs.keywords?.length > 0) {
          const prefFilters = prefs.keywords
            .map((k) => `title.ilike.%${k}%,description.ilike.%${k}%`)
            .join(',');
          query = query.or(prefFilters, { foreignTable: 'jobs' });
        }
        if (prefs.locations?.length > 0) {
          query = query.in('job.location', prefs.locations);
        }
        if (prefs.remote_only) {
          query = query.eq('job.is_remote', true);
        }
      }
    }

    // Keyword filtering on the joined table ('job')
    if (keyword?.trim()) {
      query = query.or(
        `title.ilike.%${keyword}%,description.ilike.%${keyword}%`,
        { foreignTable: 'jobs' },
      );
    }

    // Filter by job posted_at, not user_jobs created_at
    if (days && !isNaN(parseInt(days))) {
      const msPerDay = 24 * 60 * 60 * 1000;
      const cutoffDate = new Date(Date.now() - parseInt(days) * msPerDay);
      query = query.gte('job.posted_at', cutoffDate.toISOString());
    }

    // Status Filter (user_jobs table)
    if (status) query = query.eq('status', status);

    // Source filtering on the joined table alias 'job'
    if (source) query = query.eq('job.source', source);

    // Pagination and Sort
    query = query
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });

    const { data, error, count } = await query;
    if (error) throw error;

    // Transform response structure
    let jobs = data.map((item) => ({
      user_job_id: item.id,
      status: item.status,
      notes: item.notes,
      ...item.job, // Expand job details (title, description, source, etc.)
    }));

    // Filter in-memory if Supabase complex joins failed (MVP safety)
    if (keyword) {
      const lowKey = keyword.toLowerCase();
      jobs = jobs.filter(
        (j) =>
          j.title?.toLowerCase().includes(lowKey) ||
          j.description?.toLowerCase().includes(lowKey),
      );
    }

    res.json({
      data: jobs,
      total: count,
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (err) {
    console.error('Get Jobs Error:', err);
    res.status(500).json({
      error: 'Failed to fetch jobs',
      details: err.message || err,
    });
  }
});

/**
 * POST /api/v1/jobs/seed
 * Seeds the database with an array of job objects.
 * Expects: { jobs: Array<Job> }
 */
router.post('/seed', async (req, res) => {
  const { jobs } = req.body;

  // Validation: Ensure we actually have an array to work with
  if (!jobs || !Array.isArray(jobs)) {
    return res
      .status(400)
      .json({ error: 'Invalid input: "jobs" must be an array.' });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('jobs')
      .upsert(jobs, {
        onConflict: 'canonical_hash',
        ignoreDuplicates: false,
      })
      .select();

    if (error) throw error;

    res.status(201).json({
      message: `Successfully seeded ${data?.length || 0} jobs.`,
      count: data?.length || 0,
      data: data,
    });
  } catch (err) {
    console.error('Seed Jobs Error:', err);
    res.status(500).json({
      error: 'Failed to seed jobs',
      details: err.message || err,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    });
  }
});

/**
 * POST /api/v1/user_jobs/:job_id/mark
 * Updates status (applied, ignored, new) and notes.
 * Note: :job_id here refers to the actual Job ID, not the user_job entry ID?
 * Prompt says: /api/v1/user_jobs/:job_id/mark.
 * Let's assume :job_id is the `id` from `jobs` table, so we find `user_jobs` entry by (user_id, job_id).
 */
router.post('/:job_id/mark', async (req, res) => {
  const { job_id } = req.params;
  const { status, notes } = req.body;

  if (!['new', 'applied', 'ignored'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('user_jobs')
      .update({ status, notes })
      .eq('user_id', req.user.id)
      .eq('job_id', job_id)
      .select();

    if (error) throw error;
    if (!data || data.length === 0) {
      return res.status(404).json({ error: 'Job match not found' });
    }

    res.json({ message: 'Job updated', data: data[0] });
  } catch (err) {
    console.error('Update Job Error:', err);
    res.status(500).json({ error: 'Failed to update job' });
  }
});

module.exports = router;
