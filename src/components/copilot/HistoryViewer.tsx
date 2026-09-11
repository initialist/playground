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
    <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 font-sans bg-slate-50/50">
      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
        <div className="flex items-center gap-2">
          <History className="w-3.5 h-3.5 text-slate-500" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Version Timeline
          </span>
        </div>
        <span className="text-[11px] text-slate-400 font-mono">
          {history.length} checkpoint{history.length === 1 ? '' : 's'}
        </span>
      </div>

      <div className="flex flex-col gap-2.5">
        {history.length === 0 ? (
          <div className="text-center py-10 text-slate-400 text-xs">
            No versions saved yet. Versions appear as you generate and iterate.
          </div>
        ) : (
          history.map((item) => {
            const isCurrent = item.id === currentProject.id;
            return (
              <div
                key={item.id}
                className={`p-3.5 rounded-2xl border text-xs flex flex-col gap-1.5 transition-all card-shadow ${
                  isCurrent
                    ? 'bg-indigo-50/60 border-indigo-200'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200">
                      v{item.version}
                    </span>
                    <span className="font-bold text-slate-900">{item.title}</span>
                    {isCurrent && (
                      <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200">
                        Active
                      </span>
                    )}
                  </div>

                  <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5" />
                    {new Date(item.updatedAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>

                <div className="text-slate-600 text-[11px] font-mono line-clamp-2">
                  &ldquo;{item.prompt}&rdquo;
                </div>

                {!isCurrent && (
                  <div className="pt-1 flex justify-end">
                    <button
                      onClick={() => onSelectVersion(item)}
                      className="flex items-center gap-1 text-[11px] font-semibold text-slate-700 hover:text-slate-900 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Restore</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
