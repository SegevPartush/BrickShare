import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext';

const QUICK_ACTIONS = [
  'מה הסט הכי חדש של Star Wars?',
  'כמה שווה Millennium Falcon UCS?',
  'תמליץ לי על סטים עד 200$',
  'מה ההבדל בין Technic ל-Creator?',
];

const WELCOME_MESSAGE: Message = {
  role: 'assistant',
  content: 'היי! אני עוזר ה-LEGO של BrickShare 🧱\n\nאני יכול לעזור עם:\n• מידע על סטים חדשים ונדירים\n• הערכת מחירי שוק\n• המלצות מותאמות לתקציב\n• שאלות כלליות על LEGO\n\nמה תרצה לדעת?',
};

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="bg-[#16181c] border border-[#2f3336] rounded-2xl px-4 py-3">
        <div className="flex gap-1 items-center h-4">
          {[0, 150, 300].map((delay) => (
            <div key={delay} className="w-2 h-2 bg-[#1d9bf0] rounded-full animate-bounce" style={{ animationDelay: `${delay}ms` }} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function AIChatWidget() {
  const { accessToken } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  async function sendMessage(text?: string) {
    const userMessage = (text || input).trim();
    if (!userMessage || loading) return;

    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const res = await fetch('/api/ai/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({ message: userMessage }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessages((prev) => [...prev, { role: 'assistant', content: data.response }]);
      } else if (res.status === 401) {
        setMessages((prev) => [...prev, { role: 'assistant', content: 'כדי לשאול שאלות נא להתחבר לחשבון תחילה.' }]);
      } else {
        setMessages((prev) => [...prev, { role: 'assistant', content: data.message || 'מצטער, נתקלתי בשגיאה.' }]);
      }
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', content: 'שגיאת תקשורת. בדוק את החיבור לאינטרנט.' }]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  const showQuickActions = messages.length <= 1 && !loading;

  return (
    <>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          aria-label="פתח עוזר AI"
          className="fixed bottom-6 right-6 w-14 h-14 rounded-full text-white shadow-lg hover:shadow-xl transition-all hover:scale-110 z-50 flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #1d9bf0 0%, #38bdf8 100%)' }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
          </svg>
        </button>
      )}

      <div
        className={`fixed bottom-24 right-6 w-[380px] bg-black border border-[#2f3336] rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden
          transition-all duration-200 ease-out origin-bottom-right
          ${isOpen ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none'}`}
        style={{ height: '560px' }}
      >
        <div className="p-4 flex items-center gap-3 flex-shrink-0" style={{ background: 'linear-gradient(135deg, #1d9bf0 0%, #38bdf8 100%)' }}>
          <div className="w-9 h-9 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
              <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
            </svg>
          </div>
          <div className="flex-1">
            <div className="font-bold text-white text-sm">LEGO Assistant</div>
            <div className="text-xs text-white/75">מופעל ע"י Gemini AI</div>
          </div>
          <div className="w-2 h-2 bg-green-400 rounded-full mr-1" />
          <button onClick={() => setIsOpen(false)} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3" dir="rtl">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-start' : 'justify-end'}`}>
              <div
                className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap leading-relaxed ${
                  msg.role === 'user' ? 'text-white' : 'bg-[#16181c] text-[#e7e9ea] border border-[#2f3336]'
                }`}
                style={msg.role === 'user' ? { background: 'linear-gradient(135deg, #1d9bf0 0%, #38bdf8 100%)' } : {}}
              >
                {msg.content}
              </div>
            </div>
          ))}
          {loading && <TypingIndicator />}
          <div ref={bottomRef} />
        </div>

        {showQuickActions && (
          <div className="px-4 pb-3 space-y-1 flex-shrink-0" dir="rtl">
            <div className="text-xs text-[#71767b] mb-1">שאלות מהירות:</div>
            {QUICK_ACTIONS.map((action) => (
              <button key={action} onClick={() => sendMessage(action)} className="w-full text-right text-xs text-[#1d9bf0] hover:bg-[#1d9bf0]/10 px-3 py-2 rounded-lg transition-colors border border-[#2f3336]">
                {action}
              </button>
            ))}
          </div>
        )}

        <div className="p-3 border-t border-[#2f3336] flex-shrink-0" dir="rtl">
          <div className="flex gap-2 items-center">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="שאל משהו על LEGO..."
              disabled={loading}
              className="flex-1 bg-[#16181c] border border-[#2f3336] rounded-full px-4 py-2 text-sm text-[#e7e9ea] placeholder-[#71767b] outline-none focus:border-[#1d9bf0] transition-colors"
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || loading}
              className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 disabled:opacity-40 hover:scale-105 transition-transform"
              style={{ background: 'linear-gradient(135deg, #1d9bf0 0%, #38bdf8 100%)' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" /></svg>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
