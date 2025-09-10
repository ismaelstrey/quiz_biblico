# CI/CD Pipeline Documentation

Este diretório contém os workflows do GitHub Actions para o projeto Bible Quiz App.

## Workflows Configurados

### 1. CI/CD Pipeline (`ci.yml`)

**Triggers:**
- Push para branches `main` e `develop`
- Pull requests para branch `main`

**Jobs:**

#### Test Job
- **Matrix Strategy:** Node.js 18.x e 20.x
- **Database:** SQLite (file-based, no external service needed)
- **Steps:**
  1. Checkout do código
  2. Setup do Node.js
  3. Instalação de dependências
  4. Configuração de variáveis de ambiente
  5. Geração do Prisma Client
  6. Execução de migrações
  7. Verificação de formatação (Prettier)
  8. Verificação de tipos (TypeScript)
  9. Linting (ESLint)
  10. Testes unitários com coverage
  11. Testes de integração
  12. Upload de relatórios de coverage
  13. Build da aplicação

#### Deploy Job
- **Condição:** Apenas em push para `main`
- **Dependência:** Job de teste deve passar
- **Steps:**
  1. Checkout e setup
  2. Build da aplicação
  3. Deploy (configurar com provedor de hospedagem)

### 2. Security & Dependencies (`security.yml`)

**Triggers:**
- Agendamento semanal (domingos às 2h UTC)
- Push para `main`
- Pull requests para `main`

**Jobs:**

#### Security Audit
- Auditoria de segurança com `npm audit`
- Verificação de pacotes desatualizados
- Upload de resultados como artefatos

#### Dependency Review
- Análise de dependências em PRs
- Verificação de licenças permitidas
- Falha em vulnerabilidades moderadas ou superiores

#### CodeQL Analysis
- Análise estática de código
- Detecção de vulnerabilidades de segurança
- Suporte para JavaScript/TypeScript

## Configuração de Ambiente

### Variáveis de Ambiente Necessárias

```env
# Para desenvolvimento/teste (SQLite)
DATABASE_URL=file:./dev.db

# Para produção (PostgreSQL)
# DATABASE_URL=postgresql://user:password@host:port/database

NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=http://localhost:3000
NODE_ENV=production
```

### Secrets do GitHub

Para produção, configure os seguintes secrets no repositório:

- `DATABASE_URL`: URL de conexão com o banco de dados
- `NEXTAUTH_SECRET`: Chave secreta para autenticação
- Outros secrets específicos do provedor de deploy

## Badges de Status

Adicione estes badges ao README principal:

```markdown
![CI/CD](https://github.com/seu-usuario/bible-quiz-app/workflows/CI/CD%20Pipeline/badge.svg)
![Security](https://github.com/seu-usuario/bible-quiz-app/workflows/Security%20&%20Dependencies/badge.svg)
```

## Configuração de Deploy

O workflow está preparado para deploy automático. Configure de acordo com seu provedor:

### Vercel
```yaml
- name: Deploy to Vercel
  uses: amondnet/vercel-action@v20
  with:
    vercel-token: ${{ secrets.VERCEL_TOKEN }}
    vercel-org-id: ${{ secrets.ORG_ID }}
    vercel-project-id: ${{ secrets.PROJECT_ID }}
```

### Netlify
```yaml
- name: Deploy to Netlify
  uses: nwtgck/actions-netlify@v1.2
  with:
    publish-dir: './out'
    production-branch: main
    github-token: ${{ secrets.GITHUB_TOKEN }}
    deploy-message: "Deploy from GitHub Actions"
```

## Monitoramento

- **Coverage Reports:** Enviados para Codecov
- **Security Alerts:** Via GitHub Security tab
- **Dependency Updates:** Dependabot configurado
- **Audit Results:** Artefatos salvos por 30 dias