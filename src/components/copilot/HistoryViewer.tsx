'use client';

import React from 'react';
import { History, RotateCcw, Clock } from 'lucide-react';
import { GameProject } from '@/types/playground';

interface HistoryViewerProps {
  history: GameProject[];
  currentProject: GameProject;
  onSelectVersion: (project: GameProject) => void;
}

export const HistoryViewer: React.FC<HistoryViewerProps> = ({
  history,
  currentProject,
  onSelectVersion,
}) => {
  return (
    <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 font-sans">
      <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2">
        <div className="flex items-center gap-2">
          <History className="w-3.5 h-3.5 text-zinc-400" />
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Version Timeline
          </span>
        </div>
        <span className="text-[11px] text-zinc-500 font-mono">
          {history.length} checkpoint{history.length === 1 ? '' : 's'}
        </span>
      </div>

      <div className="flex flex-col gap-2.5">
        {history.map((item) => {
          const isCurrent = item.id === currentProject.id;
          return (
            <div
              key={item.id}
              className={`p-3 rounded-xl border text-xs flex flex-col gap-1.5 transition-all ${
                isCurrent
                  ? 'bg-violet-950/20 border-violet-500/40 shadow-sm'
                  : 'bg-zinc-900/40 border-zinc-800 hover:border-zinc-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-zinc-800 text-zinc-300">
                    v{item.version}
                  </span>
                  <span className="font-semibold text-zinc-200">{item.title}</span>
                  {isCurrent && (
                    <span className="text-[10px] font-medium text-violet-400 bg-violet-500/10 px-1.5 py-0.5 rounded border border-violet-500/20">
                      Active
                    </span>
                  )}
                </div>

                <span className="text-[10px] font-mono text-zinc-500 flex items-center gap-1">
                  <Clock className="w-2.5 h-2.5" />
                  {new Date(item.updatedAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>

              <div className="text-zinc-400 text-[11px] line-clamp-2">
                &ldquo;{item.prompt}&rdquo;
              </div>

              {!isCurrent && (
                <div className="pt-1 flex justify-end">
                  <button
                    onClick={() => onSelectVersion(item)}
                    className="flex items-center gap-1 text-[11px] text-zinc-300 hover:text-white px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 transition-colors"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Restore this version</span>
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
