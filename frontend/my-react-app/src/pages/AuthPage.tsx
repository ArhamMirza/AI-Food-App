import React, { useState } from 'react';
import { Eye, EyeOff, Mail, Lock, User, ChefHat, Sparkles, X, CheckCircle } from 'lucide-react';

interface FormData {
  username?: string;
  email: string;
  password: string;
  confirmPassword?: string;
}

interface FormErrors {
  username?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  general?: string;
}

const AuthPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showEmailVerificationPopup, setShowEmailVerificationPopup] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    username: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState<FormErrors>({});

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    // Signup specific validations
    if (!isLogin) {
      if (!formData.username) {
        newErrors.username = 'Username is required';
      } else if (formData.username.length < 3) {
        newErrors.username = 'Username must be at least 3 characters';
      }

      if (!formData.confirmPassword) {
        newErrors.confirmPassword = 'Please confirm your password';
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    setErrors({});

    try {
      const endpoint = isLogin ? 'http://localhost:8000/api/v1/auth/login' : 'http://localhost:8000/api/v1/auth/signup';
      const payload = isLogin 
        ? { email: formData.email, password: formData.password }
        : { 
            username: formData.username, 
            email: formData.email, 
            password: formData.password 
          };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        if (isLogin) {
          // Store tokens and redirect
          localStorage.setItem('access_token', data.access_token);
          localStorage.setItem('refresh_token', data.refresh_token);
          console.log('Login successful!');
        } else {
          // Show email verification popup
          setShowEmailVerificationPopup(true);
          // Reset form
          setFormData({
            email: '',
            password: '',
            username: '',
            confirmPassword: ''
          });
        }
      } else {
        setErrors({ general: data.detail || 'An error occurred' });
      }
    } catch (error) {
      setErrors({ general: 'Network error. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setIsLoading(true);
    try {
      // This would integrate with Google OAuth
      console.log('Google authentication would be triggered here');
    } catch (error) {
      setErrors({ general: 'Google authentication failed' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const closeEmailVerificationPopup = () => {
    setShowEmailVerificationPopup(false);
    setIsLogin(true); // Switch to login mode after closing popup
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-20 w-72 h-72 bg-green-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
        <div className="absolute top-40 right-20 w-72 h-72 bg-green-400 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-80 w-72 h-72 bg-green-600 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-4000"></div>
      </div>

      {/* Email Verification Popup */}
      {showEmailVerificationPopup && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-8 max-w-md w-full relative animate-in fade-in zoom-in duration-300">
            {/* Close button */}
            <button
              onClick={closeEmailVerificationPopup}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Success icon */}
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>
            </div>

            {/* Content */}
            <div className="text-center">
              <h3 className="text-2xl font-bold text-white mb-4">
                Check Your Email
              </h3>
              <p className="text-gray-300 mb-6 leading-relaxed">
                We've sent a verification link to <span className="text-green-400 font-medium">{formData.email}</span>. 
                Please check your email and click the verification link to activate your account.
              </p>
              
              {/* Additional info */}
              <div className="bg-gray-800/50 rounded-lg p-4 mb-6">
                <p className="text-gray-400 text-sm">
                  <strong className="text-gray-300">Didn't receive the email?</strong><br />
                  Check your spam folder or contact support if you need help.
                </p>
              </div>

              {/* Action button */}
              <button
                onClick={closeEmailVerificationPopup}
                className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-[1.02] shadow-lg hover:shadow-green-500/25"
              >
                Got it, thanks!
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="relative z-10 w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="relative">
              <ChefHat className="w-12 h-12 text-green-400" />
              <Sparkles className="w-6 h-6 text-green-300 absolute -top-1 -right-1 animate-pulse" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Food AI Assistant
          </h1>
        </div>

        {/* Main Form Card */}
        <div className="bg-gray-900/80 backdrop-blur-sm border border-gray-800 rounded-2xl p-8 shadow-2xl">
          {/* Form Title */}
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-white">
              {isLogin ? 'Sign In' : 'Create Account'}
            </h2>
            <p className="text-gray-400 mt-2">
              {isLogin 
                ? 'Welcome back! Enter your credentials to continue' 
                : 'Join us and start your culinary journey'
              }
            </p>
          </div>

          {/* Form */}
          <div className="space-y-6">
            {/* Username field (signup only) */}
            {!isLogin && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">
                  Username
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    name="username"
                    value={formData.username || ''}
                    onChange={handleInputChange}
                    className={`w-full pl-10 pr-4 py-3 bg-gray-800 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 transition-all duration-200 ${
                      errors.username
                        ? 'border-red-500 focus:ring-red-500'
                        : 'border-gray-700 focus:ring-green-500 focus:border-green-500'
                    }`}
                    placeholder="Enter your username"
                  />
                </div>
                {errors.username && (
                  <p className="text-red-400 text-sm">{errors.username}</p>
                )}
              </div>
            )}

            {/* Email field */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`w-full pl-10 pr-4 py-3 bg-gray-800 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 transition-all duration-200 ${
                    errors.email
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-gray-700 focus:ring-green-500 focus:border-green-500'
                  }`}
                  placeholder="Enter your email"
                />
              </div>
              {errors.email && (
                <p className="text-red-400 text-sm">{errors.email}</p>
              )}
            </div>

            {/* Password field */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className={`w-full pl-10 pr-12 py-3 bg-gray-800 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 transition-all duration-200 ${
                    errors.password
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-gray-700 focus:ring-green-500 focus:border-green-500'
                  }`}
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-400 text-sm">{errors.password}</p>
              )}
            </div>

            {/* Confirm Password field (signup only) */}
            {!isLogin && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={formData.confirmPassword || ''}
                    onChange={handleInputChange}
                    className={`w-full pl-10 pr-12 py-3 bg-gray-800 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 transition-all duration-200 ${
                      errors.confirmPassword
                        ? 'border-red-500 focus:ring-red-500'
                        : 'border-gray-700 focus:ring-green-500 focus:border-green-500'
                    }`}
                    placeholder="Confirm your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-white transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-red-400 text-sm">{errors.confirmPassword}</p>
                )}
              </div>
            )}

            {/* General error */}
            {errors.general && (
              <div className="bg-red-900/50 border border-red-500 rounded-lg p-3">
                <p className="text-red-400 text-sm">{errors.general}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg hover:shadow-green-500/25"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Processing...
                </div>
              ) : (
                isLogin ? 'Sign In' : 'Create Account'
              )}
            </button>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-700"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-gray-900 text-gray-400">Or continue with</span>
              </div>
            </div>

            {/* Google Sign In */}
            <button
              type="button"
              onClick={handleGoogleAuth}
              disabled={isLoading}
              className="w-full bg-white hover:bg-gray-50 text-gray-900 font-semibold py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg flex items-center justify-center"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>
          </div>

          {/* Toggle link */}
          <div className="mt-6 text-center">
            <p className="text-gray-400">
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="text-green-400 hover:text-green-300 font-medium transition-colors"
              >
                {isLogin ? "Sign up here" : "Sign in here"}
              </button>
            </p>
          </div>

          {/* Footer */}
          {isLogin && (
            <div className="mt-4 text-center">
              <a href="#" className="text-green-400 hover:text-green-300 text-sm transition-colors">
                Forgot your password?
              </a>
            </div>
          )}
        </div>

        {/* Terms */}
        <p className="text-center text-gray-500 text-xs mt-6">
          By {isLogin ? 'signing in' : 'creating an account'}, you agree to our{' '}
          <a href="#" className="text-green-400 hover:text-green-300 transition-colors">
            Terms of Service
          </a>{' '}
          and{' '}
          <a href="#" className="text-green-400 hover:text-green-300 transition-colors">
            Privacy Policy
          </a>
        </p>
      </div>
    </div>
  );
};

export default AuthPage;