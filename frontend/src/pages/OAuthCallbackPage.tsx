import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function OAuthCallbackPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setOAuthTokens } = useAuth();
  const [error, setError] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const accessToken = params.get('accessToken') || '';
    const refreshToken = params.get('refreshToken') || '';
    const userId = params.get('userId') || '';
    const oauthError = params.get('error');

    if (oauthError || !accessToken) {
      setError('OAuth failed. Please try again.');
      return;
    }

    setOAuthTokens({ accessToken, refreshToken, userId });
    navigate('/feed', { replace: true });
  }, [location.search, navigate, setOAuthTokens]);

  return (
    <div className="min-h-screen bg-bg text-fg flex items-center justify-center px-24 py-40">
      <div className="w-full max-w-[520px] rounded-lg border border-border bg-bg p-24">
        <div className="text-title font-semibold">Signing you in...</div>
        <div className="text-body text-muted mt-4">Please wait.</div>
        {error && <div className="mt-16 text-caption text-red-400">{error}</div>}
        {error && (
          <button className="mt-20 w-full rounded-lg border border-border py-8 text-body hover:bg-white/5" onClick={() => navigate('/login')}>
            Back to login
          </button>
        )}
      </div>
    </div>
  );
}
