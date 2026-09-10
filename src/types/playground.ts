export type DeviceMode = 'desktop' | 'arcade' | 'mobile' | 'fluid';

export interface GameProject {
  id: string;
  title: string;
  prompt: string;
  code: string;
  version: number;
  createdAt: number;
  updatedAt: number;
}

export type AgentStage = 'idle' | 'planning' | 'coding' | 'testing' | 'healing' | 'ready' | 'error';

export interface AgentThoughtStep {
  id: string;
  stage: AgentStage;
  title: string;
  detail?: string;
  timestamp: number;
  status: 'pending' | 'in_progress' | 'success' | 'error';
}

export interface ConsoleMessage {
  id: string;
  type: 'log' | 'warn' | 'error' | 'info';
  message: string;
  timestamp: number;
  count?: number;
}

export interface SandboxErrorPayload {
  message: string;
  lineno?: number;
  colno?: number;
  filename?: string;
  stack?: string;
}

export interface GenerationSettings {
  apiKey?: string;
  model: string;
  temperature: number;
}
