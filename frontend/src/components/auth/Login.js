import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../../services/authService';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const { email, password } = formData;

  const onChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    // Clear error when user starts typing
    if (error) setError('');
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await authService.login(formData);
      const { token, user } = response.data.data;
      
      // Store token and user data
      authService.storeUser(user, token);
      
      // Redirect to homepage after successful login
      navigate('/');
      window.location.reload(); // Reload to update navbar
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center container-padding">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center fade-in">
          <div className="mx-auto w-16 h-16 bg-gradient-to-r from-primary to-secondary rounded-2xl flex items-center justify-center mb-6 shadow-lg">
            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M13 10V3L4 14h7v7l9-11h-7z"/>
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-textPrimary">Welcome back</h2>
          <p className="mt-2 text-sm text-textSecondary">
            Sign in to your PowerSense account
          </p>
        </div>

        {/* Login Form */}
        <div className="card card-gradient scale-in">
          <div className="card-body">
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  </svg>
                  <span className="text-sm text-red-700">{error}</span>
                </div>
              </div>
            )}

            <form onSubmit={onSubmit} className="space-y-6">
              <div className="form-group">
                <label htmlFor="email" className="form-label">
                  Email address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={email}
                  onChange={onChange}
                  required
                  className="input-field"
                  placeholder="Enter your email"
                />
              </div>

              <div className="form-group">
                <label htmlFor="password" className="form-label">
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={password}
                  onChange={onChange}
                  required
                  className="input-field"
                  placeholder="Enter your password"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full btn-lg relative"
              >
                {loading ? (
                  <>
                    <div className="loading-spinner w-5 h-5 mr-3"></div>
                    Signing in...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M16 17l5-5-5-5M19.8 12H9M10 3H6a2 2 0 00-2 2v14a2 2 0 002 2h4"/>
                    </svg>
                    Sign in
                  </>
                )}
              </button>
            </form>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-textSecondary">Don't have an account?</span>
                </div>
              </div>

              <div className="mt-6 text-center">
                <Link
                  to="/register"
                  className="btn-secondary w-full"
                >
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
                    <circle cx="8.5" cy="7" r="4"/>
                    <path d="M20 8v6M23 11h-6"/>
                  </svg>
                  Create new account
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-3 gap-4 fade-in">
          <div className="text-center">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-2">
              <svg className="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l9 11h-6v7h-6v-7H3l9-11z"/>
              </svg>
            </div>
            <p className="text-xs text-textSecondary">Fast & Secure</p>
          </div>
          <div className="text-center">
            <div className="w-10 h-10 bg-secondary/10 rounded-lg flex items-center justify-center mx-auto mb-2">
              <svg className="w-5 h-5 text-secondary" fill="currentColor" viewBox="0 0 24 24">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"/>
              </svg>
            </div>
            <p className="text-xs text-textSecondary">Bill Tracking</p>
          </div>
          <div className="text-center">
            <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center mx-auto mb-2">
              <svg className="w-5 h-5 text-accent" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 20V10M6 20V4m12 16V8"/>
              </svg>
            </div>
            <p className="text-xs text-textSecondary">Analytics</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
