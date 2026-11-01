# Vinta v0.2 — BYOK (Bring Your Own Key)

Cada pessoa usa sua própria chave de API. **Não existe chave do desenvolvedor no projeto.**

## Kali Linux
```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python -m uvicorn vinta.api:app --host 127.0.0.1 --port 8000
```

## API local
Abra http://127.0.0.1:8000/docs e teste POST /process com o cabeçalho `X-OpenAI-API-Key` contendo **sua** chave. Exemplo:
```bash
curl -X POST http://127.0.0.1:8000/process \
 -H 'Content-Type: application/json' \
 -H "X-OpenAI-API-Key: $OPENAI_API_KEY" \
 -d '{"action":"translate","text":"Olá, mundo!","target_language":"en"}'
```

## Terminal
```bash
python -m vinta.cli translate 'Olá, mundo!' --target-language en
```
Se não existir `OPENAI_API_KEY` no ambiente, o terminal solicita a chave sem mostrá-la.

## Segurança
- Não inclua chaves no código, GitHub ou logs.
- Execute somente em localhost; esta API **não é segura para exposição pública**: não possui autenticação de usuários, limites de requisição ou isolamento de perfis.
- O cabeçalho de API deve trafegar apenas via HTTPS em uma implantação futura.
- A chave é usada por requisição e não é salva pelo Vinta.
- O provedor cobra a conta associada à chave fornecida.
- Para implantação pública, implementar autenticação, controle de acesso aos perfis, limites e HTTPS.
