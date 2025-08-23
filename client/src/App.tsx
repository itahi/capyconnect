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
import TestPage from "@/pages/test-page";
import NotFound from "@/pages/not-found";

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
