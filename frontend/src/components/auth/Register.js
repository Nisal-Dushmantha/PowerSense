import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../../services/authService';
import Modal from '../common/Modal';

const Register = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [isWhatsappVerified, setIsWhatsappVerified] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if (name === 'phoneNumber' && isWhatsappVerified) {
      setIsWhatsappVerified(false);
    }
  };

  const handleSendOtp = async () => {
    if (!formData.phoneNumber.trim()) {
      setError('Please enter a WhatsApp number first');
      return;
    }

    try {
      setOtpLoading(true);
      setError(null);
      await authService.sendWhatsAppOtp(formData.phoneNumber);
      setOtpDigits(['', '', '', '', '', '']);
      setIsOtpModalOpen(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP. Please try again.');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleOtpChange = (index, value) => {
    if (!/^\d?$/.test(value)) {
      return;
    }

    const updatedOtp = [...otpDigits];
    updatedOtp[index] = value;
    setOtpDigits(updatedOtp);

    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-input-${index + 1}`);
      if (nextInput) {
        nextInput.focus();
      }
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      const previousInput = document.getElementById(`otp-input-${index - 1}`);
      if (previousInput) {
        previousInput.focus();
      }
    }
  };

  const handleConfirmOtp = async () => {
    const otpValue = otpDigits.join('');
    if (otpValue.length !== 6) {
      setError('Please enter all 6 OTP digits');
      return;
    }

    try {
      setOtpVerifying(true);
      setError(null);
      await authService.verifyWhatsAppOtp(formData.phoneNumber, otpValue);
      setIsWhatsappVerified(true);
      setIsOtpModalOpen(false);
    } catch (err) {
      setError(err.response?.data?.message || 'OTP verification failed');
    } finally {
      setOtpVerifying(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    // Validate password length
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    if (!formData.phoneNumber.trim()) {
      setError('WhatsApp number is required');
      setLoading(false);
      return;
    }

    if (!isWhatsappVerified) {
      setError('Please verify your WhatsApp number before creating your account');
      setLoading(false);
      return;
    }

    try {
      const { confirmPassword, ...registerData } = formData;
      const response = await authService.register(registerData);
      const { token, user } = response.data.data;
      
      // Store token and user data
      authService.storeUser(user, token);

      const redirectPath = authService.getPostAuthRedirectPath(user);
      
      // Redirect based on role
      navigate(redirectPath, { replace: true });
      window.location.reload(); // Reload to update navbar
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
      console.error('Registration error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-gradient-to-br from-[#f4fbf7] via-[#ecf9f1] to-[#f8fcf9] dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 px-4 py-4 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute -top-24 right-0 h-80 w-80 rounded-full bg-secondary/18 blur-3xl animate-pulse"></div>
      <div className="pointer-events-none absolute -bottom-24 left-0 h-80 w-80 rounded-full bg-primary/18 blur-3xl animate-pulse"></div>

      <div className="relative mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-10">
        <section className="hidden lg:flex lg:flex-col lg:justify-center slide-up">
          <div className="max-w-lg">
            <p className="mb-4 inline-flex items-center rounded-full border border-primary/15 dark:border-gray-700 bg-white/80 dark:bg-gray-800/75 px-4 py-1 text-xs font-semibold tracking-wide text-secondary shadow-sm backdrop-blur-sm">
              New Account Setup
            </p>
            <h1 className="text-5xl font-extrabold leading-tight text-textPrimary">
              Build your
              <span className="block text-gradient">energy dashboard</span>
            </h1>
            <p className="mt-5 text-base text-textSecondary">
              Join PowerSense to track bills, monitor your monthly kWh usage, and receive payment reminders via WhatsApp.
            </p>

            <div className="mt-8 grid grid-cols-2 gap-3">
              {['Real-time tracking', 'Smart reminders', 'Monthly insights', 'Secure account'].map((item, index) => (
                <div
                  key={item}
                  className="rounded-2xl border border-primary/15 dark:border-gray-700 bg-white/75 dark:bg-gray-800/75 px-3 py-4 text-center text-sm font-semibold text-textPrimary shadow-sm backdrop-blur-sm"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="flex items-center justify-center scale-in">
          <div className="w-full max-w-md rounded-3xl border border-primary/15 dark:border-gray-700 bg-white/90 dark:bg-gray-800/90 p-6 shadow-2xl backdrop-blur-md sm:p-7">
            <div className="mb-4 text-center">
              <h2 className="text-3xl font-bold text-textPrimary">Create account</h2>
              <p className="mt-1 text-sm text-textSecondary">Start managing your energy smarter</p>
            </div>

            {error && (
              <div className="mb-5 rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-300 animate-shake">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="firstName" className="block text-sm font-semibold text-textPrimary dark:text-gray-200 mb-2">
                  First Name
                </label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                  className="input-field"
                  placeholder="John"
                />
              </div>

              <div>
                <label htmlFor="lastName" className="block text-sm font-semibold text-textPrimary dark:text-gray-200 mb-2">
                  Last Name
                </label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                  className="input-field"
                  placeholder="Doe"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-textPrimary dark:text-gray-200 mb-2">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="input-field"
                placeholder="your.email@example.com"
              />
            </div>

            <div>
              <label htmlFor="phoneNumber" className="block text-sm font-semibold text-textPrimary dark:text-gray-200 mb-2">
                WhatsApp Number
              </label>
              <div className="flex gap-2">
                <input
                  type="tel"
                  id="phoneNumber"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  required
                  className="input-field flex-1"
                  placeholder="+94771234567"
                />
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={otpLoading}
                  className="px-4 py-3 rounded-lg text-sm font-semibold text-white bg-secondary hover:opacity-90 transition-colors whitespace-nowrap disabled:opacity-60"
                >
                  {otpLoading ? 'Sending...' : 'Send OTP'}
                </button>
              </div>
              {isWhatsappVerified && (
                <p className="mt-2 text-sm text-green-600 dark:text-green-400 font-medium">WhatsApp number verified</p>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-textPrimary dark:text-gray-200 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  minLength="6"
                  className="input-field"
                  placeholder="At least 6 characters"
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-semibold text-textPrimary dark:text-gray-200 mb-2">
                  Confirm Password
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  className="input-field"
                  placeholder="Re-enter"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-base font-semibold text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary focus:ring-offset-white dark:focus:ring-offset-gray-900 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Creating Account...' : 'Create Account'}
              </button>
            </div>
          </form>

          <div className="mt-4">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-gray-700" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white dark:bg-gray-800 text-textSecondary dark:text-gray-400">
                  Already have an account?
                </span>
              </div>
            </div>

            <div className="mt-4">
              <Link
                to="/login"
                className="w-full flex justify-center py-3 px-4 border-2 border-primary rounded-lg shadow-sm text-base font-semibold text-primary bg-white dark:bg-gray-800 dark:text-primary hover:bg-light-mint dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary focus:ring-offset-white dark:focus:ring-offset-gray-900 transition-colors"
              >
                Sign In Instead
              </Link>
            </div>
          </div>
          </div>
        </section>
      </div>

      <Modal
        isOpen={isOtpModalOpen}
        onClose={() => setIsOtpModalOpen(false)}
        title="Verify WhatsApp Number"
        size="small"
      >
        <div className="space-y-5">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Enter the 6-digit OTP sent to your WhatsApp number.
          </p>

          <div className="flex justify-between gap-2">
            {otpDigits.map((digit, index) => (
              <input
                key={index}
                id={`otp-input-${index}`}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(index, e.target.value)}
                onKeyDown={(e) => handleOtpKeyDown(index, e)}
                className="w-11 h-12 text-center text-lg font-bold border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            ))}
          </div>

          <button
            type="button"
            onClick={handleConfirmOtp}
            disabled={otpVerifying}
            className="w-full py-3 px-4 rounded-lg text-white font-semibold bg-primary hover:bg-primary-dark transition-colors"
          >
            {otpVerifying ? 'Verifying...' : 'Confirm'}
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default Register;
