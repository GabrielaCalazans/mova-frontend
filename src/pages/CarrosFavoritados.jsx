import FavoritableCarList from "../components/FavoritableCarList";

export default function CarrosFavoritados() {
  return (
    <FavoritableCarList
      title="Carros Favoritados"
      documentTitle="MOVA - Carros Favoritados"
      onlyFavorites
      emptyMessage="Você ainda não favoritou nenhum carro. Toque no coração de um veículo em Carros Disponíveis para adicioná-lo aqui."
    />
  );
}
