import FavoritableCarList from "../components/FavoritableCarList";
import { t } from "../i18n";

export default function CarrosDisponiveis() {
  return (
    <FavoritableCarList
      title={t("tenant.available.title")}
      documentTitle={t("tenant.available.documentTitle")}
      onlyFavorites={false}
      emptyMessage={t("tenant.available.empty")}
    />
  );
}
