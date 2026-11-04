import { config } from './config/env';
import { logger } from './telemetry/logger';
import { createVintaServer } from './api/server';

const { server } = createVintaServer();

server.listen(config.PORT, () => {
  logger.info(
    `🚀 Vinta Pro Enterprise v2.0 rodando em http://localhost:${config.PORT} [Ambiente: ${config.NODE_ENV}]`
  );
  logger.info(`📊 Métricas Prometheus disponíveis em http://localhost:${config.PORT}/metrics`);
});
