import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Loader, ChefHat, Sparkles } from 'lucide-react';

const EmailVerificationPage: React.FC = () => {
  const [verificationStatus, setVerificationStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const BASE_URL = import.meta.env.VITE_API_URL


  

  useEffect(() => {
    const verifyEmail = async () => {
      // Get the token from URL parameters
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get('token');

      if (!token) {
        setVerificationStatus('error');
        setErrorMessage('No verification token found in the URL.');
        return;
      }

      try {
        // Send POST request to verify email endpoint with token as query parameter
        const response = await fetch(`${BASE_URL}/auth/verify-email?token=${encodeURIComponent(token)}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        const data = await response.json();

        if (response.ok) {
          setVerificationStatus('success');
        } else {
          setVerificationStatus('error');
          setErrorMessage(data.detail || 'Email verification failed. Please try again.');
        }
      } catch (error) {
        setVerificationStatus('error');
        setErrorMessage('Network error. Please check your connection and try again.');
      }
    };

    verifyEmail();
  }, []);

  const handleRedirectToLogin = () => {
    // Redirect to your login page
    window.location.href = '/auth'; // Adjust this to your actual login page URL
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-20 w-72 h-72 bg-green-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
        <div className="absolute top-40 right-20 w-72 h-72 bg-green-400 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-80 w-72 h-72 bg-green-600 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-4000"></div>
      </div>

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

        {/* Verification Card */}
        <div className="bg-gray-900/80 backdrop-blur-sm border border-gray-800 rounded-2xl p-8 shadow-2xl">
          <div className="text-center">
            {verificationStatus === 'loading' && (
              <>
                <div className="flex justify-center mb-6">
                  <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center">
                    <Loader className="w-8 h-8 text-blue-400 animate-spin" />
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-white mb-4">
                  Verifying Your Email
                </h2>
                <p className="text-gray-300 mb-6">
                  Please wait while we verify your email address...
                </p>
              </>
            )}

            {verificationStatus === 'success' && (
              <>
                <div className="flex justify-center mb-6">
                  <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-8 h-8 text-green-400" />
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-white mb-4">
                  Email Verified Successfully!
                </h2>
                <p className="text-gray-300 mb-6">
                  Your email has been verified. You can now sign in to your account and start using Food AI Assistant.
                </p>
                <button
                  onClick={handleRedirectToLogin}
                  className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-[1.02] shadow-lg hover:shadow-green-500/25"
                >
                  Go to Sign In
                </button>
              </>
            )}

            {verificationStatus === 'error' && (
              <>
                <div className="flex justify-center mb-6">
                  <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center">
                    <XCircle className="w-8 h-8 text-red-400" />
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-white mb-4">
                  Verification Failed
                </h2>
                <p className="text-gray-300 mb-6">
                  {errorMessage}
                </p>
                <div className="space-y-3">
                  <button
                    onClick={() => window.location.reload()}
                    className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-[1.02] shadow-lg hover:shadow-blue-500/25"
                  >
                    Try Again
                  </button>
                  <button
                    onClick={handleRedirectToLogin}
                    className="w-full bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-[1.02]"
                  >
                    Back to Sign In
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Additional Help */}
        <div className="mt-6 text-center">
          <p className="text-gray-500 text-sm">
            Need help? Contact our{' '}
            <a href="#" className="text-green-400 hover:text-green-300 transition-colors">
              support team
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default EmailVerificationPage;