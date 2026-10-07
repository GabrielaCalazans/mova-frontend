# Notas de implementação — src (raiz)

Texto que ficava em comentários de várias linhas no código. Cada seção indica o arquivo e o trecho que o comentário acompanhava.

## `src/App.flow.test.jsx`

**`const LOCADOR_ID = "9a8b7c6d-5555-4e3f-2a1b-000000000099";`**

As garagens deixaram de ser uma lista fixa no componente e passaram a vir de
GET /api/garagem. Os ids são UUIDs, como no backend.

**`it("retirada usa a garagem do veículo, sem oferecer escolha", async () => {`**

A retirada NÃO é escolha do usuário: o backend exige que
idGaragemRetirada seja exatamente a garagem onde o veículo está alocado
(ReservaService.resolverGaragemRetirada). A tela apenas mostra qual é.

**`it("devolução lista apenas garagens do locador dono do veículo", async () => {`**

A devolução é escolha do usuário, mas restrita: o backend exige que a
garagem pertença ao locador dono do veículo (assertGaragemDevolucao).

**`it("sem veículo escolhido, a etapa de garagem volta para a escolha do carro", async () ...`**

A jornada é veículo-primeiro: o local de retirada sai do veículo, então
entrar direto na etapa de garagem não faz sentido.

## `src/index.css`

**`:root {`**

Camada de compatibilidade (Task 8).
As telas antigas e os styled-components (authStyle.js) consomem nomes
legados (--color-\*, --mova-\*). Em vez de duplicar paletas por tema, cada
nome legado aponta para um token semântico — que já troca entre claro e
escuro em tokens.css. Assim não existe mais um segundo sistema de cores:
\#003366 e #D0E7FF chegam a todas as telas pela mesma fonte.
