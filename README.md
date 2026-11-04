# ⚡ Vinta Pro Enterprise (v2.0)

Uma evolução arquitetural completa e pronta para produção do agente **Vinta** (`allyxzs/vinta`), projetada com **Orquestração Multi-Agente baseada em Grafos (DAG)**, **Memória Vetorial Híbrida (RAG)**, **Sandbox de Execução Segura**, **Fallback Multi-LLM** e **Observabilidade em Tempo Real**.

---

## 🏗️ O que mudou nesta versão mais complexa?

| Dimensão | Vinta Original | Vinta Pro Enterprise (v2.0) |
| :--- | :--- | :--- |
| **Arquitetura Cognitiva** | Loop linear simples de prompt/resposta | **Orquestrador Multi-Agente DAG** (`Planner`, `Researcher`, `Coder`, `Critic`, `Synthesizer`) |
| **Controle de Qualidade** | Sem verificação pós-etapa | **Loop de Auto-Reflexão (Critic Agent)** com score de aprovação e replanejamento automático |
| **Sistema de Memória** | Contexto efêmero em memória | **Memória Híbrida (Curto Prazo + Banco Vetorial Semântico + Busca Lexical BM25-lite)** |
| **Provedores de IA** | Único provedor acoplado | **Roteador Multi-LLM com Fallback Automático** (OpenAI, Anthropic Claude, Ollama Local e Motor Determinístico Offline) |
| **Execução de Ferramentas** | Chamadas diretas sem validação | **Tool Registry tipado com Zod** + **Sandbox isolado (`node:vm`)** com controle de timeout |
| **Interfaces & Operação** | Script local | **Servidor REST API + Streaming WebSocket + Dashboard Web Tailwind + CLI Interativa** |
| **DevOps & Publicação** | Sem empacotamento de infraestrutura | **Dockerfile multi-stage, Docker Compose (Redis + Prometheus), Testes e GitHub Actions CI/CD** |

---

## 📂 Estrutura do Projeto

```text
vinta-pro-agent/
├── .github/workflows/ci-publish.yml  # Pipeline CI/CD para build, testes e publicação
├── public/index.html                 # Dashboard Web em tempo real (Socket.IO + Tailwind)
├── src/
│   ├── api/server.ts                 # API RESTful + Streaming WebSocket + Endpoint /metrics
│   ├── cli/index.ts                  # Interface de Linha de Comando (CLI) interativa
│   ├── config/env.ts                 # Validação rigorosa de variáveis de ambiente com Zod
│   ├── core/orchestrator.ts          # Motor Multi-Agente DAG + Loop de Auto-Reflexão
│   ├── llm/provider.router.ts        # Roteador Multi-LLM (OpenAI, Anthropic, Ollama, Offline)
│   ├── memory/hybrid.memory.ts       # Memória Episódica e Vetorial Híbrida (Cosine + Lexical)
│   ├── telemetry/                    # Logger estruturado (Pino) e Métricas Prometheus
│   ├── tools/registry.ts             # Registro de ferramentas com Sandbox VM e Workspace seguro
│   ├── types/agent.types.ts          # Contratos e interfaces TypeScript
│   └── index.ts                      # Entrypoint principal do servidor
├── tests/orchestrator.test.ts        # Suíte de testes automatizados
├── Dockerfile                        # Build multi-stage otimizado para produção
├── docker-compose.yml                # Stack completa: Agente + Redis + Prometheus
├── prometheus.yml                    # Configuração de coleta de telemetria
├── package.json                      # Dependências e scripts de publicação
└── tsconfig.json                     # Configuração TypeScript Strict Mode
```

---

## 🚀 Como Executar e Publicar

### 1. Instalação Local Rápida
```bash
npm install
cp .env.example .env
# O agente funciona mesmo sem chaves de API configuradas graças ao motor determinístico integrado!
npm run dev
```
Acesse o **Control Center Web** em `http://localhost:3000`.

### 2. Uso via CLI
```bash
npm run cli -- run "Analisar performance do servidor, validar script em sandbox e gerar plano de ação"
```

### 3. Deploy em Produção com Docker Compose
```bash
docker-compose up --build -d
```
- **API & Painel Web**: `http://localhost:3000`
- **Métricas Prometheus**: `http://localhost:3000/metrics`
- **Servidor Prometheus**: `http://localhost:9090`
