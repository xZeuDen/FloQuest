
import { useState } from 'react';
import { Link } from 'react-router';
import { supabase } from '../lib/supabaseClient';
import '../styles/Register.css';

function Register() {

  // State variables to store the information entered by the user
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('customer');

  // Used to handle loading, error messages and successful registrations
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Called when the user submits the registration form
  const handleRegister = async (e) => {
    e.preventDefault(); // Stops the page from refreshing

    // Clear any previous messages before attempting registration
    setError('');
    setSuccess('');

    // Make sure the user has entered a valid name
    if (!fullName.trim()) {
      setError('Please enter your full name.');
      return;
    }

    // Disable the submit button while registration is processing
    setLoading(true);

    try {
      // Create a new account using Supabase Authentication
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
        options: {
          // Store additional user information as metadata
          data: {
            full_name: fullName.trim(),
            role: role
          }
        }
      });

      // If Supabase returns an error, display it to the user
      if (signUpError) {
        throw signUpError;
      }

      // Our PostgreSQL trigger automatically creates the user's profile
      // using the name and role provided during registration
      if (data.session) {
        setSuccess('Account created successfully!');
      } else {
        // Email confirmation is enabled in our Supabase project
        setSuccess('Check your email to confirm your account.');
      }

    } catch (err) {
      // Display any errors that occur during registration
      setError(err.message || 'Registration failed.');
    } finally {
      // Enable the submit button again once the request finishes
      setLoading(false);
    }
  };

  return (
    <div className="register-page">

      {/* The form calls handleRegister when the user clicks Sign Up */}
      <form className="register-form" onSubmit={handleRegister}>

        <h1>FloQuest</h1>
        <h2>Create an Account</h2>

        {/* Full name field - updates the fullName state as the user types */}
        <label htmlFor="fullName">Full Name</label>
        <input
          id="fullName"
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          autoComplete="name"
          required
        />

        {/* Email field - type="email" provides basic browser validation */}
        <label htmlFor="registerEmail">Email</label>
        <input
          id="registerEmail"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          required
        />

        {/* Password field - characters are hidden and at least 6 are required */}
        <label htmlFor="registerPassword">Password</label>
        <input
          id="registerPassword"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          minLength={6}
          required
        />

        {/* Users choose whether they are registering as a customer or worker */}
        {/* This role is saved in the profiles table through our database trigger */}
        <label htmlFor="role">Register As</label>
        <select
          id="role"
          value={role}
          onChange={(e) => setRole(e.target.value)}
        >
          <option value="customer">Customer</option>
          <option value="worker">Worker</option>
        </select>

        {/* Disable the button during registration to prevent repeated clicks */}
        <button type="submit" disabled={loading}>
          {loading ? 'Creating Account...' : 'Sign Up'}
        </button>

        {/* Only display these messages when there is an error or success */}
        {error && <p className="register-error">{error}</p>}
        {success && <p className="register-success">{success}</p>}

        {/* Link to the login page for users who already have an account */}
        <p className="register-link">
          Already have an account? <Link to="/login">Login</Link>
        </p>

      </form>
    </div>
  );
}

export default Register;
