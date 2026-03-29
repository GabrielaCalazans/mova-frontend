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
├── pages/           # Páginas da aplicação (Login, Cadastro)
├── routes/          # Configuração de rotas
├── styles/          # Arquivos CSS compartilhados
├── App.jsx          # Componente principal
└── main.jsx         # Ponto de entrada da aplicação
```

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

Defina `API_BASE_URL` apontando para o backend.

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
- `/cadastro` - Registro de novos usuários
- `/recuperar-senha` - Solicitação de recuperação de senha

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
