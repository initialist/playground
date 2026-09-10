'use client';

import dynamic from 'next/dynamic';
import { Gamepad2 } from 'lucide-react';

const PlaygroundStudio = dynamic(
  () => import('@/components/studio/PlaygroundStudio').then((mod) => mod.PlaygroundStudio),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-col h-screen w-screen bg-zinc-950 text-zinc-100 items-center justify-center select-none font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center text-white shadow-xl shadow-violet-500/20 animate-pulse">
            <Gamepad2 className="w-6 h-6" />
          </div>
          <span className="text-xs font-semibold text-zinc-400 tracking-wider uppercase">
            Loading Playground AI Studio...
          </span>
        </div>
      </div>
    ),
  }
);

export default function Page() {
  return <PlaygroundStudio />;
}
