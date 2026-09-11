'use client';

import React from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Download,
  Share2,
  Plus,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
} from 'lucide-react';
import { AgentStage, GameProject } from '@/types/playground';

interface HeaderProps {
  currentProject: GameProject;
  onUpdateTitle: (title: string) => void;
  onNewApp: () => void;
  agentStage: AgentStage;
  repairAttempts: number;
  onOpenPublish: () => void;
  onOpenExport: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentProject,
  onUpdateTitle,
  onNewApp,
  agentStage,
  repairAttempts,
  onOpenPublish,
  onOpenExport,
}) => {
  return (
    <header className="h-14 border-b border-slate-200 bg-white/95 backdrop-blur-md px-4 flex items-center justify-between z-30 select-none">
      {/* Brand & App Title */}
      <div className="flex items-center gap-3">
        <Link
          href="/explore"
          className="flex items-center gap-1.5 p-1.5 -ml-1.5 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
          title="Back to Community Gallery"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>

        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-xs">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <span className="font-extrabold text-sm tracking-tight text-slate-900">
            Studio
          </span>
        </div>

        <div className="h-4 w-px bg-slate-200 mx-1" />

        {/* Current Project Title (Inline Editable) */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={currentProject.title}
            onChange={(e) => onUpdateTitle(e.target.value)}
            placeholder="Untitled Mini-App"
            className="bg-transparent hover:bg-slate-50 focus:bg-white border border-transparent hover:border-slate-200 focus:border-indigo-500 rounded-lg px-2 py-1 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500/30 transition-colors w-36 sm:w-52 truncate"
            title="Click to rename"
          />
          {currentProject.version > 0 && (
            <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 font-semibold">
              v{currentProject.version}
            </span>
          )}
        </div>

        {/* New App Button */}
        <button
          onClick={onNewApp}
          className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/80 px-2.5 py-1 rounded-lg transition-colors shadow-xs"
          title="Clear canvas and start a brand new mini-app"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New App</span>
        </button>
      </div>

      {/* Center: Agent Stage Indicator */}
      <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full bg-slate-50 border border-slate-200 text-xs font-medium">
        {agentStage === 'planning' && (
          <div className="flex items-center gap-2 text-amber-600">
            <Sparkles className="w-3.5 h-3.5 animate-spin" />
            <span>Architecting mini-app...</span>
          </div>
        )}
        {agentStage === 'coding' && (
          <div className="flex items-center gap-2 text-indigo-600">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            <span>Streaming HTML5 & Canvas code...</span>
          </div>
        )}
        {agentStage === 'testing' && (
          <div className="flex items-center gap-2 text-purple-600">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            <span>Running 4-point runtime probe...</span>
          </div>
        )}
        {agentStage === 'healing' && (
          <div className="flex items-center gap-2 text-amber-700">
            <AlertCircle className="w-3.5 h-3.5 animate-pulse" />
            <span>Auto-repairing issue ({repairAttempts}/2)...</span>
          </div>
        )}
        {agentStage === 'ready' && (
          <div className="flex items-center gap-1.5 text-emerald-700">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Ready (Gemini 3.5 Flash Lite)</span>
          </div>
        )}
        {agentStage === 'error' && (
          <div className="flex items-center gap-2 text-red-600">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Issue detected</span>
          </div>
        )}
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2">
        {/* Model Pill (Locked to gemini-3.5-flash-lite) */}
        <div
          className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600"
          title="Engine: Gemini 3.5 Flash Lite"
        >
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span className="font-mono text-[11px] font-medium">gemini-3.5-flash-lite</span>
        </div>

        {/* Export Button */}
        <button
          onClick={onOpenExport}
          disabled={!currentProject.code}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 transition-colors disabled:opacity-40"
          title="Export Standalone HTML file"
        >
          <Download className="w-3.5 h-3.5 text-slate-500" />
          <span className="hidden sm:inline">Export</span>
        </button>

        {/* Publish Button */}
        <button
          onClick={onOpenPublish}
          disabled={!currentProject.code}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm active:scale-[0.98] transition-all disabled:opacity-40"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span>Publish & Save</span>
        </button>
      </div>
    </header>
  );
};
