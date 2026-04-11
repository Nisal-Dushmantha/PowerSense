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

      const redirectPath = authService.getPostAuthRedirectPath(user);
      
      // Redirect based on role
      navigate(redirectPath, { replace: true });
      window.location.reload(); // Reload to update navbar
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-gradient-to-br from-[#f4fbf7] via-[#ecf9f1] to-[#f8fcf9] dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <div className="pointer-events-none absolute -top-20 -left-20 h-64 w-64 rounded-full bg-primary/18 blur-3xl animate-pulse"></div>
      <div className="pointer-events-none absolute -bottom-24 -right-20 h-72 w-72 rounded-full bg-secondary/18 blur-3xl animate-pulse"></div>

      <div className="relative mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl grid-cols-1 gap-8 px-4 py-8 sm:px-6 lg:grid-cols-2 lg:gap-12 lg:px-8">
        <section className="hidden lg:flex lg:flex-col lg:justify-center slide-up">
          <div className="max-w-lg">
            <p className="mb-4 inline-flex items-center rounded-full border border-primary/15 bg-white/80 dark:bg-gray-800/75 dark:border-gray-700 px-4 py-1 text-xs font-semibold tracking-wide text-primary shadow-sm backdrop-blur-sm">
              Energy Intelligence Platform
            </p>
            <h1 className="text-5xl font-extrabold leading-tight text-textPrimary">
              Sign in to your
              <span className="block text-gradient">PowerSense workspace</span>
            </h1>
            <p className="mt-5 text-base text-textSecondary">
              Monitor usage patterns, manage monthly bills, and receive timely payment alerts in one place.
            </p>

            <div className="mt-8 grid grid-cols-3 gap-3">
              {['Fast', 'Reliable', 'Insightful'].map((tag, index) => (
                <div
                  key={tag}
                  className="rounded-2xl border border-primary/15 dark:border-gray-700 bg-white/75 dark:bg-gray-800/75 px-3 py-4 text-center text-sm font-semibold text-textPrimary shadow-sm backdrop-blur-sm"
                  style={{ animationDelay: `${index * 120}ms` }}
                >
                  {tag}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="flex items-center justify-center scale-in">
          <div className="w-full max-w-md rounded-3xl border border-primary/15 dark:border-gray-700 bg-white/90 dark:bg-gray-800/90 p-7 shadow-2xl backdrop-blur-md sm:p-8">
            <div className="mb-6 text-center">
              <h2 className="text-3xl font-bold text-textPrimary">Welcome back</h2>
              <p className="mt-1 text-sm text-textSecondary">Sign in to continue</p>
            </div>

            {error && (
              <div className="mb-5 rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-300 animate-shake">
                {error}
              </div>
            )}

            <form onSubmit={onSubmit} className="space-y-5">
              <div className="form-group">
                <label htmlFor="email" className="form-label">Email address</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={email}
                  onChange={onChange}
                  required
                  className="input-field"
                  placeholder="you@example.com"
                />
              </div>

              <div className="form-group">
                <label htmlFor="password" className="form-label">Password</label>
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

              <button type="submit" disabled={loading} className="btn-primary w-full btn-lg">
                {loading ? (
                  <>
                    <div className="loading-spinner mr-3 h-5 w-5"></div>
                    Signing in...
                  </>
                ) : (
                  'Sign in'
                )}
              </button>
            </form>

            <div className="my-6 flex items-center gap-3 text-xs text-textSecondary">
              <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700"></div>
              <span>New to PowerSense?</span>
              <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700"></div>
            </div>

            <Link to="/register" className="btn-secondary w-full">
              Create account
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Login;
