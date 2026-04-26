import React, { useState } from 'react';
import Avatar from '../ui/Avatar';
import { useAuth } from '../../context/AuthContext';
import * as api from '../../services/api';

const LEGO_THEMES = [
  'Star Wars', 'Technic', 'City', 'Creator', 'Architecture',
  'Icons', 'Harry Potter', 'Marvel', 'Ninjago', 'Speed Champions',
  'Ideas', 'Botanical Collection', 'Art', 'Other',
];

interface Props {
  onClose: () => void;
  onCreated: () => void;
}

export default function CreateBuildModal({ onClose, onCreated }: Props) {
  const { user, accessToken } = useAuth();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [theme, setTheme] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] || null;
    setImage(file);
    if (file) {
      const url = URL.createObjectURL(file);
      setPreview(url);
    } else {
      setPreview(null);
    }
  }

  async function handleSubmit() {
    if (!accessToken) return;
    const t = title.trim();
    const d = description.trim();
    if (!t && !d && !image) return;
    setBusy(true);
    setError('');
    try {
      const fullText = t ? `${t}\n\n${d}` : d;
      await api.createPost({ accessToken, text: fullText, imageFile: image });
      onCreated();
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to share build. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  const canSubmit = Boolean(
    (title.trim() || description.trim() || image) && !busy && accessToken
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-8 px-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-[560px] bg-[#16181c] border border-[#2f3336] rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#2f3336]">
          <button onClick={onClose} className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors text-white">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
          <div className="font-extrabold text-[17px] text-white">Share a Build</div>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="px-4 py-1.5 rounded-full text-[15px] font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={canSubmit ? { background: 'linear-gradient(135deg, #1d9bf0, #38bdf8)', color: 'white' } : { background: '#2f3336', color: '#71767b' }}
          >
            {busy ? 'Posting...' : 'Post'}
          </button>
        </div>

        <div className="px-4 py-4 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* User info */}
          {user && (
            <div className="flex items-center gap-3">
              <Avatar name={user.username || user.email} imageUrl={user.profileImage} size={40} />
              <div>
                <div className="font-bold text-[15px] text-white">{user.username || user.email}</div>
                <div className="text-[13px] text-[#71767b]">Sharing to BrickShare community</div>
              </div>
            </div>
          )}

          {/* Build title */}
          <div>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              maxLength={80}
              placeholder="Build title (e.g. Millennium Falcon UCS)"
              className="w-full bg-[#202327] border border-[#2f3336] rounded-xl px-4 py-3 text-[17px] font-bold text-white placeholder-[#71767b] outline-none focus:border-[#1d9bf0] transition-colors"
            />
          </div>

          {/* Description */}
          <div>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Describe your build — pieces count, time taken, what makes it special..."
              rows={4}
              className="w-full bg-transparent text-[15px] text-white placeholder-[#71767b] outline-none resize-none leading-relaxed"
            />
          </div>

          {/* Image upload */}
          {preview ? (
            <div className="relative rounded-2xl overflow-hidden border border-[#2f3336]">
              <img src={preview} alt="Preview" className="w-full max-h-[340px] object-cover" />
              <button
                onClick={() => { setImage(null); setPreview(null); }}
                className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/70 flex items-center justify-center hover:bg-black transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center w-full h-36 rounded-2xl border-2 border-dashed border-[#2f3336] cursor-pointer hover:border-[#1d9bf0] hover:bg-[#1d9bf0]/5 transition-colors group">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#71767b" strokeWidth="1.5" className="mb-2 group-hover:stroke-[#1d9bf0] transition-colors">
                <rect x="3" y="3" width="18" height="18" rx="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <polyline points="21 15 16 10 5 21"/>
              </svg>
              <span className="text-[14px] text-[#71767b] group-hover:text-[#1d9bf0] transition-colors font-medium">Add a photo of your build</span>
              <span className="text-[12px] text-[#4a4f55] mt-0.5">PNG, JPG up to 10MB</span>
              <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
            </label>
          )}

          {/* LEGO Theme */}
          <div>
            <div className="text-[13px] font-semibold text-[#71767b] mb-2">LEGO Theme (optional)</div>
            <div className="flex flex-wrap gap-2">
              {LEGO_THEMES.map(t => (
                <button
                  key={t}
                  onClick={() => setTheme(theme === t ? '' : t)}
                  className={`px-3 py-1.5 rounded-full text-[13px] font-medium transition-all ${
                    theme === t
                      ? 'bg-[#1d9bf0] text-white'
                      : 'bg-[#202327] text-[#71767b] hover:bg-[#2f3336] hover:text-white border border-[#2f3336]'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-400 text-[13px] bg-red-400/10 rounded-xl px-3 py-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {error}
            </div>
          )}
        </div>

        {/* Bottom toolbar */}
        <div className="flex items-center gap-2 px-4 py-3 border-t border-[#2f3336]">
          <label className="flex items-center gap-2 px-3 py-2 rounded-xl text-[#1d9bf0] hover:bg-[#1d9bf0]/10 cursor-pointer transition-colors text-[13px] font-medium">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21 15 16 10 5 21"/>
            </svg>
            Photo
            <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
          </label>
          <div className="ml-auto text-[13px] text-[#71767b]">
            {description.length > 0 && `${description.length} chars`}
          </div>
        </div>
      </div>
    </div>
  );
}
