"use client";

import React from "react";
import Link from "next/link";
import { Play, GitFork, Eye, Sparkles } from "lucide-react";

export interface AppSummary {
  id: string;
  title: string;
  description?: string | null;
  category: string;
  tags?: string | null;
  views: number;
  likes: number;
  forks: number;
  authorName?: string | null;
  author?: {
    id: string;
    username: string;
    avatar?: string | null;
  } | null;
  createdAt: string;
}

const CATEGORY_STYLES: Record<string, { label: string; bg: string; text: string; border: string }> = {
  tools: {
    label: "Tool",
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
  },
  simulators: {
    label: "Simulator",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
  },
  interactive: {
    label: "Interactive",
    bg: "bg-purple-50",
    text: "text-purple-700",
    border: "border-purple-200",
  },
  art: {
    label: "Art & Visuals",
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
  },
  general: {
    label: "Mini-App",
    bg: "bg-slate-50",
    text: "text-slate-700",
    border: "border-slate-200",
  },
};

export default function AppCard({ app }: { app: AppSummary }) {
  const catStyle = CATEGORY_STYLES[app.category.toLowerCase()] || CATEGORY_STYLES.general;
  const authorDisplay = app.author?.username || app.authorName || "Anonymous";

  return (
    <div className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-5 card-shadow card-shadow-hover">
      <div>
        {/* Category & Fork badge */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <span
            className={`inline-flex items-center rounded-lg border px-2.5 py-0.5 text-xs font-semibold ${catStyle.bg} ${catStyle.text} ${catStyle.border}`}
          >
            {catStyle.label}
          </span>
          <div className="flex items-center gap-3 text-xs text-slate-400 font-medium">
            <span className="flex items-center gap-1">
              <Eye className="h-3.5 w-3.5" />
              {app.views}
            </span>
            <span className="flex items-center gap-1">
              <GitFork className="h-3.5 w-3.5" />
              {app.forks}
            </span>
          </div>
        </div>

        {/* Title */}
        <Link href={`/app/view/?id=${app.id}`} className="block focus:outline-none">
          <h3 className="font-bold text-slate-900 text-lg group-hover:text-indigo-600 transition-colors line-clamp-1">
            {app.title}
          </h3>
        </Link>

        {/* Description */}
        <p className="mt-2 text-xs text-slate-500 line-clamp-2 leading-relaxed">
          {app.description || "Interactive AI generated mini-app built in Playground Studio."}
        </p>
      </div>

      {/* Author & Actions Footer */}
      <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-indigo-50 text-indigo-700 font-bold text-[10px] border border-indigo-100">
            {app.author?.avatar || authorDisplay.slice(0, 1).toUpperCase()}
          </div>
          <span className="text-xs text-slate-600 font-medium truncate max-w-[110px]">
            {authorDisplay}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <Link
            href={`/create?remix=${app.id}`}
            title="Remix with AI in Studio"
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-indigo-600 bg-indigo-50/80 hover:bg-indigo-100 rounded-lg transition-colors border border-indigo-100"
          >
            <Sparkles className="h-3 w-3" />
            Remix
          </Link>
          <Link
            href={`/app/view/?id=${app.id}`}
            className="flex items-center gap-1 px-3 py-1 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-all"
          >
            <Play className="h-3 w-3 fill-current" />
            Play
          </Link>
        </div>
      </div>
    </div>
  );
}
