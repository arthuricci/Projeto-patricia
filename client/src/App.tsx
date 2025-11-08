import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Estoque from "./pages/Estoque";
import RegistrarInsumosPage from "./pages/RegistrarInsumosPage";
import VerEstoquePage from "./pages/VerEstoquePage";
import RegistrarComprasPage from "./pages/RegistrarComprasPage";
import DarBaixaPage from "./pages/DarBaixaPage";
import ListaComprasPage from "./pages/ListaComprasPage";
import Insumos from "./pages/Insumos";
import Clientes from "./pages/Clientes";
import Produtos from "./pages/Produtos";
import FichasTecnicas from "./pages/FichasTecnicas";
import OrdenProducaoPage from "./pages/OrdenProducaoPage";
import ProdutosProducao from "./pages/ProdutosProducao";
import Producoes from "./pages/Producoes";

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/estoque" component={Estoque} />
      <Route path="/estoque/registrar-insumos" component={RegistrarInsumosPage} />
      <Route path="/estoque/ver-estoque" component={VerEstoquePage} />
      <Route path="/estoque/registrar-compras" component={RegistrarComprasPage} />
      <Route path="/estoque/dar-baixa" component={DarBaixaPage} />
      <Route path="/estoque/lista-compras" component={ListaComprasPage} />
      <Route path="/insumos" component={Insumos} />
      <Route path="/clientes" component={Clientes} />
      <Route path="/produtos" component={Produtos} />
      <Route path="/fichas-tecnicas" component={FichasTecnicas} />
      <Route path="/ordens-producao" component={OrdenProducaoPage} />
      <Route path="/produtos-producao" component={ProdutosProducao} />
      <Route path="/producoes" component={Producoes} />
      <Route path="/404" component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;

