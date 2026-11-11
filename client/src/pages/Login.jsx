
import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { supabase } from '../lib/supabaseClient';
import '../styles/Login.css';

function Login() {

  // Used to redirect the user after a successful login
  const navigate = useNavigate();

  // State variables for the email and password entered by the user
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Used to manage loading and error messages
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Called when the user submits the login form
  const handleLogin = async (e) => {
    e.preventDefault(); // Prevent the browser from refreshing

    // Clear previous errors and show that login is processing
    setError('');
    setLoading(true);

    try {
      // Send the user's credentials to Supabase Authentication
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password
      });

      // If the credentials are incorrect, Supabase returns an error
      if (loginError) {
        throw loginError;
      }

      // If login succeeds, redirect the user to the dashboard
      // The dashboard checks their role from the profiles table
      navigate('/dashboard', { replace: true });

    } catch (err) {
      // Display the login error on the page
      setError(err.message || 'Login failed.');
    } finally {
      // Stop the loading state whether login succeeds or fails
      setLoading(false);
    }
  };

  return (
    <div className="login-page">

      {/* Login form that runs handleLogin when submitted */}
      <form className="login-form" onSubmit={handleLogin}>

        <h1>FloQuest</h1>
        <h2>Login</h2>

        {/* Email input - value is stored in React state */}
        {/* onChange updates the email whenever the user types */}
        <label htmlFor="loginEmail">Email</label>
        <input
          id="loginEmail"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          required
        />

        {/* Password input - hides the password characters */}
        {/* The password state is updated as the user types */}
        <label htmlFor="loginPassword">Password</label>
        <input
          id="loginPassword"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
        />

        {/* Button is disabled while Supabase checks the credentials */}
        <button type="submit" disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </button>

        {/* Display an error message if login fails */}
        {error && <p className="login-error">{error}</p>}

        {/* Link for users who need to create an account */}
        <p className="login-link">
          Don't have an account? <Link to="/register">Sign Up</Link>
        </p>

      </form>
    </div>
  );
}

export default Login;
