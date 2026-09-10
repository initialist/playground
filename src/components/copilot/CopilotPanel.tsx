'use client';

import React from 'react';
import { Sparkles, Code2, History, AlertCircle, Wrench } from 'lucide-react';
import { PromptInput } from './PromptInput';
import { AgentStatusFeed } from './AgentStatusFeed';
import { CodeEditor } from './CodeEditor';
import { HistoryViewer } from './HistoryViewer';
import { GameProject, AgentThoughtStep, AgentStage, SandboxErrorPayload } from '@/types/playground';

interface CopilotPanelProps {
  currentProject: GameProject;
  history: GameProject[];
  activeTab: 'copilot' | 'code' | 'history';
  setActiveTab: (tab: 'copilot' | 'code' | 'history') => void;
  thoughtSteps: AgentThoughtStep[];
  agentStage: AgentStage;
  streamingStatus: string;
  isGenerating: boolean;
  lastError: SandboxErrorPayload | null;
  onGenerate: (prompt: string, isIteration: boolean) => void;
  onCancel: () => void;
  onTriggerRepair: (error: SandboxErrorPayload) => void;
  onDismissError: () => void;
  onApplyManualCode: (code: string) => void;
  onSelectVersion: (project: GameProject) => void;
}

export const CopilotPanel: React.FC<CopilotPanelProps> = ({
  currentProject,
  history,
  activeTab,
  setActiveTab,
  thoughtSteps,
  agentStage,
  streamingStatus,
  isGenerating,
  lastError,
  onGenerate,
  onCancel,
  onTriggerRepair,
  onDismissError,
  onApplyManualCode,
  onSelectVersion,
}) => {
  return (
    <div className="w-full h-full flex flex-col bg-zinc-950/70 border-r border-zinc-800/80 select-none">
      {/* Navigation Tabs */}
      <div className="h-11 border-b border-zinc-800 flex items-center justify-between px-3 bg-zinc-950/90">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab('copilot')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              activeTab === 'copilot'
                ? 'bg-zinc-800/90 text-violet-400 font-semibold shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Agent Copilot</span>
          </button>

          <button
            onClick={() => setActiveTab('code')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              activeTab === 'code'
                ? 'bg-zinc-800/90 text-violet-400 font-semibold shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Code</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              activeTab === 'history'
                ? 'bg-zinc-800/90 text-violet-400 font-semibold shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>History</span>
          </button>
        </div>
      </div>

      {/* Main Tab Content */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {activeTab === 'copilot' && (
          <AgentStatusFeed
            thoughtSteps={thoughtSteps}
            agentStage={agentStage}
            streamingStatus={streamingStatus}
            isGenerating={isGenerating}
          />
        )}
        {activeTab === 'code' && (
          <CodeEditor
            code={currentProject.code}
            onApplyManualCode={onApplyManualCode}
          />
        )}
        {activeTab === 'history' && (
          <HistoryViewer
            history={history}
            currentProject={currentProject}
            onSelectVersion={onSelectVersion}
          />
        )}
      </div>

      {/* Actionable Error Banner if an issue occurred */}
      {lastError && !isGenerating && (
        <div className="p-3 mx-4 mb-2 rounded-xl bg-rose-950/40 border border-rose-500/40 flex flex-col gap-2 shadow-lg animate-in fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-rose-300 font-semibold text-xs">
              <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
              <span>Runtime Issue Detected</span>
            </div>
            <button
              onClick={onDismissError}
              className="text-zinc-500 hover:text-zinc-300 text-xs px-1"
              title="Dismiss error"
            >
              ✕
            </button>
          </div>
          <p className="text-zinc-300 text-[11px] font-mono leading-relaxed line-clamp-2">
            {lastError.message} {lastError.lineno ? `(Line ${lastError.lineno})` : ''}
          </p>
          <div className="flex items-center gap-2 pt-0.5">
            <button
              onClick={() => onTriggerRepair(lastError)}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-semibold text-xs shadow-md shadow-violet-600/20 transition-all"
            >
              <Wrench className="w-3 h-3" />
              <span>Auto-Repair with AI</span>
            </button>
            <button
              onClick={() => setActiveTab('code')}
              className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs transition-colors"
            >
              Inspect Code
            </button>
          </div>
        </div>
      )}

      {/* Bottom Prompt Bar */}
      <PromptInput
        onGenerate={onGenerate}
        onCancel={onCancel}
        isGenerating={isGenerating}
        currentTitle={currentProject.title}
      />
    </div>
  );
};
