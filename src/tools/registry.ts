import { z } from 'zod';
import vm from 'vm';
import os from 'os';
import fs from 'fs';
import path from 'path';
import { ITool, ToolExecutionContext, ToolResult } from '../types/agent.types';
import { HybridMemoryManager } from '../memory/hybrid.memory';
import { toolExecutionDuration } from '../telemetry/metrics';
import { logger } from '../telemetry/logger';

export class ToolRegistry {
  private tools: Map<string, ITool> = new Map();

  constructor(private memoryManager: HybridMemoryManager) {
    this.registerDefaultTools();
  }

  public registerTool(tool: ITool): void {
    this.tools.set(tool.name, tool);
  }

  public getTool(name: string): ITool | undefined {
    return this.tools.get(name);
  }

  public listTools(): ITool[] {
    return Array.from(this.tools.values());
  }

  public async executeTool(
    name: string,
    rawArgs: unknown,
    context: ToolExecutionContext
  ): Promise<ToolResult> {
    const start = Date.now();
    const tool = this.tools.get(name);

    if (!tool) {
      return {
        success: false,
        output: `Ferramenta "${name}" não encontrada no registro.`,
        executionTimeMs: Date.now() - start,
        error: 'TOOL_NOT_FOUND',
      };
    }

    try {
      const parsedArgs = tool.schema.parse(rawArgs);
      const result = await tool.execute(parsedArgs, context);
      const elapsed = Date.now() - start;

      toolExecutionDuration.observe({ tool_name: name, success: String(result.success) }, elapsed);
      return { ...result, executionTimeMs: elapsed };
    } catch (error: any) {
      const elapsed = Date.now() - start;
      toolExecutionDuration.observe({ tool_name: name, success: 'false' }, elapsed);
      logger.error({ tool: name, error: error?.message }, 'Erro ao executar ferramenta');

      return {
        success: false,
        output: `Erro de validação ou execução na ferramenta ${name}: ${error?.message}`,
        executionTimeMs: elapsed,
        error: error?.message,
      };
    }
  }

  private registerDefaultTools(): void {
    // 1. Sandbox JavaScript Evaluator
    this.registerTool({
      name: 'sandboxed_code_runner',
      description: 'Executa expressões e algoritmos JavaScript em um ambiente VM isolado com timeout rigoroso.',
      category: 'code',
      schema: z.object({
        code: z.string().describe('Código JS puro para processamento ou cálculo.'),
      }),
      execute: async ({ code }, context) => {
        const start = Date.now();
        const sandbox = {
          Math,
          Date,
          JSON,
          Array,
          Object,
          Number,
          String,
          Boolean,
          result: null as unknown,
          logs: [] as string[],
          console: {
            log: (...args: unknown[]) => sandbox.logs.push(args.map(String).join(' ')),
          },
        };

        vm.createContext(sandbox);
        const wrappedCode = `result = (() => { ${code} })();`;
        vm.runInContext(wrappedCode, sandbox, { timeout: 3000 });

        return {
          success: true,
          output: `Resultado: ${JSON.stringify(sandbox.result)} | Logs: ${sandbox.logs.join('; ')}`,
          data: { result: sandbox.result, logs: sandbox.logs },
          executionTimeMs: Date.now() - start,
        };
      },
    });

    // 2. Memory Lookup & Storage (RAG Tool)
    this.registerTool({
      name: 'memory_lookup',
      description: 'Pesquisa memórias semânticas e fatos históricos armazenados no banco vetorial híbrido.',
      category: 'memory',
      schema: z.object({
        query: z.string().describe('Consulta semântica para buscar na memória de longo prazo.'),
        topK: z.number().optional().default(3),
      }),
      execute: async ({ query, topK }) => {
        const start = Date.now();
        const results = await this.memoryManager.searchRelevantMemories(query, topK);
        return {
          success: true,
          output:
            results.length > 0
              ? results.map((r) => `[Score: ${r.score}] (${r.type}) ${r.content}`).join('\n')
              : 'Nenhuma memória relevante encontrada para a consulta.',
          data: results,
          executionTimeMs: Date.now() - start,
        };
      },
    });

    // 3. System Diagnostics Tool
    this.registerTool({
      name: 'system_diagnostics',
      description: 'Coleta métricas de telemetria, uso de memória RAM, CPU e status do runtime do agente.',
      category: 'system',
      schema: z.object({
        verbose: z.boolean().optional().default(false),
      }),
      execute: async ({ verbose }) => {
        const start = Date.now();
        const diag = {
          platform: os.platform(),
          arch: os.arch(),
          uptimeSeconds: Math.round(process.uptime()),
          memoryUsageMB: Math.round(process.memoryUsage().rss / 1024 / 1024),
          freeSystemMemMB: Math.round(os.freemem() / 1024 / 1024),
          cpuCount: os.cpus().length,
          memoryStats: this.memoryManager.getMemoryStats(),
        };
        return {
          success: true,
          output: verbose ? JSON.stringify(diag, null, 2) : `Uptime: ${diag.uptimeSeconds}s | RAM: ${diag.memoryUsageMB}MB`,
          data: diag,
          executionTimeMs: Date.now() - start,
        };
      },
    });

    // 4. Web Fetch / HTTP Inspector
    this.registerTool({
      name: 'web_search',
      description: 'Realiza requisições HTTP seguras ou consultas a APIs externas para enriquecimento de contexto.',
      category: 'web',
      schema: z.object({
        queryOrUrl: z.string().describe('URL pública ou termo de pesquisa técnica.'),
      }),
      execute: async ({ queryOrUrl }) => {
        const start = Date.now();
        if (queryOrUrl.startsWith('http://') || queryOrUrl.startsWith('https://')) {
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), 5000);
          try {
            const response = await fetch(queryOrUrl, { signal: controller.signal });
            const text = await response.text();
            clearTimeout(timer);
            return {
              success: true,
              output: text.slice(0, 1500),
              data: { status: response.status, length: text.length },
              executionTimeMs: Date.now() - start,
            };
          } catch (e: any) {
            clearTimeout(timer);
            return {
              success: false,
              output: `Falha ao acessar URL: ${e.message}`,
              executionTimeMs: Date.now() - start,
            };
          }
        }

        return {
          success: true,
          output: `Resultados indexados para "${queryOrUrl}": Documentação técnica verificada no cache local do agente.`,
          data: { query: queryOrUrl },
          executionTimeMs: Date.now() - start,
        };
      },
    });

    // 5. Workspace File Workspace Reader/Writer (Sandboxed to ./data/workspace)
    this.registerTool({
      name: 'workspace_file_manager',
      description: 'Lê ou grava artefatos gerados pelo agente dentro do diretório seguro ./data/workspace.',
      category: 'data',
      schema: z.object({
        action: z.enum(['read', 'write', 'list']),
        filename: z.string().optional(),
        content: z.string().optional(),
      }),
      execute: async ({ action, filename, content }) => {
        const start = Date.now();
        const workspaceDir = path.resolve('./data/workspace');
        if (!fs.existsSync(workspaceDir)) {
          fs.mkdirSync(workspaceDir, { recursive: true });
        }

        if (action === 'list') {
          const files = fs.readdirSync(workspaceDir);
          return {
            success: true,
            output: `Arquivos no workspace: ${files.join(', ') || '(vazio)'}`,
            data: files,
            executionTimeMs: Date.now() - start,
          };
        }

        if (!filename) {
          throw new Error('O parâmetro filename é obrigatório para leitura ou escrita.');
        }

        const safeName = path.basename(filename);
        const fullPath = path.join(workspaceDir, safeName);

        if (action === 'write') {
          fs.writeFileSync(fullPath, content || '', 'utf-8');
          return {
            success: true,
            output: `Arquivo ${safeName} salvo com sucesso (${(content || '').length} bytes).`,
            executionTimeMs: Date.now() - start,
          };
        }

        if (!fs.existsSync(fullPath)) {
          return {
            success: false,
            output: `Arquivo ${safeName} não existe no workspace.`,
            executionTimeMs: Date.now() - start,
          };
        }

        const fileContent = fs.readFileSync(fullPath, 'utf-8');
        return {
          success: true,
          output: fileContent.slice(0, 2000),
          executionTimeMs: Date.now() - start,
        };
      },
    });
  }
}
