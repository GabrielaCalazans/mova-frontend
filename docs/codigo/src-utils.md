# Notas de implementação — src/utils

Texto que ficava em comentários de várias linhas no código. Cada seção indica o arquivo e o trecho que o comentário acompanhava.

## `src/utils/journeyStorage.js`

**`const EMPTY_SERVICOS = {`**

IDs dos serviços opcionais escolhidos. A tela de seleção ainda não existe;
a estrutura fica pronta para o POST /reserva já enviar servicosIds.

## `src/utils/reservationMath.js`

**`export const DURACAO_MINIMA_MS = 60 * 60 * 1000;`**

Espelho de RN05 (mova-backend/src/schemas/reserva.schema.ts e
ReservaService.assertPeriodoValido). NÃO substitui a validação do servidor:
antecipa a mesma mensagem para o usuário, em vez de deixá-lo descobrir só
depois do POST. As mensagens são idênticas às do backend de propósito.

**`export function validarPeriodoReserva(inicio, fim, agora = new Date()) {`**

Valida o período escolhido. Devolve a mensagem do primeiro problema
encontrado, ou null quando está tudo certo.

@param {Date|null} inicio
@param {Date|null} fim  quando ausente, valida apenas o início
@param {Date} agora     injetável para teste

## `src/utils/reservationMath.test.js`

**`describe("validarPeriodoReserva", () => {`**

TASK 03 — casos obrigatórios de data/hora. Espelham RN05 do backend; as
mensagens são idênticas de propósito. Ver auditoria/DATAS-HORARIOS.md.

**`const escolhido = parseJourneyDateTime({ date: "10/06/2026", time: "10:00" });`**

O usuário escolhe 10/06/2026 10:00 no fuso DELE. O que trafega é o
instante em UTC; ao voltar, a hora de parede local tem que ser a mesma.

## `src/utils/vehicleDisplay.js`

**`export function isVeiculoPcd(vehicle) {`**

RN01 (backend, services/reserva.ts): adaptado OU categoria PCD exige
deficiência declarada. A UI usa o mesmo predicado.

**`export function resolveVehicleImages(vehicle) {`**

Imagem do veículo sem inventar: 1) foto real da API (com alt do locador);
2) foto ilustrativa empacotada do mesmo modelo, rotulada como tal;
3) nenhuma — a UI mostra um marcador "sem foto" em vez de um ícone de
categoria fingindo ser o carro.
