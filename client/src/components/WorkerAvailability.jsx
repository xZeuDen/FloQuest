import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import '../styles/WorkerAvailability.css';

function WorkerAvailability() {
  // Store the worker's availability and loading states
  const [isAvailable, setIsAvailable] = useState(false);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');

  // Load the worker's current availability from Supabase
  useEffect(() => {
    let active = true;

    const loadAvailability = async () => {
      try {
        const { data: { user }, error: authError } =
          await supabase.auth.getUser();

        if (authError || !user) {
          throw new Error('User not logged in.');
        }

        const { data, error: profileError } = await supabase
          .from('worker_profiles')
          .select('is_available')
          .eq('id', user.id)
          .single();

        if (profileError) throw profileError;

        if (active) {
          setIsAvailable(data.is_available);
        }

      } catch (err) {
        if (active) setError(err.message);
      } finally {
        if (active) setLoading(false);
      }
    };

    loadAvailability();

    return () => {
      active = false;
    };
  }, []);

  // Switch the worker between online and offline
  const toggleAvailability = async () => {
    setUpdating(true);
    setError('');

    try {
      const { data: { user }, error: authError } =
        await supabase.auth.getUser();

      if (authError || !user) {
        throw new Error('User not logged in.');
      }

      // Save the opposite of the worker's current status
      const newStatus = !isAvailable;

      const { data, error: updateError } = await supabase
        .from('worker_profiles')
        .update({ is_available: newStatus })
        .eq('id', user.id)
        .select('is_available')
        .single();

      if (updateError) throw updateError;

      // Only update the screen after Supabase confirms the change
      setIsAvailable(data.is_available);

    } catch (err) {
      setError(err.message);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return <p>Loading availability...</p>;
  }

  return (
    <div className="worker-availability">
      <div>
        <h3>Work Availability</h3>

        <p>
          {isAvailable
            ? 'You are online and available for jobs.'
            : 'You are currently offline.'}
        </p>
      </div>

      {/* Toggle updates the availability stored in Supabase */}
      <button
        type="button"
        className={`availability-toggle ${isAvailable ? 'online' : ''}`}
        onClick={toggleAvailability}
        disabled={updating || Boolean(error)}
        aria-pressed={isAvailable}
      >
        <span className="toggle-circle"></span>
        {isAvailable ? 'Online' : 'Offline'}
      </button>

      {error && (
        <p className="availability-error">{error}</p>
      )}
    </div>
  );
}

export default WorkerAvailability;
