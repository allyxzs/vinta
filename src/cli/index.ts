#!/usr/bin/env node
import { Command } from 'commander';
import chalk from 'chalk';
import { v4 as uuidv4 } from 'uuid';
import { MultiProviderLLMRouter } from '../llm/provider.router';
import { HybridMemoryManager } from '../memory/hybrid.memory';
import { ToolRegistry } from '../tools/registry';
import { VintaMultiAgentOrchestrator } from '../core/orchestrator';

const program = new Command();

program
  .name('vinta-pro')
  .description('CLI interativa do Agente Autônomo Multi-Agente Vinta Pro v2.0')
  .version('2.0.0');

program
  .command('run <goal>')
  .description('Executa um objetivo complexo utilizando o grafo de sub-agentes (Planner, Researcher, Coder, Critic)')
  .action(async (goal: string) => {
    const llm = new MultiProviderLLMRouter();
    const memory = new HybridMemoryManager(llm);
    const tools = new ToolRegistry(memory);
    const orchestrator = new VintaMultiAgentOrchestrator(llm, memory, tools);

    const sessionId = uuidv4();
    console.log(chalk.cyan.bold(`\n⚡ Iniciando Vinta Pro Agent [Sessão: ${sessionId}]`));
    console.log(chalk.gray(`Objetivo: "${goal}"\n`));

    orchestrator.on('agent_event', (ev) => {
      if (ev.type === 'plan_created') {
        console.log(chalk.yellow(`📋 Plano DAG gerado com ${(ev.payload.plan as any).steps.length} etapas.`));
      } else if (ev.type === 'step_started') {
        const s = ev.payload.step as any;
        console.log(chalk.blue(`▶️  Executando Etapa ${s.stepNumber}: ${s.title} [${s.assignedRole.toUpperCase()}]`));
      } else if (ev.type === 'tool_invoked') {
        console.log(chalk.magenta(`   🛠️  Invocando ferramenta: ${ev.payload.toolName}`));
      } else if (ev.type === 'critic_review') {
        console.log(
          chalk.green(
            `   ✅ Auditoria do Crítico: Score ${ev.payload.score} | ${ev.payload.notes}`
          )
        );
      }
    });

    const resultPlan = await orchestrator.runGoal(sessionId, goal);
    console.log(chalk.green.bold('\n✨ Resposta Final Consolidada:\n'));
    console.log(resultPlan.finalOutput);
  });

program.parse(process.argv);
