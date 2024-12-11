import * as React from "react";
import {
  Link,
  Outlet,
  createRootRoute,
  redirect,
  useNavigate,
} from "@tanstack/react-router";
import { useUserStore } from "@/store/user";

export const Route = createRootRoute({
  component: RootComponent,
  beforeLoad: ({ location }) => {
    const { user } = useUserStore.getState();
    const isAuthPage = location.pathname === "/login";

    if (!user && !isAuthPage) {
      throw redirect({
        to: "/login",
      });
    }

    if (user && isAuthPage) {
      throw redirect({
        to: "/",
      });
    }
  },
});

function RootComponent() {
  const { user, removeCredentials } = useUserStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    removeCredentials();
    navigate({ to: "/login" });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4">
        <header className="py-4 flex justify-between items-center">
          <nav className="flex gap-4">
            {user ? (
              <>
                <Link to="/" className="[&.active]:font-bold">
                  Dashboard
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-red-500 hover:text-red-700"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link to="/login" className="[&.active]:font-bold">
                Login
              </Link>
            )}
          </nav>
          {user && (
            <div className="text-sm text-muted-foreground">
              Role: {user.role}
            </div>
          )}
        </header>
        <main className="py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
