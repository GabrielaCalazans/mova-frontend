import AuthLayout from "./AuthLayout";
import TopBar from "../components/TopBar";

function AuthenticatedLayout({ children, topBarShowLogo = true, ...authLayoutProps }) {
  return (
    <AuthLayout
      topBarSlot={<TopBar showLogo={topBarShowLogo} />}
      hasBottomNav
      {...authLayoutProps}
    >
      {children}
    </AuthLayout>
  );
}

export default AuthenticatedLayout;