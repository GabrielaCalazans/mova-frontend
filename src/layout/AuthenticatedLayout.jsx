import AuthLayout from "./AuthLayout";
import TopBar from "../components/TopBar";

function AuthenticatedLayout({ children, ...authLayoutProps }) {
  return (
    <AuthLayout {...authLayoutProps}>
      <TopBar />
      {children}
    </AuthLayout>
  );
}

export default AuthenticatedLayout;
