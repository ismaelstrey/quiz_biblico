# Sistema de Logging - Bible Quiz App

## Visão Geral

O sistema de logging foi implementado usando Winston para fornecer logs estruturados e configuráveis para debugging, monitoramento e auditoria da aplicação.

## Estrutura do Sistema

### Arquivos Principais

- `src/lib/logger.ts` - Configuração principal do Winston
- `src/lib/logger.config.ts` - Configurações por ambiente
- `src/lib/logging-middleware.ts` - Funções especializadas de logging
- `src/middleware.ts` - Integração com middleware do Next.js

### Configurações por Ambiente

#### Desenvolvimento
- **Nível**: debug
- **Console**: habilitado com cores
- **Arquivos**: desabilitado
- **Performance**: habilitado (threshold: 1000ms)

#### Produção
- **Nível**: info
- **Console**: desabilitado
- **Arquivos**: habilitado com rotação diária
- **Performance**: habilitado (threshold: 2000ms)

#### Teste
- **Nível**: error
- **Console**: desabilitado
- **Arquivos**: desabilitado
- **Performance**: desabilitado

## Tipos de Logs

### 1. Logs de Autenticação

```typescript
logAuthEvent('login', userId, {
  email: 'user@example.com',
  ip: '192.168.1.1',
  userAgent: 'Mozilla/5.0...'
})
```

**Eventos suportados:**
- `login` - Login bem-sucedido
- `logout` - Logout do usuário
- `registration` - Registro de novo usuário
- `auth_failure` - Falha na autenticação
- `registration_failure` - Falha no registro

### 2. Logs de Quiz

```typescript
logQuizEvent('quiz_completed', userId, {
  quizId: 'quiz123',
  quizTitle: 'Bible Knowledge',
  score: 85,
  correctAnswers: 8,
  totalQuestions: 10,
  timeSpent: 300
})
```

**Eventos suportados:**
- `quiz_attempt_start` - Início de tentativa
- `quiz_completed` - Quiz finalizado
- `quiz_abandoned` - Quiz abandonado

### 3. Logs de Segurança

```typescript
logSecurityEvent('unauthorized_access_attempt', 'medium', {
  path: '/admin',
  ip: '192.168.1.1',
  userAgent: 'Mozilla/5.0...'
})
```

**Níveis de severidade:**
- `low` - Eventos de baixo risco
- `medium` - Eventos de risco moderado
- `high` - Eventos de alto risco
- `critical` - Eventos críticos

### 4. Logs de Requisições HTTP

Automaticamente capturados pelo middleware:

```typescript
// Requisição
{
  method: 'POST',
  url: '/api/auth/login',
  ip: '192.168.1.1',
  userAgent: 'Mozilla/5.0...',
  timestamp: '2024-01-15T10:30:00Z'
}

// Resposta
{
  statusCode: 200,
  duration: 150,
  contentLength: 1024
}
```

## Estrutura de Arquivos de Log

### Produção

```
logs/
├── error-2024-01-15.log      # Logs de erro
├── auth-2024-01-15.log       # Logs de autenticação
├── quiz-2024-01-15.log       # Logs de quiz
└── combined-2024-01-15.log   # Todos os logs
```

### Política de Retenção

- **Logs de erro**: 90 dias
- **Logs de autenticação**: 30 dias
- **Logs de quiz**: 7 dias
- **Logs de performance**: 3 dias
- **Logs gerais**: 7 dias

## Uso Básico

### Logging Simples

```typescript
import { log } from '@/lib/logger'

// Informação
log.info('Usuário logado com sucesso', { userId: '123' })

// Erro
log.error('Erro ao conectar com banco de dados', { 
  error: error.message,
  stack: error.stack 
})

// Warning
log.warn('Tentativa de acesso suspeita', { ip: '192.168.1.1' })

// Debug
log.debug('Processando requisição', { requestId: 'req123' })
```

### Logging Especializado

```typescript
import { logAuthEvent, logQuizEvent, logSecurityEvent } from '@/lib/logging-middleware'

// Evento de autenticação
logAuthEvent('login', 'user123', {
  email: 'user@example.com',
  ip: '192.168.1.1'
})

// Evento de quiz
logQuizEvent('quiz_completed', 'user123', {
  quizId: 'quiz456',
  score: 85
})

// Evento de segurança
logSecurityEvent('unauthorized_access', 'high', {
  path: '/admin',
  ip: '192.168.1.1'
})
```

## Integração com APIs

### Exemplo em Route Handler

```typescript
import { logAuthEvent, logApiError } from '@/lib/logging-middleware'

export async function POST(request: NextRequest) {
  try {
    // Lógica da API
    const result = await processLogin(email, password)
    
    // Log de sucesso
    logAuthEvent('login', result.userId, {
      email,
      ip: request.headers.get('x-forwarded-for')
    })
    
    return NextResponse.json(result)
  } catch (error) {
    // Log de erro
    logApiError(error, request, {
      operation: 'user_login',
      email
    })
    
    throw error
  }
}
```

## Monitoramento e Alertas

### Eventos Críticos

Os seguintes eventos são sempre logados independente do nível:
- `auth_failure`
- `unauthorized_access_attempt`
- `security_breach`
- `system_error`
- `database_error`

### Métricas de Performance

- Requisições lentas (> threshold configurado)
- Operações de banco de dados demoradas
- Tempo de resposta das APIs
- Uso de memória e CPU

## Configuração Personalizada

### Alterando Configurações

Edite `src/lib/logger.config.ts` para personalizar:

```typescript
export const loggerConfig = {
  development: {
    level: 'debug',
    console: {
      enabled: true,
      colorize: true
    },
    // ... outras configurações
  }
}
```

### Variáveis de Ambiente

```env
# Nível de log (debug, info, warn, error)
LOG_LEVEL=info

# Habilitar logs de console em produção
LOG_CONSOLE_ENABLED=false

# Diretório de logs
LOG_DIR=./logs
```

## Testes

O sistema inclui testes unitários abrangentes:

```bash
# Executar testes do sistema de logging
npm test src/__tests__/logger.test.ts
```

## Boas Práticas

1. **Use níveis apropriados**:
   - `debug`: Informações detalhadas para desenvolvimento
   - `info`: Eventos importantes da aplicação
   - `warn`: Situações que merecem atenção
   - `error`: Erros que precisam ser corrigidos

2. **Inclua contexto relevante**:
   ```typescript
   log.info('Processando pagamento', {
     userId: '123',
     orderId: '456',
     amount: 99.99,
     method: 'credit_card'
   })
   ```

3. **Não logue informações sensíveis**:
   - Senhas
   - Tokens de autenticação
   - Dados pessoais completos
   - Informações de cartão de crédito

4. **Use logging estruturado**:
   ```typescript
   // ✅ Bom
   log.info('User login successful', { userId, email, ip })
   
   // ❌ Evitar
   log.info(`User ${email} logged in from ${ip}`)
   ```

5. **Monitore performance**:
   ```typescript
   const startTime = Date.now()
   await heavyOperation()
   const duration = Date.now() - startTime
   
   if (duration > 1000) {
     log.warn('Slow operation detected', { operation: 'heavyOperation', duration })
   }
   ```

## Troubleshooting

### Logs não aparecem
1. Verifique a configuração do ambiente
2. Confirme o nível de log configurado
3. Verifique permissões do diretório de logs

### Performance impactada
1. Ajuste o nível de log em produção
2. Configure rotação de arquivos adequada
3. Monitore uso de disco

### Logs muito verbosos
1. Aumente o nível mínimo de log
2. Remova logs de debug desnecessários
3. Use sampling para logs de alta frequência