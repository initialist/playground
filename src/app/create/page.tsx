"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { PlaygroundStudio } from "@/components/studio/PlaygroundStudio";
import { GameProject } from "@/types/playground";
import { apiUrl } from "@/lib/api";
import { Loader2 } from "lucide-react";

function CreateStudioContent() {
  const searchParams = useSearchParams();
  const remixId = searchParams.get("remix");

  const [initialApp, setInitialApp] = useState<GameProject | null>(null);
  const [loadingRemix, setLoadingRemix] = useState(Boolean(remixId));

  useEffect(() => {
    if (!remixId) {
      return;
    }

    let isCancelled = false;
    fetch(apiUrl(`/api/apps/${remixId}`))
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.app && !isCancelled) {
          const app = data.app;
          setInitialApp({
            id: app.id,
            title: `${app.title} (Remix)`,
            prompt: app.agentHistories?.[0]?.prompt || `Remix of ${app.title}`,
            code: app.code,
            version: 1,
            createdAt: new Date(app.createdAt).getTime(),
            updatedAt: Date.now(),
          });
        }
      })
      .catch((err) => console.error("Failed to load remix app:", err))
      .finally(() => {
        if (!isCancelled) setLoadingRemix(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [remixId]);

  if (loadingRemix) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#fbfbfa] text-slate-400">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mb-3" />
        <p className="text-sm font-semibold text-slate-600">Loading remix into studio...</p>
      </div>
    );
  }

  return <PlaygroundStudio initialApp={initialApp} />;
}

export default function CreatePage() {
  return (
    <Suspense
      fallback={
        <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#fbfbfa] text-slate-400">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
      }
    >
      <CreateStudioContent />
    </Suspense>
  );
}
