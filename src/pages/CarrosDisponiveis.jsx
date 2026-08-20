import FavoritableCarList from "../components/FavoritableCarList";

export default function CarrosDisponiveis() {
  return (
    <FavoritableCarList
      title="Carros Disponíveis"
      documentTitle="MOVA - Carros Disponíveis"
      onlyFavorites={false}
      emptyMessage="Nenhum veículo disponível no momento."
    />
  );
}
