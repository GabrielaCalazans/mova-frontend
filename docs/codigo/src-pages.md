# Notas de implementação — src/pages

Texto que ficava em comentários de várias linhas no código. Cada seção indica o arquivo e o trecho que o comentário acompanhava.

## `src/pages/AvaliacaoReserva.jsx`

**`const veiculoJourney = getJourneyStep("veiculo");`**

A tela e alcancada de duas formas: (1) logo apos o desbloqueio, no
fluxo linear de reserva (dados ainda na journeyStorage da sessao), ou
(2) clicando numa reserva concluida no Historico (recebe o id via
location.state). Nos dois casos, o id real da reserva manda.

## `src/pages/CadastroCarroForm.jsx`

**`valorDiaria: Number(values.valorDiaria),`**

Fonte de verdade do preco da reserva: o backend multiplica esta diaria
pelo numero de diarias. Ver auditoria/PAGAMENTO.md.

**`` navigate(`/cadastro-carros/${veiculoSalvo.id}`, { ``**

O veículo já existe: ficar em /novo levaria a um 409 de placa
duplicada no reenvio. Segue para a edição do veículo criado.

**`if (e.code === "VEICULO_COM_RESERVA_FUTURA_CONFIRMADA") {`**

Task 10 (BUG-14): reserva paga futura impede manutenção/inativação.
O backend não mudou nada; a tela volta ao status salvo.

## `src/pages/CadastroGaragemForm.jsx`

**`if (e.code === "GARAGEM_COM_RESERVA_FUTURA_CONFIRMADA") {`**

Task 10.1 (Bug B): garagem ainda necessária a reservas confirmadas.
O backend não mudou nada; a tela volta ao status salvo.

## `src/pages/CheckoutReserva.jsx`

**`const erroPeriodo = validarPeriodoReserva(pickupDateTime, dropoffDateTime);`**

Espelha RN05 antes do POST: mesma mensagem que o backend devolveria,
sem gastar um round-trip. O servidor revalida de qualquer forma.

**`if (!devolucao?.garageId) {`**

A retirada é derivada do veículo (pode não existir, se ele não estiver
alocado em nenhuma garagem). A devolução é escolha do usuário.

**`const reserva = await createReserva({`**

Payload completo do contrato POST /api/reserva. status e statusPagamento
NÃO entram: são do domínio. Ver auditoria/CONTRATO-FRONTEND-BACKEND.md.

**`...(sessionUser?.deficienciaId || deficienciaDeclarada`**

RN01: só é necessário quando o veículo é adaptado/PCD e o locatário
ainda não tem deficiência cadastrada no perfil.

**`updateJourneyStep("reserva", {`**

valorTotal vem calculado pelo backend (fonte de verdade); o que o
checkout mostrou era só estimativa.

**`if (!pickupDateTime) throw new Error(t("validation.period.pickupRequired"));`**

Task 11: sem data de retirada/devolução (acesso direto ao checkout ou
jornada incompleta) o usuário via o TypeError de `toISOString`. As
demais regras do período (RN05, passado) continuam no botão Confirmar.

**`const vehicleCategory = formatCategoria(resolveVehicleField(vehicle, veiculoSalvo, "cat...`**

Campos descritivos vêm de modeloVeiculo, já normalizados por
normalizeVeiculo(); fallback para o veículo salvo na jornada.

## `src/pages/CheckoutReserva.test.jsx`

**`describe("CheckoutReserva — jornada sem período (Task 11)", () => {`**

Task 11 (T11-P2): sem data de retirada o checkout mostrava o TypeError de
`toISOString`; agora mostra a mesma validação do botão Confirmar.

## `src/pages/Configuracoes.jsx`

**`const PREFERENCIAS = {`**

Só o que o backend realmente entrega: e-mail (CanalNotificacao.EMAIL).
Push/SMS existem no enum, mas nenhum serviço os envia — não são oferecidos.
Rótulo e dica vêm de common.settings.prefs.&lt;tipo> (traduzidos no render).

## `src/pages/DataHora.jsx`

**`const MONTHS = [`**

CALENDÁRIO

**`const RADIUS = 78;`**

RELÓGIO

**`const handleSubmit = (e) => {`**

SUBMIT

**`return (`**

RENDER

## `src/pages/DesbloqueioDeCarro.jsx`

**`const TIMEOUT_GEO_MS = 8000;`**

TASK 05 — esta tela NUNCA declara o veiculo desbloqueado por conta propria.
"Veiculo Desbloqueado" so aparece depois que POST /reserva/:id/desbloqueio
respondeu 200 (ou quando o GET da reserva ja traz codigoUsadoEm). O
sessionStorage e so um atalho para achar o id; o estado vem do backend.
Ver auditoria/DESBLOQUEIO.md.

**`function obterCoordenadas() {`**

A posicao deve ser obtida no momento do pedido. Falhas do navegador
interrompem o envio; o backend continua responsavel por validar o raio.

**`function escolherReservaDesbloqueavel(reservas) {`**

Reserva que ainda pode ser desbloqueada: paga e confirmada (ou ja em
andamento). Quem ainda nao foi desbloqueada vem primeiro — e o que o usuario
veio fazer; entre iguais, a mais proxima do inicio. Usada so na recuperacao,
quando o estado local da jornada se perdeu.

**`const qrToken = new URLSearchParams(location?.search || "").get("qr") || "";`**

Deep link do QR: /desbloqueio?qr=&lt;token assinado>. O token carrega
idReserva + codigo e e revalidado inteiro pelo backend.

**`useEffect(() => {`**

Carrega a reserva pelo backend. O id vem do historico (location.state), da
jornada em sessao ou — se os dois faltarem — da listagem do proprio
locatario. O codigo exibido e sempre o que o backend devolveu.

**`setReserva(atualizada);`**

So aqui o veiculo esta desbloqueado: e a reserva que o backend
devolveu, com codigoUsadoEm preenchido e status EM_ANDAMENTO.

## `src/pages/DesbloqueioDeCarro.test.jsx`

**`vi.mock("../services/reservaService", () => ({`**

TASK 05 — a tela nunca decide o desbloqueio. Ela mostra o codigo que o
backend gerou, envia o que o usuario digitou e so anuncia "Veiculo
Desbloqueado" com a reserva que o POST devolveu.
Ver auditoria/DESBLOQUEIO.md.

**`it.each([`**

4. Recusas do backend (expirado, antes do horario, ja usado, geofence):
a tela repassa a mensagem e nunca inventa sucesso.

## `src/pages/Pagamento.jsx`

**`const QR_PATTERN = [`**

Pagamento em SANDBOX.

O frontend nunca declara o resultado: envia o método (e, para cartão, os
dados de teste) e o backend decide, registra a cobrança e entrega o desfecho
ao gateway simulado, que responde por webhook assinado. Aqui só se observa o
statusPagamento até ele sair de PROCESSANDO.

Nenhuma credencial ou segredo de assinatura vive no frontend.
Ver auditoria/PAGAMENTO.md.

**`const INTERVALO_POLLING_MS = 2000;`**

Enquanto o gateway não decide, a reserva fica PROCESSANDO. Observa-se até
resolver; se não resolver, o usuário acompanha pelo histórico.

**`function validarCartao({ numero, nome, validade, cvv }, hoje = new Date()) {`**

Espelha o schema do backend (pagamento.schema.ts) para não exibir as
mensagens em inglês do Zod; o cartão vale até o fim do mês de validade.

**`if (!reservaId) return;`**

Sem reserva na jornada nao ha o que carregar; o estado e derivado no
render (SEM_RESERVA), nao por setState dentro do efeito.

**`}, [reservaId]);`**

Acompanhamento deve iniciar uma vez por reserva; incluir a função recriada
em cada render reiniciaria o polling e poderia duplicar timers.

**`const acompanhar = (tentativasRestantes) => {`**

Observa a reserva até o gateway decidir. Só o backend muda esse status.
Laço agendado (nao recursivo) para nao depender de uma funcao antes de ela
existir — e para poder ser cancelado na desmontagem.

**`iniciarPagamento(reservaId, {`**

Só o MEIO e os dados de teste. Nada de valor, status ou resultado: o
backend calcula o valor pela reserva e decide o desfecho.

**`function PixDialog({ onClose }) {`**

Diálogo modal do QR ilustrativo: foco no botão de fechar, Esc fecha e o
Tab fica preso no único controle (é o único elemento focável).

## `src/pages/Pagamento.test.jsx`

**`vi.mock("../services/reservaService", () => ({`**

TASK 04 — a tela de pagamento nunca decide o resultado. Ela mostra o valor
que o backend calculou, envia o metodo e observa o statusPagamento.
Ver auditoria/PAGAMENTO.md.

**`it("veículo indisponível: mostra o motivo, não confirma e permite tentar de novo", asyn...`**

6. Erro da API
Task 10.1 (Bug A): veículo indisponível → 409; nada de sucesso, botão segue disponível.

## `src/pages/RelatoriosAvaliacoes.jsx`

**`const csvValue = (value) => {`**

Texto iniciado por = + - @ ou tab/CR seria interpretado como fórmula pela
planilha (CSV injection); prefixa com apóstrofo. Números não são afetados.

## `src/pages/RelatoriosVeiculos.jsx`

**`const csvValue = (value) => {`**

Texto iniciado por = + - @ ou tab/CR seria interpretado como fórmula pela
planilha (CSV injection); prefixa com apóstrofo. Números não são afetados.

**`function GraficoBarras({ dados, campo, formatar }) {`**

Gráfico de barras com uma única cor de ação: a cor vem do CSS (relatorios.css),
então segue o tema. A lista abaixo do gráfico é a alternativa textual.
Barras horizontais: a placa fica no eixo vertical e nunca se sobrepõe à
vizinha, nem em 320 px; a altura cresce com o número de veículos.

## `src/pages/ReservaDetalhe.jsx`

**`async function mostrarQr() {`**

RF15: o QR é gerado pelo app a partir do token assinado do backend e aponta
para o próprio fluxo de desbloqueio (/desbloqueio?qr=...).

## `src/pages/ReservationLifecycle.i18n.test.jsx`

**`vi.mock("../services/reservaService", () => ({`**

RNF08 — o ciclo da reserva acompanha o idioma: textos, datas no formato do
locale e moeda sempre em BRL.

## `src/pages/TiposDeCarros.jsx`

**`const TIPOS = [`**

Todas as categorias visíveis de uma vez: o carrossel de uma opção por vez
escondia escolhas e exigia setas para descobrir o catálogo.
Nome e dica saem de catalog.types.&lt;id> no render (idioma pode mudar).
