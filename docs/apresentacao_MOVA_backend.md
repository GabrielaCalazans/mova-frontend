# MOVA - Material para Apresentacao Academica

## Resumo executivo

O MOVA, neste repositório, é uma API backend em Node.js e TypeScript para um sistema de mobilidade e locacao de veiculos com foco em acessibilidade. A base de codigo implementa cadastro, autenticacao, consulta e manutencao de contas, locadores, locatarios, veiculos e tipos de deficiencia, usando Express, Prisma, PostgreSQL, Zod, bcrypt e JWT.

O projeto ainda nao possui frontend neste workspace. Tambem nao existe, na camada de aplicacao, o fluxo completo de reserva, checkout, pagamento, acompanhamento de reserva ou avaliacao. Esses conceitos aparecem no modelo de dados do Prisma e nos scripts de seed/reset, mas ainda nao foram expostos por rotas, controllers, services e repositories proprios.

Em termos de maturidade, o sistema esta em um estagio solido de backend fundacional: autentica usuarios, organiza a persistencia, valida dados, aplica arquitetura em camadas e expoe endpoints REST. Ao mesmo tempo, o dominio maior de locacao sob demanda ainda esta parcialmente implementado.

## 1. Introducao ao projeto

### O que e o MOVA

O MOVA e uma plataforma proposta para mobilidade urbana e locacao de veiculos com foco em acesso ampliado, inclusao e experiencia simplificada. A ideia central e conectar usuarios a veiculos e operadoras de locacao, com suporte a atributos relevantes para acessibilidade, como veiculos adaptados e garagens com acessibilidade.

### Qual problema resolve

O projeto responde a um problema prático de mobilidade: nem sempre o processo de locar um veiculo considera acessibilidade, perfil do usuario, disponibilidade e organizacao de frota de forma clara. O MOVA busca estruturar esse fluxo em uma plataforma digital orientada a dados, reduzindo friccao no cadastro, autenticacao, consulta e gestao das entidades do sistema.

### Publico atendido

- Usuarios finais que pretendem alugar veiculos.
- Locadores e empresas de locacao que gerenciam frota.
- Locatarios com necessidades de acessibilidade ou com perfil de mobilidade especifico.
- Avaliadores academicos e tecnicos que precisam analisar uma solucao de engenharia de software com arquitetura organizada.

### Diferenciais conceituais do projeto

- Foco em acessibilidade e inclusao.
- Estrutura de dados preparada para garagens, reservas, localizacoes e avaliacao.
- Modelo de veiculos com suporte a caracteristicas relevantes, como veiculo eletrico e veiculo adaptado.
- Separacao clara entre camadas tecnicas no backend.

## 2. Objetivo do sistema

### Proposta da plataforma

O objetivo do MOVA e fornecer uma base tecnica para um ecossistema de locacao e mobilidade sob demanda. O backend foi organizado para sustentar operacoes de cadastro, consulta e autenticacao de contas, alem de catalogo de veiculos e perfis vinculados ao negocio.

### Foco em mobilidade

O dominio do sistema gira em torno de disponibilizar veiculos para uso pontual, com suporte a busca por atributos como marca, modelo, ano, cambio, capacidade, status, veiculo eletrico e veiculo adaptado.

### Acessibilidade

O repositorio demonstra preocupacao com acessibilidade por meio do modelo de dados e das entidades de dominio:

- `Deficiencia` para classificar perfis de usuario.
- Campo `adaptado` em `Veiculo`.
- Campo `acessibilidade` em `Garagem`.

Isso indica um direcionamento inclusivo, embora a camada frontend para acessibilidade visual e interativa nao esteja presente neste workspace.

### Veiculos autonomos e smart garagens

A narrativa conceitual do projeto cita veiculos autonomos e smart garagens, mas a implementacao atual nao contem logica operacional de autonomia veicular ou orquestracao inteligente de garagem. O que existe hoje e a modelagem de suporte para garagens, localizacao e status de veiculo, sem a camada de negocio completa.

## 3. Funcionalidades implementadas

### Funcionalidades completas

Estas funcionalidades estao efetivamente expostas na API e sustentadas por controller, service, repository, schema e Prisma:

- Cadastro de conta.
- Login com emissao de JWT.
- Consulta da conta autenticada.
- Troca de senha autenticada.
- Exclusao da propria conta autenticada.
- CRUD de conta em area administrativa.
- CRUD de locador.
- Consulta de locador por ID, CNPJ ou empresa.
- CRUD de locatario.
- Consulta de locatario por ID, CPF ou CNH.
- CRUD de veiculo.
- Consulta de veiculos por ID, por locador e por filtros.
- CRUD de deficiencia.
- Consulta de deficiencia por ID e por descricao.
- Middleware de autenticacao via Bearer token.
- Middleware de metadados de resposta da API.
- Tratamento centralizado de erros.
- Validacao de entrada com Zod.
- Persistencia com Prisma e PostgreSQL.

### Funcionalidades parcialmente implementadas

Estas partes aparecem no dominio ou na estrutura do banco, mas ainda nao formam uma jornada completa de produto:

- Garagem.
- Reserva.
- Localizacao de veiculo.
- Avaliacao.
- Fluxo de checkout e pagamento.
- Acompanhamento de reserva.
- Controle de disponibilidade mais avancado.

No Prisma, essas entidades existem no modelo, e o seed contem dados relacionados, mas faltam rotas, controllers, services e repositories para colocarem essas funcoes em producao.

### Funcionalidades planejadas ou apenas modeladas

O que o repositorio indica como planejado, mas nao implementado na camada de aplicacao:

- Reserva completa com estados de ciclo de vida.
- Pagamento com status de processamento, sucesso ou falha.
- Check-in/check-out operacional.
- Avaliacao do servico apos uso.
- Localizacao historica do veiculo.
- Regras de smart garagem com alocacao automatica e acompanhamento.

## 4. Arquitetura e estrutura tecnica

### Arquitetura utilizada

O projeto segue uma arquitetura em camadas, com separacao clara entre:

- Routes: definicao dos endpoints HTTP.
- Controllers: recebimento da requisicao, validacao inicial e resposta.
- Services: regras de negocio.
- Repositories: acesso aos dados.
- Schemas: validacao estrutural com Zod.
- Prisma: persistencia e modelagem do banco.

Na pratica, o desenho se aproxima de um MVC simplificado com DAO/repository pattern. Nao ha frontend neste workspace, entao a analise estrutural fica concentrada no backend.

### Organizacao de pastas

- `src/server.ts`: ponto de entrada da API.
- `src/routes/`: rotas separadas por dominio.
- `src/controllers/`: controllers por entidade.
- `src/services/`: regras de negocio.
- `src/repositories/`: contratos e implementacoes de persistencia.
- `src/schemas/`: validacao com Zod.
- `src/middlewares/`: auth, versionamento e erro.
- `src/errors/`: classe de erro HTTP.
- `src/database/`: cliente Prisma.
- `prisma/`: schema, seed e reset.

### Fluxo de dados

1. A requisicao entra na rota.
2. O controller valida parametros e corpo.
3. O service aplica regra de negocio.
4. O repository consulta ou altera o banco.
5. O Prisma executa a operacao no PostgreSQL.
6. A resposta retorna com o middleware de metadados da API.

### Gerenciamento de estado e sessao

O sistema e stateless do ponto de vista de autenticacao. A sessao nao e armazenada no servidor. O estado de autenticacao e mantido por JWT enviado no header `Authorization`.

### Padrao arquitetural

O codigo nao usa um framework de MVC tradicional completo, mas adota os principios de:

- separacao de responsabilidade,
- injeção manual de dependencias via container,
- isolamento de regras de negocio,
- acesso a dados desacoplado por interfaces.

## 5. Tecnologias utilizadas

### Linguagens e runtime

- Node.js: runtime da API.
- TypeScript: tipagem, organizacao e manutenibilidade.

### Framework e bibliotecas principais

- Express 5: servidor HTTP e roteamento.
- Prisma ORM: acesso ao banco e modelagem de dados.
- PostgreSQL: banco de dados relacional.
- Zod: validacao de entrada e contratos de dados.
- bcrypt: hash e verificacao de senha.
- jsonwebtoken: emissao e verificacao de JWT.
- dotenv: carregamento de variaveis de ambiente.

### Ferramentas de desenvolvimento

- tsx: execucao do projeto em modo de desenvolvimento.
- TypeScript compiler: build de compilacao.
- rimraf: limpeza de build anterior.
- Postman collection: consumo manual da API.

### Motivo da escolha

- Express oferece simplicidade e maturidade para APIs REST.
- Prisma reduz custo de acesso ao banco e aumenta seguranca de tipagem.
- Zod reforca validacao consistente entre camadas.
- JWT permite autenticacao stateless, adequada para API.
- bcrypt protege senhas com hash.

## 6. Banco de dados e APIs

### Como os dados sao consumidos

Os dados sao consumidos via endpoints REST e persistidos no PostgreSQL por meio do Prisma. O repositório usa interfaces para definir o contrato de acesso e implementacoes concretas em `src/repositories/prisma`.

### Principais entidades do banco

- Conta.
- Locador.
- Locatario.
- Veiculo.
- Deficiencia.
- Garagem.
- Reserva.
- Localizacao.
- Avaliacao.

### Entidades efetivamente integradas na aplicacao

- Conta.
- Locador.
- Locatario.
- Veiculo.
- Deficiencia.

### Entidades apenas modeladas no Prisma

- Garagem.
- Reserva.
- Localizacao.
- Avaliacao.

### Endpoints principais

Base local: `/api`

#### Status

- `GET /api/basic/status`

#### Conta

- `POST /api/conta/auth/register`
- `POST /api/conta/auth/login`
- `GET /api/conta/auth/me`
- `PATCH /api/conta/auth/change-password`
- `DELETE /api/conta/auth/delete-account`

#### Admin

- `GET /api/admin/conta/all`
- `GET /api/admin/conta/`
- `GET /api/admin/conta/:id`
- `POST /api/admin/conta/create`
- `PUT /api/admin/conta/update/:id`
- `DELETE /api/admin/conta/delete/:id`
- `GET /api/admin/deficiencia/all`
- `GET /api/admin/deficiencia/search`
- `POST /api/admin/deficiencia`
- `GET /api/admin/deficiencia/:id`
- `PUT /api/admin/deficiencia/:id`
- `DELETE /api/admin/deficiencia/:id`

#### Locador

- `GET /api/locador/all`
- `GET /api/locador/search`
- `POST /api/locador/`
- `GET /api/locador/:id`
- `PUT /api/locador/:id`
- `DELETE /api/locador/:id`

#### Locatario

- `GET /api/locatario/all`
- `GET /api/locatario/search`
- `POST /api/locatario/`
- `GET /api/locatario/:id`
- `PUT /api/locatario/:id`
- `DELETE /api/locatario/:id`

#### Veiculo

- `GET /api/veiculo/all`
- `GET /api/veiculo/search`
- `GET /api/veiculo/locador/:id_locador`
- `GET /api/veiculo/:id`
- `POST /api/veiculo/`
- `PUT /api/veiculo/:id`
- `DELETE /api/veiculo/:id`

### Fluxo de requisicao e persistencia

O backend usa validacao por schema antes de tocar no banco. Em seguida, o service chama o repository, que usa Prisma para consultar ou mutar os dados. Erros de dominio retornam `HttpError`, e erros de validacao ou excecao generica passam pelo handler central.

## 7. Acessibilidade e inclusao

### Suporte PCD no dominio

O projeto demonstra preocupacao com inclusao por meio da modelagem:

- `Deficiencia` como entidade de classificacao.
- `Locatario` pode ser vinculado a uma deficiencia.
- `Veiculo.adaptado` indica veiculos preparados para uso inclusivo.
- `Garagem.acessibilidade` indica infraestrutura acessivel.

### Acessibilidade auditiva e para cadeirantes

A implementacao atual nao contem frontend, portanto nao e possivel verificar componentes de interface, contraste, labels, alertas visuais ou suporte interativo para acessibilidade auditiva. No entanto, o modelo de dados foi pensado para representar necessidades reais de acessibilidade, inclusive adaptacao de veiculos e infraestrutura de garagem.

### WCAG e design acessivel

Nao ha camada visual nesta base para validar WCAG diretamente. Esse ponto deve ser tratado na futura interface do projeto, com foco em contraste, navegacao por teclado, textos alternativos e feedback visual claro.

## 8. Fluxo do usuario

O fluxo completo desejado pelo dominio do MOVA e o seguinte:

1. Login ou cadastro.
2. Escolha do tipo de veiculo.
3. Escolha do veiculo.
4. Retirada.
5. Devolucao.
6. Checkout.
7. Pagamento.
8. Reserva concluida.

### Estado real no repositorio

Esse fluxo ainda nao esta totalmente implementado. Hoje a base suporta apenas o inicio da jornada, com autenticacao, catalogo e gestao de cadastros. As etapas de reserva, pagamento, retirada e devolucao ainda precisam ser desenvolvidas na camada de aplicacao.

## 9. Testes e qualidade

### Testes existentes

Nao foram encontrados arquivos de teste automatizado no workspace.

### Ferramentas presentes

- Nao ha configuracao de Vitest.
- Nao ha Testing Library.
- Nao ha suite E2E.

### Implicacoes

A ausencia de testes automatizados significa que a confiabilidade atual depende de validacao manual, da colecao Postman e da consistencia entre schema, service e repository.

### Melhorias futuras

- Adicionar testes unitarios para services.
- Adicionar testes de integracao para rotas e repositories.
- Criar cobertura E2E para o fluxo de autenticacao e futura reserva.

## 10. Seguranca

### Autenticacao

O sistema usa JWT.

- No cadastro, a API gera token com o id da conta.
- No login, a API emite token apos validacao de credenciais.
- O middleware de autenticacao verifica `Authorization: Bearer <token>`.

### Protecao de rotas

Rotas autenticadas existentes:

- `GET /auth/me`
- `PATCH /auth/change-password`
- `DELETE /auth/delete-account`

### Senhas

As senhas sao armazenadas como hash com bcrypt, nao em texto puro.

### Validação de dados

Zod e usado para impedir entrada invalida antes da persistencia.

### LGPD

O repositorio nao contem, ate este momento, uma camada especifica de consentimento, anonimização ou politicas formais de privacidade. Esse ponto deve ser tratado como requisito futuro, principalmente por envolver dados pessoais como nome, email, telefone, CPF, CNH e CNPJ.

## 11. Diferenciais do projeto

### Diferenciais ja sustentados por codigo ou modelagem

- Foco em mobilidade com recorte inclusivo.
- Modelo de veiculo com suporte a `adaptado` e `eletrico`.
- Modelo de garagem com flag de `acessibilidade`.
- Separacao limpa de camadas no backend.
- Autenticacao stateless via JWT.
- Respostas padronizadas com metadados da API.

### Diferenciais ainda conceituais

- Veiculos autonomos.
- Smart garagens com orchestracao inteligente.
- Reserva sob demanda com pagamento integrado.
- Experiencia digital completa em frontend.

Esses diferenciais fazem parte da proposta de valor do projeto, mas ainda nao estao totalmente entregues na implementacao atual.

## 12. Estado atual do desenvolvimento

### O que ja existe de forma consistente

- Backend funcional em Node.js + TypeScript.
- Rotas REST organizadas por dominio.
- Cadastro e autenticacao de contas.
- CRUD de locador, locatario, veiculo e deficiencia.
- Persistencia com Prisma e PostgreSQL.
- Validacao com Zod.
- Middleware de auth e erro.
- Colecao Postman para testes manuais.

### O que ainda falta

- Frontend.
- Suporte completo a reservas, pagamentos e checkout.
- Rotas para garagem, reserva, localizacao e avaliacao.
- Testes automatizados.
- Camada de autorizacao por perfil ou papel.
- Fluxos de inclusao e acessibilidade na interface.

### Leitura academica do estado atual

O MOVA pode ser apresentado, neste momento, como uma base backend bem estruturada e alinhada a boas praticas de engenharia de software, com dominio coerente e arquitetura organizada. Ao mesmo tempo, ele ainda nao e uma plataforma finalizada de locacao de mobilidade; ele esta em fase de consolidacao da camada de negocio central.

## 13. Sugestao de roteiro de slides

### Slide 1 - Titulo

- MOVA: plataforma de mobilidade, acessibilidade e locacao sob demanda.

### Slide 2 - Problema e contexto

- Dificuldade de unir locacao, acessibilidade e experiencia digital em um unico fluxo.

### Slide 3 - Objetivo do sistema

- Criar uma base tecnica para uma solucao de mobilidade inclusiva.

### Slide 4 - Funcionalidades implementadas

- Autenticacao, cadastro, CRUDs e consulta de veiculos.

### Slide 5 - Arquitetura

- Routes -> Controllers -> Services -> Repositories -> Prisma.

### Slide 6 - Tecnologias

- Node.js, TypeScript, Express, Prisma, PostgreSQL, Zod, bcrypt, JWT.

### Slide 7 - Banco e APIs

- Entidades, endpoints principais e fluxo de requisicao.

### Slide 8 - Acessibilidade

- Deficiencia, veiculos adaptados, garagens acessiveis.

### Slide 9 - Seguranca e qualidade

- JWT, hash de senha, validacao, ausencia de testes automatizados.

### Slide 10 - Estado atual e proximos passos

- Base forte, mas com reservas, pagamentos e frontend ainda pendentes.
