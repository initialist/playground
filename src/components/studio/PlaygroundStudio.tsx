'use client';

import React, { useState } from 'react';
import { usePlayground } from '@/lib/use-playground';
import { Header } from '@/components/layout/Header';
import { CopilotPanel } from '@/components/copilot/CopilotPanel';
import { GameStage } from '@/components/stage/GameStage';
import { SettingsModal } from '@/components/modals/SettingsModal';
import { ExportModal } from '@/components/modals/ExportModal';
import { ShareModal } from '@/components/modals/ShareModal';

export function PlaygroundStudio() {
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
    apiKey,
    model,
    saveSettings,
    isSettingsOpen,
    setIsSettingsOpen,
    isExportOpen,
    setIsExportOpen,
    isShareOpen,
    setIsShareOpen,
    generateGame,
    cancelOperation,
    triggerAutoRepair,
    updateCodeManually,
    loadStarter,
    sandboxedHtml,
  } = usePlayground();

  // Split-pane width state for desktop (in percent, default 38%)
  const [copilotWidth, setCopilotWidth] = useState(38);
  const [isDraggingSplitter, setIsDraggingSplitter] = useState(false);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDraggingSplitter(true);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const windowWidth = window.innerWidth;
      const newWidth = Math.max(25, Math.min(65, (moveEvent.clientX / windowWidth) * 100));
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
    setCurrentProject(prev => ({
      ...prev,
      title: newTitle,
    }));
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-zinc-950 text-zinc-100 antialiased font-sans">
      {/* Top Header */}
      <Header
        currentProject={currentProject}
        onUpdateTitle={handleUpdateTitle}
        onLoadStarter={loadStarter}
        agentStage={agentStage}
        repairAttempts={repairAttempts}
        model={model}
        hasApiKey={Boolean(apiKey)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenExport={() => setIsExportOpen(true)}
        onOpenShare={() => setIsShareOpen(true)}
      />

      {/* Main Studio Area */}
      <main className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        {/* Left: Copilot & Code Studio */}
        <div
          style={{ width: `${copilotWidth}%` }}
          className="h-1/2 md:h-full flex-shrink-0 min-w-[320px] max-w-[800px] flex flex-col z-10"
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
            onTriggerRepair={triggerAutoRepair}
            onDismissError={() => setLastError(null)}
            onApplyManualCode={updateCodeManually}
            onSelectVersion={setCurrentProject}
          />
        </div>

        {/* Resizer Splitter (Desktop) */}
        <div
          onMouseDown={handleMouseDown}
          className={`hidden md:flex w-1.5 hover:w-2 bg-zinc-900 hover:bg-violet-600/50 cursor-col-resize transition-all items-center justify-center relative z-20 select-none ${
            isDraggingSplitter ? 'bg-violet-600 w-2' : ''
          }`}
        >
          <div className="w-0.5 h-8 bg-zinc-700 rounded-full pointer-events-none" />
        </div>

        {/* Right: Game Stage Sandbox */}
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

      {/* Modals */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        apiKey={apiKey}
        model={model}
        onSave={saveSettings}
      />

      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        project={currentProject}
      />

      <ShareModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        project={currentProject}
      />
    </div>
  );
}
