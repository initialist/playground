'use client';

import React, { useRef, useState, useEffect, useMemo } from 'react';
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
  Gamepad,
  Ratio,
  Scaling,
  Sparkles,
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
  const stageAreaRef = useRef<HTMLDivElement>(null);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showConsole, setShowConsole] = useState(false);
  const [consoleFilter, setConsoleFilter] = useState<'all' | 'log' | 'error'>('all');
  const [showVirtualControls, setShowVirtualControls] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  // Scaling mode: 'fit' (strict aspect ratio) or 'stretch' (fill container)
  const [scaleMode, setScaleMode] = useState<'fit' | 'stretch'>('fit');
  const [isPixelated, setIsPixelated] = useState(false);

  // Measure stage area dynamically
  const [stageDimensions, setStageDimensions] = useState({ width: 800, height: 600 });

  useEffect(() => {
    if (!stageAreaRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect) {
          setStageDimensions({
            width: Math.floor(entry.contentRect.width),
            height: Math.floor(entry.contentRect.height),
          });
        }
      }
    });
    observer.observe(stageAreaRef.current);
    return () => observer.disconnect();
  }, []);

  // Compute exact frame sizing to strictly fit available stage area without any overflow
  const frameGeometry = useMemo(() => {
    if (scaleMode === 'stretch' || deviceMode === 'fluid') {
      return {
        width: '100%',
        height: '100%',
        computedW: stageDimensions.width,
        computedH: stageDimensions.height,
        ratioLabel: 'Fluid',
        wrapperClass: 'w-full h-full rounded-none border-none',
      };
    }

    const paddingX = 32;
    const paddingY = 32;
    const availW = Math.max(120, stageDimensions.width - paddingX);
    const availH = Math.max(120, stageDimensions.height - paddingY);

    let targetRatio = 16 / 9;
    let ratioLabel = '16:9';
    let wrapperClass = 'rounded-2xl border border-slate-300 shadow-lg';

    if (deviceMode === 'mobile') {
      targetRatio = 9 / 16;
      ratioLabel = '9:16';
      wrapperClass = 'rounded-[36px] border-4 border-slate-800 shadow-xl';
    } else if (deviceMode === 'arcade') {
      targetRatio = 1 / 1;
      ratioLabel = '1:1';
      wrapperClass = 'rounded-2xl border border-slate-300 shadow-lg';
    }

    let w = availW;
    let h = w / targetRatio;

    if (h > availH) {
      h = availH;
      w = h * targetRatio;
    }

    const finalW = Math.round(w);
    const finalH = Math.round(h);

    return {
      width: `${finalW}px`,
      height: `${finalH}px`,
      computedW: finalW,
      computedH: finalH,
      ratioLabel,
      wrapperClass,
    };
  }, [stageDimensions, deviceMode, scaleMode]);

  const handleRestart = () => {
    setReloadKey((prev) => prev + 1);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'r') {
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

  useEffect(() => {
    const timer = setTimeout(() => {
      if (iframeRef.current && iframeRef.current.contentWindow) {
        iframeRef.current.contentWindow.dispatchEvent(new Event('resize'));
      }
    }, 50);
    return () => clearTimeout(timer);
  }, [frameGeometry.computedW, frameGeometry.computedH, deviceMode]);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const sendVirtualKey = (key: string, isDown: boolean) => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        { type: 'PLAYGROUND_VIRTUAL_KEY', key, isDown },
        '*'
      );
    }
  };

  const errorCount = consoleLogs.filter((l) => l.type === 'error').length;
  const filteredLogs = consoleLogs.filter((l) => {
    if (consoleFilter === 'all') return true;
    if (consoleFilter === 'error') return l.type === 'error';
    return l.type !== 'error';
  });

  return (
    <div
      ref={containerRef}
      className="flex-1 h-full flex flex-col bg-slate-100/70 relative overflow-hidden select-none"
    >
      {/* Top Toolbar */}
      <div className="h-11 border-b border-slate-200 px-4 flex items-center justify-between bg-white z-20">
        {/* Device Mode Switcher */}
        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-0.5 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            <button
              onClick={() => setDeviceMode('desktop')}
              className={`p-1.5 rounded-md text-xs transition-colors ${
                deviceMode === 'desktop'
                  ? 'bg-white text-indigo-600 font-semibold shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Desktop (16:9 Widescreen)"
            >
              <Monitor className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setDeviceMode('arcade')}
              className={`p-1.5 rounded-md text-xs transition-colors ${
                deviceMode === 'arcade'
                  ? 'bg-white text-indigo-600 font-semibold shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Square (1:1)"
            >
              <Square className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setDeviceMode('mobile')}
              className={`p-1.5 rounded-md text-xs transition-colors ${
                deviceMode === 'mobile'
                  ? 'bg-white text-indigo-600 font-semibold shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Mobile Portrait (9:16)"
            >
              <Smartphone className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setDeviceMode('fluid')}
              className={`p-1.5 rounded-md text-xs transition-colors ${
                deviceMode === 'fluid'
                  ? 'bg-white text-indigo-600 font-semibold shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Fill Entire Stage"
            >
              <Maximize className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-1 px-2 py-0.5 rounded bg-slate-50 border border-slate-200 text-[10px] font-mono text-slate-500">
            <Ratio className="w-3 h-3 text-indigo-600" />
            <span>
              {frameGeometry.computedW} × {frameGeometry.computedH} ({frameGeometry.ratioLabel})
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5">
          {/* Fit vs Stretch */}
          <button
            onClick={() => setScaleMode(scaleMode === 'fit' ? 'stretch' : 'fit')}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-xs transition-colors ${
              scaleMode === 'stretch'
                ? 'bg-indigo-50 border-indigo-200 text-indigo-700 font-semibold'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
            title={scaleMode === 'fit' ? 'Switch to Stretch Fill' : 'Switch to Aspect Ratio Fit'}
          >
            <Scaling className="w-3.5 h-3.5" />
            <span className="hidden md:inline text-[11px] capitalize">{scaleMode}</span>
          </button>

          {/* Crisp Pixel Sharpness Toggle */}
          <button
            onClick={() => setIsPixelated(!isPixelated)}
            className={`p-1.5 rounded-lg border text-xs transition-colors ${
              isPixelated
                ? 'bg-indigo-50 border-indigo-200 text-indigo-700 font-semibold'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
            title={isPixelated ? 'Pixel Art Sharpness: ON' : 'Pixel Art Sharpness: OFF'}
          >
            <Sparkles className="w-3.5 h-3.5" />
          </button>

          {/* Virtual Mobile Controls toggle */}
          <button
            onClick={() => setShowVirtualControls(!showVirtualControls)}
            className={`p-1.5 rounded-lg border text-xs transition-colors ${
              showVirtualControls
                ? 'bg-indigo-50 border-indigo-200 text-indigo-700 font-semibold'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
            title="Toggle Virtual Touch Controls"
          >
            <Gamepad className="w-3.5 h-3.5" />
          </button>

          {/* Restart */}
          <button
            onClick={handleRestart}
            disabled={!sandboxedHtml}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 transition-colors disabled:opacity-40"
            title="Restart Mini-App (Ctrl+R)"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Restart</span>
          </button>

          {/* Audio toggle */}
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="p-1.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 transition-colors"
            title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5 text-slate-400" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>

          {/* Fullscreen */}
          <button
            onClick={toggleFullscreen}
            className="p-1.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 transition-colors"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>

          {/* Console Drawer Toggle */}
          <button
            onClick={() => setShowConsole(!showConsole)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs transition-colors ${
              showConsole
                ? 'bg-slate-100 border-slate-300 text-slate-900 font-semibold'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
            title="Toggle Console Logs"
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Console</span>
            {errorCount > 0 ? (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-red-600 text-white animate-pulse">
                {errorCount}
              </span>
            ) : consoleLogs.length > 0 ? (
              <span className="text-[10px] text-slate-400 font-mono">
                {consoleLogs.length}
              </span>
            ) : null}
          </button>
        </div>
      </div>

      {/* Center Stage Container */}
      <div
        ref={stageAreaRef}
        className="flex-1 relative flex items-center justify-center p-4 bg-slate-100/60 overflow-hidden"
      >
        {sandboxedHtml ? (
          /* Visual Device Frame Wrapper with Dynamic Resolution Sizing */
          <div
            style={{
              width: frameGeometry.width,
              height: frameGeometry.height,
            }}
            className={`relative transition-all duration-150 flex flex-col items-center justify-center overflow-hidden bg-white ${frameGeometry.wrapperClass}`}
          >
            {deviceMode === 'mobile' && scaleMode === 'fit' && (
              <div className="absolute top-2 w-20 h-3 bg-slate-800 rounded-full z-20 pointer-events-none" />
            )}

            {/* Sandboxed Iframe */}
            <iframe
              key={reloadKey}
              ref={iframeRef}
              srcDoc={sandboxedHtml}
              sandbox="allow-scripts allow-modals allow-downloads allow-pointer-lock allow-same-origin"
              style={{
                imageRendering: isPixelated ? 'pixelated' : 'auto',
              }}
              className="w-full h-full border-none bg-white block flex-1"
              title="Mini-App Preview Stage"
            />

            {/* Virtual Touch Controls */}
            {showVirtualControls && (
              <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between pointer-events-none z-30 opacity-80 hover:opacity-100 transition-opacity">
                <div className="relative w-32 h-32 pointer-events-auto">
                  <button
                    onMouseDown={() => sendVirtualKey('ArrowUp', true)}
                    onMouseUp={() => sendVirtualKey('ArrowUp', false)}
                    className="absolute top-0 left-11 w-10 h-10 bg-slate-900/90 active:bg-indigo-600 rounded-md border border-slate-700 flex items-center justify-center text-white text-xs font-bold"
                  >
                    ▲
                  </button>
                  <button
                    onMouseDown={() => sendVirtualKey('ArrowLeft', true)}
                    onMouseUp={() => sendVirtualKey('ArrowLeft', false)}
                    className="absolute top-11 left-0 w-10 h-10 bg-slate-900/90 active:bg-indigo-600 rounded-md border border-slate-700 flex items-center justify-center text-white text-xs font-bold"
                  >
                    ◀
                  </button>
                  <button
                    onMouseDown={() => sendVirtualKey('ArrowRight', true)}
                    onMouseUp={() => sendVirtualKey('ArrowRight', false)}
                    className="absolute top-11 right-0 w-10 h-10 bg-slate-900/90 active:bg-indigo-600 rounded-md border border-slate-700 flex items-center justify-center text-white text-xs font-bold"
                  >
                    ▶
                  </button>
                  <button
                    onMouseDown={() => sendVirtualKey('ArrowDown', true)}
                    onMouseUp={() => sendVirtualKey('ArrowDown', false)}
                    className="absolute bottom-0 left-11 w-10 h-10 bg-slate-900/90 active:bg-indigo-600 rounded-md border border-slate-700 flex items-center justify-center text-white text-xs font-bold"
                  >
                    ▼
                  </button>
                </div>

                <div className="pointer-events-auto">
                  <button
                    onMouseDown={() => sendVirtualKey('Space', true)}
                    onMouseUp={() => sendVirtualKey('Space', false)}
                    className="w-14 h-14 rounded-full bg-indigo-600 active:bg-indigo-700 text-white font-bold text-xs shadow-lg flex items-center justify-center"
                  >
                    ACTION
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Clean Canvas Empty State View */
          <div className="max-w-md w-full text-center p-8 rounded-3xl border border-dashed border-slate-300 bg-white/90 card-shadow">
            <div className="h-12 w-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mx-auto mb-4">
              <Sparkles className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">
              Clean Studio Canvas
            </h3>
            <p className="mt-1 text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
              Describe your mini-app idea in the copilot on the left. The agent will stream code, execute a 4-point verification probe, and render it right here.
            </p>
          </div>
        )}
      </div>

      {/* Slide-Up Console Drawer */}
      {showConsole && (
        <div className="h-56 border-t border-slate-200 bg-slate-950 flex flex-col font-mono text-xs z-30 transition-all shadow-2xl">
          <div className="h-8 px-3 border-b border-slate-800 flex items-center justify-between bg-slate-900">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-300">Sandbox Logs</span>
              <div className="flex items-center gap-1 ml-2">
                <button
                  onClick={() => setConsoleFilter('all')}
                  className={`px-2 py-0.5 rounded text-[10px] ${
                    consoleFilter === 'all'
                      ? 'bg-slate-800 text-white font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  All ({consoleLogs.length})
                </button>
                <button
                  onClick={() => setConsoleFilter('log')}
                  className={`px-2 py-0.5 rounded text-[10px] ${
                    consoleFilter === 'log'
                      ? 'bg-slate-800 text-white font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Logs ({consoleLogs.filter((l) => l.type !== 'error').length})
                </button>
                <button
                  onClick={() => setConsoleFilter('error')}
                  className={`px-2 py-0.5 rounded text-[10px] ${
                    consoleFilter === 'error'
                      ? 'bg-red-950 text-red-300 font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Errors ({errorCount})
                </button>
              </div>
            </div>

            <button
              onClick={onClearLogs}
              className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-200"
              title="Clear Console"
            >
              <Trash2 className="w-3 h-3" />
              <span>Clear</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-1">
            {filteredLogs.length === 0 ? (
              <div className="text-slate-600 italic py-4 text-center">
                No logs recorded yet. Mini-app output and probe results appear here.
              </div>
            ) : (
              filteredLogs.map((log) => (
                <div
                  key={log.id}
                  className={`py-1 px-2 rounded flex items-start gap-2 leading-relaxed ${
                    log.type === 'error'
                      ? 'bg-red-950/40 text-red-300 border-l-2 border-red-500'
                      : log.type === 'warn'
                      ? 'bg-amber-950/20 text-amber-300'
                      : 'text-slate-300 hover:bg-slate-900/50'
                  }`}
                >
                  <span className="text-slate-500 text-[10px] whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })}
                  </span>
                  {log.type === 'error' && <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />}
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
