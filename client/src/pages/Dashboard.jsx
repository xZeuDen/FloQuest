
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { supabase } from '../lib/supabaseClient';

function Dashboard() {
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    const loadProfile = async () => {
      const { data: { user }, error: authError } =
        await supabase.auth.getUser();

      if (!active) return;

      if (authError || !user) {
        navigate('/login', { replace: true });
        return;
      }

      const { data, error: profileError } = await supabase
        .from('profiles')
        .select('full_name, role')
        .eq('id', user.id)
        .single();

      if (!active) return;

      if (profileError) {
        setError(profileError.message);
      } else {
        setProfile(data);
      }

      setLoading(false);
    };

    loadProfile();

    return () => {
      active = false;
    };
  }, [navigate]);

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

      <button onClick={handleLogout}>
        Logout
      </button>
    </div>
  );
}

export default Dashboard;
