'use client';

import React, { useState, useRef } from 'react';
import { Send, Sparkles, Wand2, Layers } from 'lucide-react';

interface PromptInputProps {
  onGenerate: (prompt: string) => void;
  onCancel?: () => void;
  onNewApp?: () => void;
  isGenerating: boolean;
  currentTitle: string;
  hasExistingApp: boolean;
}

const INSPIRATION_PROMPTS = [
  'Interactive particle physics sandbox with mouse gravity',
  '8-bit chiptune drum pad with tempo control & synth leads',
  'Zen markdown notepad with live split preview & file export',
  'Procedural fractal botanical tree visualizer with wind sliders',
  'Pomodoro focus timer with ambient sound generators',
  'Retro cyber obstacle racer with scoring & procedural sound fx',
];

export const PromptInput: React.FC<PromptInputProps> = ({
  onGenerate,
  onCancel,
  onNewApp,
  isGenerating,
  currentTitle,
  hasExistingApp,
}) => {
  const [prompt, setPrompt] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = () => {
    if (!prompt.trim() || isGenerating) return;
    onGenerate(prompt.trim());
    setPrompt('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey || !e.shiftKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleQuickPrompt = (text: string) => {
    setPrompt(text);
    if (textareaRef.current) textareaRef.current.focus();
  };

  const handleSurpriseMe = () => {
    const random = INSPIRATION_PROMPTS[Math.floor(Math.random() * INSPIRATION_PROMPTS.length)];
    setPrompt(random);
    if (textareaRef.current) textareaRef.current.focus();
  };

  return (
    <div className="p-4 border-t border-slate-200 bg-white flex flex-col gap-3">
      {/* Context info bar: indicates if iterating on current app or starting fresh */}
      <div className="flex items-center justify-between text-xs">
        {hasExistingApp ? (
          <div className="flex items-center gap-1.5 text-slate-600 font-medium">
            <Layers className="w-3.5 h-3.5 text-indigo-600" />
            <span>Iterating on <strong className="text-slate-800">{currentTitle}</strong></span>
            {onNewApp && (
              <button
                type="button"
                onClick={onNewApp}
                className="ml-2 text-[11px] text-indigo-600 hover:text-indigo-800 underline font-semibold"
              >
                Start New App
              </button>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-slate-500 font-medium">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>Clean Canvas — enter your idea to begin</span>
          </div>
        )}

        <button
          type="button"
          onClick={handleSurpriseMe}
          className="flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
        >
          <Wand2 className="w-3 h-3" />
          <span>Idea Prompt</span>
        </button>
      </div>

      {/* Main Input Box */}
      <div className="relative rounded-2xl bg-slate-50 border border-slate-200 focus-within:bg-white focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all p-3 flex flex-col gap-2">
        <textarea
          ref={textareaRef}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            hasExistingApp
              ? `Describe what to tweak, add, or fix on ${currentTitle} (e.g. "Add a score counter and speed slider")...`
              : 'Describe your mini-app or tool idea in plain English...'
          }
          rows={2}
          className="w-full bg-transparent text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 resize-none focus:outline-none leading-relaxed"
          disabled={isGenerating}
        />

        <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
          <span className="text-[10px] text-slate-400 flex items-center gap-1">
            Press <kbd className="px-1 py-0.5 bg-slate-200 text-slate-600 rounded text-[9px] font-mono">Enter ↵</kbd>
          </span>

          {isGenerating ? (
            <button
              type="button"
              onClick={onCancel}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white shadow-xs active:scale-95 transition-all"
              title="Stop Generation"
            >
              <div className="w-2 h-2 rounded-sm bg-white" />
              <span>Cancel</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!prompt.trim()}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-semibold text-white transition-all ${
                prompt.trim()
                  ? 'bg-indigo-600 hover:bg-indigo-700 shadow-xs active:scale-95'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <span>{hasExistingApp ? 'Iterate App' : 'Build with AI'}</span>
              <Send className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Quick Suggestions (if canvas is fresh) */}
      {!hasExistingApp && (
        <div className="flex flex-wrap gap-1.5 pt-0.5">
          {INSPIRATION_PROMPTS.slice(0, 3).map((qp, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleQuickPrompt(qp)}
              className="text-[11px] text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 border border-slate-200 px-2.5 py-1 rounded-full transition-all truncate max-w-[260px]"
              title={qp}
            >
              + {qp}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
