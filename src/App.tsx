import "./App.css";
import { SignInForm } from "./pages/Login";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SignInForm />
    </QueryClientProvider>
  );
}

export default App;
