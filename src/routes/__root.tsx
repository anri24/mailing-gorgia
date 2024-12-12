import * as React from "react";
import {
  Link,
  Outlet,
  createRootRoute,
  redirect,
  useNavigate,
  useRouter,
} from "@tanstack/react-router";
import { useUserStore } from "@/store/user";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";

export const Route = createRootRoute({
  component: RootComponent,
  beforeLoad: ({ location }) => {
    const { user } = useUserStore.getState();
    const isAuthPage = location.pathname === "/login";

    if (!user && !isAuthPage) {
      throw redirect({
        to: "/login",
        search: {
          redirect: location.pathname,
        },
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
  const router = useRouter();

  React.useEffect(() => {
    const unsubscribe = useUserStore.subscribe((state) => {
      const user = state.user;
      const isAuthPage = router.state.location.pathname === "/login";

      if (!user && !isAuthPage) {
        navigate({ to: "/login" });
      } else if (user && isAuthPage) {
        navigate({ to: "/" });
      }
    });

    return () => unsubscribe();
  }, [navigate, router.state.location.pathname]);

  const handleLogout = () => {
    removeCredentials();
    navigate({ to: "/login" });
    toast.success("წარმატებით გამოხვედით სისტემიდან");
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4">
        <header className="py-4 flex justify-between items-center">
          <nav className="flex gap-4">
            {user ? (
              <>
                <Link to="/" className="[&.active]:font-bold">
                  მთავარი
                </Link>
                {user.isAdmin && (
                  <Link to="/users" className="[&.active]:font-bold">
                    მომხმარებლები
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="text-red-500 hover:text-red-700"
                >
                  გასვლა
                </button>
              </>
            ) : (
              <Link to="/login" className="[&.active]:font-bold">
                შესვლა
              </Link>
            )}
          </nav>
          {user && (
            <div className="text-sm text-muted-foreground">
              {user.name} ({user.isAdmin ? "ადმინისტრატორი" : "მომხმარებელი"})
            </div>
          )}
        </header>
        <main className="py-8">
          <Outlet />
        </main>
      </div>
      <Toaster />
    </div>
  );
}
