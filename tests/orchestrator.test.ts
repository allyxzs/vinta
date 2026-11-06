import { MultiProviderLLMRouter } from '../src/llm/provider.router';
import { HybridMemoryManager } from '../src/memory/hybrid.memory';
import { ToolRegistry } from '../src/tools/registry';
import { Vinta3Orchestrator } from '../src/core/orchestrator';
import { SecurityGuardrails } from '../src/security/guardrails';

describe('Vinta 3 — Autonomous Parallel DAG Suite', () => {
  it('deve validar Security Guardrails e mascarar chaves sensíveis', () => {
    const check = SecurityGuardrails.inspectAndSanitize(
      'Minha chave é sk-1234567890abcdefghijklmnop e quero diagnosticar o servidor'
    );
    expect(check.safe).toBe(true);
    expect(check.sanitizedInput).toContain('sk-***REDACTED***');
  });

  it('deve executar o grafo DAG em ondas paralelas, rodar o security_auditor e aprovar no Crítico', async () => {
    const llm = new MultiProviderLLMRouter();
    const memory = new HybridMemoryManager(llm);
    const tools = new ToolRegistry(memory);
    const orchestrator = new Vinta3Orchestrator(llm, memory, tools);

    const waves: number[] = [];
    orchestrator.on('agent_event', (ev) => {
      if (ev.type === 'wave_started') {
        waves.push(ev.payload.waveNumber as number);
      }
    });

    const plan = await orchestrator.runGoal(
      'vinta3-test-session',
      'Auditar segurança do runtime, consultar memória RAG e validar sandbox'
    );

    expect(plan.version).toBe('3.0.0');
    expect(plan.status).toBe('completed');
    expect(plan.securityPassed).toBe(true);
    expect(plan.steps.length).toBe(3);
    expect(waves.length).toBeGreaterThanOrEqual(2); // Etapa 1 e 2 rodam juntas na Onda #1, Etapa 3 na Onda #2
    expect(plan.finalOutput).toContain('Vinta 3');
  });

  it('deve exportar o manifesto compatível com Model Context Protocol (MCP)', () => {
    const llm = new MultiProviderLLMRouter();
    const memory = new HybridMemoryManager(llm);
    const tools = new ToolRegistry(memory);
    const manifest = tools.exportMCPManifest();

    expect(manifest.serverName).toBe('vinta-3-mcp-server');
    expect(manifest.tools.length).toBeGreaterThanOrEqual(6);
  });
});
