
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { supabase } from '../lib/supabaseClient';

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

          // Check whether worker details have been saved
          const { data: workerProfile, error: workerError } =
            await supabase
              .from('worker_profiles')
              .select('id')
              .eq('id', user.id)
              .maybeSingle();

          if (workerError) throw workerError;

          // Check that the worker has selected at least one category
          const { count, error: categoryError } = await supabase
            .from('worker_categories')
            .select('category_id', { count: 'exact', head: true })
            .eq('worker_id', user.id);

          if (categoryError) throw categoryError;
          if (!active) return;

          // Redirect workers who have not completed their setup
          if (!workerProfile || !count) {
            navigate('/worker-setup', { replace: true });
            return;
          }
        }

        setProfile(data);

      } catch (err) {
        if (active) setError(err.message);
      } finally {
        if (active) setLoading(false);
      }
    };

    loadDashboard();

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

  if (loading) {
    return <p>Loading dashboard...</p>;
  }

  if (error) {
    return <p>Error: {error}</p>;
  }

  return (
    <div>
      <h1>Welcome, {profile.full_name}!</h1>

      <h2>
        {profile.role === 'customer'
          ? 'Customer Dashboard'
          : 'Worker Dashboard'}
      </h2>

      <p>You are logged in as a {profile.role}.</p>

      {/* Workers can return to their setup page to change their details */}
      {profile.role === 'worker' && (
        <p>
          <Link to="/worker-setup">Edit Worker Profile</Link>
        </p>
      )}

      <button onClick={handleLogout}>Logout</button>
    </div>
  );
}

export default Dashboard;
