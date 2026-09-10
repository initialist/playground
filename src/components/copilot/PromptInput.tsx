'use client';

import React, { useState, useRef } from 'react';
import { Send, Sparkles, Wand2, Layers } from 'lucide-react';

interface PromptInputProps {
  onGenerate: (prompt: string, isIteration: boolean) => void;
  onCancel?: () => void;
  isGenerating: boolean;
  currentTitle: string;
}

const QUICK_PROMPTS = [
  'Space arcade shooter with boss waves & laser beams',
  'Neon cyber breakout with multiball powerups',
  'Endless retro runner with jumping, coins, and obstacles',
  'Zen particle sandbox toy reacting to mouse gravity',
  'Flappy cyberpunk bird with neon pipes & sound effects',
  'Match-3 gem puzzle game with combo animations',
];

export const PromptInput: React.FC<PromptInputProps> = ({
  onGenerate,
  onCancel,
  isGenerating,
  currentTitle,
}) => {
  const [prompt, setPrompt] = useState('');
  const [isIteration, setIsIteration] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = () => {
    if (!prompt.trim() || isGenerating) return;
    onGenerate(prompt.trim(), isIteration);
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
    const random = QUICK_PROMPTS[Math.floor(Math.random() * QUICK_PROMPTS.length)];
    setPrompt(random);
    if (textareaRef.current) textareaRef.current.focus();
  };

  return (
    <div className="p-4 border-b border-zinc-800/80 bg-zinc-950/60 flex flex-col gap-3">
      {/* Mode Selector: New Game vs Iterate */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 bg-zinc-900/80 p-0.5 rounded-lg border border-zinc-800">
          <button
            type="button"
            onClick={() => setIsIteration(false)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
              !isIteration
                ? 'bg-violet-600 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Sparkles className="w-3 h-3" />
            <span>New Game</span>
          </button>
          <button
            type="button"
            onClick={() => setIsIteration(true)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
              isIteration
                ? 'bg-violet-600 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Layers className="w-3 h-3" />
            <span>Iterate on &ldquo;{currentTitle.slice(0, 14)}...&rdquo;</span>
          </button>
        </div>

        <button
          type="button"
          onClick={handleSurpriseMe}
          className="flex items-center gap-1 text-[11px] text-violet-400 hover:text-violet-300 transition-colors"
        >
          <Wand2 className="w-3 h-3" />
          <span>Surprise me</span>
        </button>
      </div>

      {/* Main Input Box */}
      <div className="relative rounded-xl bg-zinc-900/90 border border-zinc-800 focus-within:border-violet-500/80 focus-within:ring-1 focus-within:ring-violet-500/30 transition-all p-2.5 flex flex-col gap-2 shadow-inner">
        <textarea
          ref={textareaRef}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            isIteration
              ? `Describe how to expand or tweak ${currentTitle} (e.g. "Add a second boss and double jump")...`
              : 'Describe your mini-game or mini-app idea in natural language...'
          }
          rows={2}
          className="w-full bg-transparent text-sm text-zinc-100 placeholder-zinc-500 resize-none focus:outline-none leading-relaxed"
          disabled={isGenerating}
        />

        <div className="flex items-center justify-between pt-1 border-t border-zinc-800/60">
          <span className="text-[10px] text-zinc-500 flex items-center gap-1">
            Press <kbd className="px-1 py-0.5 bg-zinc-800 rounded text-[9px] font-mono">Enter ↵</kbd> to build
          </span>

          {isGenerating ? (
            <button
              type="button"
              onClick={onCancel}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-600/20 active:scale-95 transition-all"
              title="Stop Generation"
            >
              <div className="w-2 h-2 rounded-sm bg-white" />
              <span>Stop / Cancel</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!prompt.trim()}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white transition-all ${
                prompt.trim()
                  ? 'bg-violet-600 hover:bg-violet-500 shadow-md shadow-violet-500/20 active:scale-95'
                  : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
              }`}
            >
              <span>Build with AI</span>
              <Send className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Quick Prompt Suggestions */}
      {!isIteration && (
        <div className="flex flex-wrap gap-1.5 pt-0.5">
          {QUICK_PROMPTS.slice(0, 3).map((qp, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleQuickPrompt(qp)}
              className="text-[11px] text-zinc-400 hover:text-zinc-200 bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800/80 hover:border-zinc-700 px-2.5 py-1 rounded-full transition-all truncate max-w-[280px]"
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
