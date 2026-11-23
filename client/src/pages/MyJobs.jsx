import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { supabase } from '../lib/supabaseClient';

// Text displayed for each possible job status
const statusLabels = {
  open: 'Open',
  assigned: 'Assigned',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled'
};

function MyJobs() {
  const navigate = useNavigate();

  // Store the jobs belonging to the logged-in customer
  const [jobs, setJobs] = useState([]);

  // Control the loading state and any error messages
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Load the customer's jobs when the page opens
  useEffect(() => {
    let active = true;

    const loadJobs = async () => {
      try {
        // Get the currently logged-in user
        const { data: { user }, error: authError } =
          await supabase.auth.getUser();

        if (!active) return;

        if (authError || !user) {
          navigate('/login', { replace: true });
          return;
        }

        // Make sure only customers can access this page
        const { data: profile, error: profileError } =
          await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (profileError) throw profileError;
        if (!active) return;

        if (profile.role !== 'customer') {
          navigate('/dashboard', { replace: true });
          return;
        }

        // Get the customer's jobs and their category names
        const { data, error: jobsError } = await supabase
          .from('jobs')
          .select(`
            id,
            title,
            description,
            price,
            estimated_minutes,
            status,
            created_at,
            categories(name)
          `)
          .eq('customer_id', user.id)
          .order('created_at', { ascending: false });

        if (jobsError) throw jobsError;

        // Save the jobs in React state so they can be displayed
        if (active) {
          setJobs(data);
        }

      } catch (err) {
        if (active) {
          setError(err.message || 'Could not load your jobs.');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadJobs();

    // Prevent state updates if the user leaves the page
    return () => {
      active = false;
    };
  }, [navigate]);

  if (loading) {
    return <p>Loading your jobs...</p>;
  }

  if (error) {
    return <p>Error: {error}</p>;
  }

  return (
    <div className="my-jobs-page">
      <div className="my-jobs-container">

        <div className="my-jobs-header">
          <h1>My Jobs</h1>
          <p>View and manage the jobs you've posted.</p>

          <Link to="/post-job" className="my-jobs-add-button">
            + Post New Job
          </Link>
        </div>

        {/* Show a message if the customer hasn't posted any jobs */}
        {jobs.length === 0 ? (
          <div className="my-jobs-empty">
            <h2>No jobs posted yet</h2>
            <p>Your posted jobs will appear here.</p>
          </div>
        ) : (

          // Display a separate card for each job
          <div className="my-jobs-list">
            {jobs.map((job) => (
              <div className="my-job-card" key={job.id}>

                <div className="my-job-top">
                  <h2>{job.title}</h2>

                  {/* Show the job's current status */}
                  <span className={`my-job-status ${job.status}`}>
                    {statusLabels[job.status] || job.status}
                  </span>
                </div>

                {/* Category name comes from the categories table */}
                <p className="my-job-category">
                  {job.categories?.name || 'No category'}
                </p>

                <p className="my-job-description">
                  {job.description}
                </p>

                <div className="my-job-details">
                  <span>€{Number(job.price).toFixed(2)}</span>
                  <span>{job.estimated_minutes} minutes</span>
                </div>

                {/* Format the database date for easier reading */}
                <p className="my-job-date">
                  Posted: {new Date(job.created_at).toLocaleDateString('en-IE')}
                </p>

              </div>
            ))}
          </div>
        )}

        <Link to="/dashboard" className="my-jobs-back">
          Back to Dashboard
        </Link>

      </div>
    </div>
  );
}

export default MyJobs;
