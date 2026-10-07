# Notas de implementação — src/components

Texto que ficava em comentários de várias linhas no código. Cada seção indica o arquivo e o trecho que o comentário acompanhava.

## `src/components/BottomNav.jsx`

**`export default function BottomNav({ activeReservation: providedReservation, shellOwned ...`**

Tab bar do locatário. Dentro do AppShell só a instância do próprio shell
(shellOwned) renderiza; chamadas legadas nas páginas viram no-op.

## `src/components/brand/BrandLogo.jsx`

**`const VARIANTS = {`**

Assets oficiais de mova-identidade-visual, publicados em /public/brand.
Cada variante tem versão clara e escura; o CSS (.brand-img--light/--dark)
mostra a correta para o tema efetivo. Um único nome acessível fica no
invólucro, para o leitor de tela não anunciar a marca duas vezes.

## `src/components/FiltroDataPicker.jsx`

**`export default function FiltroDataPicker({ dataSelecionada, onChange }) {`**

Card "Selecione a Data" + popup de calendario, reutilizado em todos os
filtros de relatorio (Veiculos, Avaliacoes, etc.).

## `src/components/GarageJourneyStep.jsx`

**`function descreverCapacidade(garagem) {`**

As garagens vêm da API (GET /api/garagem). O locatário enxerga apenas as
ATIVAS — o escopo é aplicado no backend, não aqui.
Antes esta lista era fixa, com ids 1..4, incompatíveis com os UUIDs reais;
por isso a reserva nunca conseguia enviar idGaragemRetirada/idGaragemDevolucao.

**`const veiculoSelecionado = useMemo(() => getJourneyStep("veiculo"), []);`**

O veículo escolhido define as duas garagens possíveis:
- retirada  -> exatamente veiculo.garagemId (ReservaService.resolverGaragemRetirada)
- devolução -> qualquer garagem ATIVA do locador do veículo (assertGaragemDevolucao)

**`const erroPeriodo = useMemo(() => {`**

Valida o instante escolhido já nesta etapa, com as MESMAS mensagens do
backend (RN05). O servidor continua sendo a autoridade — isto só evita que
o usuário só descubra o problema depois de percorrer o checkout.

**`if (!veiculoSelecionado?.id) {`**

A jornada é veículo-primeiro: o local de retirada SAI do veículo e a
devolução é restrita ao locador dele. Sem veículo escolhido, esta etapa não
tem o que mostrar — volta para a escolha do carro em vez de exibir um
estado vazio enganoso.

## `src/components/icons/index.jsx`

**`export function Icone01({ size = 24, ...props }) {`**

Icones customizados fornecidos para o menu inferior (icone-01 a icone-05).
O fill original (#003366 / black) foi trocado por currentColor, para que a
cor acompanhe o CSS do botao (estado ativo, tema claro/escuro etc.), do
mesmo jeito que os icones do lucide-react já usados no resto do app.

## `src/components/layout/AccountMenu.jsx`

**`export default function AccountMenu({ open, onClose }) {`**

Menu da conta do locatário. Folha inferior no mobile, painel ancorado no
desktop. Diálogo modal: foco entra no primeiro item, Tab circula dentro,
Escape fecha e o foco volta ao acionador (responsabilidade de onClose).

## `src/components/layout/AppShell.jsx`

**`export default function AppShell({ children }) {`**

Shell único do visitante e do locatário: cabeçalho com a marca oficial,
navegação no topo (≥1024 px) ou tab bar (mobile) e menu da conta.
As páginas desenham o próprio &lt;main>; o shell só fornece o alvo de foco.

## `src/components/layout/navItems.js`

**`export function renterNavItems(activeReservation) {`**

Fonte única dos destinos do locatário (tab bar no mobile, barra superior no
desktop). "Alugar" só aparece com reserva ativa real (WIREFRAME-SPEC 1.1).

## `src/components/layout/PublicAppShell.jsx`

**`export default function PublicAppShell({ children }) {`**

Conteúdo público (Home e detalhe). Dentro das rotas o AppShell já existe;
renderizada isolada (testes de página), cria o próprio shell.

## `src/components/layout/shell-context.js`

**`export const ShellContext = createContext(null);`**

Presente quando a rota já está dentro do AppShell. Componentes legados que
desenhavam o próprio cabeçalho/menu inferior (PublicAppShell, BottomNav,
TopBar, AuthLayout) leem isto para não duplicar a navegação. Fora do shell
(testes de página isolada) eles seguem funcionando como antes.

## `src/components/ReservasList.jsx`

**`const STATUS_VISUAL = {`**

Tom e rótulo do status da reserva: sempre texto, nunca só cor.
PENDENTE/FINALIZADA são grafias antigas que ainda aparecem em dados legados.
Rótulos resolvidos no render (não no import) para acompanhar o idioma.

**`export function StatusBadge({ status, expiradaEm, ...props }) {`**

Task 10 (BUG-05): expiração automática é CANCELADA + expiradaEm no backend,
mas para a pessoa é "Expirada", não um cancelamento que ela fez.

**`function resolveVeiculoNome(reserva) {`**

A resposta da reserva agora traz o veículo aninhado (veiculo.modeloVeiculo),
no mesmo formato de GET /api/veiculo/:id.

**`function acaoDaReserva(reserva) {`**

Reserva paga e ainda nao desbloqueada leva para o desbloqueio; as demais,
para a avaliacao. O id vai no state — a tela de destino confirma o estado
real com o backend.

**`function podeExibirRastreamento(reserva, agora = new Date()) {`**

Conveniência visual. O backend continua validando posse, estado e período
ao atender GET /reserva/:id/localizacao.

**`export default function ReservasList({ title, documentTitle, somenteConcluidas = false,...`**

Lista de reservas do locatario, da mais recente para a mais antiga. Usada
tanto pelo "Historico" (todas as reservas) quanto por "Corridas Realizadas"
(somente as com status REALIZADA), via a prop somenteConcluidas.

## `src/components/reservation/JourneySteps.jsx`

**`export default function JourneySteps({ current }) {`**

Onde estou na reserva. Mobile mostra "Etapa N de 7" + barra segmentada;
desktop mostra a lista inteira. A etapa atual é aria-current="step" e
as concluídas trazem "concluída" em texto, não só cor.

## `src/components/ui/CursorGlowArea.jsx`

**`const CAN_GLOW = "(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-pr...`**

O conceito do CursorCard (React + Tailwind + shadcn + motion/react) adaptado
à stack real: React + CSS. Um único listener no contêiner calcula, para cada
cartão `.cursor-card` dentro dele, a posição do ponteiro em coordenadas
locais (--mx/--my). O CSS desenha um brilho discreto na borda e na
superfície dos cartões PRÓXIMOS ao ponteiro — inclusive no vão entre eles.
Só roda com ponteiro fino que faz hover; com prefers-reduced-motion o CSS
remove o efeito. É realce progressivo: nada depende dele.

## `src/components/ui/LanguageSelect.jsx`

**`export default function LanguageSelect({ labeled = false, className = "" }) {`**

Seletor de idioma nativo (teclado, leitor de tela e mobile de graça).
Cada opção aparece no próprio idioma; `lang` na opção ajuda a pronúncia.
`labeled` mostra o rótulo visível (Configurações e menu de conta); sem ele,
o controle é compacto (cabeçalho): sigla visível, nome completo como nome
acessível da opção.

## `src/components/ui/ModalDialog.jsx`

**`export default function ModalDialog({ role = "dialog", labelledBy, describedBy, onClose...`**

Diálogo modal acessível.
- Renderizado em portal no &lt;body>; enquanto aberto, #root fica `inert`
(fundo sem foco, clique ou leitura por tecnologia assistiva).
- Foco entra no elemento com `data-autofocus` (ou no primeiro focável).
- Tab e Shift+Tab circulam só dentro do painel; Escape fecha.
- Ao fechar, o foco volta ao acionador; se ele saiu do DOM (ex.: item
excluído), vai para o conteúdo principal.

## `src/components/ui/ThemeToggle.jsx`

**`export default function ThemeToggle({ labeled = false }) {`**

Três posições em radiogroup (setas trocam a opção). Cada opção tem ícone e
nome acessível; a ativa é marcada por aria-checked, não só por cor.
`labeled` mostra o nome ao lado do ícone (menu de conta e Configurações).

## `src/components/vehicle/HistoricoAlteracoes.jsx`

**`function valor(campo, bruto, garagens) {`**

RN09: trilha de auditoria do veículo, só leitura. Mostra quem (cargo), quando,
a operação e os campos que mudaram (antes → depois).

## `src/components/vehicle/VehicleCard.jsx`

**`export default function VehicleCard({`**

Cartão de veículo (catálogo, lista da jornada e favoritos).
Ordem de leitura do brief: foto → nome/ano → dados principais →
acessibilidade → garagem → preço → ações. A acessibilidade aparece sempre,
inclusive no "não": escondê-la tiraria a informação de quem depende dela.
O título é o único link do cartão; as ações ficam em botões próprios.

## `src/components/vehicle/VehicleMedia.jsx`

**`export default function VehicleMedia({ vehicle, index = 0, eager = false, className = "...`**

Mídia do veículo em proporção fixa e `object-fit: contain`: o carro inteiro
aparece, sem cortar para-choque nem rodas. Sem foto, um marcador neutro
diz isso em texto — nunca um ícone de categoria posando de foto.
