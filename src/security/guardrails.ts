export interface GuardrailCheckResult {
  safe: boolean;
  sanitizedInput: string;
  flaggedPatterns: string[];
}

/**
 * Vinta 3 Security Guardrails:
 * - Proteção contra Prompt Injection óbvio
 * - Mascaramento automático de credenciais / chaves vazadas (API Keys / Tokens)
 */
export class SecurityGuardrails {
  private static readonly INJECTION_PATTERNS: Array<{ name: string; regex: RegExp }> = [
    { name: 'IGNORE_SYSTEM_PROMPT', regex: /ignore\s+(all\s+)?previous\s+instructions/i },
    { name: 'DESTRUCTIVE_SHELL', regex: /rm\s+-rf\s+\/|mkfs\.|dd\s+if=/i },
  ];

  public static inspectAndSanitize(input: string): GuardrailCheckResult {
    const flaggedPatterns: string[] = [];

    for (const rule of this.INJECTION_PATTERNS) {
      if (rule.regex.test(input)) {
        flaggedPatterns.push(rule.name);
      }
    }

    // Mascara possíveis chaves vazadas acidentalmente no prompt
    const sanitizedInput = input
      .replace(/sk-[a-zA-Z0-9]{20,}/g, 'sk-***REDACTED***')
      .replace(/ghp_[a-zA-Z0-9]{20,}/g, 'ghp_***REDACTED***');

    return {
      safe: flaggedPatterns.length === 0,
      sanitizedInput,
      flaggedPatterns,
    };
  }
}
