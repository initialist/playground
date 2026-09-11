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
import { parseAIStream } from './code-parser';
import { injectSandboxHarness } from './sandbox-harness';
import { apiUrl, getAuthToken } from './api';

function generateUniqueId(prefix: string): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export const BLANK_APP: GameProject = {
  id: 'blank',
  title: 'Untitled Mini-App',
  prompt: '',
  code: '',
  version: 0,
  createdAt: 0,
  updatedAt: 0,
};

export function usePlayground(initialApp?: GameProject | null) {
  // Mini-App & Project State (Clean Canvas by default)
  const [currentProject, setCurrentProject] = useState<GameProject>(() => initialApp || BLANK_APP);
  const [history, setHistory] = useState<GameProject[]>(() => (initialApp && initialApp.code ? [initialApp] : []));
  const [deviceMode, setDeviceMode] = useState<DeviceMode>('desktop');
  const [activeTab, setActiveTab] = useState<'copilot' | 'code' | 'history'>('copilot');

  // Agentic Loop State
  const [agentStage, setAgentStage] = useState<AgentStage>('ready');
  const [thoughtSteps, setThoughtSteps] = useState<AgentThoughtStep[]>([
    {
      id: 'step-init',
      stage: 'ready',
      title: 'Studio Ready',
      detail: initialApp?.code
        ? `Loaded "${initialApp.title}". You can prompt refinements or test the app.`
        : 'Describe your mini-app idea below to start building with Gemini 3.5 Flash Lite.',
      timestamp: initialApp?.createdAt || 1740000000000,
      status: 'success',
    },
  ]);
  const [streamingStatus, setStreamingStatus] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [repairAttempts, setRepairAttempts] = useState<number>(0);

  // Telemetry & Logs
  const [consoleLogs, setConsoleLogs] = useState<ConsoleMessage[]>([]);
  const [lastError, setLastError] = useState<SandboxErrorPayload | null>(null);

  // Modals
  const [isPublishOpen, setIsPublishOpen] = useState<boolean>(false);
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

  // Add thought step helper
  const addThought = useCallback((
    stage: AgentStage,
    title: string,
    detail?: string,
    status: 'pending' | 'in_progress' | 'success' | 'error' = 'in_progress'
  ) => {
    const newStep: AgentThoughtStep = {
      id: generateUniqueId('thought'),
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

  // Start a fresh new project (New App button)
  const resetToNewApp = useCallback(() => {
    cancelOperation();
    setCurrentProject(BLANK_APP);
    setHistory([]);
    setConsoleLogs([]);
    setLastError(null);
    setRepairAttempts(0);
    setThoughtSteps([
      {
        id: generateUniqueId('step-init'),
        stage: 'ready',
        title: 'New Canvas Ready',
        detail: 'Started fresh project. Enter a prompt to build a new mini-app!',
        timestamp: Date.now(),
        status: 'success',
      },
    ]);
    setAgentStage('ready');
  }, [cancelOperation]);

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
    }, 1500);
  }, []);

  // AUTO REPAIR: Mini Agentic Loop trigger
  const triggerAutoRepair = useCallback(
    async (errorPayload: SandboxErrorPayload) => {
      if (isRepairingRef.current) return;

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
      setStreamingStatus(`Diagnosing error: "${errorPayload.message}"...`);

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
        const token = getAuthToken();
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch(apiUrl('/api/repair'), {
          method: 'POST',
          headers,
          signal: controller.signal,
          body: JSON.stringify({
            code: activeCodeRef.current,
            error: errorPayload,
            prompt: currentProject.prompt,
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
            detail: `Resolved "${errorPayload.message}". Sandbox reloading to verify probe...`,
          });

          const updatedProject: GameProject = {
            ...currentProject,
            code: finalParsed.code,
            version: (currentProject.version || 0) + 1,
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
    [repairAttempts, currentProject, addThought, updateThought, startDiagnosticWatch]
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
            id: generateUniqueId('err'),
            type: 'error',
            message: `Runtime Error: ${payload.message} (Line ${payload.lineno || '?'})`,
            timestamp: Date.now(),
          },
        ]);

        if (!isGenerating && !isRepairingRef.current) {
          triggerAutoRepair(payload);
        }
      } else if (data.type === 'PLAYGROUND_CONSOLE') {
        setConsoleLogs(prev => [
          ...prev.slice(-150),
          {
            id: generateUniqueId('log'),
            type: data.level || 'log',
            message: data.message,
            timestamp: data.timestamp || Date.now(),
          },
        ]);
      } else if (data.type === 'PLAYGROUND_VERIFIED') {
        const { status, details } = data;
        if (status === 'passed') {
          setAgentStage('ready');
          setRepairAttempts(0);
          addThought(
            'testing',
            '✅ Runtime Verified (4-Point Probe)',
            details.message || 'App initialized cleanly with 0 console errors.',
            'success'
          );
        } else if (status === 'error') {
          addThought(
            'error',
            '⚠️ Probe Detected Runtime Failure',
            details.message || 'Errors detected during initial execution.',
            'error'
          );
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [isGenerating, triggerAutoRepair, addThought]);

  // GENERATE GAME / MINI-APP: Main creation & iteration function
  const generateGame = async (promptText: string) => {
    if (!promptText.trim()) return;

    // Check if iterating on an existing app or creating from blank canvas
    const isIteration = Boolean(currentProject.code && currentProject.code.trim().length > 0);

    setIsGenerating(true);
    setRepairAttempts(0);
    setLastError(null);
    setStreamingStatus('Initializing Gemini 3.5 Flash Lite...');
    setAgentStage('planning');

    const planStepId = addThought(
      'planning',
      isIteration ? 'Analyzing Iteration Request' : 'Architecting Mini-App Architecture',
      promptText,
      'in_progress'
    );

    let codeStepId = '';
    const controller = new AbortController();
    abortControllerRef.current = controller;
    const timeoutId = setTimeout(() => controller.abort(), 60000);

    try {
      const token = getAuthToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await fetch(apiUrl('/api/generate'), {
        method: 'POST',
        headers,
        signal: controller.signal,
        body: JSON.stringify({
          prompt: promptText,
          currentCode: isIteration ? currentProject.code : undefined,
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
          setStreamingStatus(`Generating mini-app code... (${kb} KB)`);
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
          detail: `Generated complete ${(finalParsed.code.length / 1024).toFixed(1)} KB application.`,
        });
      }

      const titleMatch = promptText.slice(0, 32).trim();
      const newTitle = isIteration
        ? currentProject.title
        : `${titleMatch.charAt(0).toUpperCase() + titleMatch.slice(1)}`;

      const newProject: GameProject = {
        id: isIteration ? currentProject.id : generateUniqueId('project'),
        title: newTitle,
        prompt: promptText,
        code: finalParsed.code,
        version: isIteration ? currentProject.version + 1 : 1,
        createdAt: isIteration ? currentProject.createdAt : Date.now(),
        updatedAt: Date.now(),
      };

      setCurrentProject(newProject);
      setHistory(prev => [newProject, ...prev]);

      addThought('testing', 'Running 4-Point Runtime Probe', 'Validating canvas render, animation loop & console logs...', 'in_progress');
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
      version: (currentProject.version || 0) + 1,
      updatedAt: Date.now(),
    };
    setCurrentProject(updated);
    setHistory(prev => [updated, ...prev]);
    setLastError(null);
    startDiagnosticWatch();
  };

  const clearLogs = () => setConsoleLogs([]);

  const sandboxedHtml = currentProject.code ? injectSandboxHarness(currentProject.code) : '';

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
    isPublishOpen,
    setIsPublishOpen,
    isExportOpen,
    setIsExportOpen,
    isShareOpen,
    setIsShareOpen,
    generateGame,
    cancelOperation,
    resetToNewApp,
    triggerAutoRepair,
    updateCodeManually,
    sandboxedHtml,
  };
}
