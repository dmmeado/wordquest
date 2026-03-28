'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import type { UserProfile } from '@/types';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

const GOALS = [
  { id: 'family', label: 'Speak more easily with family', icon: '👨‍👩‍👧' },
  { id: 'restaurant', label: 'Order at restaurants confidently', icon: '🍽️' },
  { id: 'social', label: 'Feel better in social settings', icon: '🤝' },
  { id: 'appointments', label: 'Speak more independently at appointments', icon: '🏥' },
  { id: 'phone', label: 'Handle phone calls more easily', icon: '📞' },
  { id: 'confidence', label: 'Build overall communication confidence', icon: '💪' },
];

const THEMES = [
  { id: 'home', label: 'Home', icon: '🏠' },
  { id: 'food', label: 'Food & Cooking', icon: '🍳' },
  { id: 'sports', label: 'Sports', icon: '⚽' },
  { id: 'travel', label: 'Travel', icon: '✈️' },
  { id: 'work', label: 'Work', icon: '💼' },
  { id: 'health', label: 'Health', icon: '🩺' },
  { id: 'social', label: 'Social & Community', icon: '👋' },
];

const TONES = [
  { id: 'encouraging' as const, label: 'Encouraging', desc: 'Warm and supportive', icon: '☀️' },
  { id: 'neutral' as const, label: 'Neutral', desc: 'Calm and straightforward', icon: '🌊' },
  { id: 'energetic' as const, label: 'Energetic', desc: 'Upbeat and motivating', icon: '⚡' },
];

const SESSION_LENGTHS = [1, 5, 10, 15];

export default function OnboardingPage() {
  const router = useRouter();
  const { setProfile, refreshMissions } = useAppStore();
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [selectedThemes, setSelectedThemes] = useState<string[]>([]);
  const [tone, setTone] = useState<'encouraging' | 'neutral' | 'energetic'>('encouraging');
  const [sessionLength, setSessionLength] = useState(5);

  const toggleItem = (list: string[], item: string, setter: (v: string[]) => void) => {
    setter(list.includes(item) ? list.filter((i) => i !== item) : [...list, item]);
  };

  const handleComplete = () => {
    const profile: UserProfile = {
      uid: crypto.randomUUID(),
      name: name || 'Friend',
      goals: selectedGoals.map((id) => GOALS.find((g) => g.id === id)?.label || id),
      themes: selectedThemes.length > 0 ? selectedThemes : ['home', 'food'],
      tone,
      sessionLength,
      reminderTime: null,
      onboardingComplete: true,
      createdAt: Date.now(),
    };
    setProfile(profile);
    refreshMissions();
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Progress dots */}
      <div className="flex justify-center gap-2 pt-8 pb-4">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`w-2.5 h-2.5 rounded-full transition-all ${
              i === step ? 'bg-primary w-8' : i < step ? 'bg-primary/40' : 'bg-border'
            }`}
          />
        ))}
      </div>

      <div className="flex-1 flex flex-col px-4 pb-8 max-w-lg mx-auto w-full">
        {/* Step 0: Welcome */}
        {step === 0 && (
          <div className="flex-1 flex flex-col justify-center animate-fade-in">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-text mb-3">Welcome to WordQuest</h1>
              <p className="text-text-light text-lg leading-relaxed">
                This is your space to practice word finding at your own pace.
                Every session builds strength.
              </p>
            </div>
            <div className="mb-8">
              <label className="block text-sm font-medium text-text-light mb-2">
                What should we call you?
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name (optional)"
                className="w-full px-4 py-4 text-lg border-2 border-border rounded-xl bg-white focus:border-primary focus:outline-none"
              />
            </div>
            <Button onClick={() => setStep(1)} variant="primary" size="lg" className="w-full">
              Get Started
            </Button>
          </div>
        )}

        {/* Step 1: Goals */}
        {step === 1 && (
          <div className="flex-1 flex flex-col animate-fade-in">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-text mb-2">What matters to you?</h2>
              <p className="text-text-light">Choose what you&apos;d like to work toward</p>
            </div>
            <div className="flex-1 space-y-3 mb-6">
              {GOALS.map((goal) => (
                <button
                  key={goal.id}
                  onClick={() => toggleItem(selectedGoals, goal.id, setSelectedGoals)}
                  className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left min-h-[56px] ${
                    selectedGoals.includes(goal.id)
                      ? 'border-primary bg-primary/5'
                      : 'border-border bg-white hover:border-primary/30'
                  }`}
                >
                  <span className="text-2xl">{goal.icon}</span>
                  <span className="font-medium text-text">{goal.label}</span>
                  {selectedGoals.includes(goal.id) && (
                    <span className="ml-auto text-primary">✓</span>
                  )}
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <Button onClick={() => setStep(0)} variant="ghost" size="md">Back</Button>
              <Button onClick={() => setStep(2)} variant="primary" size="lg" className="flex-1">
                Continue
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Themes */}
        {step === 2 && (
          <div className="flex-1 flex flex-col animate-fade-in">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-text mb-2">Pick your topics</h2>
              <p className="text-text-light">Choose 2 or more areas to practice with</p>
            </div>
            <div className="flex-1 grid grid-cols-2 gap-3 mb-6 content-start">
              {THEMES.map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => toggleItem(selectedThemes, theme.id, setSelectedThemes)}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all min-h-[80px] ${
                    selectedThemes.includes(theme.id)
                      ? 'border-primary bg-primary/5'
                      : 'border-border bg-white hover:border-primary/30'
                  }`}
                >
                  <span className="text-3xl">{theme.icon}</span>
                  <span className="font-medium text-sm text-text">{theme.label}</span>
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <Button onClick={() => setStep(1)} variant="ghost" size="md">Back</Button>
              <Button
                onClick={() => setStep(3)}
                variant="primary"
                size="lg"
                className="flex-1"
                disabled={selectedThemes.length < 1}
              >
                Continue
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Preferences */}
        {step === 3 && (
          <div className="flex-1 flex flex-col animate-fade-in">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-text mb-2">Your preferences</h2>
              <p className="text-text-light">You can change these anytime</p>
            </div>

            <div className="flex-1 space-y-6 mb-6">
              {/* Tone */}
              <div>
                <label className="block text-sm font-medium text-text mb-3">Feedback Style</label>
                <div className="grid grid-cols-3 gap-3">
                  {TONES.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setTone(t.id)}
                      className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all ${
                        tone === t.id
                          ? 'border-primary bg-primary/5'
                          : 'border-border bg-white'
                      }`}
                    >
                      <span className="text-2xl">{t.icon}</span>
                      <span className="text-sm font-medium text-text">{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Session length */}
              <div>
                <label className="block text-sm font-medium text-text mb-3">Session Length</label>
                <div className="grid grid-cols-4 gap-3">
                  {SESSION_LENGTHS.map((len) => (
                    <button
                      key={len}
                      onClick={() => setSessionLength(len)}
                      className={`py-3 px-2 rounded-xl border-2 text-center transition-all ${
                        sessionLength === len
                          ? 'border-primary bg-primary/5 text-primary font-semibold'
                          : 'border-border bg-white text-text'
                      }`}
                    >
                      {len} min
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button onClick={() => setStep(2)} variant="ghost" size="md">Back</Button>
              <Button onClick={handleComplete} variant="primary" size="lg" className="flex-1">
                Start Practicing!
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
