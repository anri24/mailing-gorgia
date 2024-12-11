import { createLazyFileRoute } from '@tanstack/react-router'

export const Route = createLazyFileRoute('/users')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/users"!</div>
}
