import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AuthenticatedLayout from '../layout/AuthenticatedLayout';
import ThemeToggle from '../components/ui/ThemeToggle';
import { useAuthSession } from '../hooks/useAuthSession';
import { getUserCargo } from '../services/authIdentity';
import { definirPreferencia, listarPreferencias } from '../services/notificacaoService';
import { Section, SectionTitle, Row, Label, Toggle } from '../styles/authStyle';

// Só o que o backend realmente entrega: e-mail (CanalNotificacao.EMAIL).
// Push/SMS existem no enum, mas nenhum serviço os envia — não são oferecidos.
const PREFERENCIAS = {
  LOCATARIO: [
    { tipo: 'RESERVA', rotulo: 'E-mails sobre minhas reservas', dica: 'Confirmação de pagamento e dados da retirada.' },
    { tipo: 'VEICULO_DISPONIVEL', rotulo: 'Avisos de disponibilidade', dica: 'Quando um veículo que você acompanha volta a ficar livre.' },
  ],
  LOCADOR: [
    { tipo: 'ALERTA_VEICULO', rotulo: 'Alertas da frota', dica: 'Inatividade prolongada e avaliações baixas recorrentes.' },
  ],
};

export default function Configuracoes() {
  const session = useAuthSession();
  const opcoes = PREFERENCIAS[getUserCargo(session?.user)] ?? [];
  const temOpcoes = opcoes.length > 0;
  const [habilitadas, setHabilitadas] = useState({});
  const [carregando, setCarregando] = useState(temOpcoes);
  const [aviso, setAviso] = useState('');
  const [erro, setErro] = useState('');

  useEffect(() => {
    document.title = 'MOVA - Configurações';
    if (!temOpcoes) return undefined;
    let ativo = true;
    listarPreferencias()
      .then((lista) => {
        if (!ativo) return;
        const mapa = {};
        for (const pref of lista) if (pref.canal === 'EMAIL') mapa[pref.tipo] = pref.habilitado;
        setHabilitadas(mapa);
      })
      .catch((error) => { if (ativo) setErro(error?.message || 'Não foi possível carregar suas preferências.'); })
      .finally(() => { if (ativo) setCarregando(false); });
    return () => { ativo = false; };
  }, [temOpcoes]);

  async function alternar(tipo, rotulo) {
    // Sem preferência gravada o backend considera habilitado (opt-in padrão).
    const atual = habilitadas[tipo] ?? true;
    setErro('');
    setHabilitadas((anterior) => ({ ...anterior, [tipo]: !atual }));
    try {
      await definirPreferencia({ canal: 'EMAIL', tipo, habilitado: !atual });
      setAviso(`${rotulo}: ${!atual ? 'ativado' : 'desativado'}.`);
    } catch (error) {
      setHabilitadas((anterior) => ({ ...anterior, [tipo]: atual }));
      setErro(error?.message || 'Não foi possível salvar a preferência.');
    }
  }

  return (
    <AuthenticatedLayout title="Configurações">
      <Section aria-labelledby="cfg-aparencia">
        <SectionTitle as="h2" id="cfg-aparencia">Aparência</SectionTitle>
        <Row>
          <Label>Tema</Label>
          <ThemeToggle labeled />
        </Row>
        <p className="field__hint">Para aumentar o texto, use o zoom ou o tamanho de fonte do navegador: a interface se adapta sem cortar conteúdo.</p>
      </Section>

      {temOpcoes && (
        <Section aria-labelledby="cfg-notificacoes">
          <SectionTitle as="h2" id="cfg-notificacoes">Notificações por e-mail</SectionTitle>
          {carregando && <p className="loading-state" role="status"><span className="spinner" aria-hidden="true" />Carregando preferências…</p>}
          {erro && <p className="alert alert--danger" role="alert">{erro}</p>}
          {!carregando && opcoes.map(({ tipo, rotulo, dica }) => (
            <Row as="label" key={tipo}>
              <span>
                <Label>{rotulo}</Label>
                <span className="field__hint" style={{ display: 'block' }}>{dica}</span>
              </span>
              <Toggle checked={habilitadas[tipo] ?? true} onChange={() => alternar(tipo, rotulo)} />
            </Row>
          ))}
          <p className="sr-only" role="status" aria-live="polite">{aviso}</p>
        </Section>
      )}

      <Section aria-labelledby="cfg-seguranca">
        <SectionTitle as="h2" id="cfg-seguranca">Segurança</SectionTitle>
        <p className="field__hint">Senha, e-mail e exclusão de conta ficam em Minha conta.</p>
        <Link className="btn btn--secondary" to="/conta">Alterar senha em Minha conta</Link>
      </Section>
    </AuthenticatedLayout>
  );
}
