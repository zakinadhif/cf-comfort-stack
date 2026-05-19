import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { ProtectedRoute } from "./components/protected-route";

import Login from "./pages/Login";
import Home from "./pages/Home";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			retry: 1,
			refetchOnWindowFocus: false,
			staleTime: 5 * 60 * 1000,
		},
	},
});

function Router() {
	return (
		<Switch>
			<Route path="/login" component={Login} />
			<Route path="/">
				<ProtectedRoute>
					<Home />
				</ProtectedRoute>
			</Route>
			<Route component={NotFound} />
		</Switch>
	);
}

function App() {
	return (
		<QueryClientProvider client={queryClient}>
			<WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
				<Router />
			</WouterRouter>
			<Toaster />
		</QueryClientProvider>
	);
}

export default App;
