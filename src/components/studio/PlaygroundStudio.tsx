'use client';

import React, { useState } from 'react';
import { usePlayground } from '@/lib/use-playground';
import { Header } from '@/components/layout/Header';
import { CopilotPanel } from '@/components/copilot/CopilotPanel';
import { GameStage } from '@/components/stage/GameStage';
import { ExportModal } from '@/components/modals/ExportModal';
import PublishModal from '@/components/PublishModal';
import { GameProject } from '@/types/playground';

export function PlaygroundStudio({
  initialApp,
}: {
  initialApp?: GameProject | null;
}) {
  const {
    currentProject,
    setCurrentProject,
    history,
    deviceMode,
    setDeviceMode,
    activeTab,
    setActiveTab,
    agentStage,
    thoughtSteps,
    streamingStatus,
    isGenerating,
    repairAttempts,
    consoleLogs,
    clearLogs,
    lastError,
    setLastError,
    isPublishOpen,
    setIsPublishOpen,
    isExportOpen,
    setIsExportOpen,
    generateGame,
    cancelOperation,
    resetToNewApp,
    triggerAutoRepair,
    updateCodeManually,
    sandboxedHtml,
  } = usePlayground(initialApp);

  // Split-pane width state for desktop (in percent, default 36%)
  const [copilotWidth, setCopilotWidth] = useState(36);
  const [isDraggingSplitter, setIsDraggingSplitter] = useState(false);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDraggingSplitter(true);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const windowWidth = window.innerWidth;
      const newWidth = Math.max(25, Math.min(60, (moveEvent.clientX / windowWidth) * 100));
      setCopilotWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsDraggingSplitter(false);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const handleUpdateTitle = (newTitle: string) => {
    setCurrentProject((prev) => ({
      ...prev,
      title: newTitle,
    }));
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#fbfbfa] text-slate-900 antialiased font-sans">
      {/* Top Header */}
      <Header
        currentProject={currentProject}
        onUpdateTitle={handleUpdateTitle}
        onNewApp={resetToNewApp}
        agentStage={agentStage}
        repairAttempts={repairAttempts}
        onOpenPublish={() => setIsPublishOpen(true)}
        onOpenExport={() => setIsExportOpen(true)}
      />

      {/* Main Studio Area */}
      <main className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        {/* Left: Copilot & Code Studio */}
        <div
          style={{ width: `${copilotWidth}%` }}
          className="h-1/2 md:h-full flex-shrink-0 min-w-[320px] max-w-[700px] flex flex-col z-10 bg-white"
        >
          <CopilotPanel
            currentProject={currentProject}
            history={history}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            thoughtSteps={thoughtSteps}
            agentStage={agentStage}
            streamingStatus={streamingStatus}
            isGenerating={isGenerating}
            lastError={lastError}
            onGenerate={generateGame}
            onCancel={cancelOperation}
            onNewApp={resetToNewApp}
            onTriggerRepair={triggerAutoRepair}
            onDismissError={() => setLastError(null)}
            onApplyManualCode={updateCodeManually}
            onSelectVersion={setCurrentProject}
          />
        </div>

        {/* Resizer Splitter (Desktop) */}
        <div
          onMouseDown={handleMouseDown}
          className={`hidden md:flex w-1 hover:w-1.5 bg-slate-200 hover:bg-indigo-500 cursor-col-resize transition-all items-center justify-center relative z-20 select-none ${
            isDraggingSplitter ? 'bg-indigo-600 w-1.5' : ''
          }`}
        >
          <div className="w-0.5 h-8 bg-slate-400 rounded-full pointer-events-none" />
        </div>

        {/* Right: Stage Sandbox */}
        <div className="flex-1 h-1/2 md:h-full overflow-hidden flex flex-col">
          <GameStage
            sandboxedHtml={sandboxedHtml}
            deviceMode={deviceMode}
            setDeviceMode={setDeviceMode}
            consoleLogs={consoleLogs}
            onClearLogs={clearLogs}
          />
        </div>
      </main>

      {/* Publish & Share Modal */}
      <PublishModal
        isOpen={isPublishOpen}
        onClose={() => setIsPublishOpen(false)}
        code={currentProject.code}
        defaultTitle={currentProject.title}
        defaultPrompt={currentProject.prompt}
        appId={currentProject.id !== 'blank' ? currentProject.id : undefined}
      />

      {/* Export Modal */}
      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        project={currentProject}
      />
    </div>
  );
}
