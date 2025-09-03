import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import Home from "@/pages/home";
import Login from "@/pages/login";
import Register from "@/pages/register";
import Category from "@/pages/category";
import Post from "@/pages/post";
import CreatePost from "@/pages/create-post";
import PostarAnuncios from "@/pages/postar-anuncios";
import MeusAnuncios from "@/pages/meus-anuncios";
import EditarAnuncio from "@/pages/editar-anuncio";
import Impulsionar from "@/pages/impulsionar";
import FavoritosPage from "@/pages/favoritos";
import AdminPage from "@/pages/admin";
import TestPage from "@/pages/test-page";
import NotFound from "@/pages/not-found";
import ServicosPage from "@/pages/servicos";
import ProdutosPage from "@/pages/produtos";
import VagasPage from "@/pages/vagas";
import NoticiasPage from "@/pages/noticias";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/categoria/:slug" component={Category} />
      <Route path="/post/:id" component={Post} />
      <Route path="/postar" component={CreatePost} />
      <Route path="/postar-anuncios" component={PostarAnuncios} />
      <Route path="/meus-anuncios" component={MeusAnuncios} />
      <Route path="/editar-anuncio/:id" component={EditarAnuncio} />
      <Route path="/impulsionar/:id" component={Impulsionar} />
      <Route path="/favoritos" component={FavoritosPage} />
      <Route path="/admin" component={AdminPage} />
      <Route path="/servicos" component={ServicosPage} />
      <Route path="/produtos" component={ProdutosPage} />
      <Route path="/vagas" component={VagasPage} />
      <Route path="/noticias" component={NoticiasPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
