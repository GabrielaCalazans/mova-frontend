import FavoritableCarList from "../components/FavoritableCarList";
import { t } from "../i18n";

export default function CarrosFavoritados() {
  return (
    <FavoritableCarList
      title={t("tenant.favorites.title")}
      documentTitle={t("tenant.favorites.documentTitle")}
      onlyFavorites
      emptyMessage={t("tenant.favorites.empty")}
    />
  );
}
