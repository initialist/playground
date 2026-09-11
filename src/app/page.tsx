"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import AppCard, { AppSummary } from "@/components/AppCard";
import { apiUrl } from "@/lib/api";
import { Sparkles, ArrowRight, Cpu, ShieldCheck, GitFork, Loader2 } from "lucide-react";

export default function HomePage() {
  const [apps, setApps] = useState<AppSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isCancelled = false;
    fetch(apiUrl("/api/apps?limit=6"))
      .then((res) => (res.ok ? res.json() : { apps: [] }))
      .then((data) => {
        if (!isCancelled) {
          setApps(data.apps || []);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error("Failed to load featured apps:", err);
        if (!isCancelled) setLoading(false);
      });

    return () => {
      isCancelled = true;
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[#fbfbfa]">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-slate-200/80 bg-gradient-to-b from-white to-slate-50/50 py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200/80 bg-indigo-50/60 px-3.5 py-1 text-xs font-semibold text-indigo-700 mb-6">
            <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
            <span>Powered by Gemini 3.5 Flash Lite</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tight max-w-4xl mx-auto leading-tight">
            Build, play, and remix <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">
              AI mini-apps
            </span>{" "}
            in seconds.
          </h1>

          <p className="mt-6 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            A playful, creative community for software. Prompt an interactive tool or simulator, let the agent verify runtime stability, and remix any project with one click.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3.5">
            <Link
              href="/create"
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 active:scale-[0.98] transition-all"
            >
              <Sparkles className="h-4 w-4" />
              Open Studio (Free)
            </Link>
            <Link
              href="/explore"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Explore Community
              <ArrowRight className="h-4 w-4 text-slate-400" />
            </Link>
          </div>

          {/* Quick Category Chips */}
          <div className="mt-12 flex flex-wrap justify-center items-center gap-2">
            {[
              { label: "Tools", path: "/explore?category=tools", emoji: "🛠️" },
              { label: "Simulators", path: "/explore?category=simulators", emoji: "🌌" },
              { label: "Art & Visuals", path: "/explore?category=art", emoji: "🎨" },
              { label: "Interactive", path: "/explore?category=interactive", emoji: "⚡" },
            ].map((cat) => (
              <Link
                key={cat.label}
                href={cat.path}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-medium text-slate-600 hover:border-slate-300 hover:text-slate-900 transition-all shadow-xs"
              >
                <span>{cat.emoji}</span>
                <span>{cat.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Community Apps Grid */}
      <main className="flex-1 mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              Featured Mini-Apps
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Popular tools and creations built by the community. Click any app to run it or remix the code.
            </p>
          </div>

          <Link
            href="/explore"
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition-colors"
          >
            View all apps
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mb-3" />
            <p className="text-sm font-medium">Loading featured apps...</p>
          </div>
        ) : apps.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {apps.map((app) => (
              <AppCard key={app.id} app={app} />
            ))}
          </div>
        ) : (
          <div className="py-16 text-center rounded-3xl border border-dashed border-slate-300 bg-white p-8 sm:p-12 card-shadow">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mx-auto mb-4">
              <Sparkles className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-slate-800">
              No mini-apps published yet
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-6 leading-relaxed">
              The community gallery is brand new! Be the first creator to build and publish an interactive tool, simulator, or visual toy.
            </p>
            <Link
              href="/create"
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-indigo-700 shadow-sm transition-all"
            >
              <Sparkles className="h-4 w-4" />
              Build the First App
            </Link>
          </div>
        )}

        {/* Feature Banner: The Scratch for AI Apps */}
        <section className="mt-20 rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 p-8 sm:p-12">
          <div className="max-w-3xl">
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              How Playground Works
            </h3>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              Designed around creative agency and continuous improvement. We eliminated dark neon styling in favor of a clean, focused workshop.
            </p>
          </div>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 card-shadow">
              <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 mb-4">
                <Cpu className="h-5 w-5" />
              </div>
              <h4 className="font-bold text-slate-900 text-sm">1. Fast Generation</h4>
              <p className="mt-1.5 text-xs text-slate-500 leading-relaxed">
                Gemini 3.5 Flash Lite streams real-time single-file HTML, Canvas, and Web Audio code without unnecessary fluff.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 card-shadow">
              <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 mb-4">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h4 className="font-bold text-slate-900 text-sm">2. 4-Point Runtime Probe</h4>
              <p className="mt-1.5 text-xs text-slate-500 leading-relaxed">
                Before declaring success, the sandbox probe inspects canvas context, animation loops, and console logs to ensure it works.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 card-shadow">
              <div className="h-10 w-10 rounded-xl bg-violet-50 flex items-center justify-center text-violet-600 mb-4">
                <GitFork className="h-5 w-5" />
              </div>
              <h4 className="font-bold text-slate-900 text-sm">3. See Inside & Remix</h4>
              <p className="mt-1.5 text-xs text-slate-500 leading-relaxed">
                Like Scratch, every public mini-app has an open remix button so you can inspect prompt history and evolve ideas.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900">Playground</span>
            <span>— AI Mini-App Platform</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/explore" className="hover:text-slate-900 transition-colors">
              Explore
            </Link>
            <Link href="/create" className="hover:text-slate-900 transition-colors">
              Create Studio
            </Link>
            <Link href="/login" className="hover:text-slate-900 transition-colors">
              Sign In
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
