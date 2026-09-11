"use client";

import React, { useState, useRef } from "react";
import { Maximize2, Minimize2, RotateCw, Code } from "lucide-react";

interface AppData {
  id: string;
  title: string;
  code: string;
}

export default function ProjectPlayerClient({ app }: { app: AppData }) {
  const [key, setKey] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleRestart = () => {
    setKey((prev) => prev + 1);
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  return (
    <div
      ref={containerRef}
      className={`rounded-2xl border border-slate-200 bg-white overflow-hidden card-shadow flex flex-col ${
        isFullscreen ? "h-screen w-screen rounded-none" : "h-[540px] sm:h-[600px]"
      }`}
    >
      {/* Player Top Controls */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50/80 border-b border-slate-200 text-xs">
        <div className="flex items-center gap-2">
          <button
            onClick={handleRestart}
            title="Restart Mini-App"
            className="flex items-center gap-1.5 rounded-lg bg-white border border-slate-200 px-2.5 py-1 font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-xs"
          >
            <RotateCw className="h-3.5 w-3.5 text-slate-500" />
            Restart
          </button>
          <button
            onClick={() => setShowCode(!showCode)}
            className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 font-semibold transition-colors shadow-xs ${
              showCode
                ? "bg-indigo-50 border-indigo-200 text-indigo-700"
                : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
            }`}
          >
            <Code className="h-3.5 w-3.5" />
            {showCode ? "Hide Code" : "Inspect Code"}
          </button>
        </div>

        <button
          onClick={toggleFullscreen}
          title={isFullscreen ? "Exit Fullscreen" : "Fullscreen Stage"}
          className="flex items-center gap-1.5 rounded-lg bg-white border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-50 transition-colors shadow-xs"
        >
          {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
        </button>
      </div>

      {/* Main View: Code or Iframe */}
      <div className="flex-1 relative bg-slate-950">
        {showCode ? (
          <div className="absolute inset-0 overflow-auto p-4 bg-slate-900 text-slate-200 font-mono text-xs leading-relaxed selection:bg-indigo-500 selection:text-white">
            <pre>{app.code}</pre>
          </div>
        ) : (
          <iframe
            key={key}
            srcDoc={app.code}
            title={app.title}
            className="w-full h-full border-0 bg-white"
            sandbox="allow-scripts allow-modals allow-pointer-lock allow-same-origin"
          />
        )}
      </div>
    </div>
  );
}
