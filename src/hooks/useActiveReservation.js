import { useEffect, useState } from "react";
import { listReservasDoLocatario } from "../services/reservaService";
import { getUserCargo } from "../services/authIdentity";
import { getAuthSession } from "../services/authSession";

const ACTIVE_STATUSES = new Set(["CONFIRMADA", "EM_ANDAMENTO"]);

export function findActiveReservation(reservas = []) {
  return [...reservas]
    .filter((reserva) => ACTIVE_STATUSES.has(reserva?.status))
    .sort((a, b) => {
      if (a.status === "EM_ANDAMENTO" && b.status !== "EM_ANDAMENTO") return -1;
      if (b.status === "EM_ANDAMENTO" && a.status !== "EM_ANDAMENTO") return 1;
      return new Date(a.dataHoraInicio).getTime() - new Date(b.dataHoraInicio).getTime();
    })[0] ?? null;
}

/**
 * Reserva ativa vem sempre da API. A sessão só fornece a identidade para o
 * endpoint escopado; não é fonte de verdade para status ou datas.
 */
export function useActiveReservation({ enabled = true, refreshKey = "" } = {}) {
  const session = getAuthSession();
  const token = session?.token || "";
  const cargo = getUserCargo(session?.user);
  const locatarioId = session?.user?.locatario?.id || session?.user?.id || "";
  const shouldLoad = Boolean(enabled && token && cargo === "LOCATARIO" && locatarioId);
  const requestKey = shouldLoad ? `${token}:${locatarioId}:${refreshKey}` : "";
  const [state, setState] = useState({ key: requestKey, loading: shouldLoad, reservation: null, error: null });

  useEffect(() => {
    let active = true;

    if (!shouldLoad) {
      return () => { active = false; };
    }

    listReservasDoLocatario(locatarioId)
      .then((reservas) => {
        if (active) setState({ key: requestKey, loading: false, reservation: findActiveReservation(reservas), error: null });
      })
      .catch((error) => {
        if (active) setState({ key: requestKey, loading: false, reservation: null, error });
      });

    return () => { active = false; };
  }, [locatarioId, requestKey, shouldLoad]);

  if (state.key === requestKey) return state;
  // Recarregando para a mesma identidade (troca de rota): mantém a última
  // reserva conhecida para a aba "Alugar" não piscar. Outra identidade: zera.
  const sameIdentity = shouldLoad && state.key.startsWith(`${token}:${locatarioId}:`);
  return { key: requestKey, loading: shouldLoad, reservation: sameIdentity ? state.reservation : null, error: null };
}
