import { z } from 'zod';

export type LLMProviderName = 'openai' | 'anthropic' | 'ollama' | 'mock';

export type AgentRole = 'planner' | 'researcher' | 'coder' | 'critic' | 'synthesizer';

export interface Message {
  id: string;
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  name?: string;
  toolCallId?: string;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

export interface ToolParameterSchema {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description: string;
  required: boolean;
}

export interface ToolExecutionContext {
  sessionId: string;
  userId?: string;
  agentRole: AgentRole;
  sandboxEnabled: boolean;
  abortSignal?: AbortSignal;
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
  category: 'system' | 'web' | 'code' | 'data' | 'memory';
  schema: z.ZodObject<any>;
  requiresApproval?: boolean;
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
}

export interface ExecutionPlan {
  planId: string;
  goal: string;
  createdAt: number;
  steps: PlanStep[];
  status: 'planning' | 'executing' | 'reviewing' | 'completed' | 'failed';
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
    | 'plan_created'
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
