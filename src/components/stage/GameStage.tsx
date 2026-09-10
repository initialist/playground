'use client';

import React, { useRef, useState, useEffect } from 'react';
import {
  RotateCcw,
  Maximize2,
  Minimize2,
  Smartphone,
  Monitor,
  Square,
  Maximize,
  Terminal,
  Volume2,
  VolumeX,
  Trash2,
  AlertCircle,
  Gamepad
} from 'lucide-react';
import { DeviceMode, ConsoleMessage } from '@/types/playground';

interface GameStageProps {
  sandboxedHtml: string;
  deviceMode: DeviceMode;
  setDeviceMode: (mode: DeviceMode) => void;
  consoleLogs: ConsoleMessage[];
  onClearLogs: () => void;
}

export const GameStage: React.FC<GameStageProps> = ({
  sandboxedHtml,
  deviceMode,
  setDeviceMode,
  consoleLogs,
  onClearLogs,
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showConsole, setShowConsole] = useState(false);
  const [consoleFilter, setConsoleFilter] = useState<'all' | 'log' | 'error'>('all');
  const [showVirtualControls, setShowVirtualControls] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  // Restart game
  const handleRestart = () => {
    setReloadKey(prev => prev + 1);
  };

  // Keyboard shortcut for restart (Ctrl+R / Cmd+R)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'r') {
        // Only prevent if focus is not in an editable area
        const target = e.target as HTMLElement;
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
          e.preventDefault();
          handleRestart();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  // Dispatch virtual key press to iframe
  const sendVirtualKey = (key: string, isDown: boolean) => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        { type: 'PLAYGROUND_VIRTUAL_KEY', key, isDown },
        '*'
      );
    }
  };

  const errorCount = consoleLogs.filter(l => l.type === 'error').length;
  const filteredLogs = consoleLogs.filter(l => {
    if (consoleFilter === 'all') return true;
    if (consoleFilter === 'error') return l.type === 'error';
    return l.type !== 'error';
  });

  // Calculate container aspect ratio styling
  const getDeviceStyles = () => {
    switch (deviceMode) {
      case 'mobile':
        return 'w-[375px] h-[667px] max-h-[90%] rounded-[36px] border-4 border-zinc-800 shadow-2xl overflow-hidden';
      case 'arcade':
        return 'w-[520px] h-[520px] max-h-[90%] rounded-2xl border-2 border-zinc-800 shadow-2xl overflow-hidden';
      case 'desktop':
        return 'w-[840px] h-[520px] max-w-[95%] max-h-[90%] rounded-2xl border-2 border-zinc-800 shadow-2xl overflow-hidden';
      case 'fluid':
      default:
        return 'w-full h-full rounded-none border-none';
    }
  };

  return (
    <div
      ref={containerRef}
      className="flex-1 h-full flex flex-col bg-zinc-950 relative overflow-hidden select-none"
    >
      {/* Top Toolbar */}
      <div className="h-11 border-b border-zinc-800/80 px-4 flex items-center justify-between bg-zinc-900/40 backdrop-blur-sm z-20">
        {/* Device Mode Switcher */}
        <div className="flex items-center gap-1 bg-zinc-900 p-0.5 rounded-lg border border-zinc-800">
          <button
            onClick={() => setDeviceMode('desktop')}
            className={`p-1.5 rounded text-xs transition-colors ${
              deviceMode === 'desktop'
                ? 'bg-zinc-800 text-violet-400 font-medium'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
            title="Desktop 16:9"
          >
            <Monitor className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setDeviceMode('arcade')}
            className={`p-1.5 rounded text-xs transition-colors ${
              deviceMode === 'arcade'
                ? 'bg-zinc-800 text-violet-400 font-medium'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
            title="Arcade Cabinet 1:1"
          >
            <Square className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setDeviceMode('mobile')}
            className={`p-1.5 rounded text-xs transition-colors ${
              deviceMode === 'mobile'
                ? 'bg-zinc-800 text-violet-400 font-medium'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
            title="Mobile Portrait 9:16"
          >
            <Smartphone className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setDeviceMode('fluid')}
            className={`p-1.5 rounded text-xs transition-colors ${
              deviceMode === 'fluid'
                ? 'bg-zinc-800 text-violet-400 font-medium'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
            title="Fill Container"
          >
            <Maximize className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5">
          {/* Virtual Mobile Controls toggle */}
          <button
            onClick={() => setShowVirtualControls(!showVirtualControls)}
            className={`p-1.5 rounded-md border text-xs transition-colors ${
              showVirtualControls
                ? 'bg-violet-600/20 border-violet-500/40 text-violet-300'
                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
            title="Toggle Virtual Touch Controls"
          >
            <Gamepad className="w-3.5 h-3.5" />
          </button>

          {/* Restart */}
          <button
            onClick={handleRestart}
            className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs text-zinc-300 hover:text-white transition-colors"
            title="Restart Game (Ctrl+R)"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Restart</span>
          </button>

          {/* Audio toggle */}
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="p-1.5 rounded-md bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
            title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5 text-zinc-500" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>

          {/* Fullscreen */}
          <button
            onClick={toggleFullscreen}
            className="p-1.5 rounded-md bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>

          {/* Console Drawer Toggle */}
          <button
            onClick={() => setShowConsole(!showConsole)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs transition-colors ${
              showConsole
                ? 'bg-zinc-800 border-zinc-700 text-zinc-200'
                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
            title="Toggle Console Logs"
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Console</span>
            {errorCount > 0 ? (
              <span className="px-1 py-0.2 rounded-full text-[9px] font-bold bg-rose-500 text-white animate-pulse">
                {errorCount}
              </span>
            ) : consoleLogs.length > 0 ? (
              <span className="text-[10px] text-zinc-500 font-mono">
                {consoleLogs.length}
              </span>
            ) : null}
          </button>
        </div>
      </div>

      {/* Center Stage Container */}
      <div className="flex-1 relative flex items-center justify-center p-4 bg-radial from-zinc-900/40 to-zinc-950 overflow-hidden">
        {/* Visual Device Frame Wrapper */}
        <div className={`relative transition-all duration-300 flex flex-col items-center justify-center ${getDeviceStyles()}`}>
          {/* Optional Mobile Camera Notch */}
          {deviceMode === 'mobile' && (
            <div className="absolute top-2 w-28 h-4 bg-zinc-800 rounded-full z-20 pointer-events-none" />
          )}

          {/* Sandboxed Game Iframe */}
          <iframe
            key={reloadKey}
            ref={iframeRef}
            srcDoc={sandboxedHtml}
            sandbox="allow-scripts allow-modals allow-downloads allow-pointer-lock allow-same-origin"
            className="w-full h-full border-none bg-black"
            title="Playground Game Preview"
          />

          {/* Virtual On-Screen Gamepad Controls Overlay */}
          {showVirtualControls && (
            <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between pointer-events-none z-30 opacity-80 hover:opacity-100 transition-opacity">
              {/* Virtual D-Pad */}
              <div className="relative w-32 h-32 pointer-events-auto">
                {/* UP */}
                <button
                  onMouseDown={() => sendVirtualKey('ArrowUp', true)}
                  onMouseUp={() => sendVirtualKey('ArrowUp', false)}
                  onTouchStart={() => sendVirtualKey('ArrowUp', true)}
                  onTouchEnd={() => sendVirtualKey('ArrowUp', false)}
                  className="absolute top-0 left-11 w-10 h-10 bg-zinc-800/90 active:bg-violet-600 rounded-md border border-zinc-700 flex items-center justify-center text-white text-xs font-bold"
                >
                  ▲
                </button>
                {/* LEFT */}
                <button
                  onMouseDown={() => sendVirtualKey('ArrowLeft', true)}
                  onMouseUp={() => sendVirtualKey('ArrowLeft', false)}
                  onTouchStart={() => sendVirtualKey('ArrowLeft', true)}
                  onTouchEnd={() => sendVirtualKey('ArrowLeft', false)}
                  className="absolute top-11 left-0 w-10 h-10 bg-zinc-800/90 active:bg-violet-600 rounded-md border border-zinc-700 flex items-center justify-center text-white text-xs font-bold"
                >
                  ◀
                </button>
                {/* RIGHT */}
                <button
                  onMouseDown={() => sendVirtualKey('ArrowRight', true)}
                  onMouseUp={() => sendVirtualKey('ArrowRight', false)}
                  onTouchStart={() => sendVirtualKey('ArrowRight', true)}
                  onTouchEnd={() => sendVirtualKey('ArrowRight', false)}
                  className="absolute top-11 right-0 w-10 h-10 bg-zinc-800/90 active:bg-violet-600 rounded-md border border-zinc-700 flex items-center justify-center text-white text-xs font-bold"
                >
                  ▶
                </button>
                {/* DOWN */}
                <button
                  onMouseDown={() => sendVirtualKey('ArrowDown', true)}
                  onMouseUp={() => sendVirtualKey('ArrowDown', false)}
                  onTouchStart={() => sendVirtualKey('ArrowDown', true)}
                  onTouchEnd={() => sendVirtualKey('ArrowDown', false)}
                  className="absolute bottom-0 left-11 w-10 h-10 bg-zinc-800/90 active:bg-violet-600 rounded-md border border-zinc-700 flex items-center justify-center text-white text-xs font-bold"
                >
                  ▼
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pointer-events-auto">
                <button
                  onMouseDown={() => sendVirtualKey('Space', true)}
                  onMouseUp={() => sendVirtualKey('Space', false)}
                  onTouchStart={() => sendVirtualKey('Space', true)}
                  onTouchEnd={() => sendVirtualKey('Space', false)}
                  className="w-14 h-14 rounded-full bg-violet-600/90 active:bg-violet-500 border border-violet-400 text-white font-bold text-xs shadow-lg shadow-violet-600/30 flex items-center justify-center"
                >
                  ACTION
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Slide-Up Console Drawer */}
      {showConsole && (
        <div className="h-56 border-t border-zinc-800 bg-zinc-950 flex flex-col font-mono text-xs z-30 transition-all shadow-2xl">
          <div className="h-8 px-3 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/80">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-zinc-300">Sandbox Logs</span>
              <div className="flex items-center gap-1 ml-2">
                <button
                  onClick={() => setConsoleFilter('all')}
                  className={`px-1.5 py-0.5 rounded text-[10px] ${
                    consoleFilter === 'all'
                      ? 'bg-zinc-800 text-white'
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  All ({consoleLogs.length})
                </button>
                <button
                  onClick={() => setConsoleFilter('log')}
                  className={`px-1.5 py-0.5 rounded text-[10px] ${
                    consoleFilter === 'log'
                      ? 'bg-zinc-800 text-white'
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  Logs ({consoleLogs.filter(l => l.type !== 'error').length})
                </button>
                <button
                  onClick={() => setConsoleFilter('error')}
                  className={`px-1.5 py-0.5 rounded text-[10px] ${
                    consoleFilter === 'error'
                      ? 'bg-rose-950 text-rose-400'
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  Errors ({errorCount})
                </button>
              </div>
            </div>

            <button
              onClick={onClearLogs}
              className="flex items-center gap-1 text-[11px] text-zinc-500 hover:text-zinc-300"
              title="Clear Console"
            >
              <Trash2 className="w-3 h-3" />
              <span>Clear</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-1">
            {filteredLogs.length === 0 ? (
              <div className="text-zinc-600 italic py-4 text-center">
                No logs recorded yet. Game events and errors will appear here.
              </div>
            ) : (
              filteredLogs.map(log => (
                <div
                  key={log.id}
                  className={`py-1 px-1.5 rounded flex items-start gap-2 leading-relaxed ${
                    log.type === 'error'
                      ? 'bg-rose-950/30 text-rose-300 border-l-2 border-rose-500'
                      : log.type === 'warn'
                      ? 'bg-amber-950/20 text-amber-300'
                      : 'text-zinc-300 hover:bg-zinc-900/50'
                  }`}
                >
                  <span className="text-zinc-600 text-[10px] whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })}
                  </span>
                  {log.type === 'error' && <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />}
                  <span className="break-all">{log.message}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
