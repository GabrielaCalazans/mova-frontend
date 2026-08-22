import React from 'react';
import AuthenticatedLayout from '../layout/AuthenticatedLayout';
import onix from '../assets/chevrolet-onix-flex.png';
import argo1 from '../assets/fiat-argo-drive.png';
import argo2 from '../assets/fiat-argo-drive2.png';
import {
  LogoContainer,
  Subtitle,
  TripList,
  TripCard,
  TripImage,
  TripInfo,
  TripText,
  PageFooter,
} from '../styles/authStyle';
import movaLogo from '../assets/mova_logo.png';

const viagens = [
  { id: 1, image: onix,  start: 'Centro',     destination: 'Av. Paulista', time: '15 min', price: 'R$ 25,00' },
  { id: 2, image: onix,  start: 'Shopping A',  destination: 'Praia X',      time: '30 min', price: 'R$ 40,00' },
  { id: 3, image: argo1, start: 'Estação Y',   destination: 'Parque Z',     time: '20 min', price: 'R$ 30,00' },
  { id: 4, image: argo2, start: 'Casa',        destination: 'Trabalho',     time: '45 min', price: 'R$ 50,00' },
];

export default function Historico() {
  return (
    <AuthenticatedLayout>

      <LogoContainer>
        <img src={movaLogo} alt="Mova Logo" />
      </LogoContainer>

      <Subtitle>Histórico de Viagens</Subtitle>

      <TripList>
        {viagens.map(trip => (
          <TripCard key={trip.id}>
            <TripImage src={trip.image} alt={`Carro ${trip.id}`} />
            <TripInfo>
              <TripText>Ponto Inicial: {trip.start}</TripText>
              <TripText>Destino: {trip.destination}</TripText>
              <TripText>Tempo: {trip.time}</TripText>
              <TripText>Preço: {trip.price}</TripText>
            </TripInfo>
          </TripCard>
        ))}
      </TripList>

      <PageFooter>MOVA</PageFooter>

    </AuthenticatedLayout>
  );
}