import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AuthenticatedLayout from '../layout/AuthenticatedLayout';
import ThemeToggle from '../components/ui/ThemeToggle';
import LanguageSelect from '../components/ui/LanguageSelect';
import { t } from '../i18n';
import { useAuthSession } from '../hooks/useAuthSession';
import { getUserCargo } from '../services/authIdentity';
import { definirPreferencia, listarPreferencias } from '../services/notificacaoService';
import { Section, SectionTitle, Row, Label, Toggle } from '../styles/authStyle';

// Só o que o backend realmente entrega: e-mail (CanalNotificacao.EMAIL).
// Push/SMS existem no enum, mas nenhum serviço os envia — não são oferecidos.
// Rótulo e dica vêm de common.settings.prefs.<tipo> (traduzidos no render).
const PREFERENCIAS = {
  LOCATARIO: ['RESERVA', 'VEICULO_DISPONIVEL'],
  LOCADOR: ['ALERTA_VEICULO'],
};

export default function Configuracoes() {
  const session = useAuthSession();
  const opcoes = PREFERENCIAS[getUserCargo(session?.user)] ?? [];
  const temOpcoes = opcoes.length > 0;
  const [habilitadas, setHabilitadas] = useState({});
  const [carregando, setCarregando] = useState(temOpcoes);
  const [aviso, setAviso] = useState('');
  const [erro, setErro] = useState('');
  // Sem a leitura do backend o estado exibido não é confirmado: não permite alternar.
  const [falhouCarga, setFalhouCarga] = useState(false);
  const [salvando, setSalvando] = useState({});

  useEffect(() => {
    document.title = t('common.settings.documentTitle');
    if (!temOpcoes) return undefined;
    let ativo = true;
    listarPreferencias()
      .then((lista) => {
        if (!ativo) return;
        const mapa = {};
        for (const pref of lista) if (pref.canal === 'EMAIL') mapa[pref.tipo] = pref.habilitado;
        setHabilitadas(mapa);
      })
      .catch((error) => {
        if (!ativo) return;
        setFalhouCarga(true);
        setErro(error?.message || t('common.settings.loadError'));
      })
      .finally(() => { if (ativo) setCarregando(false); });
    return () => { ativo = false; };
  }, [temOpcoes]);

  async function alternar(tipo, rotulo) {
    // Sem preferência gravada o backend considera habilitado (opt-in padrão).
    const atual = habilitadas[tipo] ?? true;
    setErro('');
    setHabilitadas((anterior) => ({ ...anterior, [tipo]: !atual }));
    setSalvando((anterior) => ({ ...anterior, [tipo]: true }));
    try {
      await definirPreferencia({ canal: 'EMAIL', tipo, habilitado: !atual });
      setAviso(t('common.settings.toggled', { label: rotulo, state: t(!atual ? 'common.settings.on' : 'common.settings.off') }));
    } catch (error) {
      setHabilitadas((anterior) => ({ ...anterior, [tipo]: atual }));
      setErro(error?.message || t('common.settings.saveError'));
    } finally {
      setSalvando((anterior) => ({ ...anterior, [tipo]: false }));
    }
  }

  return (
    <AuthenticatedLayout title={t('common.settings.title')}>
      <Section aria-labelledby="cfg-aparencia">
        <SectionTitle as="h2" id="cfg-aparencia">{t('common.settings.appearance')}</SectionTitle>
        <Row>
          <Label>{t('common.settings.theme')}</Label>
          <ThemeToggle labeled />
        </Row>
        <p className="field__hint">{t('common.settings.zoomHint')}</p>
      </Section>

      <Section aria-labelledby="cfg-idioma">
        <SectionTitle as="h2" id="cfg-idioma">{t('common.settings.language')}</SectionTitle>
        <LanguageSelect labeled />
        <p className="field__hint">{t('common.language.hint')}</p>
      </Section>

      {temOpcoes && (
        <Section aria-labelledby="cfg-notificacoes">
          <SectionTitle as="h2" id="cfg-notificacoes">{t('common.settings.notifications')}</SectionTitle>
          {carregando && <p className="loading-state" role="status"><span className="spinner" aria-hidden="true" />{t('common.settings.loadingPrefs')}</p>}
          {erro && <p className="alert alert--danger" role="alert">{erro}</p>}
          {!carregando && opcoes.map((tipo) => {
            const rotulo = t(`common.settings.prefs.${tipo}.label`);
            return (
              <Row as="label" key={tipo}>
                <span>
                  <Label>{rotulo}</Label>
                  <span className="field__hint" style={{ display: 'block' }}>{t(`common.settings.prefs.${tipo}.hint`)}</span>
                </span>
                <Toggle
                  checked={habilitadas[tipo] ?? true}
                  disabled={falhouCarga || Boolean(salvando[tipo])}
                  aria-busy={salvando[tipo] || undefined}
                  onChange={() => alternar(tipo, rotulo)}
                />
              </Row>
            );
          })}
          <p className="sr-only" role="status" aria-live="polite">{aviso}</p>
        </Section>
      )}

      <Section aria-labelledby="cfg-seguranca">
        <SectionTitle as="h2" id="cfg-seguranca">{t('common.settings.security')}</SectionTitle>
        <p className="field__hint">{t('common.settings.securityHint')}</p>
        <Link className="btn btn--secondary" to="/conta">{t('common.settings.changePassword')}</Link>
      </Section>
    </AuthenticatedLayout>
  );
}
