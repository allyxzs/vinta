import { config } from './config/env';
import { logger } from './telemetry/logger';
import { createVintaServer } from './api/server';

const { server } = createVintaServer();

server.listen(config.PORT, () => {
  logger.info(
    `⚡ Vinta 3 Autonomous Engine v3.0.0 ativo em http://localhost:${config.PORT} [Modo: ${config.NODE_ENV}]`
  );
  logger.info(`📡 Manifesto MCP: http://localhost:${config.PORT}/api/v1/mcp/manifest`);
  logger.info(`📊 Métricas Prometheus: http://localhost:${config.PORT}/metrics`);
});
