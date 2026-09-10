'use client';

import React from 'react';
import {
  Gamepad2,
  Sparkles,
  Settings,
  Share2,
  Download,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Cpu,
  FolderOpen
} from 'lucide-react';
import { AgentStage, GameProject } from '@/types/playground';
import { STARTER_GAMES } from '@/data/starter-games';

interface HeaderProps {
  currentProject: GameProject;
  onUpdateTitle: (title: string) => void;
  onLoadStarter: (id: string) => void;
  agentStage: AgentStage;
  repairAttempts: number;
  model: string;
  hasApiKey: boolean;
  onOpenSettings: () => void;
  onOpenExport: () => void;
  onOpenShare: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentProject,
  onUpdateTitle,
  onLoadStarter,
  agentStage,
  repairAttempts,
  model,
  hasApiKey,
  onOpenSettings,
  onOpenExport,
  onOpenShare,
}) => {
  return (
    <header className="h-14 border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md px-4 flex items-center justify-between z-30 select-none">
      {/* Brand & Game Title */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 group cursor-pointer">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-violet-500/20 group-hover:scale-105 transition-transform">
            <Gamepad2 className="w-4 h-4" />
          </div>
          <span className="font-extrabold text-base tracking-tight bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
            Playground
          </span>
          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold tracking-wider uppercase bg-violet-500/10 text-violet-400 border border-violet-500/20">
            AI Studio
          </span>
        </div>

        <div className="h-4 w-px bg-zinc-800 mx-1" />

        {/* Current Project Title (Inline Editable) */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={currentProject.title}
            onChange={(e) => onUpdateTitle(e.target.value)}
            className="bg-transparent hover:bg-zinc-900 focus:bg-zinc-900 border border-transparent hover:border-zinc-800 focus:border-violet-500/50 rounded px-2 py-1 text-sm font-medium text-zinc-200 focus:outline-none transition-colors w-40 sm:w-56 truncate"
            title="Click to rename"
          />
          <span className="text-[11px] font-mono text-zinc-500 bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800">
            v{currentProject.version}
          </span>
        </div>

        {/* Starter Games Quick Dropdown */}
        <div className="relative group hidden md:block">
          <button className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800/80 px-2.5 py-1 rounded-md transition-colors">
            <FolderOpen className="w-3.5 h-3.5 text-zinc-400" />
            <span>Templates</span>
          </button>
          <div className="absolute left-0 top-full mt-1 w-52 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl shadow-black/50 py-1 hidden group-hover:block z-50">
            <div className="px-3 py-1 text-[10px] font-semibold uppercase text-zinc-500">
              Starter Games
            </div>
            {STARTER_GAMES.map((game) => (
              <button
                key={game.id}
                onClick={() => onLoadStarter(game.id)}
                className="w-full text-left px-3 py-1.5 text-xs text-zinc-300 hover:text-white hover:bg-violet-600/20 flex items-center justify-between"
              >
                <span>{game.title}</span>
                {game.id === currentProject.id && (
                  <span className="w-1.5 h-1.5 rounded-full bg-violet-400" />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Center: Agent Stage Indicator */}
      <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900/90 border border-zinc-800/80 text-xs">
        {agentStage === 'planning' && (
          <div className="flex items-center gap-2 text-amber-400">
            <Sparkles className="w-3.5 h-3.5 animate-spin" />
            <span>Architecting game mechanics...</span>
          </div>
        )}
        {agentStage === 'coding' && (
          <div className="flex items-center gap-2 text-blue-400">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            <span>Generating HTML5 & Canvas code...</span>
          </div>
        )}
        {agentStage === 'testing' && (
          <div className="flex items-center gap-2 text-purple-400">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            <span>Verifying sandbox diagnostics...</span>
          </div>
        )}
        {agentStage === 'healing' && (
          <div className="flex items-center gap-2 text-orange-400">
            <AlertCircle className="w-3.5 h-3.5 animate-pulse" />
            <span>Auto-repairing runtime error ({repairAttempts}/2)...</span>
          </div>
        )}
        {agentStage === 'ready' && (
          <div className="flex items-center gap-2 text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span className="text-zinc-300">Sandbox Active & Verified</span>
          </div>
        )}
        {agentStage === 'error' && (
          <div className="flex items-center gap-2 text-rose-400">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Build error detected</span>
          </div>
        )}
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2">
        {/* Model Tag */}
        <div
          onClick={onOpenSettings}
          className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-900 border border-zinc-800 text-xs text-zinc-400 hover:text-zinc-200 hover:border-zinc-700 cursor-pointer transition-colors"
          title="Configure Model & API Key"
        >
          <Cpu className="w-3.5 h-3.5 text-violet-400" />
          <span className="font-mono text-[11px]">{model}</span>
          {!hasApiKey && (
            <span className="w-2 h-2 rounded-full bg-amber-400" title="No custom API key set" />
          )}
        </div>

        {/* Export Button */}
        <button
          onClick={onOpenExport}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-medium text-zinc-300 hover:text-white transition-colors"
          title="Export Standalone HTML"
        >
          <Download className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Export</span>
        </button>

        {/* Share Button */}
        <button
          onClick={onOpenShare}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-md shadow-violet-500/20 transition-all"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span>Publish & Share</span>
        </button>

        {/* Settings Button */}
        <button
          onClick={onOpenSettings}
          className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 transition-colors"
          title="Settings"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
