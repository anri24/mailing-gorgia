import { createLazyFileRoute } from "@tanstack/react-router";
import Users from "@/pages/Users";

export const Route = createLazyFileRoute("/users")({
  component: RouteComponent,
});

function RouteComponent() {
  return <Users />;
}
