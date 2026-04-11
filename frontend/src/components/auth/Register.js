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
      
      // Redirect to bills page
      navigate('/bills');
      window.location.reload(); // Reload to update navbar
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
      console.error('Registration error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-light-mint py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-4xl font-extrabold text-primary flex items-center justify-center space-x-2">
            <span className="text-5xl">⚡</span>
            <span>PowerSense</span>
          </h2>
          <p className="mt-2 text-center text-lg text-dark-charcoal font-medium">
            Create your account
          </p>
        </div>
        
        <div className="bg-white shadow-xl rounded-lg p-8 border border-background-dark">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="firstName" className="block text-sm font-semibold text-dark-charcoal mb-2">
                First Name
              </label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                placeholder="John"
              />
            </div>

            <div>
              <label htmlFor="lastName" className="block text-sm font-semibold text-dark-charcoal mb-2">
                Last Name
              </label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                placeholder="Doe"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-dark-charcoal mb-2">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                placeholder="your.email@example.com"
              />
            </div>

            <div>
              <label htmlFor="phoneNumber" className="block text-sm font-semibold text-dark-charcoal mb-2">
                WhatsApp Number
              </label>
              <div className="flex gap-2">
                <input
                  type="tel"
                  id="phoneNumber"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  placeholder="+94771234567"
                />
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={otpLoading}
                  className="px-4 py-3 rounded-lg text-sm font-semibold text-white bg-secondary hover:opacity-90 transition-colors whitespace-nowrap"
                >
                  {otpLoading ? 'Sending...' : 'Send OTP'}
                </button>
              </div>
              {isWhatsappVerified && (
                <p className="mt-2 text-sm text-green-600 font-medium">WhatsApp number verified</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-dark-charcoal mb-2">
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
                className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                placeholder="At least 6 characters"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-semibold text-dark-charcoal mb-2">
                Confirm Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                placeholder="Re-enter your password"
              />
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-base font-semibold text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 transition-colors"
              >
                {loading ? 'Creating Account...' : 'Create Account'}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-text-light">
                  Already have an account?
                </span>
              </div>
            </div>

            <div className="mt-6">
              <Link
                to="/login"
                className="w-full flex justify-center py-3 px-4 border-2 border-primary rounded-lg shadow-sm text-base font-semibold text-primary bg-white hover:bg-light-mint focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
              >
                Sign In Instead
              </Link>
            </div>
          </div>
        </div>
      </div>

      <Modal
        isOpen={isOtpModalOpen}
        onClose={() => setIsOtpModalOpen(false)}
        title="Verify WhatsApp Number"
        size="small"
      >
        <div className="space-y-5">
          <p className="text-sm text-gray-600">
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
                className="w-11 h-12 text-center text-lg font-bold border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
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
