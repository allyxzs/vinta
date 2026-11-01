# Vinta v0.1 — Ara OS 12

Agente de comunicação e linguagem com escrita, resumo, tradução, revisão, adaptação de estilo e chat.

## Instalação (Kali Linux / Linux)

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

Edite `.env` e configure `OPENAI_API_KEY` com uma chave válida. O modelo pode ser alterado em `VINTA_MODEL`.

## Executar API

```bash
uvicorn vinta.api:app --host 127.0.0.1 --port 8000
```

Documentação interativa: http://127.0.0.1:8000/docs

### Exemplos

```bash
curl http://127.0.0.1:8000/health
curl -X PUT http://127.0.0.1:8000/profiles/allyxzs -H 'Content-Type: application/json' -d '{"language":"pt-BR","tone":"profissional e objetivo","audience":"desenvolvedores"}'
curl -X POST http://127.0.0.1:8000/process -H 'Content-Type: application/json' -d '{"action":"summarize","text":"Este é um texto longo para resumir.","user_id":"allyxzs"}'
```

## Terminal

```bash
python -m vinta.cli translate 'Olá, mundo!' --target-language en
python -m vinta.cli rewrite 'nóis vai amanhã'
```

## Segurança e limitações

- Não publique `.env` ou chaves de API no GitHub.
- O servidor deve permanecer local por padrão; antes de expor na internet, adicione autenticação, limites de uso e proteção de dados.
- Perfis ficam em arquivo JSON local; não é armazenamento multiusuário concorrente.
- Chamadas ao modelo exigem rede, credenciais válidas e podem gerar custos.
- Esta versão não inclui memória conversacional persistente, tradução offline ou integração direta com outros agentes.
