'use client';

import React from 'react';
import {
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  Code2,
  Stethoscope,
  Wrench,
  Terminal
} from 'lucide-react';
import { AgentThoughtStep, AgentStage } from '@/types/playground';

interface AgentStatusFeedProps {
  thoughtSteps: AgentThoughtStep[];
  agentStage: AgentStage;
  streamingStatus?: string;
  isGenerating: boolean;
}

export const AgentStatusFeed: React.FC<AgentStatusFeedProps> = ({
  thoughtSteps,
  streamingStatus,
  isGenerating,
}) => {
  const getStageIcon = (stage: AgentStage, status: AgentThoughtStep['status']) => {
    if (status === 'error') return <AlertCircle className="w-4 h-4 text-rose-400" />;
    if (status === 'in_progress') return <Sparkles className="w-4 h-4 text-violet-400 animate-spin" />;

    switch (stage) {
      case 'planning':
        return <Sparkles className="w-4 h-4 text-amber-400" />;
      case 'coding':
        return <Code2 className="w-4 h-4 text-blue-400" />;
      case 'testing':
        return <Stethoscope className="w-4 h-4 text-purple-400" />;
      case 'healing':
        return <Wrench className="w-4 h-4 text-orange-400" />;
      case 'ready':
      default:
        return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 font-sans">
      <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2">
        <div className="flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-zinc-400" />
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Agent Build Activity
          </span>
        </div>
        <span className="text-[11px] text-zinc-500 font-mono">
          {thoughtSteps.length} step{thoughtSteps.length === 1 ? '' : 's'} recorded
        </span>
      </div>

      {/* Streaming Status Banner */}
      {isGenerating && (
        <div className="p-3 rounded-lg bg-violet-950/30 border border-violet-500/30 flex items-center gap-3 animate-cyber-pulse">
          <div className="w-2.5 h-2.5 rounded-full bg-violet-400 animate-ping" />
          <div className="flex-1 text-xs text-violet-200 font-medium">
            {streamingStatus || 'Gemini Flash is synthesizing your game...'}
          </div>
        </div>
      )}

      {/* Agent Activity Cards */}
      <div className="flex flex-col gap-2.5">
        {thoughtSteps.map((step) => {
          const isHealing = step.stage === 'healing';
          return (
            <div
              key={step.id}
              className={`p-3 rounded-xl border transition-all text-xs flex flex-col gap-1.5 ${
                isHealing
                  ? 'bg-orange-950/20 border-orange-500/30 shadow-sm shadow-orange-900/10'
                  : step.status === 'error'
                  ? 'bg-rose-950/20 border-rose-500/30'
                  : step.status === 'in_progress'
                  ? 'bg-zinc-900/90 border-violet-500/40 shadow-sm shadow-violet-900/10'
                  : 'bg-zinc-900/40 border-zinc-800/80 hover:border-zinc-700/80'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-medium text-zinc-200">
                  {getStageIcon(step.stage, step.status)}
                  <span className={isHealing ? 'text-orange-300 font-semibold' : ''}>
                    {step.title}
                  </span>
                </div>
                <span className="text-[10px] font-mono text-zinc-500 flex items-center gap-1">
                  <Clock className="w-2.5 h-2.5" />
                  {step.timestamp > 0
                    ? new Date(step.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })
                    : 'Initial'}
                </span>
              </div>

              {step.detail && (
                <div className="text-zinc-400 pl-6 leading-relaxed text-[11px] font-mono whitespace-pre-wrap break-words">
                  {step.detail}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
