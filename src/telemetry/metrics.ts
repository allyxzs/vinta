import client from 'prom-client';

export const register = new client.Registry();
client.collectDefaultMetrics({ register });

export const agentTaskCounter = new client.Counter({
  name: 'vinta_agent_tasks_total',
  help: 'Total de tarefas submetidas ao orquestrador Vinta Pro',
  labelNames: ['status', 'provider'],
  registers: [register],
});

export const toolExecutionDuration = new client.Histogram({
  name: 'vinta_tool_execution_duration_ms',
  help: 'Duração da execução de ferramentas em milissegundos',
  labelNames: ['tool_name', 'success'],
  buckets: [10, 50, 150, 500, 1500, 5000, 15000],
  registers: [register],
});

export const tokenUsageCounter = new client.Counter({
  name: 'vinta_llm_tokens_total',
  help: 'Total de tokens consumidos por chamadas LLM',
  labelNames: ['provider', 'model', 'type'],
  registers: [register],
});
