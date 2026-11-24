
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { supabase } from '../lib/supabaseClient';
import WorkerAvailability from '../components/WorkerAvailability';
import '../styles/Dashboard.css';

function Dashboard() {
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Check the logged-in user and load their profile
  useEffect(() => {
    let active = true;

    const loadDashboard = async () => {
      try {
        // Get the currently logged-in user from Supabase
        const { data: { user }, error: authError } =
          await supabase.auth.getUser();

        if (!active) return;

        // Users must be logged in to access the dashboard
        if (authError || !user) {
          navigate('/login', { replace: true });
          return;
        }

        // Get the user's name and role from our profiles table
        const { data, error: profileError } = await supabase
          .from('profiles')
          .select('full_name, role')
          .eq('id', user.id)
          .single();

        if (profileError) throw profileError;
        if (!active) return;

        // Workers must complete their profile before using the dashboard
        if (data.role === 'worker') {

          // Check whether the worker has saved their location and radius
          const { data: workerProfile, error: workerError } =
            await supabase
              .from('worker_profiles')
              .select('id')
              .eq('id', user.id)
              .maybeSingle();

          if (workerError) throw workerError;

          // Check that the worker has selected at least one job category
          const { count, error: categoryError } = await supabase
            .from('worker_categories')
            .select('category_id', { count: 'exact', head: true })
            .eq('worker_id', user.id);

          if (categoryError) throw categoryError;
          if (!active) return;

          // Redirect workers who haven't completed their setup
          if (!workerProfile || !count) {
            navigate('/worker-setup', { replace: true });
            return;
          }
        }

        // Save the profile so we can display the correct dashboard
        setProfile(data);

      } catch (err) {
        if (active) {
          setError(err.message || 'Could not load the dashboard.');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadDashboard();

    // Prevent state updates if the component is unmounted
    return () => {
      active = false;
    };
  }, [navigate]);

  // Log out the user and return them to the login page
  const handleLogout = async () => {
    const { error: logoutError } = await supabase.auth.signOut();

    if (logoutError) {
      setError(logoutError.message);
      return;
    }

    navigate('/login', { replace: true });
  };

  // Show a loading message while checking the user
  if (loading) {
    return <p>Loading dashboard...</p>;
  }

  // Display any Supabase errors
  if (error) {
    return <p>Error: {error}</p>;
  }

  return (
    <div>
      <h1>Welcome, {profile.full_name}!</h1>

      {/* Display a different heading based on the user's role */}
      <h2>
        {profile.role === 'customer'
          ? 'Customer Dashboard'
          : 'Worker Dashboard'}
      </h2>

      <p>You are logged in as a {profile.role}.</p>

      {/* Customers can post jobs and view jobs they have already created */}
      {profile.role === 'customer' && (
        <div>
          <h3>Manage Your Jobs</h3>

          <p>
            Post a new job or check the jobs you've already created.
          </p>

          <div className="customer-actions">

            <Link to="/post-job" className="post-job-link">
              + Post a Job
            </Link>

            <Link to="/my-jobs" className="my-jobs-link">
              View My Jobs
            </Link>

          </div>
        </div>
      )}

      {/* Show worker-specific features only for worker accounts */}
      {profile.role === 'worker' && (
        <div className="worker-dashboard-section">

          {/* Workers can switch their availability ON or OFF */}
          <WorkerAvailability />

          {/* Workers can discover matching jobs or update their profile */}
          <div className="worker-dashboard-actions">

            <Link to="/worker-jobs" className="worker-jobs-link">
              Find Jobs Near Me
            </Link>

            <Link to="/worker-setup" className="worker-setup-link">
              Edit Worker Profile
            </Link>

          </div>
        </div>
      )}

      {/* Both customers and workers can log out */}
      <button onClick={handleLogout}>
        Logout
      </button>
    </div>
  );
}

export default Dashboard;
