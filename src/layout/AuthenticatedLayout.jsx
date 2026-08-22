import AuthLayout from "./AuthLayout";

function AuthenticatedLayout({ children, ...authLayoutProps }) {
  return (
    <AuthLayout hasBottomNav {...authLayoutProps}>
      {children}
    </AuthLayout>
  );
}

export default AuthenticatedLayout;