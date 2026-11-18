import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { supabase } from '../lib/supabaseClient';
import '../styles/PostJob.css';

function PostJob() {
  const navigate = useNavigate();

  // Store the information entered into the job posting form
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [price, setPrice] = useState('');
  const [estimatedMinutes, setEstimatedMinutes] = useState('');

  // Store the available job categories and customer's location
  const [categories, setCategories] = useState([]);
  const [location, setLocation] = useState(null);

  // Used for loading, saving and displaying messages
  const [loading, setLoading] = useState(true);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Load the categories from Supabase when the page opens
  useEffect(() => {
    let active = true;

    const loadCategories = async () => {
      try {
        // Check that the user is logged in
        const { data: { user }, error: authError } =
          await supabase.auth.getUser();

        if (!active) return;

        if (authError || !user) {
          navigate('/login', { replace: true });
          return;
        }

        // Only customers should be able to post jobs
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

        // Get the nine job categories from our categories table
        const { data, error: categoryError } = await supabase
          .from('categories')
          .select('id, name')
          .order('id');

        if (categoryError) throw categoryError;

        if (active) {
          setCategories(data);
        }

      } catch (err) {
        if (active) {
          setError(err.message);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadCategories();

    return () => {
      active = false;
    };
  }, [navigate]);

  // Get the customer's location using the browser
  const getLocation = () => {
    setError('');

    if (!navigator.geolocation) {
      setError('Your browser does not support location detection.');
      return;
    }

    setGettingLocation(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        // Keep the coordinates in state for saving the job
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });

        setGettingLocation(false);
      },
      () => {
        setError('Could not detect your location. Check browser permissions.');
        setGettingLocation(false);
      },
      {
        enableHighAccuracy: false,
        timeout: 15000,
        maximumAge: 60000
      }
    );
  };

  // Called when the customer submits the job posting form
  const handlePostJob = async (e) => {
    e.preventDefault();

    // Clear messages from previous attempts
    setError('');
    setSuccess('');

    // Check that the required information has been provided
    if (!title.trim() || !description.trim() || !categoryId) {
      setError('Please complete all job details.');
      return;
    }

    if (Number(price) <= 0 || Number(estimatedMinutes) <= 0) {
      setError('Please enter a valid price and duration.');
      return;
    }

    if (!location) {
      setError('Please set the job location.');
      return;
    }

    setSaving(true);

    try {
      // Get the logged-in customer's ID
      const { data: { user }, error: authError } =
        await supabase.auth.getUser();

      if (authError || !user) {
        throw new Error('Please log in again.');
      }

      // Create a new record in the jobs table
      const { error: insertError } = await supabase
        .from('jobs')
        .insert({
          customer_id: user.id,
          category_id: Number(categoryId),
          title: title.trim(),
          description: description.trim(),
          price: Number(price),
          estimated_minutes: Number(estimatedMinutes),
          latitude: location.latitude,
          longitude: location.longitude,
          status: 'open'
        });

      if (insertError) {
        throw insertError;
      }

      // Show a confirmation and reset the form
      setSuccess('Your job has been posted successfully!');

      setTitle('');
      setDescription('');
      setCategoryId('');
      setPrice('');
      setEstimatedMinutes('');
      setLocation(null);

    } catch (err) {
      setError(err.message || 'Could not post your job.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p>Loading job posting form...</p>;
  }

  return (
    <div className="post-job-page">
      <div className="post-job-container">

        <h1>Post a New Job</h1>
        <p>Describe the work you need help with.</p>

        {/* Submitting this form calls handlePostJob */}
        <form onSubmit={handlePostJob}>

          {/* Job title is stored in React state */}
          <label htmlFor="jobTitle">Job Title</label>
          <input
            id="jobTitle"
            type="text"
            placeholder="e.g. Assemble IKEA wardrobe"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={100}
            required
          />

          {/* Categories are loaded from the Supabase database */}
          <label htmlFor="jobCategory">Job Category</label>
          <select
            id="jobCategory"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            required
          >
            <option value="">Select a category</option>

            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>

          {/* Customer describes what needs to be done */}
          <label htmlFor="jobDescription">Description</label>
          <textarea
            id="jobDescription"
            placeholder="Describe the job in more detail..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows="5"
            required
          />

          {/* Fixed price offered by the customer */}
          <label htmlFor="jobPrice">Your Budget (€)</label>
          <input
            id="jobPrice"
            type="number"
            placeholder="e.g. 50"
            min="0.01"
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
          />

          {/* Estimated time needed to complete the job */}
          <label htmlFor="jobDuration">Estimated Duration (minutes)</label>
          <input
            id="jobDuration"
            type="number"
            placeholder="e.g. 90"
            min="1"
            step="1"
            value={estimatedMinutes}
            onChange={(e) => setEstimatedMinutes(e.target.value)}
            required
          />

          {/* Use the browser to detect the job location */}
          <div className="post-job-location">
            <h3>Job Location</h3>
            <p>Use your current location for this job.</p>

            <button
              type="button"
              onClick={getLocation}
              disabled={gettingLocation}
            >
              {gettingLocation
                ? 'Finding location...'
                : '📍 Use my current location'}
            </button>

            {/* Only show this message when location is detected */}
            {location && (
              <p className="post-job-location-success">
                ✓ Location detected successfully
              </p>
            )}
          </div>

          {/* Show feedback after submitting the form */}
          {error && <p className="post-job-error">{error}</p>}
          {success && <p className="post-job-success">{success}</p>}

          {/* Disable the button while saving to prevent repeated clicks */}
          <button
            type="submit"
            className="post-job-submit"
            disabled={saving || categories.length === 0}
          >
            {saving ? 'Posting Job...' : 'Post Job'}
          </button>

        </form>
      </div>
    </div>
  );
}

export default PostJob;
