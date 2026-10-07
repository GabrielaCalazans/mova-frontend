# Notas de implementação — Configuração do repositório

Texto que ficava em comentários de várias linhas no código. Cada seção indica o arquivo e o trecho que o comentário acompanhava.

## `.env.example`

**`VITE_API_BASE_URL=/api`**

FRONTEND MOVA
Copie para .env e ajuste. Ver auditoria/AMBIENTES.md.

IMPORTANTE: o Vite so expoe ao navegador variaveis com o prefixo VITE_.
Qualquer variavel sem esse prefixo e invisivel para o codigo do cliente.

**`VITE_API_BASE_URL=/api`**

URL base da API, JA INCLUINDO o prefixo /api.
Backend local (npm run dev no mova-backend): o proxy do Vite repassa /api
para API_BACKEND_URL (padrao http://localhost:3000).

**`(fim do arquivo)`**

Opcional. Liga os logs de diagnostico de autenticacao (authService.js).
Precisa do prefixo VITE_ para funcionar.

## `.github/workflows/tests.yml`

**`VITE_API_BASE_URL: ${{ secrets.VITE_API_BASE_URL || 'http://mova-api.ci.invalid/api' }}`**

Vem do environment "test". Sem o secret, cai no host .invalid: a suíte
E2E mockada intercepta toda chamada /api/\*\* de qualquer forma.
