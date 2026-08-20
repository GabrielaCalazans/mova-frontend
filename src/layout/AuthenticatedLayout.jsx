import AuthLayout from "./AuthLayout";
import TopBar from "../components/TopBar";

<<<<<<< HEAD
function AuthenticatedLayout({ children, topBarShowLogo = true, ...authLayoutProps }) {
  return (
    <AuthLayout
      topBarSlot={<TopBar showLogo={topBarShowLogo} />}
      hasBottomNav
=======
function AuthenticatedLayout({ children, ...authLayoutProps }) {
  return (
    <AuthLayout
      topBarSlot={<TopBar />}
>>>>>>> 1c95901965c2026bba2162d3f430df8344c59244
      {...authLayoutProps}
    >
      {children}
    </AuthLayout>
  );
}

export default AuthenticatedLayout;