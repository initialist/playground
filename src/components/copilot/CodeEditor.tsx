'use client';

import React, { useState } from 'react';
import { Copy, Check, Edit3, Eye, Play, FileCode } from 'lucide-react';

interface CodeEditorProps {
  code: string;
  onApplyManualCode: (newCode: string) => void;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({ code, onApplyManualCode }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedCode, setEditedCode] = useState(code);
  const [copied, setCopied] = useState(false);

  const handleStartEdit = () => {
    setEditedCode(code);
    setIsEditing(true);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(isEditing ? editedCode : code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApply = () => {
    onApplyManualCode(editedCode);
    setIsEditing(false);
  };

  const activeContent = isEditing ? editedCode : code;
  const lineCount = (activeContent.match(/\n/g) || []).length + 1;
  const byteSize = new Blob([activeContent]).size;

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-zinc-950 font-mono text-xs">
      {/* Editor Toolbar */}
      <div className="h-10 px-3 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/60 select-none">
        <div className="flex items-center gap-2 text-zinc-400">
          <FileCode className="w-3.5 h-3.5 text-violet-400" />
          <span className="font-semibold text-zinc-300">index.html</span>
          <span className="text-[10px] text-zinc-500">
            ({lineCount} lines • {(byteSize / 1024).toFixed(1)} KB)
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Copy Button */}
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 px-2 py-1 rounded bg-zinc-800/80 hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors text-[11px]"
            title="Copy Code"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-emerald-400" />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span>Copy</span>
              </>
            )}
          </button>

          {/* Edit/View Toggle */}
          {isEditing ? (
            <button
              onClick={() => setIsEditing(false)}
              className="flex items-center gap-1 px-2 py-1 rounded bg-violet-600 text-white transition-colors text-[11px]"
            >
              <Eye className="w-3 h-3" />
              <span>View Mode</span>
            </button>
          ) : (
            <button
              onClick={handleStartEdit}
              className="flex items-center gap-1 px-2 py-1 rounded bg-zinc-800/80 hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors text-[11px]"
            >
              <Edit3 className="w-3 h-3" />
              <span>Manual Edit</span>
            </button>
          )}

          {/* Apply Button */}
          {isEditing && (
            <button
              onClick={handleApply}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition-colors text-[11px]"
            >
              <Play className="w-3 h-3 fill-current" />
              <span>Run Edited Code</span>
            </button>
          )}
        </div>
      </div>

      {/* Editor / Viewer Body */}
      <div className="flex-1 overflow-auto p-4 leading-5">
        {isEditing ? (
          <textarea
            value={editedCode}
            onChange={(e) => setEditedCode(e.target.value)}
            className="w-full h-full bg-transparent text-zinc-200 font-mono text-xs resize-none focus:outline-none whitespace-pre"
            spellCheck={false}
          />
        ) : (
          <pre className="text-zinc-300 whitespace-pre overflow-x-auto selection:bg-violet-900/50">
            <code>{code}</code>
          </pre>
        )}
      </div>
    </div>
  );
};
