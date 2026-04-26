import React, { useEffect, useRef, useState } from 'react';
import ShellLayout from '../components/layout/ShellLayout';
import Avatar from '../components/ui/Avatar';
import { useAuth } from '../context/AuthContext';
import * as api from '../services/api';

interface Message {
  id: string;
  text: string;
  senderId: string;
  timestamp: string;
}

interface Conversation {
  userId: string;
  username: string;
  email: string;
  profileImage?: string;
  lastMessage: string;
  unread: number;
  messages: Message[];
}

// שמירה וטעינה של שיחות מ-localStorage
const STORAGE_KEY = 'brickshare_messages';

function loadConversations(): Record<string, Conversation> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveConversations(convs: Record<string, Conversation>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(convs));
}

export default function MessagesPage() {
  const { user, accessToken } = useAuth();
  const currentUserId = user?.id || user?._id || '';

  // רשימת שיחות ומשתמש פתוח
  const [conversations, setConversations] = useState<Record<string, Conversation>>(loadConversations);
  const [activeUserId, setActiveUserId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const [showNewChat, setShowNewChat] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // גלילה לתחתית הצ'אט
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeUserId, conversations]);

  // טעינת משתמשים ליצירת שיחה חדשה
  useEffect(() => {
    api.getSuggestedUsers({ accessToken, limit: 20 })
      .then(setUsers)
      .catch(() => setUsers([]));
  }, [accessToken]);

  // שמירה כל שינוי
  useEffect(() => {
    saveConversations(conversations);
  }, [conversations]);

  const activeConv = activeUserId ? conversations[activeUserId] : null;
  const convList = Object.values(conversations);

  // שליחת הודעה
  function handleSend() {
    if (!newMessage.trim() || !activeUserId || !currentUserId) return;

    const msg: Message = {
      id: Date.now().toString(),
      text: newMessage.trim(),
      senderId: currentUserId,
      timestamp: new Date().toISOString(),
    };

    setConversations(prev => {
      const conv = prev[activeUserId];
      const updated = {
        ...conv,
        messages: [...(conv?.messages || []), msg],
        lastMessage: msg.text,
        unread: 0,
      };
      return { ...prev, [activeUserId]: updated };
    });

    setNewMessage('');
  }

  // התחלת שיחה חדשה עם משתמש
  function startConversation(u: any) {
    const uid = u.id || u._id;
    if (!conversations[uid]) {
      setConversations(prev => ({
        ...prev,
        [uid]: {
          userId: uid,
          username: u.username || u.email || 'משתמש',
          email: u.email || '',
          profileImage: u.profileImage,
          lastMessage: '',
          unread: 0,
          messages: [],
        },
      }));
    }
    setActiveUserId(uid);
    setShowNewChat(false);
  }

  // פורמט שעה קצר
  function fmtTime(iso: string) {
    return new Date(iso).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
  }

  // אם לא מחובר
  if (!user) {
    return (
      <ShellLayout title="הודעות">
        <div className="flex flex-col items-center justify-center h-64 text-[#71767b]">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mb-4">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          <div className="text-[17px] font-bold text-white mb-2">כניסה נדרשת</div>
          <div className="text-[15px] mb-4">התחבר כדי לשלוח הודעות פרטיות</div>
          <button
            onClick={() => { window.location.href = '/login'; }}
            className="px-6 py-2 bg-gradient-to-r from-[#1d9bf0] to-[#38bdf8] text-white font-bold rounded-full"
          >
            התחבר
          </button>
        </div>
      </ShellLayout>
    );
  }

  return (
    <ShellLayout title="הודעות">
      <div className="flex h-[calc(100vh-65px)] overflow-hidden">

        {/* עמודת שיחות - שמאל */}
        <div className={`w-full md:w-[350px] border-l border-[#2f3336] flex flex-col shrink-0 ${activeConv ? 'hidden md:flex' : 'flex'}`}>

          {/* הדר */}
          <div className="sticky top-0 bg-black/85 backdrop-blur-xl border-b border-[#2f3336] px-4 py-3 z-10 flex items-center justify-between">
            <div className="font-extrabold text-[20px]">הודעות</div>
            <button
              onClick={() => setShowNewChat(true)}
              className="w-9 h-9 rounded-full flex items-center justify-center text-[#1d9bf0] hover:bg-[#1d9bf0]/10 transition-colors"
              title="שיחה חדשה"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 5v14M5 12h14" />
              </svg>
            </button>
          </div>

          {/* חיפוש שיחה */}
          <div className="px-4 py-2 border-b border-[#2f3336]">
            <div className="bg-[#202327] rounded-full px-4 py-2 flex items-center gap-2 text-[#71767b]">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <span className="text-[14px]">חפש הודעות</span>
            </div>
          </div>

          {/* רשימת שיחות */}
          <div className="flex-1 overflow-y-auto">
            {convList.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-[#71767b] p-8 text-center">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mb-3">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                <div className="text-[17px] font-bold text-white mb-1">אין שיחות עדיין</div>
                <div className="text-[14px]">לחץ על + כדי להתחיל שיחה חדשה</div>
              </div>
            ) : (
              convList.map(conv => (
                <button
                  key={conv.userId}
                  onClick={() => setActiveUserId(conv.userId)}
                  className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-white/[0.03] border-b border-[#2f3336] transition-colors text-right ${activeUserId === conv.userId ? 'bg-white/[0.05]' : ''}`}
                >
                  <Avatar name={conv.username} imageUrl={conv.profileImage} size={44} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[15px] truncate">{conv.username}</span>
                      {conv.messages.length > 0 && (
                        <span className="text-[12px] text-[#71767b] shrink-0 mr-2">
                          {fmtTime(conv.messages[conv.messages.length - 1].timestamp)}
                        </span>
                      )}
                    </div>
                    <div className="text-[13px] text-[#71767b] truncate mt-0.5">
                      {conv.lastMessage || 'התחל שיחה...'}
                    </div>
                  </div>
                  {conv.unread > 0 && (
                    <div className="w-5 h-5 rounded-full bg-[#1d9bf0] text-white text-[11px] flex items-center justify-center shrink-0">
                      {conv.unread}
                    </div>
                  )}
                </button>
              ))
            )}
          </div>
        </div>

        {/* אזור הצ'אט - ימין */}
        {activeConv ? (
          <div className="flex-1 flex flex-col min-w-0 min-h-0">
            {/* הדר הצ'אט */}
            <div className="sticky top-0 bg-black/85 backdrop-blur-xl border-b border-[#2f3336] px-4 sm:px-5 py-3 z-10 flex items-center gap-3">
              {/* כפתור חזרה במובייל */}
              <button
                onClick={() => setActiveUserId(null)}
                className="md:hidden w-9 h-9 rounded-full flex items-center justify-center text-[#1d9bf0] hover:bg-[#1d9bf0]/10 transition-colors"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 12H5M12 5l-7 7 7 7" />
                </svg>
              </button>
              <Avatar name={activeConv.username} imageUrl={activeConv.profileImage} size={36} />
              <div>
                <div className="font-bold text-[15px]">{activeConv.username}</div>
                <div className="text-[12px] text-[#71767b]">{activeConv.email}</div>
              </div>
            </div>

            {/* הודעות — dir=ltr כדי שבועות "שלי" יישבו בצד ימין (עקבי בכל הדפדפנים) */}
            <div
              className="flex-1 overflow-y-auto min-h-0 px-3 sm:px-5 md:px-6 py-4 sm:py-5 space-y-3.5 bg-gradient-to-b from-[#0c1014] to-black/30"
              dir="ltr"
            >
              {activeConv.messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center min-h-[200px] text-[#71767b] text-center">
                  <Avatar name={activeConv.username} imageUrl={activeConv.profileImage} size={72} />
                  <div className="mt-3 font-bold text-[20px] text-white">{activeConv.username}</div>
                  <div className="mt-1 text-[15px]">התחל שיחה עם {activeConv.username}</div>
                </div>
              ) : (
                activeConv.messages.map(msg => {
                  const isMe = msg.senderId === currentUserId;
                  return (
                    <div key={msg.id} className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div
                        dir="auto"
                        className={`
                          w-fit max-w-[min(90%,20rem)]
                          min-w-[4.5rem] sm:min-w-[5.5rem]
                          px-4 py-3 rounded-2xl text-base leading-relaxed
                          break-words shadow-md
                          ${isMe
                            ? 'bg-gradient-to-br from-[#1d9bf0] to-[#38bdf8] text-white rounded-br-md shadow-sky-500/15'
                            : 'bg-[#202327] text-white border border-[#2f3336] rounded-bl-md'
                          }
                        `}
                      >
                        <p className="m-0 pr-0.5">{msg.text}</p>
                        <div
                          className={`text-[11px] tabular-nums mt-1.5 ${isMe ? 'text-white/80' : 'text-[#71767b]'}`}
                        >
                          {fmtTime(msg.timestamp)}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} className="h-2" />
            </div>

            {/* שורת כתיבה — יישור מרווחים ממורד כן כפתור AI צף (ימין) */}
            <div className="border-t border-[#2f3336] bg-black/50 backdrop-blur-sm pl-3 sm:pl-4 py-3 pb-4 sm:pb-3 pr-16 sm:pr-20">
              <div className="flex items-center gap-2 sm:gap-3">
                <input
                  type="text"
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSend()}
                  placeholder="כתוב הודעה..."
                  className="flex-1 bg-[#202327] border border-[#2f3336] rounded-full px-4 py-2.5 text-[15px] outline-none focus:border-[#1d9bf0] transition-colors text-white placeholder-[#71767b]"
                  dir="auto"
                />
                <button
                  onClick={handleSend}
                  disabled={!newMessage.trim()}
                  className="w-10 h-10 rounded-full bg-gradient-to-r from-[#1d9bf0] to-[#38bdf8] flex items-center justify-center disabled:opacity-40 hover:shadow-lg transition-all shrink-0"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* מסך ריק */
          <div className="hidden md:flex flex-1 flex-col items-center justify-center text-[#71767b]">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="mb-4">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <div className="text-[22px] font-bold text-white mb-2">ההודעות שלך</div>
            <div className="text-[15px] mb-6">שלח הודעה פרטית לאספנים אחרים</div>
            <button
              onClick={() => setShowNewChat(true)}
              className="px-5 py-2.5 bg-gradient-to-r from-[#1d9bf0] to-[#38bdf8] text-white font-bold rounded-full hover:shadow-lg transition-all"
            >
              שיחה חדשה
            </button>
          </div>
        )}
      </div>

      {/* מודאל - שיחה חדשה */}
      {showNewChat && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-16">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowNewChat(false)} />
          <div className="relative w-full max-w-[560px] mx-4 bg-[#000] border border-[#2f3336] rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center gap-4 px-4 py-3 border-b border-[#2f3336]">
              <button onClick={() => setShowNewChat(false)} className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-white/10">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
              <div className="font-extrabold text-[20px]">הודעה חדשה</div>
            </div>

            <div className="max-h-[60vh] overflow-y-auto">
              {users.length === 0 ? (
                <div className="p-8 text-center text-[#71767b]">טוען משתמשים...</div>
              ) : (
                users.map(u => {
                  const uid = u.id || u._id;
                  const name = u.username || u.email || 'משתמש';
                  return (
                    <button
                      key={uid}
                      onClick={() => startConversation(u)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/[0.03] border-b border-[#2f3336] transition-colors"
                    >
                      <Avatar name={name} imageUrl={u.profileImage} size={44} />
                      <div className="text-right">
                        <div className="font-bold text-[15px]">{name}</div>
                        <div className="text-[13px] text-[#71767b]">{u.email}</div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </ShellLayout>
  );
}
