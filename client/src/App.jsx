import { Routes, Route, Navigate } from 'react-router';

import Register from './pages/Register';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import WorkerSetup from './pages/WorkerSetup';
import PostJob from './pages/PostJob';

function App() {
  return (
    <Routes>
      {/* Redirect users to login when they first visit */}
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* Authentication pages */}
      <Route path="/register" element={<Register />} />
      <Route path="/login" element={<Login />} />

      {/* Main dashboard */}
      <Route path="/dashboard" element={<Dashboard />} />

      {/* Worker profile setup */}
      <Route path="/worker-setup" element={<WorkerSetup />} />

      {/* Customer job posting */}
      <Route path="/post-job" element={<PostJob />} />

      {/* Redirect unknown URLs to login */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;
