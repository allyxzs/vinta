import client from 'prom-client';

export const register = new client.Registry();
client.collectDefaultMetrics({ register });

export const agentTaskCounter = new client.Counter({
  name: 'vinta3_agent_tasks_total',
  help: 'Total de missões processadas pelo motor Vinta 3',
  labelNames: ['status', 'provider'],
  registers: [register],
});

export const toolExecutionDuration = new client.Histogram({
  name: 'vinta3_tool_execution_duration_ms',
  help: 'Latência de execução das ferramentas em milissegundos',
  labelNames: ['tool_name', 'success'],
  buckets: [5, 25, 100, 300, 1000, 3000, 10000],
  registers: [register],
});

export const tokenUsageCounter = new client.Counter({
  name: 'vinta3_llm_tokens_total',
  help: 'Total de tokens consumidos no Vinta 3',
  labelNames: ['provider', 'model', 'type'],
  registers: [register],
});
