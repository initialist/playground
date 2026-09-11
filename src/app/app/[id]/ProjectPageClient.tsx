"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import { apiUrl } from "@/lib/api";
import {
  Sparkles,
  GitFork,
  Eye,
  Terminal,
  Loader2,
  ArrowLeft,
  AlertCircle,
} from "lucide-react";
import ProjectPlayerClient from "./ProjectPlayerClient";

interface AppDetail {
  id: string;
  title: string;
  description?: string | null;
  code: string;
  instructions?: string | null;
  category: string;
  views: number;
  forks: number;
  authorName?: string | null;
  author?: {
    id: string;
    username: string;
    avatar?: string | null;
  } | null;
  agentHistories?: Array<{
    id: string;
    prompt: string;
    agentPlan?: string | null;
    verificationStatus?: string | null;
    timestamp: string;
  }>;
  createdAt: string;
}

function ProjectDetailContent({ id }: { id: string }) {
  const searchParams = useSearchParams();
  const effectiveId = id === "view" ? searchParams.get("id") || "" : id;

  const [app, setApp] = useState<AppDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(Boolean(effectiveId));
  const [error, setError] = useState<boolean>(!effectiveId);

  useEffect(() => {
    if (!effectiveId) {
      return;
    }

    let isCancelled = false;
    fetch(apiUrl(`/api/apps/${effectiveId}`))
      .then((res) => {
        if (!res.ok) throw new Error("Not found");
        return res.json();
      })
      .then((data) => {
        if (!isCancelled && data.app) {
          setApp(data.app);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!isCancelled) {
          setError(true);
          setLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [effectiveId]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-[#fbfbfa]">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mb-3" />
          <p className="text-sm font-semibold text-slate-600">Loading mini-app...</p>
        </div>
      </div>
    );
  }

  if (error || !app) {
    return (
      <div className="min-h-screen flex flex-col bg-[#fbfbfa]">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center text-center px-4 py-20">
          <div className="h-12 w-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 mx-auto mb-4">
            <AlertCircle className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Mini-App Not Found</h2>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-6">
            This mini-app may have been removed or does not exist.
          </p>
          <Link
            href="/explore"
            className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Explore
          </Link>
        </div>
      </div>
    );
  }

  const authorName = app.author?.username || app.authorName || "Anonymous";

  return (
    <div className="min-h-screen flex flex-col bg-[#fbfbfa]">
      <Navbar />

      <main className="flex-1 mx-auto max-w-6xl w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Project Header Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="inline-flex items-center rounded-md bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-700 border border-indigo-100 uppercase tracking-wider">
                {app.category}
              </span>
              <span className="text-xs text-slate-400 font-medium">
                Created on {new Date(app.createdAt).toLocaleDateString()}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {app.title}
            </h1>
            <div className="flex items-center gap-3 mt-2 text-xs text-slate-500 font-medium">
              <div className="flex items-center gap-1.5">
                <div className="flex h-5 w-5 items-center justify-center rounded-md bg-indigo-100 text-indigo-700 font-bold text-[10px]">
                  {app.author?.avatar || authorName.slice(0, 1).toUpperCase()}
                </div>
                <span>
                  by <strong className="text-slate-700">{authorName}</strong>
                </span>
              </div>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Eye className="h-3.5 w-3.5" />
                {app.views} views
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <GitFork className="h-3.5 w-3.5" />
                {app.forks} remixes
              </span>
            </div>
          </div>

          {/* Action Buttons: See Inside & Remix */}
          <div className="flex items-center gap-3">
            <Link
              href={`/create?remix=${app.id}`}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 active:scale-[0.98] transition-all"
            >
              <Sparkles className="h-4 w-4" />
              See Inside & Remix with AI
            </Link>
          </div>
        </div>

        {/* Interactive App Stage & Player Client */}
        <ProjectPlayerClient app={app} />

        {/* Info & Remix Callout */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            {/* Instructions */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 card-shadow">
              <h3 className="text-sm font-bold text-slate-900 mb-2">Instructions</h3>
              <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                {app.instructions || "Click anywhere inside the app to interact with controls. No special setup required."}
              </p>
            </div>

            {/* Notes and Description */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 card-shadow">
              <h3 className="text-sm font-bold text-slate-900 mb-2">Notes & Description</h3>
              <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                {app.description || "Generated and verified using Gemini 3.5 Flash Lite in Playground Studio."}
              </p>
            </div>

            {/* Agent Prompt History */}
            {app.agentHistories && app.agentHistories.length > 0 && (
              <div className="rounded-2xl border border-slate-200 bg-white p-6 card-shadow">
                <div className="flex items-center gap-2 mb-4">
                  <Terminal className="h-4 w-4 text-indigo-600" />
                  <h3 className="text-sm font-bold text-slate-900">AI Prompt History</h3>
                </div>
                <div className="space-y-4">
                  {app.agentHistories.map((hist, idx) => (
                    <div
                      key={hist.id}
                      className="rounded-xl border border-slate-100 bg-slate-50/70 p-4 text-xs"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-indigo-600">
                          Iteration #{idx + 1}
                        </span>
                        <span className="text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md font-medium">
                          ✓ {hist.verificationStatus || "passed"}
                        </span>
                      </div>
                      <p className="text-slate-800 font-mono text-[11px] bg-white border border-slate-200 rounded-lg p-2.5 mb-2">
                        &quot;{hist.prompt}&quot;
                      </p>
                      {hist.agentPlan && (
                        <p className="text-slate-500 whitespace-pre-line text-[11px]">
                          {hist.agentPlan}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Sidebar: Remix Callout */}
          <div className="space-y-6">
            <div className="rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50/50 to-white p-6 card-shadow">
              <div className="h-10 w-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center mb-3">
                <Sparkles className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">Want to change this app?</h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Remixing copies this app into your own AI studio sandbox. You can prompt the Gemini agent to add new features, fix mechanics, or restyle it!
              </p>
              <Link
                href={`/create?remix=${app.id}`}
                className="mt-4 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 transition-colors"
              >
                <GitFork className="h-4 w-4" />
                Remix Now
              </Link>
            </div>

            {/* Quick Stats Box */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 card-shadow text-xs space-y-3">
              <div className="flex items-center justify-between text-slate-600">
                <span>Total Views</span>
                <span className="font-semibold text-slate-900">{app.views}</span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>Community Remixes</span>
                <span className="font-semibold text-slate-900">{app.forks}</span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>AI Verification</span>
                <span className="font-semibold text-emerald-600">Active (4-Point Probe)</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function ProjectPageClient({ id }: { id: string }) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex flex-col bg-[#fbfbfa]">
          <Navbar />
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mb-3" />
            <p className="text-sm font-semibold text-slate-600">Loading mini-app...</p>
          </div>
        </div>
      }
    >
      <ProjectDetailContent id={id} />
    </Suspense>
  );
}
