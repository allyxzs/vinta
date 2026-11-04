import { MultiProviderLLMRouter } from '../src/llm/provider.router';
import { HybridMemoryManager } from '../src/memory/hybrid.memory';
import { ToolRegistry } from '../src/tools/registry';
import { VintaMultiAgentOrchestrator } from '../src/core/orchestrator';

describe('Vinta Pro Multi-Agent Orchestrator Suite', () => {
  it('deve decompor, executar ferramentas em sandbox, auditar com o Crítico e sintetizar um plano completo', async () => {
    const llm = new MultiProviderLLMRouter();
    const memory = new HybridMemoryManager(llm);
    const tools = new ToolRegistry(memory);
    const orchestrator = new VintaMultiAgentOrchestrator(llm, memory, tools);

    const plan = await orchestrator.runGoal(
      'test-session-001',
      'Analisar diagnósticos do sistema e validar cálculo em sandbox'
    );

    expect(plan.status).toBe('completed');
    expect(plan.steps.length).toBeGreaterThan(0);
    expect(plan.finalOutput).toBeDefined();
  });
});
