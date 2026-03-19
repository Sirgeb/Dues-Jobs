import React, { useState, useEffect, memo } from 'react';
import { Search as SearchIcon, X, Loader2 } from 'lucide-react';
import { apiRequest } from '../../services/api';
import './Search.css';

const SearchBar = memo(({ setJobs }) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Create an AbortController for this specific request cycle
    const controller = new AbortController();
    const { signal } = controller;

    const delayDebounceFn = setTimeout(async () => {
      setLoading(true);
      try {
        const endpoint = `/api/v1/jobs?keyword=${encodeURIComponent(query)}`;

        // Pass the signal to your apiRequest
        const response = await apiRequest(endpoint, {
          method: 'GET',
          signal,
        });

        setJobs(response.data || []);
      } catch (error) {
        // Only log if the error wasn't a manual cancellation
        if (error.name !== 'AbortError') {
          console.error('Search error:', error);
        }
      } finally {
        // Only stop loading if this is still the active request
        if (!signal.aborted) setLoading(false);
      }
    }, 400);

    // Cancel the timer AND the fetch request if query changes
    return () => {
      clearTimeout(delayDebounceFn);
      controller.abort();
    };
  }, [query, setJobs]);

  const handleClear = () => setQuery('');

  return (
    <div className='search-container'>
      <div className='search-wrapper'>
        <SearchIcon className='icon-left' size={19} />

        <input
          type='text'
          className='search-input'
          placeholder='Search for jobs...'
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />

        <div className='icon-right-container'>
          {loading ? (
            <Loader2 className='spinner' size={18} />
          ) : (
            query && (
              <button
                className='clear-btn-right'
                onClick={handleClear}
                type='button'
                aria-label='Clear search'
              >
                <X size={18} />
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
});

// display name for easier debugging in DevTools
SearchBar.displayName = 'SearchBar';

export default SearchBar;
