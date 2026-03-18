import { useEffect, useState } from 'react';
import { apiRequest, triggerFetch } from '../services/api';
import JobCard from '../components/jobs/JobCard';
import SearchBar from '../components/search/Search';
import { usePageMeta } from '../hooks/usePageMeta';
import { RefreshCw, Briefcase, Zap } from 'lucide-react';

import '../styles/dashboard.css';

export default function Dashboard() {
  usePageMeta(
    'Dashboard',
    'View your personalized job matches. Discover remote job opportunities tailored to your skills and preferences.',
    'dashboard, job matches, remote jobs, job recommendations',
  );

  const [jobs, setJobs] = useState([]);
  const [allFilteredJobs, setAllFilteredJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [preferences, setPreferences] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [dateRange, setDateRange] = useState(3); // Default: 3 days
  const [currentPage, setCurrentPage] = useState(1);
  const jobsPerPage = 12;
  const totalPages = Math.ceil(jobs.length / jobsPerPage);

  const paginatedJobs = jobs.slice(
    (currentPage - 1) * jobsPerPage,
    currentPage * jobsPerPage,
  );

  // Fetch user preferences first
  const fetchPreferences = async () => {
    try {
      const response = await apiRequest('/api/v1/users/me/preferences');
      setPreferences(response);
      return response;
    } catch (err) {
      console.error('Error fetching preferences:', err);
      setError('Failed to load preferences');
      return null;
    }
  };

  // Filter jobs based on user preferences
  const filterJobsByPreferences = (jobs, prefs) => {
    const {
      keywords = [],
      locations = [],
      remote_only = false,
      sources = [],
    } = prefs;

    return jobs.filter((job) => {
      // 1. Source Filter
      if (sources && sources.length > 0 && !sources.includes(job.source)) {
        return false;
      }

      // 2. Remote Filter
      if (remote_only && !job.is_remote) {
        return false;
      }

      // 3. Location Filter
      if (!remote_only && locations && locations.length > 0) {
        const jobLoc = (job.location || '').toLowerCase().trim();
        if (!job.is_remote) {
          const locMatch = locations.some((loc) =>
            jobLoc.includes(loc.toLowerCase().trim()),
          );
          if (!locMatch) return false;
        }
      }

      // 4. Keyword Filter - Match ANY keyword
      if (keywords && keywords.length > 0) {
        const text =
          `${job.title || ''} ${job.description || ''} ${job.company || ''}`.toLowerCase();
        const keywordMatch = keywords.some((keyword) => {
          const cleanKeyword = keyword.toLowerCase().trim();
          return cleanKeyword && text.includes(cleanKeyword);
        });
        if (!keywordMatch) return false;
      }

      return true;
    });
  };

  // Fetch all jobs and filter by preferences + date
  const fetchJobs = async (userPrefs) => {
    setLoading(true);
    setError(null);
    try {
      // Fetch all jobs without date filter first
      const response = await apiRequest('/api/v1/jobs?status=new');
      console.log('Fetched all jobs:', response);

      const allJobs = response.data || [];

      // Filter by user preferences if available
      let filteredJobs = allJobs;
      if (userPrefs) {
        filteredJobs = filterJobsByPreferences(allJobs, userPrefs);
      }

      // Store preference-filtered jobs
      setAllFilteredJobs(filteredJobs);

      // Apply date filter
      applyDateFilter(filteredJobs, dateRange);

      console.log(
        `Filtered: ${allJobs.length} total → ${filteredJobs.length} by preferences`,
      );
    } catch (err) {
      console.error('Error fetching jobs:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Apply date filter to preference-filtered jobs
  const applyDateFilter = (jobsToFilter, days) => {
    const daysAgo = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const dateFilteredJobs = jobsToFilter.filter((job) => {
      if (!job.posted_at) return false;
      const postedDate = new Date(job.posted_at);
      return postedDate >= daysAgo;
    });

    console.log(
      `Applied ${days} day filter: ${jobsToFilter.length} → ${dateFilteredJobs.length} jobs`,
    );
    setJobs(dateFilteredJobs);
    setCurrentPage(1);
  };

  // Handle date range change
  const handleDateRangeChange = (days) => {
    setDateRange(days);
    applyDateFilter(allFilteredJobs, days);
  };

  // Load preferences on mount, then fetch jobs
  useEffect(() => {
    const loadData = async () => {
      const prefs = await fetchPreferences();
      if (prefs) {
        await fetchJobs(prefs);
      } else {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const manuallyTriggerFetch = async () => {
    if (confirm('Trigger backend scraper? This may take a few seconds.')) {
      try {
        setRefreshing(true);
        await triggerFetch();
        setTimeout(() => {
          fetchPreferences().then((prefs) => {
            if (prefs) fetchJobs(prefs);
          });
        }, 2000);
      } catch (e) {
        alert('Failed to trigger fetch: ' + e.message);
      } finally {
        setRefreshing(false);
      }
    }
  };

  if (loading && jobs.length === 0) {
    return (
      <div className='dashboard-loading'>
        <div className='loading-spinner-large'></div>
        <p>Finding your perfect jobs...</p>
      </div>
    );
  }

  return (
    <div className='dashboard-container'>
      {/* Welcome Banner */}
      <div className='dashboard-banner fade-in'>
        <div className='banner-content'>
          <div className='banner-icon'>
            <Briefcase size={32} />
          </div>
          <div>
            <h1 className='banner-title'>Your Job Matches</h1>
            <p className='text-secondary banner-subtitle'>
              {jobs.length > 0
                ? `We found ${jobs.length} opportunity${jobs.length !== 1 ? 'ies' : ''} matching your preferences from the last ${dateRange} day${dateRange !== 1 ? 's' : ''}.`
                : `No jobs found matching your preferences in the last ${dateRange} day${dateRange !== 1 ? 's' : ''}.`}
            </p>
          </div>
        </div>

        <div className='banner-actions'>
          <div className='filter-group'>
            {[
              { label: '24h', value: 1 },
              { label: '2 Days', value: 2 },
              { label: '3 Days', value: 3 },
              { label: '7 Days', value: 7 },
            ].map((range, idx) => (
              <button
                key={`filter-${idx}`}
                onClick={() => handleDateRangeChange(range.value)}
                className={`btn-filter ${dateRange === range.value ? 'active' : ''}`}
              >
                {range.label}
              </button>
            ))}
          </div>

          <button
            onClick={manuallyTriggerFetch}
            className='btn btn-secondary btn-refresh'
            disabled={refreshing}
          >
            <RefreshCw size={16} className={refreshing ? 'spin' : ''} />
            {refreshing ? 'Refreshing...' : 'Refresh Feed'}
          </button>
        </div>
      </div>

      {error && (
        <div className='error-banner slide-down'>
          <span>⚠️ Error: {error}</span>
        </div>
      )}

      <SearchBar setJobs={setJobs} />

      {jobs.length === 0 && !loading ? (
        <div className='empty-state fade-in'>
          <div className='empty-icon'>
            <Zap size={48} />
          </div>
          <h2>No jobs found</h2>
          <p>
            {preferences
              ? `No jobs match your preferences in the last ${dateRange} day${dateRange !== 1 ? 's' : ''}. Try adjusting your preferences or check back later.`
              : 'Set up your preferences to get personalized job recommendations.'}
          </p>
          <button
            onClick={manuallyTriggerFetch}
            className='btn btn-primary'
            style={{ marginTop: '1.5rem' }}
          >
            <RefreshCw size={16} /> Check Again
          </button>
        </div>
      ) : (
        <div className='jobs-grid'>
          {paginatedJobs.map((job, index) => (
            <div
              key={job.id}
              className='job-card-wrapper'
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <JobCard
                job={job}
                onUpdate={() =>
                  setJobs((current) => current.filter((j) => j.id !== job.id))
                }
              />
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {jobs.length > 0 && (
        <div className='pagination'>
          <button
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            disabled={currentPage === 1}
            className='btn btn-secondary'
          >
            Prev
          </button>

          <span className='pagination-info'>
            Page {currentPage} of {totalPages}
          </span>

          <button
            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            disabled={currentPage === totalPages}
            className='btn btn-secondary'
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
