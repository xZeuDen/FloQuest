
import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import '../styles/Register.css';

function Register() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('customer');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleRegister = async (e) => {
    e.preventDefault();

    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const { data, error: signUpError } =
        await supabase.auth.signUp({
          email: email.trim(),
          password: password,
          options: {
            data: {
              full_name: fullName.trim(),
              role: role
            }
          }
        });

      if (signUpError) {
        throw signUpError;
      }

      if (data.session) {
        setSuccess('Account created successfully!');
      } else {
        setSuccess('Check your email to confirm your account.');
      }

    } catch (err) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page">
      <form onSubmit={handleRegister} className="register-form">
        <h1>FloQuest</h1>
        <h2>Create an Account</h2>

        <label>Full Name</label>
        <input
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
        />

        <label>Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <label>Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={6}
          required
        />

        <label>Register As</label>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
        >
          <option value="customer">Customer</option>
          <option value="worker">Worker</option>
        </select>

        <button type="submit" disabled={loading}>
          {loading ? 'Creating Account...' : 'Sign Up'}
        </button>

        {error && <p className="error">{error}</p>}
        {success && <p className="success">{success}</p>}
      </form>
    </div>
  );
}

export default Register;
