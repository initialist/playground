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
  onGenerate: (prompt: string) => void;
  onCancel: () => void;
  onNewApp: () => void;
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
  onNewApp,
  onTriggerRepair,
  onDismissError,
  onApplyManualCode,
  onSelectVersion,
}) => {
  const hasExistingApp = Boolean(currentProject.code && currentProject.code.trim().length > 0);

  return (
    <div className="w-full h-full flex flex-col bg-white border-r border-slate-200 select-none">
      {/* Navigation Tabs */}
      <div className="h-11 border-b border-slate-200 flex items-center justify-between px-3 bg-white">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab('copilot')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'copilot'
                ? 'bg-slate-100 text-indigo-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Agent Copilot</span>
          </button>

          <button
            onClick={() => setActiveTab('code')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'code'
                ? 'bg-slate-100 text-indigo-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Code</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'history'
                ? 'bg-slate-100 text-indigo-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
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
        <div className="p-3 mx-4 mb-2 rounded-2xl bg-red-50 border border-red-200 flex flex-col gap-2 shadow-sm animate-in fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-red-700 font-bold text-xs">
              <AlertCircle className="w-3.5 h-3.5 text-red-600" />
              <span>Runtime Issue Detected</span>
            </div>
            <button
              onClick={onDismissError}
              className="text-slate-400 hover:text-slate-700 text-xs px-1"
              title="Dismiss notice"
            >
              ✕
            </button>
          </div>
          <p className="text-red-800 text-[11px] font-mono leading-relaxed line-clamp-2">
            {lastError.message} {lastError.lineno ? `(Line ${lastError.lineno})` : ''}
          </p>
          <div className="flex items-center gap-2 pt-0.5">
            <button
              onClick={() => onTriggerRepair(lastError)}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold text-xs shadow-xs transition-all"
            >
              <Wrench className="w-3 h-3" />
              <span>Auto-Repair with AI</span>
            </button>
            <button
              onClick={() => setActiveTab('code')}
              className="px-2.5 py-1 rounded-lg bg-white border border-red-200 hover:bg-red-100 text-red-700 text-xs font-semibold transition-colors"
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
        onNewApp={onNewApp}
        isGenerating={isGenerating}
        currentTitle={currentProject.title}
        hasExistingApp={hasExistingApp}
      />
    </div>
  );
};
