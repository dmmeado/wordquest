'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

const THEMES = [
  { id: 'home', label: 'Home', icon: '🏠' },
  { id: 'food', label: 'Food', icon: '🍳' },
  { id: 'sports', label: 'Sports', icon: '⚽' },
  { id: 'travel', label: 'Travel', icon: '✈️' },
  { id: 'work', label: 'Work', icon: '💼' },
  { id: 'health', label: 'Health', icon: '🩺' },
  { id: 'social', label: 'Social', icon: '👋' },
];

export default function SettingsPage() {
  const router = useRouter();
  const { profile, updateProfile, customWords, addCustomWord, removeCustomWord, caregiverMode, setCaregiverMode } = useAppStore();
  const [newWord, setNewWord] = useState('');
  const [newCategory, setNewCategory] = useState('');

  if (!profile) return null;

  const toggleTheme = (themeId: string) => {
    const current = profile.themes || [];
    const updated = current.includes(themeId)
      ? current.filter((t) => t !== themeId)
      : [...current, themeId];
    if (updated.length > 0) updateProfile({ themes: updated });
  };

  const handleAddWord = () => {
    if (!newWord.trim()) return;
    addCustomWord({
      id: crypto.randomUUID(),
      word: newWord.trim(),
      category: newCategory.trim() || 'General',
      note: '',
      addedAt: Date.now(),
    });
    setNewWord('');
    setNewCategory('');
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 bg-background/95 backdrop-blur-sm z-10 px-4 pt-4 pb-2 border-b border-border">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <button
            onClick={() => router.push('/dashboard')}
            className="text-text-light hover:text-text p-2 -ml-2 min-h-[48px] min-w-[48px] flex items-center justify-center"
          >
            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-lg font-semibold text-text">Settings</h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Profile */}
        <Card>
          <h3 className="font-semibold text-text mb-3">Profile</h3>
          <div className="space-y-3">
            <div>
              <label className="text-sm text-text-light">Name</label>
              <input
                type="text"
                value={profile.name}
                onChange={(e) => updateProfile({ name: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-lg bg-white mt-1"
              />
            </div>
          </div>
        </Card>

        {/* Session Preferences */}
        <Card>
          <h3 className="font-semibold text-text mb-3">Session Preferences</h3>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-text-light mb-2 block">Session Length</label>
              <div className="grid grid-cols-4 gap-2">
                {[1, 5, 10, 15].map((len) => (
                  <button
                    key={len}
                    onClick={() => updateProfile({ sessionLength: len })}
                    className={`py-2 rounded-lg border text-sm ${
                      profile.sessionLength === len
                        ? 'border-primary bg-primary/5 text-primary font-semibold'
                        : 'border-border text-text'
                    }`}
                  >
                    {len} min
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm text-text-light mb-2 block">Feedback Tone</label>
              <div className="grid grid-cols-3 gap-2">
                {(['encouraging', 'neutral', 'energetic'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => updateProfile({ tone: t })}
                    className={`py-2 rounded-lg border text-sm capitalize ${
                      profile.tone === t
                        ? 'border-primary bg-primary/5 text-primary font-semibold'
                        : 'border-border text-text'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* Topics */}
        <Card>
          <h3 className="font-semibold text-text mb-3">Topics</h3>
          <div className="flex flex-wrap gap-2">
            {THEMES.map((theme) => (
              <button
                key={theme.id}
                onClick={() => toggleTheme(theme.id)}
                className={`px-3 py-2 rounded-full border text-sm ${
                  profile.themes.includes(theme.id)
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-border text-text-muted'
                }`}
              >
                {theme.icon} {theme.label}
              </button>
            ))}
          </div>
        </Card>

        {/* Custom Vocabulary */}
        <Card>
          <h3 className="font-semibold text-text mb-3">Custom Vocabulary</h3>
          <p className="text-sm text-text-light mb-3">
            Add words that matter to your daily life
          </p>
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={newWord}
              onChange={(e) => setNewWord(e.target.value)}
              placeholder="Word"
              className="flex-1 px-3 py-2 border border-border rounded-lg bg-white text-sm"
            />
            <input
              type="text"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder="Category"
              className="w-28 px-3 py-2 border border-border rounded-lg bg-white text-sm"
            />
            <Button onClick={handleAddWord} variant="primary" size="sm" disabled={!newWord.trim()}>
              Add
            </Button>
          </div>
          {customWords.length > 0 && (
            <div className="space-y-2">
              {customWords.map((w) => (
                <div key={w.id} className="flex items-center justify-between bg-surface rounded-lg px-3 py-2">
                  <div>
                    <span className="text-sm font-medium text-text">{w.word}</span>
                    <span className="text-xs text-text-muted ml-2">{w.category}</span>
                  </div>
                  <button
                    onClick={() => removeCustomWord(w.id)}
                    className="text-text-muted hover:text-text p-1"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Caregiver Mode */}
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-text">Caregiver Mode</h3>
              <p className="text-sm text-text-light">Show cueing tips and manual scoring</p>
            </div>
            <button
              onClick={() => setCaregiverMode(!caregiverMode)}
              className={`w-12 h-7 rounded-full transition-colors ${
                caregiverMode ? 'bg-primary' : 'bg-border'
              }`}
            >
              <div
                className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  caregiverMode ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}
