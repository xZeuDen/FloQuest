
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { supabase } from '../lib/supabaseClient';
import '../styles/WorkerSetup.css';

function WorkerSetup() {
  const navigate = useNavigate();

  // Store the available categories and the ones selected by the worker
  const [categories, setCategories] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);

  // Store the worker's location and maximum travel distance
  const [location, setLocation] = useState(null);
  const [travelRadius, setTravelRadius] = useState(10);

  // Control loading states and error messages
  const [loading, setLoading] = useState(true);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Load the categories and any existing worker information
  useEffect(() => {
    let active = true;

    const loadSetup = async () => {
      try {
        // Check that the user is logged in
        const { data: { user }, error: authError } =
          await supabase.auth.getUser();

        if (!active) return;

        if (authError || !user) {
          navigate('/login', { replace: true });
          return;
        }

        // Only worker accounts should access this page
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        if (profileError) throw profileError;

        if (profile.role !== 'worker') {
          navigate('/dashboard', { replace: true });
          return;
        }

        // Get the nine categories from our database
        const { data: categoryData, error: categoryError } =
          await supabase
            .from('categories')
            .select('id, name')
            .order('id');

        if (categoryError) throw categoryError;

        // Check whether the worker has saved information before
        const { data: workerData, error: workerError } =
          await supabase
            .from('worker_profiles')
            .select('latitude, longitude, travel_radius_km')
            .eq('id', user.id)
            .maybeSingle();

        if (workerError) throw workerError;

        // Load any categories previously selected by the worker
        const { data: savedCategories, error: savedError } =
          await supabase
            .from('worker_categories')
            .select('category_id')
            .eq('worker_id', user.id);

        if (savedError) throw savedError;
        if (!active) return;

        setCategories(categoryData);
        setSelectedCategories(
          savedCategories.map((item) => item.category_id)
        );

        // Fill in saved location and radius if a profile already exists
        if (workerData) {
          setLocation({
            latitude: workerData.latitude,
            longitude: workerData.longitude
          });
          setTravelRadius(workerData.travel_radius_km);
        }

      } catch (err) {
        if (active) setError(err.message);
      } finally {
        if (active) setLoading(false);
      }
    };

    loadSetup();

    return () => {
      active = false;
    };
  }, [navigate]);

  // Add or remove a category when its button is clicked
  const toggleCategory = (categoryId) => {
    setSelectedCategories((current) => {
      if (current.includes(categoryId)) {
        return current.filter((id) => id !== categoryId);
      }

      return [...current, categoryId];
    });
  };

  // Ask the browser for the worker's current location
  const getLocation = () => {
    setError('');

    if (!navigator.geolocation) {
      setError('Your browser does not support location detection.');
      return;
    }

    setGettingLocation(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        // Save the latitude and longitude returned by the browser
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });

        setGettingLocation(false);
      },
      () => {
        setError('Could not get your location. Check browser permissions.');
        setGettingLocation(false);
      },
      {
        enableHighAccuracy: false,
        timeout: 15000,
        maximumAge: 60000
      }
    );
  };

  // Save the worker's information to Supabase
  const handleSave = async (e) => {
    e.preventDefault();
    setError('');

    // A worker must select at least one category
    if (selectedCategories.length === 0) {
      setError('Please select at least one job category.');
      return;
    }

    // Location is needed for our matching algorithm
    if (!location) {
      setError('Please set your location before continuing.');
      return;
    }

    setSaving(true);

    try {
      const { data: { user }, error: authError } =
        await supabase.auth.getUser();

      if (authError || !user) {
        throw new Error('Please log in again.');
      }

      // Insert a new worker profile or update the existing one
      const { error: workerError } = await supabase
        .from('worker_profiles')
        .upsert({
          id: user.id,
          latitude: location.latitude,
          longitude: location.longitude,
          travel_radius_km: travelRadius,
          is_available: false
        }, {
          onConflict: 'id'
        });

      if (workerError) throw workerError;

      // Remove old category selections before saving the new ones
      const { error: deleteError } = await supabase
        .from('worker_categories')
        .delete()
        .eq('worker_id', user.id);

      if (deleteError) throw deleteError;

      // Create a record for every category the worker selected
      const categoryRecords = selectedCategories.map((categoryId) => ({
        worker_id: user.id,
        category_id: categoryId
      }));

      const { error: insertError } = await supabase
        .from('worker_categories')
        .insert(categoryRecords);

      if (insertError) throw insertError;

      // Return to the dashboard when everything has been saved
      navigate('/dashboard', { replace: true });

    } catch (err) {
      setError(err.message || 'Could not save your profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="worker-setup-loading">Loading worker setup...</p>;
  }

  return (
    <div className="worker-setup-page">
      <div className="worker-setup-container">

        <div className="worker-setup-header">
          <span className="worker-setup-logo">FloQuest</span>
          <h1>Set up your worker profile</h1>
          <p>
            Tell us what jobs you can do and how far you're willing to travel.
          </p>
        </div>

        <form onSubmit={handleSave}>

          {/* Workers can select more than one category */}
          <section className="worker-setup-card">
            <h2>1. Your job categories</h2>
            <p>Select all the types of work you can do.</p>

            <div className="worker-setup-categories">
              {categories.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  className={`worker-category-button ${
                    selectedCategories.includes(category.id)
                      ? 'selected'
                      : ''
                  }`}
                  aria-pressed={selectedCategories.includes(category.id)}
                  onClick={() => toggleCategory(category.id)}
                >
                  {selectedCategories.includes(category.id) && '✓ '}
                  {category.name}
                </button>
              ))}
            </div>

            <p className="worker-setup-count">
              {selectedCategories.length} categories selected
            </p>
          </section>

          {/* Location is used later to find nearby jobs */}
          <section className="worker-setup-card">
            <h2>2. Your location</h2>
            <p>We use your location to find jobs near you.</p>

            <button
              type="button"
              className="worker-location-button"
              onClick={getLocation}
              disabled={gettingLocation}
            >
              📍 {gettingLocation ? 'Finding location...' : 'Use my current location'}
            </button>

            {location && (
              <p className="worker-location-success">
                ✓ Location saved: {location.latitude.toFixed(4)},
                {' '}{location.longitude.toFixed(4)}
              </p>
            )}
          </section>

          {/* Slider for the maximum distance a worker will travel */}
          <section className="worker-setup-card">
            <div className="worker-radius-header">
              <div>
                <h2>3. Travel distance</h2>
                <p>How far are you willing to travel for a job?</p>
              </div>

              <span className="worker-radius-value">
                {travelRadius} km
              </span>
            </div>

            <label htmlFor="travelRadius" className="worker-slider-label">
              Maximum travel radius
            </label>

            <input
              id="travelRadius"
              className="worker-radius-slider"
              type="range"
              min="1"
              max="50"
              step="1"
              value={travelRadius}
              onChange={(e) => setTravelRadius(Number(e.target.value))}
              style={{
                '--slider-progress': `${((travelRadius - 1) / 49) * 100}%`
              }}
            />

            <div className="worker-radius-labels">
              <span>1 km</span>
              <span>50 km</span>
            </div>
          </section>

          {error && <p className="worker-setup-error">{error}</p>}

          {/* Save all profile details before entering the dashboard */}
          <button
            type="submit"
            className="worker-save-button"
            disabled={saving || categories.length === 0}
          >
            {saving ? 'Saving profile...' : 'Save Profile →'}
          </button>

        </form>
      </div>
    </div>
  );
}

export default WorkerSetup;
