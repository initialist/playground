'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  GameProject,
  AgentThoughtStep,
  AgentStage,
  ConsoleMessage,
  SandboxErrorPayload,
  DeviceMode,
} from '@/types/playground';
import { STARTER_GAMES } from '@/data/starter-games';
import { parseAIStream } from './code-parser';
import { injectSandboxHarness } from './sandbox-harness';

const STORAGE_API_KEY = 'playground_gemini_api_key';
const STORAGE_MODEL = 'playground_gemini_model';
const DEFAULT_MODEL = 'gemini-3.5-flash-lite';

export function usePlayground() {
  // Game & Project State
  const [currentProject, setCurrentProject] = useState<GameProject>(STARTER_GAMES[0]);
  const [history, setHistory] = useState<GameProject[]>([STARTER_GAMES[0]]);
  const [deviceMode, setDeviceMode] = useState<DeviceMode>('desktop');
  const [activeTab, setActiveTab] = useState<'copilot' | 'code' | 'history'>('copilot');

  // Agentic Loop State
  const [agentStage, setAgentStage] = useState<AgentStage>('ready');
  const [thoughtSteps, setThoughtSteps] = useState<AgentThoughtStep[]>([
    {
      id: 'step-init',
      stage: 'ready',
      title: 'Ready',
      detail: 'Playground studio loaded with Cosmic Defender.',
      timestamp: 1740000000000,
      status: 'success',
    },
  ]);
  const [streamingStatus, setStreamingStatus] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [repairAttempts, setRepairAttempts] = useState<number>(0);

  // Telemetry & Logs
  const [consoleLogs, setConsoleLogs] = useState<ConsoleMessage[]>([]);
  const [lastError, setLastError] = useState<SandboxErrorPayload | null>(null);

  // Settings
  const [apiKey, setApiKey] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(STORAGE_API_KEY) || '';
    }
    return '';
  });
  const [model, setModel] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(STORAGE_MODEL) || DEFAULT_MODEL;
    }
    return DEFAULT_MODEL;
  });

  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isExportOpen, setIsExportOpen] = useState<boolean>(false);
  const [isShareOpen, setIsShareOpen] = useState<boolean>(false);

  // Refs
  const diagnosticTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const activeCodeRef = useRef<string>(currentProject.code);
  const isRepairingRef = useRef<boolean>(false);
  const lastErrorTimeRef = useRef<number>(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    activeCodeRef.current = currentProject.code;
  }, [currentProject.code]);

  const saveSettings = (newKey: string, newModel: string) => {
    setApiKey(newKey);
    setModel(newModel);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_API_KEY, newKey);
      localStorage.setItem(STORAGE_MODEL, newModel);
    }
  };

  // Add a thought step helper
  const addThought = useCallback((
    stage: AgentStage,
    title: string,
    detail?: string,
    status: 'pending' | 'in_progress' | 'success' | 'error' = 'in_progress'
  ) => {
    const newStep: AgentThoughtStep = {
      id: `thought-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      stage,
      title,
      detail,
      timestamp: Date.now(),
      status,
    };
    setThoughtSteps(prev => [...prev, newStep]);
    return newStep.id;
  }, []);

  const updateThought = useCallback((id: string, updates: Partial<AgentThoughtStep>) => {
    setThoughtSteps(prev =>
      prev.map(step => (step.id === id ? { ...step, ...updates } : step))
    );
  }, []);

  // Cancel any ongoing generation or repair
  const cancelOperation = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsGenerating(false);
    isRepairingRef.current = false;
    setStreamingStatus('');
    setAgentStage('ready');
    addThought('ready', 'Operation Cancelled', 'Generation or repair was cancelled by user.', 'success');
  }, [addThought]);

  // Sandbox Health Watcher
  const startDiagnosticWatch = useCallback(() => {
    if (diagnosticTimeoutRef.current) clearTimeout(diagnosticTimeoutRef.current);

    setAgentStage('testing');
    diagnosticTimeoutRef.current = setTimeout(() => {
      setAgentStage('ready');
      setRepairAttempts(0);
      setThoughtSteps(prev => {
        const last = prev[prev.length - 1];
        if (last && last.status === 'in_progress') {
          return [...prev.slice(0, -1), { ...last, status: 'success' }];
        }
        return prev;
      });
    }, 2000);
  }, []);

  // AUTO REPAIR: Mini Agentic Loop trigger
  const triggerAutoRepair = useCallback(
    async (errorPayload: SandboxErrorPayload) => {
      if (isRepairingRef.current) return;

      if (!apiKey) {
        setAgentStage('error');
        addThought(
          'error',
          'Runtime Issue Detected',
          `"${errorPayload.message}" (Line ${errorPayload.lineno || '?'}). Configure your Gemini API key in Settings to enable automatic self-healing.`,
          'error'
        );
        return;
      }

      if (repairAttempts >= 2) {
        setAgentStage('error');
        addThought(
          'error',
          'Auto-Repair Limit Reached',
          `Could not automatically resolve "${errorPayload.message}". You can inspect or modify the code directly in the Code tab.`,
          'error'
        );
        return;
      }

      isRepairingRef.current = true;
      setIsGenerating(true);
      setRepairAttempts(prev => prev + 1);
      setAgentStage('healing');
      setStreamingStatus(`Diagnosing: "${errorPayload.message}"...`);

      const stepId = addThought(
        'healing',
        `Auto-Repairing Runtime Error (Attempt ${repairAttempts + 1}/2)`,
        `Diagnosing: "${errorPayload.message}" at line ${errorPayload.lineno || 'unknown'}`,
        'in_progress'
      );

      const controller = new AbortController();
      abortControllerRef.current = controller;
      const timeoutId = setTimeout(() => controller.abort(), 45000);

      try {
        const response = await fetch('/api/repair', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            code: activeCodeRef.current,
            error: errorPayload,
            prompt: currentProject.prompt,
            apiKey: apiKey || undefined,
            model,
          }),
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error || 'Repair request failed');
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error('No readable stream received');

        const decoder = new TextDecoder();
        let accumulated = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          accumulated += decoder.decode(value, { stream: true });

          const parsed = parseAIStream(accumulated);
          const currentLen = parsed.code.length || accumulated.length;
          setStreamingStatus(`Auto-repair streaming... (${(currentLen / 1024).toFixed(1)} KB)`);
          updateThought(stepId, {
            detail: `Synthesizing bug fix... (${(currentLen / 1024).toFixed(1)} KB received)`,
          });
        }

        const finalParsed = parseAIStream(accumulated);
        if (finalParsed.code) {
          updateThought(stepId, {
            status: 'success',
            detail: `Resolved "${errorPayload.message}". Reloading in sandbox...`,
          });

          const updatedProject: GameProject = {
            ...currentProject,
            code: finalParsed.code,
            version: currentProject.version + 1,
            updatedAt: Date.now(),
          };
          setCurrentProject(updatedProject);
          setHistory(prev => [updatedProject, ...prev]);
          setLastError(null);
          startDiagnosticWatch();
        } else {
          throw new Error('Could not extract valid HTML code from repair stream');
        }
      } catch (err: unknown) {
        if (controller.signal.aborted) {
          updateThought(stepId, {
            status: 'error',
            detail: 'Repair timed out after 45 seconds or was cancelled.',
          });
        } else {
          const msg = err instanceof Error ? err.message : String(err);
          updateThought(stepId, {
            status: 'error',
            detail: `Repair failed: ${msg}`,
          });
        }
        setAgentStage('error');
      } finally {
        clearTimeout(timeoutId);
        abortControllerRef.current = null;
        isRepairingRef.current = false;
        setIsGenerating(false);
        setStreamingStatus('');
      }
    },
    [repairAttempts, currentProject, apiKey, model, addThought, updateThought, startDiagnosticWatch]
  );

  // Message listener from iframe sandbox
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const data = event.data;
      if (!data || typeof data !== 'object') return;

      if (data.type === 'PLAYGROUND_ERROR') {
        const payload: SandboxErrorPayload = data.error;
        const now = Date.now();
        // Debounce rapid duplicate errors (within 1.5 seconds)
        if (now - lastErrorTimeRef.current < 1500) return;
        lastErrorTimeRef.current = now;

        setLastError(payload);
        setConsoleLogs(prev => [
          ...prev,
          {
            id: `err-${Date.now()}`,
            type: 'error',
            message: `Runtime Error: ${payload.message} (Line ${payload.lineno || '?'})`,
            timestamp: Date.now(),
          },
        ]);

        // Auto-heal if an API key is available and not already busy
        if (!isGenerating && !isRepairingRef.current) {
          triggerAutoRepair(payload);
        }
      } else if (data.type === 'PLAYGROUND_CONSOLE') {
        setConsoleLogs(prev => {
          const next = [
            ...prev.slice(-150),
            {
              id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
              type: data.level || 'log',
              message: data.message,
              timestamp: data.timestamp || Date.now(),
            },
          ];
          return next;
        });
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [isGenerating, triggerAutoRepair]);

  // GENERATE GAME: Main creation & iteration function
  const generateGame = async (promptText: string, isIteration = false) => {
    if (!promptText.trim()) return;

    setIsGenerating(true);
    setRepairAttempts(0);
    setLastError(null);
    setStreamingStatus('Initializing Gemini 3.5 Flash Lite...');
    setAgentStage('planning');

    const planStepId = addThought(
      'planning',
      isIteration ? 'Analyzing Iteration Request' : 'Architecting Game Mechanics',
      promptText,
      'in_progress'
    );

    let codeStepId = '';
    const controller = new AbortController();
    abortControllerRef.current = controller;
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s generation timeout

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          prompt: promptText,
          currentCode: isIteration ? currentProject.code : undefined,
          apiKey: apiKey || undefined,
          model,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate code');
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response stream available');

      const decoder = new TextDecoder();
      let accumulated = '';
      let codeStarted = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        accumulated += decoder.decode(value, { stream: true });

        if (accumulated.includes('[ERROR:')) {
          const errMsg = accumulated.match(/\[ERROR:\s*(.*?)\]/)?.[1] || 'Server generation error';
          throw new Error(errMsg);
        }

        const parsed = parseAIStream(accumulated);

        if (parsed.isGeneratingCode && !codeStarted) {
          codeStarted = true;
          setAgentStage('coding');
          updateThought(planStepId, { status: 'success' });
          codeStepId = addThought('coding', 'Writing HTML5, Canvas & Audio Code', undefined, 'in_progress');
        }

        if (codeStarted && parsed.code) {
          const kb = (parsed.code.length / 1024).toFixed(1);
          setStreamingStatus(`Generating game assets & loop... (${kb} KB)`);
          if (codeStepId) {
            updateThought(codeStepId, {
              detail: `Streaming code: ${kb} KB generated...`,
            });
          }
        }
      }

      const finalParsed = parseAIStream(accumulated);
      if (!finalParsed.code) {
        throw new Error('Could not extract valid HTML code from model output');
      }

      if (codeStepId) {
        updateThought(codeStepId, {
          status: 'success',
          detail: `Generated complete ${(finalParsed.code.length / 1024).toFixed(1)} KB game application.`,
        });
      }

      const titleMatch = promptText.slice(0, 30).trim();
      const newTitle = isIteration ? currentProject.title : `${titleMatch.charAt(0).toUpperCase() + titleMatch.slice(1)}`;

      const newProject: GameProject = {
        id: `project-${Date.now()}`,
        title: newTitle,
        prompt: promptText,
        code: finalParsed.code,
        version: isIteration ? currentProject.version + 1 : 1,
        createdAt: isIteration ? currentProject.createdAt : Date.now(),
        updatedAt: Date.now(),
      };

      setCurrentProject(newProject);
      setHistory(prev => [newProject, ...prev]);

      addThought('testing', 'Verifying Sandbox Diagnostics', 'Testing execution in isolated frame...', 'in_progress');
      startDiagnosticWatch();
    } catch (err: unknown) {
      if (controller.signal.aborted) {
        setAgentStage('error');
        addThought('error', 'Generation Timed Out', 'The request timed out or was cancelled by user.', 'error');
      } else {
        const msg = err instanceof Error ? err.message : String(err);
        setAgentStage('error');
        addThought('error', 'Generation Error', msg, 'error');
      }
    } finally {
      clearTimeout(timeoutId);
      abortControllerRef.current = null;
      setIsGenerating(false);
      setStreamingStatus('');
    }
  };

  const updateCodeManually = (newCode: string) => {
    const updated: GameProject = {
      ...currentProject,
      code: newCode,
      version: currentProject.version + 1,
      updatedAt: Date.now(),
    };
    setCurrentProject(updated);
    setHistory(prev => [updated, ...prev]);
    setLastError(null);
    startDiagnosticWatch();
  };

  const loadStarter = (starterId: string) => {
    const found = STARTER_GAMES.find(g => g.id === starterId);
    if (found) {
      setCurrentProject(found);
      setHistory(prev => [found, ...prev]);
      setThoughtSteps([
        {
          id: `step-${Date.now()}`,
          stage: 'ready',
          title: `Loaded ${found.title}`,
          detail: found.prompt,
          timestamp: 1740000000000,
          status: 'success',
        },
      ]);
      setAgentStage('ready');
      setRepairAttempts(0);
      isRepairingRef.current = false;
      setLastError(null);
    }
  };

  const clearLogs = () => setConsoleLogs([]);

  const sandboxedHtml = injectSandboxHarness(currentProject.code);

  return {
    currentProject,
    setCurrentProject,
    history,
    deviceMode,
    setDeviceMode,
    activeTab,
    setActiveTab,
    agentStage,
    thoughtSteps,
    streamingStatus,
    isGenerating,
    repairAttempts,
    consoleLogs,
    clearLogs,
    lastError,
    setLastError,
    apiKey,
    model,
    saveSettings,
    isSettingsOpen,
    setIsSettingsOpen,
    isExportOpen,
    setIsExportOpen,
    isShareOpen,
    setIsShareOpen,
    generateGame,
    cancelOperation,
    triggerAutoRepair,
    updateCodeManually,
    loadStarter,
    sandboxedHtml,
  };
}
