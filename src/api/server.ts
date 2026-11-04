import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { Server as SocketIOServer } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config/env';
import { logger } from '../telemetry/logger';
import { register } from '../telemetry/metrics';
import { MultiProviderLLMRouter } from '../llm/provider.router';
import { HybridMemoryManager } from '../memory/hybrid.memory';
import { ToolRegistry } from '../tools/registry';
import { VintaMultiAgentOrchestrator } from '../core/orchestrator';

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
  const orchestrator = new VintaMultiAgentOrchestrator(llmRouter, memoryManager, toolRegistry);

  // Encaminha todos os eventos em tempo real para o painel Web via WebSockets
  orchestrator.on('agent_event', (event) => {
    io.emit('agent_event', event);
  });

  // Healthcheck
  app.get('/api/v1/health', (_req, res) => {
    res.json({
      status: 'ok',
      agent: 'Vinta Pro Enterprise',
      version: '2.0.0',
      uptime: process.uptime(),
      memory: memoryManager.getMemoryStats(),
    });
  });

  // Prometheus Metrics Endpoint
  app.get('/metrics', async (_req, res) => {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  });

  // Listar ferramentas registradas
  app.get('/api/v1/tools', (_req, res) => {
    const tools = toolRegistry.listTools().map((t) => ({
      name: t.name,
      description: t.description,
      category: t.category,
    }));
    res.json({ count: tools.length, tools });
  });

  // Consultar ou adicionar memória semântica (RAG)
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
      importance || 0.8
    );
    return res.status(201).json({ item });
  });

  // Executar objetivo complexo no Orquestrador Multi-Agente
  app.post('/api/v1/agent/run', async (req, res) => {
    try {
      const { goal, sessionId } = req.body;
      if (!goal || typeof goal !== 'string') {
        return res.status(400).json({ error: 'Forneça um objetivo válido no campo "goal".' });
      }
      const activeSession = sessionId || uuidv4();
      const plan = await orchestrator.runGoal(activeSession, goal);
      return res.json({ sessionId: activeSession, plan });
    } catch (error: any) {
      logger.error({ error: error?.message }, 'Falha ao executar objetivo via API');
      return res.status(500).json({ error: error?.message || 'Erro interno no agente' });
    }
  });

  io.on('connection', (socket) => {
    logger.info({ socketId: socket.id }, 'Cliente conectado ao stream de telemetria WebSocket');
    socket.on('run_goal', async (data: { goal: string; sessionId?: string }) => {
      const sessionId = data.sessionId || uuidv4();
      const plan = await orchestrator.runGoal(sessionId, data.goal);
      socket.emit('goal_finished', plan);
    });
  });

  return { app, server, orchestrator, memoryManager, toolRegistry };
}
