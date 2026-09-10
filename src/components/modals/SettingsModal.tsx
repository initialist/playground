'use client';

import React, { useState } from 'react';
import { X, Key, Cpu, Check, Eye, EyeOff } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiKey: string;
  model: string;
  onSave: (apiKey: string, model: string) => void;
}

const AVAILABLE_MODELS = [
  { id: 'gemini-2.0-flash-lite', name: 'Gemini 2.0 Flash Lite', desc: 'Ultra-fast, lowest latency (Recommended)' },
  { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', desc: 'High intelligence & balanced speed' },
  { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', desc: 'Standard generation model' },
  { id: 'custom', name: 'Custom Model ID', desc: 'Enter custom Gemini preview or fine-tuned model name' },
];

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  apiKey,
  model,
  onSave,
}) => {
  if (!isOpen) return null;

  return (
    <SettingsModalContent
      onClose={onClose}
      initialApiKey={apiKey}
      initialModel={model}
      onSave={onSave}
    />
  );
};

interface SettingsModalContentProps {
  onClose: () => void;
  initialApiKey: string;
  initialModel: string;
  onSave: (apiKey: string, model: string) => void;
}

const SettingsModalContent: React.FC<SettingsModalContentProps> = ({
  onClose,
  initialApiKey,
  initialModel,
  onSave,
}) => {
  const [localKey, setLocalKey] = useState(initialApiKey);
  const isInitialStandard = AVAILABLE_MODELS.some(m => m.id === initialModel && m.id !== 'custom');
  const [selectedModel, setSelectedModel] = useState(isInitialStandard ? initialModel : 'custom');
  const [customModel, setCustomModel] = useState(isInitialStandard ? '' : initialModel);
  const [showKey, setShowKey] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = () => {
    const finalModel = selectedModel === 'custom' ? (customModel.trim() || 'gemini-2.0-flash-lite') : selectedModel;
    onSave(localKey.trim(), finalModel);
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm select-none p-4">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-violet-400" />
            <span className="font-bold text-sm text-zinc-100">AI Studio Settings</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 flex flex-col gap-4 text-xs">
          {/* API Key */}
          <div className="flex flex-col gap-1.5">
            <label className="font-semibold text-zinc-300 flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-zinc-400" />
              <span>Gemini API Key</span>
            </label>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={localKey}
                onChange={(e) => setLocalKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full bg-zinc-950 border border-zinc-800 focus:border-violet-500 rounded-lg px-3 py-2 text-xs text-zinc-100 focus:outline-none pr-9 font-mono"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-2.5 top-2.5 text-zinc-500 hover:text-zinc-300"
              >
                {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
            <p className="text-[11px] text-zinc-500 leading-normal">
              Stored locally in your browser. Alternatively, you can define <code className="text-zinc-400 bg-zinc-800 px-1 py-0.5 rounded">GEMINI_API_KEY</code> in <code className="text-zinc-400 bg-zinc-800 px-1 py-0.5 rounded">.env.local</code>.
            </p>
          </div>

          {/* Model Selection */}
          <div className="flex flex-col gap-1.5">
            <label className="font-semibold text-zinc-300">Model Selection</label>
            <div className="flex flex-col gap-2">
              {AVAILABLE_MODELS.map(m => (
                <label
                  key={m.id}
                  className={`flex items-start gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-all ${
                    selectedModel === m.id
                      ? 'bg-violet-950/20 border-violet-500/50 text-zinc-200'
                      : 'bg-zinc-950/50 border-zinc-800 hover:border-zinc-700 text-zinc-400'
                  }`}
                >
                  <input
                    type="radio"
                    name="modelSelection"
                    checked={selectedModel === m.id}
                    onChange={() => setSelectedModel(m.id)}
                    className="mt-0.5 accent-violet-500"
                  />
                  <div className="flex flex-col">
                    <span className="font-semibold text-zinc-200 text-xs">{m.name}</span>
                    <span className="text-[10px] text-zinc-500">{m.desc}</span>
                  </div>
                </label>
              ))}
            </div>

            {selectedModel === 'custom' && (
              <div className="mt-1 flex flex-col gap-1">
                <input
                  type="text"
                  value={customModel}
                  onChange={(e) => setCustomModel(e.target.value)}
                  placeholder="e.g. gemini-flash-3.5-lite or custom model"
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-violet-500 rounded-lg px-3 py-1.5 text-xs text-zinc-100 focus:outline-none font-mono"
                />
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-zinc-800 bg-zinc-950/60 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-semibold text-xs transition-colors shadow-md shadow-violet-600/20"
          >
            {isSaved ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Saved!</span>
              </>
            ) : (
              <span>Save Changes</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
