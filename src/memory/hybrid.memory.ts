import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { MemoryItem, Message } from '../types/agent.types';
import { config } from '../config/env';
import { MultiProviderLLMRouter } from '../llm/provider.router';
import { logger } from '../telemetry/logger';

export class HybridMemoryManager {
  private shortTermMemory: Map<string, Message[]> = new Map();
  private longTermStore: MemoryItem[] = [];
  private storageFile: string;

  constructor(private llmRouter: MultiProviderLLMRouter) {
    this.storageFile = path.resolve(config.VECTOR_DB_PATH);
    this.loadPersistentMemory();
  }

  private loadPersistentMemory(): void {
    try {
      const dir = path.dirname(this.storageFile);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      if (fs.existsSync(this.storageFile)) {
        const raw = fs.readFileSync(this.storageFile, 'utf-8');
        this.longTermStore = JSON.parse(raw);
      }
    } catch (error) {
      logger.warn({ error }, 'Banco vetorial Vinta 3 iniciado em memória limpa.');
      this.longTermStore = [];
    }
  }

  private savePersistentMemory(): void {
    try {
      const dir = path.dirname(this.storageFile);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.storageFile, JSON.stringify(this.longTermStore, null, 2), 'utf-8');
    } catch (error) {
      logger.error({ error }, 'Falha ao gravar banco vetorial Vinta 3.');
    }
  }

  public addMessage(sessionId: string, message: Omit<Message, 'id' | 'timestamp'>): Message {
    const fullMsg: Message = {
      ...message,
      id: uuidv4(),
      timestamp: Date.now(),
    };

    const history = this.shortTermMemory.get(sessionId) || [];
    history.push(fullMsg);

    if (history.length > config.MEMORY_WINDOW_SIZE) {
      history.shift();
    }

    this.shortTermMemory.set(sessionId, history);
    return fullMsg;
  }

  public getSessionHistory(sessionId: string): Message[] {
    return this.shortTermMemory.get(sessionId) || [];
  }

  public async storeSemanticMemory(
    sessionId: string,
    content: string,
    tags: string[] = [],
    type: 'episodic' | 'semantic' | 'procedural' = 'semantic',
    importance = 0.75
  ): Promise<MemoryItem> {
    const embedding = await this.llmRouter.embedText(content);
    const item: MemoryItem = {
      id: uuidv4(),
      sessionId,
      type,
      content,
      embedding,
      tags,
      importance,
      createdAt: Date.now(),
    };

    this.longTermStore.push(item);
    this.savePersistentMemory();
    return item;
  }

  public async searchRelevantMemories(query: string, topK = 5): Promise<Array<MemoryItem & { score: number }>> {
    if (this.longTermStore.length === 0) return [];

    const queryEmbedding = await this.llmRouter.embedText(query);
    const queryTerms = query
      .toLowerCase()
      .split(/\s+/)
      .filter((t) => t.length > 2);

    const now = Date.now();
    const scored = this.longTermStore.map((item) => {
      const cosine = this.cosineSimilarity(queryEmbedding, item.embedding);

      const contentLower = item.content.toLowerCase();
      let lexicalMatches = 0;
      for (const term of queryTerms) {
        if (contentLower.includes(term)) lexicalMatches++;
      }
      const lexicalScore = queryTerms.length > 0 ? lexicalMatches / queryTerms.length : 0;

      // Recency decay boost
      const ageHours = Math.max(0, (now - item.createdAt) / (1000 * 60 * 60));
      const recencyBoost = 1 / (1 + ageHours * 0.05);

      const hybridScore = cosine * 0.65 + lexicalScore * 0.2 + item.importance * 0.1 + recencyBoost * 0.05;
      return { ...item, score: Number(hybridScore.toFixed(4)) };
    });

    return scored.sort((a, b) => b.score - a.score).slice(0, topK);
  }

  private cosineSimilarity(vecA: number[], vecB: number[]): number {
    const len = Math.min(vecA.length, vecB.length);
    let dot = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < len; i++) {
      dot += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }
    const denom = Math.sqrt(normA) * Math.sqrt(normB);
    return denom === 0 ? 0 : dot / denom;
  }

  public getMemoryStats() {
    return {
      activeSessions: this.shortTermMemory.size,
      totalLongTermItems: this.longTermStore.length,
    };
  }
}
