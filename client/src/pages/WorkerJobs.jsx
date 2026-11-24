import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { supabase } from '../lib/supabaseClient';
import '../styles/WorkerJobs.css';

function WorkerJobs() {
  const navigate = useNavigate();

  // Store the jobs that match the worker
  const [jobs, setJobs] = useState([]);

  // Store whether the worker is currently available
  const [isAvailable, setIsAvailable] = useState(false);

  // Control loading, errors and refreshing the job list
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshCount, setRefreshCount] = useState(0);

  // Load matching jobs when the page opens or is refreshed
  useEffect(() => {
    let active = true;

    const loadJobs = async () => {
      setLoading(true);
      setError('');

      try {
        // Get the currently logged-in user
        const { data: { user }, error: authError } =
          await supabase.auth.getUser();

        if (!active) return;

        if (authError || !user) {
          navigate('/login', { replace: true });
          return;
        }

        // Check that the user has a worker account
        const { data: profile, error: profileError } =
          await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (profileError) throw profileError;
        if (!active) return;

        if (profile.role !== 'worker') {
          navigate('/dashboard', { replace: true });
          return;
        }

        // Get the worker's current availability status
        const { data: workerProfile, error: workerError } =
          await supabase
            .from('worker_profiles')
            .select('is_available')
            .eq('id', user.id)
            .maybeSingle();

        if (workerError) throw workerError;
        if (!active) return;

        // Workers must complete onboarding first
        if (!workerProfile) {
          navigate('/worker-setup', { replace: true });
          return;
        }

        setIsAvailable(workerProfile.is_available);

        // Unavailable workers should not receive job matches
        if (!workerProfile.is_available) {
          setJobs([]);
          return;
        }

        // Call the database function created in our previous commit
        // It filters jobs by category, distance and availability
        const { data, error: jobsError } =
          await supabase.rpc('discover_jobs');

        if (jobsError) throw jobsError;

        // Display the matching jobs returned by Supabase
        if (active) {
          setJobs(data || []);
        }

      } catch (err) {
        if (active) {
          setError(err.message || 'Could not load available jobs.');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadJobs();

    // Stop updating the component after leaving the page
    return () => {
      active = false;
    };
  }, [navigate, refreshCount]);

  // Reload jobs when the worker presses Refresh
  const handleRefresh = () => {
    setRefreshCount((current) => current + 1);
  };

  return (
    <div className="worker-jobs-page">
      <div className="worker-jobs-container">

        <div className="worker-jobs-header">
          <h1>Find Jobs Near You</h1>

          <p>
            Discover jobs that match your skills and travel radius.
          </p>

          <div className="worker-jobs-actions">
            <button
              type="button"
              className="worker-jobs-refresh"
              onClick={handleRefresh}
              disabled={loading}
            >
              {loading ? 'Loading...' : 'Refresh Jobs'}
            </button>

            <Link to="/dashboard" className="worker-jobs-back">
              Back to Dashboard
            </Link>
          </div>
        </div>

        {/* Show a loading message while retrieving jobs */}
        {loading && (
          <div className="worker-jobs-message">
            <p>Finding jobs near you...</p>
          </div>
        )}

        {/* Display errors if something goes wrong */}
        {!loading && error && (
          <div className="worker-jobs-message">
            <p className="worker-jobs-error">{error}</p>
          </div>
        )}

        {/* Workers must enable availability to receive jobs */}
        {!loading && !error && !isAvailable && (
          <div className="worker-jobs-message">
            <h2>You are currently unavailable</h2>
            <p>
              Return to your dashboard and turn on your
              availability to discover jobs.
            </p>
          </div>
        )}

        {/* Available worker, but no jobs currently match */}
        {!loading && !error && isAvailable && jobs.length === 0 && (
          <div className="worker-jobs-message">
            <h2>No matching jobs found</h2>
            <p>
              There are currently no open jobs matching your
              categories and travel radius.
            </p>
          </div>
        )}

        {/* Display a card for every matching job */}
        {!loading && !error && isAvailable && jobs.length > 0 && (
          <div className="worker-jobs-list">

            {jobs.map((job) => (
              <div className="worker-job-card" key={job.job_id}>

                <div className="worker-job-top">
                  <h2>{job.title}</h2>

                  <span className="worker-job-price">
                    €{Number(job.price).toFixed(2)}
                  </span>
                </div>

                {/* Job category returned by Supabase */}
                <p className="worker-job-category">
                  {job.category_name}
                </p>

                <p className="worker-job-description">
                  {job.description}
                </p>

                {/* Display the job's distance and duration */}
                <div className="worker-job-details">
                  <span>
                    📍 {Number(job.distance_km).toFixed(1)} km away
                  </span>

                  <span>
                    ⏱ {job.estimated_minutes} minutes
                  </span>
                </div>

              </div>
            ))}

          </div>
        )}

      </div>
    </div>
  );
}

export default WorkerJobs;
