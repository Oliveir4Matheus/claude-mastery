# Política de Segurança — Claude Code Mastery

## Configuração Crítica para Produção

### 1. JWT Secret

**CRÍTICO**: Você DEVE usar um JWT_SECRET forte e aleatório.

```bash
# Gere um novo secret:
openssl rand -hex 32
```

Salve o resultado em seu `.env` como:
```
JWT_SECRET=seu-resultado-aqui
```

Nunca:
- Use a chave padrão de desenvolvimento
- Compartilhe o JWT_SECRET
- Armazene em repositórios git

### 2. CORS Configuration

Configure `CORS_ORIGIN` para seus domínios exatos:

```
CORS_ORIGIN=https://seu-dominio.com,https://www.seu-dominio.com
```

Nunca use `*` em produção.

### 3. Database Credentials

Use credenciais fortes e aleatórias:

```bash
# Gere senhas aleatórias para DATABASE_URL
openssl rand -base64 32
```

Armazene em variáveis de ambiente, nunca em código.

### 4. HTTPS/TLS

Configure TLS em sua proxy reversa (Traefik):
- Certificados Let's Encrypt autorenováveis
- HSTS header configurado (max-age: 31536000)
- Redirecionar HTTP → HTTPS

### 5. Senhas de Usuário

Requisitos mínimos para senhas:
- 12 caracteres
- Pelo menos 1 letra
- Pelo menos 1 número
- Pelo menos 1 caractere especial

Exemplo válido: `MyPassword123!`

## Vulnerabilidades Corrigidas

### Backend (FastAPI)
✓ CORS restritivo (sem `*`)
✓ Security headers HTTP (X-Frame-Options, X-Content-Type-Options, etc.)
✓ Rate limiting em endpoints críticos (login: 5/min, srs: 30/min)
✓ Validação rigorosa de entrada (Pydantic com Field constraints)
✓ Proteção contra DoS (limit de question_count: 500 máximo)
✓ Validação de ranges (score 0-100, etc.)

### Frontend (React)
✓ Validação de formato de token JWT
✓ Escapamento de entradas de usuário
✓ CSP (Content-Security-Policy) headers
✓ Sanitização de inputs de registro

### Nginx
✓ CSP header restritivo
✓ X-Frame-Options: DENY
✓ X-Content-Type-Options: nosniff
✓ Cache-Control headers

## Rate Limits

- `POST /auth/register`: 5 requisições/hora
- `POST /auth/login`: 5 requisições/minuto
- `GET /validate/{code}`: 20 requisições/minuto
- `PUT /srs/review/{card_key}`: 30 requisições/minuto
- `PUT /challenges/{challenge_id}`: 20 requisições/minuto
- `POST /srs/init/{chapter_id}`: 10 requisições/minuto

## Endpoints Protegidos

Todos os endpoints exceto os seguintes requerem autenticação JWT:
- `POST /auth/register` (público, com rate limit)
- `POST /auth/login` (público, com rate limit)
- `GET /validate/{code}` (público, com rate limit)
- `GET /health` (público, sem autenticação)

## Verificação de Segurança Antes de Deploy

- [ ] JWT_SECRET configurado com valor aleatório
- [ ] CORS_ORIGIN configurado para seu domínio
- [ ] DATABASE_URL com credenciais fortes
- [ ] HTTPS/TLS habilitado na proxy reversa
- [ ] Todos os secrets removidos de repositórios
- [ ] Backup e rotação de secrets configurados
- [ ] Logs de auditoria habilitados
- [ ] Monitoramento de taxa de erro configurado

## Relatórios de Segurança

Se encontrar uma vulnerabilidade, por favor:

1. **NÃO** crie um issue público
2. Envie um email para: `security@seu-dominio.com`
3. Inclua:
   - Descrição da vulnerabilidade
   - Passos para reproduzir
   - Impacto potencial

Todos os relatórios serão revisados em até 48 horas.

## Atualizações de Dependências

Atualize regularmente:

```bash
# Backend
cd backend
pip list --outdated
pip install --upgrade <package>

# Frontend
npm outdated
npm upgrade
```

Monitore CVEs em:
- https://nvd.nist.gov/
- https://security.snyk.io/
- Seu sistema de CI/CD

## Logs e Monitoramento

Configure logging de:
- Tentativas de login falhadas
- Acessos a endpoints sensíveis
- Mudanças de configuração
- Erros de autenticação

Mantenha logs por pelo menos 90 dias.

---

**Última revisão**: 2026-04-04
**Versão**: 1.0.0
