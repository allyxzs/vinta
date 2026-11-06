import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { Server as SocketIOServer } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../telemetry/logger';
import { register } from '../telemetry/metrics';
import { MultiProviderLLMRouter } from '../llm/provider.router';
import { HybridMemoryManager } from '../memory/hybrid.memory';
import { ToolRegistry } from '../tools/registry';
import { Vinta3Orchestrator } from '../core/orchestrator';
import { BYOKCredentials } from '../types/agent.types';

export function createVintaServer() {
  const app = express();
  const server = http.createServer(app);
  const io = new SocketIOServer(server, {
    cors: { origin: '*' },
  });

  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(cors());
  app.use(express.json({ limit: '2mb' }));
  app.use(express.static(path.resolve('./public')));

  const llmRouter = new MultiProviderLLMRouter();
  const memoryManager = new HybridMemoryManager(llmRouter);
  const toolRegistry = new ToolRegistry(memoryManager);
  const orchestrator = new Vinta3Orchestrator(llmRouter, memoryManager, toolRegistry);

  orchestrator.on('agent_event', (event) => {
    io.emit('agent_event', event);
  });

  app.get('/api/v1/health', (_req, res) => {
    res.json({
      status: 'ok',
      agent: 'Vinta 3 Autonomous Engine',
      version: '3.0.0',
      uptime: process.uptime(),
      memory: memoryManager.getMemoryStats(),
    });
  });

  app.get('/api/v1/mcp/manifest', (_req, res) => {
    res.json(toolRegistry.exportMCPManifest());
  });

  app.get('/metrics', async (_req, res) => {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  });

  app.get('/api/v1/tools', (_req, res) => {
    const tools = toolRegistry.listTools().map((t) => ({
      name: t.name,
      description: t.description,
      category: t.category,
    }));
    res.json({ count: tools.length, tools });
  });

  app.post('/api/v1/memory/search', async (req, res) => {
    const { query, topK } = req.body;
    if (!query) {
      return res.status(400).json({ error: 'O campo query é obrigatório.' });
    }
    const results = await memoryManager.searchRelevantMemories(query, topK || 5);
    return res.json({ results });
  });

  app.post('/api/v1/memory/ingest', async (req, res) => {
    const { sessionId, content, tags, type, importance } = req.body;
    if (!content) {
      return res.status(400).json({ error: 'O campo content é obrigatório.' });
    }
    const item = await memoryManager.storeSemanticMemory(
      sessionId || 'global',
      content,
      tags || [],
      type || 'semantic',
      importance || 0.85
    );
    return res.status(201).json({ item });
  });

  app.post('/api/v1/agent/run', async (req, res) => {
    try {
      const { goal, sessionId, byok } = req.body;
      if (!goal || typeof goal !== 'string') {
        return res.status(400).json({ error: 'Forneça um objetivo válido no campo "goal".' });
      }
      const activeSession = sessionId || uuidv4();
      const plan = await orchestrator.runGoal(activeSession, goal, byok as BYOKCredentials);
      return res.json({ sessionId: activeSession, plan });
    } catch (error: any) {
      logger.error({ error: error?.message }, 'Erro ao processar objetivo Vinta 3');
      return res.status(500).json({ error: error?.message || 'Erro interno Vinta 3' });
    }
  });

  io.on('connection', (socket) => {
    socket.on(
      'run_goal',
      async (data: { goal: string; sessionId?: string; byok?: BYOKCredentials }) => {
        const sessionId = data.sessionId || uuidv4();
        const plan = await orchestrator.runGoal(sessionId, data.goal, data.byok);
        socket.emit('goal_finished', plan);
      }
    );
  });

  return { app, server, orchestrator, memoryManager, toolRegistry };
}
