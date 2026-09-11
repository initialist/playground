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
  Terminal,
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
    if (status === 'error') return <AlertCircle className="w-4 h-4 text-red-500" />;
    if (status === 'in_progress') return <Sparkles className="w-4 h-4 text-indigo-600 animate-spin" />;

    switch (stage) {
      case 'planning':
        return <Sparkles className="w-4 h-4 text-amber-500" />;
      case 'coding':
        return <Code2 className="w-4 h-4 text-indigo-500" />;
      case 'testing':
        return <Stethoscope className="w-4 h-4 text-purple-500" />;
      case 'healing':
        return <Wrench className="w-4 h-4 text-amber-600" />;
      case 'ready':
      default:
        return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 font-sans bg-slate-50/50">
      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
        <div className="flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-slate-500" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Agent Activity & Verification
          </span>
        </div>
        <span className="text-[11px] text-slate-400 font-mono">
          {thoughtSteps.length} checkpoint{thoughtSteps.length === 1 ? '' : 's'}
        </span>
      </div>

      {/* Streaming Status Banner */}
      {isGenerating && (
        <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center gap-3 animate-pulse">
          <div className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
          <div className="flex-1 text-xs text-indigo-900 font-semibold">
            {streamingStatus || 'Gemini 3.5 Flash Lite is streaming code...'}
          </div>
        </div>
      )}

      {/* Agent Activity Cards */}
      <div className="flex flex-col gap-2.5">
        {thoughtSteps.map((step) => {
          const isHealing = step.stage === 'healing';
          const isVerified = step.title.includes('Verified') || step.title.includes('Runtime');
          return (
            <div
              key={step.id}
              className={`p-3.5 rounded-2xl border transition-all text-xs flex flex-col gap-1.5 card-shadow ${
                step.status === 'error'
                  ? 'bg-red-50/80 border-red-200 text-red-900'
                  : isHealing
                  ? 'bg-amber-50 border-amber-200 text-amber-900'
                  : isVerified
                  ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900'
                  : step.status === 'in_progress'
                  ? 'bg-indigo-50/60 border-indigo-200 text-indigo-900'
                  : 'bg-white border-slate-200 text-slate-800'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold">
                  {getStageIcon(step.stage, step.status)}
                  <span>{step.title}</span>
                </div>
                <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
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
                <div className="pl-6 leading-relaxed text-[11px] font-mono text-slate-600 whitespace-pre-wrap break-words">
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
