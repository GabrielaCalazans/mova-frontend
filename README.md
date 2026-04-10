# MOVA - Sistema de Aluguel de Carros

Sistema web para aluguel de veículos desenvolvido como projeto acadêmico da FATEC.

## 🚗 Sobre o Projeto

MOVA é uma plataforma que facilita o aluguel de carros, conectando usuários a veículos disponíveis de forma prática e segura.

## 🛠️ Tecnologias Utilizadas

- **React** - Biblioteca para construção da interface
- **Vite** - Build tool e dev server
- **React Router** - Navegação entre páginas
- **CSS** - Estilização customizada
- **Vitest + Testing Library** - Testes de fluxo e unitários

## 📁 Estrutura do Projeto

```
src/
├── assets/          # Imagens e recursos estáticos
├── layout/          # Componentes de layout reutilizáveis (AuthLayout)
├── pages/           # Páginas da aplicação (Login, Cadastro, Conta)
├── services/        # Integração com API, auth e sessão
├── utils/           # Validações e máscaras de formulário
├── routes/          # Configuração de rotas
├── styles/          # Arquivos CSS compartilhados
├── App.jsx          # Componente principal
└── main.jsx         # Ponto de entrada da aplicação
```

## ⚙️ Configuração de Ambiente

O projeto utiliza variáveis de ambiente que podem ser configuradas através do arquivo `.env`. 

### Variáveis Disponíveis

| Variável | Padrão | Descrição |
|----------|--------|-----------|
| `VITE_API_BASE_URL` | `/api` | Endpoint base da API no frontend |
| `API_BASE_URL` | `/api` | Fallback para endpoint da API |
| `VITE_API_BACKEND_URL` | `http://localhost:3000` | URL do servidor backend para proxy em desenvolvimento |
| `VITE_AUTH_DEBUG` | `false` | Ativa logs de debug no console para autenticação e perfil |

### Configuração por Ambiente

Exemplo:
```env
VITE_API_BASE_URL=/api
VITE_API_BACKEND_URL=http://localhost:3000
VITE_AUTH_DEBUG=false
```

No desenvolvimento, o Vite usa `VITE_API_BACKEND_URL` para encaminhar as chamadas feitas para `/api` ao backend correto.

## 🎨 Padrão Visual

O projeto utiliza uma paleta de cores baseada em azul:
- **Primária:** #003366
- **Secundária:** #AEC5E7
- **Gradiente:** #D0E7FF → #AEC5E7

## 🚀 Como Executar

1. Instale as dependências:
```bash
npm install
```

2. Configure as variáveis de ambiente:
```bash
.env
```

Defina `VITE_API_BASE_URL=/api` e `VITE_API_BACKEND_URL` apontando para o backend.

3. Execute o servidor de desenvolvimento:
```bash
npm run dev
```

4. Acesse no navegador:
```
http://localhost:5173
```

## 📄 Páginas Disponíveis

- `/login` - Autenticação de usuários
- `/cadastro` - Cadastro de locatário
- `/cadastro-locador` - Cadastro de locador
- `/recuperar-senha` - Solicitação de recuperação de senha
- `/conta` - Área da conta após login, carregada com os dados do perfil

## 🔐 Fluxo de Autenticação

1. O login envia `POST /conta/auth/login`.
2. Em caso de sucesso, o frontend chama `GET /conta/auth/me` usando o token recebido no header `Authorization: Bearer <token>`.
3. O perfil do usuário é definido apenas pelo conteúdo de `result.locador` ou `result.locatario`.
4. A tela de conta é aberta já preenchida com os campos retornados pela API.
5. O botão de sair limpa a sessão em `localStorage` e retorna para `/login`.

## 🧾 Perfis

O sistema trabalha somente com dois perfis:

- `locatario`
- `locador`

A tela de conta, o badge de perfil e a hidratação dos campos seguem apenas esses dois tipos.

## 🌐 API

O frontend usa como base de integração o prefixo `/api` no ambiente local, com proxy configurado no Vite para o backend publicado em Render.

- Login: `/api/conta/auth/login`
- Conta atual: `/api/conta/auth/me`
- Cadastro de conta: `/api/conta/auth/register`
- Cadastro de locatário: `/api/locatario/`
- Cadastro de locador: `/api/locador/`

## 🧪 Testes

Execute os testes uma vez:

```bash
npm run test:run
```

Execute em modo watch:

```bash
npm run test
```

## ♿ Acessibilidade

Todas as páginas seguem padrões de acessibilidade com uso de `aria-label` nos formulários para compatibilidade com leitores de tela.

## 📝 Licença

Projeto acadêmico desenvolvido para a FATEC.
