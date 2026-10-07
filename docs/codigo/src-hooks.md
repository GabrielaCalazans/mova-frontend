# Notas de implementação — src/hooks

Texto que ficava em comentários de várias linhas no código. Cada seção indica o arquivo e o trecho que o comentário acompanhava.

## `src/hooks/useActiveReservation.js`

**`export function useActiveReservation({ enabled = true, refreshKey = "" } = {}) {`**

Reserva ativa vem sempre da API. A sessão só fornece a identidade para o
endpoint escopado; não é fonte de verdade para status ou datas.

**`` const sameIdentity = shouldLoad && state.key.startsWith(`${token}:${locatarioId}:`); ``**

Recarregando para a mesma identidade (troca de rota): mantém a última
reserva conhecida para a aba "Alugar" não piscar. Outra identidade: zera.

## `src/hooks/useAuthSession.js`

**`refresh();`**

A sessão pode ter mudado entre a primeira renderização e esta inscrição
(ex.: subárvore suspensa carregando um chunk): sincroniza ao assinar.

## `src/hooks/useAuthSession.test.jsx`

**`it("relê a sessão ao assinar os eventos (mudança ocorrida antes da inscrição)", () => {`**

Task 11: a sessão pode mudar entre a primeira renderização e a inscrição
nos eventos (ex.: subárvore suspensa carregando um chunk). O hook precisa
reler a sessão ao assinar, senão a mudança é perdida até o próximo evento.

## `src/hooks/useFormSubmit.js`

**`const emAndamento = useRef(false);`**

O estado só desabilita o botão após o re-render; o ref barra um segundo
envio no mesmo instante (duplo clique/Enter), ex.: cadastro duplicado.
