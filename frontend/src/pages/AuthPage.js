import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

function SectionTitle({ children }) {
  return <div className="text-subtitle font-semibold">{children}</div>;
}

export default function AuthPage() {
  const navigate = useNavigate();
  const { register, login } = useAuth();

  const [reg, setReg] = useState({
    username: '',
    email: '',
    password: ''
  });
  const [loginForm, setLoginForm] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function onRegister() {
    setBusy(true);
    setError('');
    try {
      await register(reg);
      navigate('/feed');
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || 'Registration failed');
    } finally {
      setBusy(false);
    }
  }

  async function onLogin() {
    setBusy(true);
    setError('');
    try {
      await login(loginForm);
      navigate('/feed');
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || 'Login failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-bg text-fg flex items-center justify-center px-24 py-40">
      <div className="w-full max-w-[1040px] grid grid-cols-1 md:grid-cols-2 gap-24">
        <div className="rounded-lg border border-border bg-bg p-24">
          <div className="text-title font-semibold">Welcome back</div>
          <div className="text-body text-muted mt-4">Sign in to continue your BrickShare feed.</div>

          <div className="mt-20 space-y-16">
            <SectionTitle>Login</SectionTitle>
            <Input
              label="Email"
              type="email"
              value={loginForm.email}
              onChange={(e) => setLoginForm((s) => ({ ...s, email: e.target.value }))}
              placeholder="john@example.com"
            />
            <Input
              label="Password"
              type="password"
              value={loginForm.password}
              onChange={(e) => setLoginForm((s) => ({ ...s, password: e.target.value }))}
              placeholder="••••••"
            />
            <Button variant="primary" className="w-full" onClick={onLogin} disabled={busy}>
              {busy ? 'Signing in...' : 'Sign in'}
            </Button>
          </div>

          {error ? <div className="mt-16 text-caption text-red-400">{error}</div> : null}

          <div className="mt-22 pt-18 border-t border-border">
            <SectionTitle>Or continue with</SectionTitle>
            <div className="mt-14 flex flex-col sm:flex-row gap-12">
              <Button
                variant="secondary"
                className="w-full"
                onClick={() => {
                  window.location.href = '/api/auth/google';
                }}
              >
                Continue with Google
              </Button>
              <Button
                variant="secondary"
                className="w-full"
                onClick={() => {
                  window.location.href = '/api/auth/facebook';
                }}
              >
                Continue with Facebook
              </Button>
            </div>
            <div className="text-caption text-muted mt-14">OAuth will redirect back to this app.</div>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-bg p-24">
          <div className="text-title font-semibold">Start building</div>
          <div className="text-body text-muted mt-4">Create an account and share LEGO builds.</div>

          <div className="mt-20 space-y-16">
            <SectionTitle>Register</SectionTitle>
            <Input
              label="Username"
              value={reg.username}
              onChange={(e) => setReg((s) => ({ ...s, username: e.target.value }))}
              placeholder="johndoe"
            />
            <Input
              label="Email"
              type="email"
              value={reg.email}
              onChange={(e) => setReg((s) => ({ ...s, email: e.target.value }))}
              placeholder="john@example.com"
            />
            <Input
              label="Password"
              type="password"
              value={reg.password}
              onChange={(e) => setReg((s) => ({ ...s, password: e.target.value }))}
              placeholder="At least 6 characters"
            />
            <Button variant="primary" className="w-full" onClick={onRegister} disabled={busy}>
              {busy ? 'Creating...' : 'Create account'}
            </Button>
          </div>

          <div className="mt-22 pt-18 border-t border-border">
            <div className="text-caption text-muted">
              Tip: if you only need to test the app locally, you can skip OAuth and use email/password.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

