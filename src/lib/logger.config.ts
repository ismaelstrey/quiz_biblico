export const loggerConfig = {
  // Configurações de desenvolvimento
  development: {
    level: 'debug',
    console: {
      enabled: true,
      colorize: true,
      timestamp: true,
    },
    file: {
      enabled: false,
    },
    performance: {
      enabled: true,
      slowRequestThreshold: 1000, // ms
    },
  },

  // Configurações de produção
  production: {
    level: 'info',
    console: {
      enabled: false,
      colorize: false,
      timestamp: true,
    },
    file: {
      enabled: true,
      maxSize: '20m',
      maxFiles: '14d',
      datePattern: 'YYYY-MM-DD',
    },
    performance: {
      enabled: true,
      slowRequestThreshold: 2000, // ms
    },
  },

  // Configurações de teste
  test: {
    level: 'error',
    console: {
      enabled: false,
      colorize: false,
      timestamp: false,
    },
    file: {
      enabled: false,
    },
    performance: {
      enabled: false,
    },
  },
};

// Configuração atual baseada no ambiente
export const currentConfig =
  loggerConfig[process.env.NODE_ENV as keyof typeof loggerConfig] ||
  loggerConfig.development;

// Tipos de eventos que devem ser sempre logados independente do nível
export const criticalEvents = [
  'auth_failure',
  'unauthorized_access_attempt',
  'security_breach',
  'system_error',
  'database_error',
];

// Configurações de retenção de logs
export const retentionPolicy = {
  // Logs de erro: manter por 90 dias
  error: '90d',
  // Logs de autenticação: manter por 30 dias
  auth: '30d',
  // Logs de quiz: manter por 7 dias
  quiz: '7d',
  // Logs de performance: manter por 3 dias
  performance: '3d',
  // Logs gerais: manter por 7 dias
  general: '7d',
};
