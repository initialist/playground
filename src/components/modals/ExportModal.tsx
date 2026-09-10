'use client';

import React, { useState } from 'react';
import { X, Download, Code, Check } from 'lucide-react';
import { GameProject } from '@/types/playground';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: GameProject;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  project,
}) => {
  const [copiedSnippet, setCopiedSnippet] = useState(false);

  if (!isOpen) return null;

  const handleDownload = () => {
    const blob = new Blob([project.code], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const safeTitle = project.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    link.href = url;
    link.download = `${safeTitle}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const embedSnippet = `<iframe src="${project.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.html" width="100%" height="600" frameborder="0" allow="pointer-lock" allowfullscreen></iframe>`;

  const handleCopySnippet = () => {
    navigator.clipboard.writeText(embedSnippet);
    setCopiedSnippet(true);
    setTimeout(() => setCopiedSnippet(false), 2000);
  };

  const fileSizeKB = (new Blob([project.code]).size / 1024).toFixed(1);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm select-none p-4">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Download className="w-4 h-4 text-violet-400" />
            <span className="font-bold text-sm text-zinc-100">Export Standalone App</span>
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
          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="font-semibold text-zinc-200 text-sm">{project.title}</span>
              <span className="text-[11px] text-zinc-500">Standalone single-file HTML • {fileSizeKB} KB</span>
            </div>
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors shadow-md shadow-emerald-600/20"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download .html</span>
            </button>
          </div>

          {/* Embed snippet */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-zinc-300 flex items-center gap-1.5">
                <Code className="w-3.5 h-3.5 text-zinc-400" />
                <span>Embed Snippet</span>
              </label>
              <button
                onClick={handleCopySnippet}
                className="text-[11px] text-violet-400 hover:text-violet-300 flex items-center gap-1"
              >
                {copiedSnippet ? <Check className="w-3 h-3 text-emerald-400" /> : null}
                <span>{copiedSnippet ? 'Copied' : 'Copy HTML'}</span>
              </button>
            </div>
            <pre className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-400 font-mono text-[11px] overflow-x-auto whitespace-pre">
              {embedSnippet}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-zinc-800 bg-zinc-950/60 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold text-xs transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
