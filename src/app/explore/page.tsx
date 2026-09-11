"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import AppCard, { AppSummary } from "@/components/AppCard";
import { apiUrl } from "@/lib/api";
import { Search, Sparkles, Filter, Loader2, RefreshCw } from "lucide-react";

const CATEGORIES = [
  { id: "all", label: "All Apps" },
  { id: "tools", label: "Tools" },
  { id: "simulators", label: "Simulators" },
  { id: "art", label: "Art & Visuals" },
  { id: "interactive", label: "Interactive" },
];

function ExploreContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const initialCategory = searchParams.get("category") || "all";
  const initialSearch = searchParams.get("search") || "";

  const [category, setCategory] = useState(initialCategory);
  const [search, setSearch] = useState(initialSearch);
  const [sort, setSort] = useState("trending");
  const [apps, setApps] = useState<AppSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isCancelled = false;

    const fetchAppsAsync = async () => {
      try {
        const params = new URLSearchParams();
        if (category && category !== "all") params.set("category", category);
        if (search.trim()) params.set("search", search.trim());
        if (sort) params.set("sort", sort);

        const res = await fetch(apiUrl(`/api/apps?${params.toString()}`));
        if (res.ok && !isCancelled) {
          const data = await res.json();
          setApps(data.apps || []);
        }
      } catch (e) {
        console.error("Failed to load apps:", e);
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    fetchAppsAsync();

    return () => {
      isCancelled = true;
    };
  }, [category, search, sort]);

  const handleCategoryClick = (catId: string) => {
    setLoading(true);
    setCategory(catId);
    const params = new URLSearchParams(searchParams.toString());
    if (catId === "all") {
      params.delete("category");
    } else {
      params.set("category", catId);
    }
    router.replace(`/explore?${params.toString()}`);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const params = new URLSearchParams(searchParams.toString());
    if (search.trim()) {
      params.set("search", search.trim());
    } else {
      params.delete("search");
    }
    router.replace(`/explore?${params.toString()}`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#fbfbfa]">
      <Navbar />

      <main className="flex-1 mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 py-10">
        {/* Header & Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-slate-200">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">
              Community Gallery
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Explore open-source AI mini-apps, test interactive demos, and remix your favorites.
            </p>
          </div>

          <form onSubmit={handleSearchSubmit} className="flex items-center gap-3">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search projects..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
            <button
              type="submit"
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 transition-colors"
            >
              Search
            </button>
          </form>
        </div>

        {/* Filter Pills & Sorting */}
        <div className="flex flex-wrap items-center justify-between gap-4 py-6">
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleCategoryClick(cat.id)}
                className={`rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
                  category === cat.id
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "bg-white border border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-900"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <Filter className="h-3.5 w-3.5" />
            <span>Sort by:</span>
            <select
              value={sort}
              onChange={(e) => {
                setLoading(true);
                setSort(e.target.value);
              }}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="trending">Most Remixed (Trending)</option>
              <option value="popular">Most Viewed</option>
              <option value="newest">Recently Created</option>
            </select>
          </div>
        </div>

        {/* Apps Grid or States */}
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center text-slate-400">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mb-3" />
            <p className="text-sm font-medium">Loading community mini-apps...</p>
          </div>
        ) : apps.length === 0 ? (
          <div className="py-20 text-center rounded-3xl border border-dashed border-slate-300 bg-white p-12">
            <Sparkles className="h-10 w-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800">No mini-apps found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-6">
              Try adjusting your search filter or be the first to build an app in this category!
            </p>
            <button
              onClick={() => {
                setLoading(true);
                setCategory("all");
                setSearch("");
                router.replace("/explore");
              }}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {apps.map((app) => (
              <AppCard key={app.id} app={app} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default function ExplorePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex flex-col bg-[#fbfbfa]">
          <Navbar />
          <div className="flex-1 flex items-center justify-center text-slate-400">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          </div>
        </div>
      }
    >
      <ExploreContent />
    </Suspense>
  );
}
