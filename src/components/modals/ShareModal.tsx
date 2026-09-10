'use client';

import React, { useState } from 'react';
import { X, Share2, Copy, Check, QrCode, Smartphone, Globe } from 'lucide-react';
import { GameProject } from '@/types/playground';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: GameProject;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  project,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const currentUrl = typeof window !== 'undefined' ? window.location.origin : 'https://playground.local';
  const shareableUrl = `${currentUrl}/?game=${encodeURIComponent(project.id)}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareableUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm select-none p-4">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Share2 className="w-4 h-4 text-violet-400" />
            <span className="font-bold text-sm text-zinc-100">Publish & Share Game</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 flex flex-col gap-4 text-xs">
          {/* Share Link */}
          <div className="flex flex-col gap-1.5">
            <label className="font-semibold text-zinc-300 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-zinc-400" />
              <span>Direct Game Link</span>
            </label>
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                readOnly
                value={shareableUrl}
                className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-300 font-mono select-all focus:outline-none"
              />
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 px-3 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-semibold transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* Instant Mobile Play Preview */}
          <div className="p-4 rounded-xl bg-zinc-950/80 border border-zinc-800/80 flex items-center gap-4">
            <div className="w-20 h-20 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-center shrink-0">
              <QrCode className="w-10 h-10 text-violet-400" />
            </div>
            <div className="flex flex-col gap-1">
              <span className="font-semibold text-zinc-200 flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5 text-zinc-400" />
                Play on Mobile
              </span>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Games made in Playground automatically support touch and responsive canvas scaling. Open this link on your phone to play!
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-zinc-800 bg-zinc-950/60 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold text-xs transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
