"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { authFetch } from "@/lib/api";
import { X, Sparkles, Check, Globe, Lock, Loader2, ExternalLink, Copy } from "lucide-react";
import confetti from "canvas-confetti";

interface PublishModalProps {
  isOpen: boolean;
  onClose: () => void;
  code: string;
  defaultTitle: string;
  defaultPrompt: string;
  appId?: string;
}

export default function PublishModal({
  isOpen,
  onClose,
  code,
  defaultTitle,
  defaultPrompt,
  appId,
}: PublishModalProps) {
  const { user } = useAuth();
  const [title, setTitle] = useState(defaultTitle || "My Mini-App");
  const [description, setDescription] = useState("");
  const [instructions, setInstructions] = useState("");
  const [category, setCategory] = useState("tools");
  const [isPublic, setIsPublic] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [publishedAppId, setPublishedAppId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const res = await authFetch("/api/apps", {
        method: "POST",
        body: JSON.stringify({
          id: appId,
          title,
          description,
          instructions,
          category,
          isPublic,
          code,
          lastPrompt: defaultPrompt,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save mini-app.");
      }

      setPublishedAppId(data.app.id);
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error saving app.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyShareLink = () => {
    if (!publishedAppId) return;
    const url = `${window.location.origin}/app/view/?id=${publishedAppId}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="relative w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 card-shadow animate-in fade-in zoom-in-95 duration-150">
        <button
          onClick={onClose}
          className="absolute right-5 top-5 p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {publishedAppId ? (
          <div className="text-center py-4">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 mb-4">
              <Check className="h-6 w-6" />
            </div>
            <h2 className="text-2xl font-black text-slate-900">
              Mini-App {isPublic ? "Published!" : "Saved!"}
            </h2>
            <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
              {isPublic
                ? "Your mini-app is now live in the community gallery for anyone to play and remix."
                : "Your draft has been saved to your account."}
            </p>

            <div className="mt-6 flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs">
              <input
                type="text"
                readOnly
                value={`${typeof window !== "undefined" ? window.location.origin : ""}/app/view/?id=${publishedAppId}`}
                className="flex-1 bg-transparent px-2 text-slate-700 font-mono outline-none text-xs truncate"
              />
              <button
                onClick={copyShareLink}
                className="flex items-center gap-1 rounded-lg bg-white border border-slate-200 px-3 py-1.5 font-semibold text-slate-700 hover:bg-slate-50"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>

            <div className="mt-6 flex items-center justify-center gap-3">
              <Link
                href={`/app/view/?id=${publishedAppId}`}
                className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                View Mini-App Page
              </Link>
              <button
                onClick={onClose}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div className="mb-6">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 border border-indigo-100 px-3 py-0.5 text-xs font-semibold text-indigo-700 mb-2">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Share & Publish</span>
              </div>
              <h2 className="text-xl font-black text-slate-900">Publish Mini-App</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {user
                  ? `Publishing as @${user.username}`
                  : "Publishing as Anonymous Creator. Sign in to link to your profile."}
              </p>
            </div>

            {error && (
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-600">
                {error}
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="tools">Tool / Productivity</option>
                  <option value="simulators">Physics / Simulator</option>
                  <option value="art">Art & Generative Visuals</option>
                  <option value="interactive">Interactive / Mini-App</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Explain what this mini-app does..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Instructions
                </label>
                <input
                  type="text"
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder="e.g. Click and drag to draw shapes. Press Space to clear."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="flex items-center gap-2.5">
                  {isPublic ? (
                    <Globe className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <Lock className="h-4 w-4 text-slate-400" />
                  )}
                  <div>
                    <p className="text-xs font-semibold text-slate-800">
                      {isPublic ? "Community Gallery" : "Private Draft"}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {isPublic ? "Visible to everyone and remixable" : "Only accessible to you"}
                    </p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  className="h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !code}
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 active:scale-[0.98] disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3.5 w-3.5" />
                      {isPublic ? "Publish to Community" : "Save Draft"}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
