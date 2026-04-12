# MOVA - Frontend

Aplicacao web de locacao de veiculos desenvolvida em React + Vite.

## Visao Geral

O projeto possui autenticacao, perfil de usuario (`locatario` e `locador`), fluxo de locacao com etapas sequenciais e menu global compartilhado para paginas autenticadas.

Principais ajustes recentes:
- Fluxo pos-login por perfil:
- `locatario` vai para `/tipos-carros`.
- `locador` permanece em `/conta`.
- Menu global atualizado com itens: `Minha Conta`, `Historico`, `Suporte`, `Configuracoes` e `Sair`.
- Guard de rotas autenticadas para bloquear acesso sem sessao.
- Compatibilidade de rotas legadas via redirecionamento.
- Exclusao de conta com popup/modal (sem `alert`/`confirm` nativo).

## Tecnologias

- React 19
- Vite 7
- React Router DOM 7
- Styled Components
- Lucide React
- Vitest + Testing Library

## Estrutura

```text
src/
	assets/
	components/
	hooks/
	layout/
		AuthLayout.jsx
		AuthenticatedLayout.jsx
	pages/
	routes/
		AppRoutes.jsx
	services/
	styles/
	test/
	utils/
```

## Requisitos

- Node.js 20+
- npm 10+

## Configuracao de Ambiente

1. Crie o arquivo `.env` com base em `.env.example`.
2. Preencha as variaveis abaixo:

| Variavel | Exemplo | Uso |
|---|---|---|
| `API_BASE_URL` | `/api` | Base usada pelo client HTTP |
| `VITE_API_BASE_URL` | `/api` | Opcional; se definida, tem prioridade sobre `API_BASE_URL` |
| `API_BACKEND_URL` | `http://localhost:3000` | Destino do proxy do Vite para `/api` |
| `AUTH_DEBUG` | `false` | Habilita logs de debug de autenticacao/perfil |

Observacao:
- O client usa `VITE_API_BASE_URL` e, se ausente, usa `API_BASE_URL`.
- No desenvolvimento, o Vite encaminha `/api` para `API_BACKEND_URL`.

## Como Rodar

1. Instalar dependencias:

```bash
npm install
```

2. Iniciar ambiente de desenvolvimento:

```bash
npm run dev
```

3. Abrir no navegador:

```text
http://localhost:5173
```

## Scripts

- `npm run dev`: sobe o servidor local
- `npm run build`: gera build de producao
- `npm run preview`: sobe build local para validacao
- `npm run lint`: executa lint
- `npm run test`: executa testes em watch
- `npm run test:run`: executa testes uma vez

## Rotas

Publicas:
- `/login`
- `/cadastro`
- `/cadastro-locatario`
- `/cadastro-locador`
- `/recuperar-senha`

Protegidas (exigem sessao):
- `/conta`
- `/tipos-carros`
- `/carros`
- `/escolha-garagem`
- `/agendamento`
- `/pagamento`
- `/desbloqueio`
- `/historico`
- `/suporte`
- `/configuracoes`

Compatibilidade (redirecionam para rotas novas):
- `/carros-screens` -> `/carros`
- `/escolha-data-e-hora` -> `/agendamento`
- `/modo-de-pagamento` -> `/pagamento`
- `/desbloqueio-de-carro` -> `/desbloqueio`

## Fluxo de Login e Navegacao

1. Login chama `POST /api/conta/auth/login`.
2. Perfil atual e sessao sao hidratados.
3. Redirecionamento pos-login:
- `locatario`: `/tipos-carros`
- `locador`: `/conta`
4. O menu global (TopBar) e compartilhado em paginas autenticadas via `AuthenticatedLayout`.
5. O item `Sair` limpa sessao (`localStorage`) e volta para `/login`.

## Fluxo de Locacao (Locatario)

Sequencia principal:
- `/tipos-carros` -> `/carros` -> `/escolha-garagem` -> `/agendamento` -> `/pagamento` -> `/desbloqueio`

## API

Principais endpoints utilizados:
- `POST /api/conta/auth/login`
- `GET /api/conta/auth/me`
- `POST /api/conta/auth/register`
- `POST /api/locatario/`
- `POST /api/locador/`

## Testes

Status atual da suite (ultima execucao local):
- 4 arquivos de teste
- 22 testes
- todos passando

Executar:

```bash
npm run test:run
```

## Observacoes

- Se ocorrer erro de conexao com API, valide `API_BASE_URL`/`VITE_API_BASE_URL` e `API_BACKEND_URL`.
- Para depuracao de autenticacao/perfil, habilite `AUTH_DEBUG=true`.

## Licenca

Projeto academico (FATEC).
