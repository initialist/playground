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
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-950 font-mono text-xs">
      {/* Editor Toolbar */}
      <div className="h-10 px-3 border-b border-slate-800 flex items-center justify-between bg-slate-900 select-none">
        <div className="flex items-center gap-2 text-slate-400">
          <FileCode className="w-3.5 h-3.5 text-indigo-400" />
          <span className="font-semibold text-slate-200">index.html</span>
          <span className="text-[10px] text-slate-500">
            ({lineCount} lines • {(byteSize / 1024).toFixed(1)} KB)
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors text-[11px]"
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

          {isEditing ? (
            <button
              onClick={() => setIsEditing(false)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700 transition-colors text-[11px]"
            >
              <Eye className="w-3 h-3" />
              <span>View Mode</span>
            </button>
          ) : (
            <button
              onClick={handleStartEdit}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors text-[11px]"
            >
              <Edit3 className="w-3 h-3" />
              <span>Edit Code</span>
            </button>
          )}

          {isEditing && (
            <button
              onClick={handleApply}
              className="flex items-center gap-1 px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-colors text-[11px]"
            >
              <Play className="w-3 h-3 fill-current" />
              <span>Run Code</span>
            </button>
          )}
        </div>
      </div>

      {/* Code Editor / Viewer Body */}
      <div className="flex-1 overflow-auto p-4 leading-relaxed">
        {isEditing ? (
          <textarea
            value={editedCode}
            onChange={(e) => setEditedCode(e.target.value)}
            className="w-full h-full bg-transparent text-slate-200 font-mono text-xs resize-none focus:outline-none whitespace-pre selection:bg-indigo-600 selection:text-white"
            spellCheck={false}
          />
        ) : (
          <pre className="text-slate-300 whitespace-pre overflow-x-auto selection:bg-indigo-600 selection:text-white">
            <code>{code || '// Canvas is empty. Prompt an idea on the copilot to generate code.'}</code>
          </pre>
        )}
      </div>
    </div>
  );
};
