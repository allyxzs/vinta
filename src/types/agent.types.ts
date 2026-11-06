import { z } from 'zod';

export type LLMProviderName = 'openai' | 'anthropic' | 'gemini' | 'ollama' | 'mock';

export type AgentRole = 'planner' | 'researcher' | 'coder' | 'security_auditor' | 'critic' | 'synthesizer';

export interface BYOKCredentials {
  openaiApiKey?: string;
  anthropicApiKey?: string;
  geminiApiKey?: string;
  preferredProvider?: LLMProviderName;
  preferredModel?: string;
}

export interface Message {
  id: string;
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  name?: string;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

export interface ToolExecutionContext {
  sessionId: string;
  agentRole: AgentRole;
  sandboxEnabled: boolean;
}

export interface ToolResult {
  success: boolean;
  output: string;
  data?: unknown;
  executionTimeMs: number;
  error?: string;
}

export interface ITool {
  name: string;
  description: string;
  category: 'system' | 'web' | 'code' | 'data' | 'memory' | 'security';
  schema: z.ZodObject<any>;
  execute(args: any, context: ToolExecutionContext): Promise<ToolResult>;
}

export interface PlanStep {
  id: string;
  stepNumber: number;
  title: string;
  description: string;
  assignedRole: AgentRole;
  requiredTools: string[];
  dependencies: string[];
  status: 'pending' | 'running' | 'completed' | 'failed' | 'replanning';
  result?: string;
  reflectionScore?: number;
  critiqueNotes?: string;
  executionTimeMs?: number;
}

export interface ExecutionPlan {
  planId: string;
  version: '3.0.0';
  goal: string;
  createdAt: number;
  completedAt?: number;
  totalDurationMs?: number;
  steps: PlanStep[];
  status: 'planning' | 'executing' | 'reviewing' | 'completed' | 'failed';
  securityPassed: boolean;
  finalOutput?: string;
}

export interface MemoryItem {
  id: string;
  sessionId: string;
  type: 'episodic' | 'semantic' | 'procedural';
  content: string;
  embedding: number[];
  tags: string[];
  importance: number;
  createdAt: number;
}

export interface AgentEvent {
  type:
    | 'guardrail_checked'
    | 'plan_created'
    | 'wave_started'
    | 'step_started'
    | 'tool_invoked'
    | 'tool_completed'
    | 'critic_review'
    | 'replan_triggered'
    | 'task_completed'
    | 'error';
  sessionId: string;
  timestamp: number;
  payload: Record<string, unknown>;
}
