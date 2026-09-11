"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { authFetch } from "@/lib/api";
import Navbar from "@/components/Navbar";
import {
  Sparkles,
  Plus,
  Eye,
  GitFork,
  Trash2,
  Edit3,
  Loader2,
  FolderCode,
  ExternalLink,
} from "lucide-react";

interface UserApp {
  id: string;
  title: string;
  description?: string | null;
  category: string;
  isPublic: boolean;
  views: number;
  likes: number;
  forks: number;
  createdAt: string;
  updatedAt: string;
}

export default function MyAppsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [apps, setApps] = useState<UserApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }

    if (user) {
      authFetch("/api/apps/my")
        .then((res) => (res.ok ? res.json() : { apps: [] }))
        .then((data) => setApps(data.apps || []))
        .catch((e) => console.error(e))
        .finally(() => setLoading(false));
    }
  }, [user, authLoading, router]);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    if (!confirm("Are you sure you want to delete this mini-app?")) return;

    setDeletingId(id);
    try {
      const res = await authFetch(`/api/apps/${id}`, { method: "DELETE" });
      if (res.ok) {
        setApps((prev) => prev.filter((a) => a.id !== id));
      }
    } catch (e) {
      console.error("Failed to delete app:", e);
    } finally {
      setDeletingId(null);
    }
  };

  if (authLoading || (user && loading)) {
    return (
      <div className="min-h-screen flex flex-col bg-[#fbfbfa]">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mb-3" />
          <p className="text-sm font-medium">Loading your projects...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const totalViews = apps.reduce((acc, a) => acc + a.views, 0);
  const totalRemixes = apps.reduce((acc, a) => acc + a.forks, 0);

  return (
    <div className="min-h-screen flex flex-col bg-[#fbfbfa]">
      <Navbar />

      <main className="flex-1 mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 py-10">
        {/* Profile & Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white font-bold text-lg shadow-sm">
                {user.avatar || user.username.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  {user.username}&apos;s Studio
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  Manage your creations, private drafts, and community remixes
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/create"
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 active:scale-[0.98] transition-all"
            >
              <Plus className="h-4 w-4" />
              New Mini-App
            </Link>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-8">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 card-shadow">
            <div className="text-xs font-semibold text-slate-400">Total Mini-Apps</div>
            <div className="mt-1 text-2xl font-black text-slate-900">{apps.length}</div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 card-shadow">
            <div className="text-xs font-semibold text-slate-400">Community Views</div>
            <div className="mt-1 text-2xl font-black text-slate-900">{totalViews}</div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 card-shadow">
            <div className="text-xs font-semibold text-slate-400">Remixes Spawned</div>
            <div className="mt-1 text-2xl font-black text-slate-900">{totalRemixes}</div>
          </div>
        </div>

        {/* Apps Grid */}
        {apps.length === 0 ? (
          <div className="py-20 text-center rounded-3xl border border-dashed border-slate-300 bg-white p-12">
            <FolderCode className="h-10 w-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800">You haven&apos;t built any mini-apps yet</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-6">
              Open the AI Studio and describe any interactive tool, simulator, or visual toy!
            </p>
            <Link
              href="/create"
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-indigo-700"
            >
              <Sparkles className="h-4 w-4" />
              Start Your First App
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {apps.map((app) => (
              <div
                key={app.id}
                className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 card-shadow"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border ${
                        app.isPublic
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-slate-100 text-slate-600 border-slate-200"
                      }`}
                    >
                      {app.isPublic ? "Public" : "Private Draft"}
                    </span>
                    <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
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

                  <h3 className="font-bold text-slate-900 text-base line-clamp-1">
                    {app.title}
                  </h3>
                  <p className="mt-1 text-xs text-slate-500 line-clamp-2">
                    {app.description || "No description provided."}
                  </p>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/app/view/?id=${app.id}`}
                      className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                      title="View App"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Link>
                    <button
                      onClick={(e) => handleDelete(app.id, e)}
                      disabled={deletingId === app.id}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                      title="Delete App"
                    >
                      {deletingId === app.id ? (
                        <Loader2 className="h-4 w-4 animate-spin text-red-500" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </button>
                  </div>

                  <Link
                    href={`/create?remix=${app.id}`}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 transition-colors"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                    Edit in Studio
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
