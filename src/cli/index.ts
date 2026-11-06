#!/usr/bin/env node
import { Command } from 'commander';
import chalk from 'chalk';
import { v4 as uuidv4 } from 'uuid';
import { MultiProviderLLMRouter } from '../llm/provider.router';
import { HybridMemoryManager } from '../memory/hybrid.memory';
import { ToolRegistry } from '../tools/registry';
import { Vinta3Orchestrator } from '../core/orchestrator';

const program = new Command();

program
  .name('vinta3')
  .description('CLI oficial do Vinta 3 — Autonomous Parallel DAG Multi-Agent')
  .version('3.0.0');

program
  .command('run <goal>')
  .description('Executa uma missão no motor paralelo de sub-agentes Vinta 3')
  .action(async (goal: string) => {
    const llm = new MultiProviderLLMRouter();
    const memory = new HybridMemoryManager(llm);
    const tools = new ToolRegistry(memory);
    const orchestrator = new Vinta3Orchestrator(llm, memory, tools);

    const sessionId = uuidv4();
    console.log(chalk.cyan.bold(`\n⚡ Vinta 3 Engine [Sessão: ${sessionId}]`));
    console.log(chalk.gray(`Missão: "${goal}"\n`));

    orchestrator.on('agent_event', (ev) => {
      if (ev.type === 'wave_started') {
        console.log(
          chalk.magenta.bold(
            `🌊 Onda Paralela #${ev.payload.waveNumber} iniciada (${(ev.payload.stepIds as string[]).join(', ')})`
          )
        );
      } else if (ev.type === 'step_started') {
        const s = ev.payload.step as any;
        console.log(chalk.blue(`  ▶️  Etapa ${s.stepNumber}: ${s.title} [${s.assignedRole.toUpperCase()}]`));
      } else if (ev.type === 'critic_review') {
        console.log(chalk.green(`  ✅ Crítico [${ev.payload.stepId}]: Score ${ev.payload.score}`));
      }
    });

    const resultPlan = await orchestrator.runGoal(sessionId, goal);
    console.log(chalk.green.bold(`\n✨ Concluído em ${resultPlan.totalDurationMs}ms:\n`));
    console.log(resultPlan.finalOutput);
  });

program.parse(process.argv);
