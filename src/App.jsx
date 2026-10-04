import AppRoutes from "./routes/AppRoutes";
import { ThemeProvider } from "./context/ThemeContext";
import { useLocale } from "./i18n";

function App() {
  // Trocar o idioma remonta as rotas: todo texto é lido de novo via t().
  const locale = useLocale();
  return (
    <ThemeProvider>
      <AppRoutes key={locale} />
    </ThemeProvider>
  );
}

export default App;
