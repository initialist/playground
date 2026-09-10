'use client';

import React from 'react';
import { Sparkles, Code2, History } from 'lucide-react';
import { PromptInput } from './PromptInput';
import { AgentStatusFeed } from './AgentStatusFeed';
import { CodeEditor } from './CodeEditor';
import { HistoryViewer } from './HistoryViewer';
import { GameProject, AgentThoughtStep, AgentStage } from '@/types/playground';

interface CopilotPanelProps {
  currentProject: GameProject;
  history: GameProject[];
  activeTab: 'copilot' | 'code' | 'history';
  setActiveTab: (tab: 'copilot' | 'code' | 'history') => void;
  thoughtSteps: AgentThoughtStep[];
  agentStage: AgentStage;
  streamingStatus: string;
  isGenerating: boolean;
  onGenerate: (prompt: string, isIteration: boolean) => void;
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
  onGenerate,
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

      {/* Bottom Prompt Bar */}
      <PromptInput
        onGenerate={onGenerate}
        isGenerating={isGenerating}
        currentTitle={currentProject.title}
      />
    </div>
  );
};
