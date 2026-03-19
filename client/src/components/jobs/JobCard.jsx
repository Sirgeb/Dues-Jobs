import { useState } from 'react';
import {
  ExternalLink,
  Clock,
  MapPin,
  Building2,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { apiRequest } from '../../services/api';
import { formatDistanceToNow } from 'date-fns';
import './JobCard.css';

export default function JobCard({ job, onUpdate }) {
  const [loading, setLoading] = useState(false);
  const [selectedAction, setSelectedAction] = useState(null); // 'applied' or 'ignored'
  const [isRemoving, setIsRemoving] = useState(false);

  const handleAction = async (status) => {
    if (selectedAction) return;

    setSelectedAction(status);
    setLoading(true);

    try {
      const jobId = job.id || job.job_id;
      await apiRequest(`/api/v1/jobs/${jobId}/mark`, {
        method: 'POST',
        body: JSON.stringify({ status }),
      });

      setTimeout(() => {
        setIsRemoving(true);
        setTimeout(() => {
          onUpdate(jobId, status);
        }, 300);
      }, 800);
    } catch (err) {
      console.error('Failed to update job', err);
      setSelectedAction(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`job-card ${isRemoving ? 'removing' : ''}`}>
      <div>
        <div className='card-header'>
          <div className='header-content'>
            <h3 className='job-title'>{job.title}</h3>
            <div className='job-company'>
              <Building2 size={14} /> {job.company}
            </div>
          </div>

          <div className='header-badge'>
            {job.is_remote ? (
              <span className='badge badge-remote'>🌍 Remote</span>
            ) : (
              <span className='badge badge-location'>
                <MapPin size={12} /> {job.location}
              </span>
            )}
          </div>
        </div>

        <div className='job-meta'>
          <span className='meta-item'>
            <Clock size={13} />
            {job.posted_at
              ? formatDistanceToNow(new Date(job.posted_at), {
                  addSuffix: true,
                })
              : 'Recently posted'}
          </span>
          <span className='meta-divider'>•</span>
          <span className='meta-item source-badge'>{job.source}</span>
          {job.salary && (
            <>
              <span className='meta-divider'>•</span>
              <span className='meta-item salary'>{job.salary}</span>
            </>
          )}
        </div>
      </div>

      <div className='job-actions'>
        <a
          href={job.apply_url}
          target='_blank'
          rel='noreferrer'
          className='btn btn-secondary btn-details'
        >
          <ExternalLink size={14} /> View Details
        </a>

        {job.status === 'new' && (
          <div className='action-buttons'>
            <button
              onClick={() => handleAction('applied')}
              className={`btn-action btn-applied ${selectedAction === 'applied' ? 'active' : ''}`}
              disabled={loading}
              title='Mark as applied'
            >
              {selectedAction === 'applied' ? (
                <>
                  <CheckCircle size={16} />
                  <span>Applied!</span>
                </>
              ) : (
                <>
                  <CheckCircle size={16} />
                  <span>Applied</span>
                </>
              )}
            </button>
            <button
              onClick={() => handleAction('ignored')}
              className={`btn-action btn-ignored ${selectedAction === 'ignored' ? 'active' : ''}`}
              disabled={loading}
              title='Mark as ignored'
            >
              {selectedAction === 'ignored' ? (
                <>
                  <XCircle size={16} />
                  <span>Ignored!</span>
                </>
              ) : (
                <>
                  <XCircle size={16} />
                  <span>Ignore</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
