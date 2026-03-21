import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function BrandPanel() {
  return (
    <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative overflow-hidden flex-shrink-0"
      style={{ background: 'linear-gradient(150deg, #0f1117 0%, #0d1f33 50%, #0a1628 100%)' }}>
      <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, #1d9bf0 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
      <div className="relative z-10 flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #1d9bf0 0%, #38bdf8 100%)' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="white"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>
        </div>
        <span className="text-2xl font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif", background: 'linear-gradient(135deg, #1d9bf0 0%, #38bdf8 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>BrickShare</span>
      </div>
      <div className="relative z-10 flex-1 flex flex-col justify-center py-12">
        <h1 className="text-4xl font-bold text-white leading-tight mb-4">
          Share Your Passion,<br />
          <span style={{ background: 'linear-gradient(135deg, #1d9bf0 0%, #38bdf8 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Brick by Brick.</span>
        </h1>
        <p className="text-[#8b9ab0] text-lg leading-relaxed max-w-sm">הצטרף לקהילת אספני LEGO. שתף בניות, גלה סטים נדירים וחבר עם אספנים מרחבי העולם.</p>
        <div className="mt-10 space-y-4">
          {[{ icon: '🧱', text: 'שתף בניות ואוספים' }, { icon: '💰', text: 'עקוב אחרי מחירי שוק' }, { icon: '🤖', text: 'עוזר AI מומחה LEGO' }].map(({ icon, text }) => (
            <div key={text} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">{icon}</div>
              <span className="text-[#a0b0c0] text-sm">{text}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="relative z-10 bg-white/5 border border-white/10 rounded-2xl p-5">
        <p className="text-[#c0d0e0] text-sm leading-relaxed">"הפלטפורמה הכי טובה לאספני LEGO – מצאתי סטים נדירים שחיפשתי שנים."</p>
        <div className="flex items-center gap-2 mt-3">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#1d9bf0] to-[#38bdf8] flex items-center justify-center text-xs font-bold text-white">י</div>
          <span className="text-[#8b9ab0] text-xs">יוסי כהן · אספן מאז 2015</span>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [rememberMe, setRememberMe] = useState(true);
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  function handleOAuth(provider: string) {
    window.location.href = `http://localhost:3001/api/auth/${provider}`;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.email || !form.password) { setError('נא למלא את כל השדות'); return; }
    setBusy(true);
    setError('');
    try {
      await login(form);
      navigate('/feed');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'אימייל או סיסמא שגויים');
    } finally {
      setBusy(false);
    }
  }

  const inputCls = 'w-full bg-[#16181c] border border-[#2f3336] rounded-xl px-4 py-3 text-sm text-white placeholder-[#71767b] outline-none focus:border-[#1d9bf0] transition-colors';

  return (
    <div className="min-h-screen bg-black flex">
      <BrandPanel />
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-[420px]">
          <h2 className="text-2xl font-bold text-white mb-1">ברוך הבא חזרה 👋</h2>
          <p className="text-[#71767b] text-sm mb-8">התחבר כדי להמשיך לפיד שלך</p>

          <div className="space-y-3 mb-6">
            <button type="button" onClick={() => handleOAuth('google')} className="w-full flex items-center justify-center gap-3 py-3 rounded-xl border border-[#2f3336] bg-[#16181c] text-white text-sm font-medium hover:bg-[#1e2126] transition-colors">
              <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
              המשך עם Google
            </button>
            <button type="button" onClick={() => handleOAuth('facebook')} className="w-full flex items-center justify-center gap-3 py-3 rounded-xl border border-[#2f3336] bg-[#16181c] text-white text-sm font-medium hover:bg-[#1e2126] transition-colors">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#1877F2"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              המשך עם Facebook
            </button>
          </div>

          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-[#2f3336]" /><span className="text-[#71767b] text-xs">או התחבר עם אימייל</span><div className="flex-1 h-px bg-[#2f3336]" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[#a0a8b4] mb-1.5">כתובת אימייל</label>
              <input type="email" value={form.email} onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))} placeholder="you@example.com" className={inputCls} dir="ltr" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-[#a0a8b4]">סיסמא</label>
                <button type="button" className="text-xs text-[#1d9bf0] hover:underline">שכחתי סיסמא</button>
              </div>
              <div className="relative">
                <input type={showPass ? 'text' : 'password'} value={form.password} onChange={(e) => setForm((s) => ({ ...s, password: e.target.value }))} placeholder="לפחות 6 תווים" className={`${inputCls} pr-12`} dir="ltr" />
                <button type="button" onClick={() => setShowPass((v) => !v)} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#71767b] hover:text-white">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d={showPass ? "M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19M1 1l22 22" : "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"}/>{!showPass && <circle cx="12" cy="12" r="3"/>}</svg>
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setRememberMe((v) => !v)} className={`w-4 h-4 rounded flex items-center justify-center border transition-colors ${rememberMe ? 'bg-[#1d9bf0] border-[#1d9bf0]' : 'border-[#2f3336]'}`}>
                {rememberMe && <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="white" strokeWidth="2"><polyline points="2,6 5,9 10,3"/></svg>}
              </button>
              <span className="text-xs text-[#a0a8b4]">זכור אותי במכשיר זה</span>
            </div>

            {error && <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-xs">{error}</div>}

            <button type="submit" disabled={busy} className="w-full py-3 rounded-xl text-white font-semibold text-sm disabled:opacity-60 hover:opacity-90 active:scale-[0.98] transition-all" style={{ background: 'linear-gradient(135deg, #1d9bf0 0%, #38bdf8 100%)' }}>
              {busy ? 'מתחבר...' : 'התחבר'}
            </button>
          </form>

          <p className="text-center text-xs text-[#71767b] mt-6">
            אין לך חשבון? <Link to="/register" className="text-[#1d9bf0] hover:underline font-medium">הרשם עכשיו</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
