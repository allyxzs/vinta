# ⚡ Vinta 3 (v3.0.0) — Autonomous Parallel DAG Engine

**Vinta 3** é a terceira geração da arquitetura de agentes autônomos **Vinta**, combinando **Execução de Grafos em Ondas Paralelas (Topological DAG Waves)**, **BYOK (Bring Your Own Key) Dinâmico**, **Security Guardrails Anti-Injection**, **Circuit Breaker Multi-LLM** e **Compatibilidade com Model Context Protocol (MCP)**.

---

## 🛠️ O que foi corrigido do Vinta 2.0 e evoluído no Vinta 3?

1. **Correção Definitiva do GitHub Actions CI (`Failing after 8s`)**:
   - Na v2.0, o workflow utilizava `cache: 'npm'` sem um arquivo `package-lock.json` commitado e sem `jest.config.js` para o `ts-jest`, fazendo a Action abortar em 8 segundos.
   - O **Vinta 3** inclui pipeline `.github/workflows/ci-publish.yml` corrigido, limpeza automática de pastas legadas (`./vinta`), `jest.config.js` configurado e `typecheck` estrito.
2. **Execução DAG em Ondas Paralelas (`Promise.all` Topological Sort)**:
   - Etapas independentes (como *Researcher* e *Security Auditor*) agora rodam **simultaneamente na mesma onda**, reduzindo o tempo de resposta pela metade.
3. **Suporte Nativo a BYOK (Bring Your Own Key) + Google Gemini 2.5**:
   - Além de OpenAI (`gpt-4o`), Anthropic (`claude-3-5-sonnet`) e Ollama, o Vinta 3 suporta **Google Gemini** e permite enviar chaves de API por requisição ou direto pelo Painel Web.
4. **Security Guardrails & Sub-Agente `security_auditor`**:
   - Inspeção automática de prompts contra *Prompt Injection*, redação automática de chaves vazadas (`sk-***REDACTED***`) e ferramenta dedicada `security_audit_scanner`.
5. **Model Context Protocol (MCP) Ready**:
   - Novo endpoint `/api/v1/mcp/manifest` que expõe todas as ferramentas registradas no padrão MCP.

---

## 🚀 Como Atualizar e Publicar no GitHub

```bash
# 1. Na pasta do seu repositório local vinta:
rm -rf ./vinta
unzip -o ~/Downloads/vinta-3.0.0.zip -d .

# 2. Testar localmente (Build + Testes Jest):
npm install
npm run build
npm test

# 3. Subir o Vinta 3 para o GitHub (usando aspas simples para evitar erro no Zsh!):
git add .
git commit -m 'feat: upgrade to Vinta 3.0 (Parallel DAG, BYOK, Guardrails & CI Fix)'
git tag -a v3.0.0 -m 'Vinta 3.0.0 Release'
git push origin main --tags
```
