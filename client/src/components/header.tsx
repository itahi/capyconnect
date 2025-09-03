import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Search, Menu, X, User, LogOut, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";

function UserActions() {
  const { user, isAuthenticated, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      window.location.href = '/';
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (isAuthenticated && user) {
    return (
      <div className="flex items-center space-x-4">
        <Link href="/meus-anuncios">
          <Button variant="ghost" className="flex items-center space-x-2 text-gray-600 hover:text-primary-yellow">
            <User className="h-4 w-4" />
            <span className="hidden md:block">Meus Anúncios</span>
          </Button>
        </Link>

        <Link href="/favoritos">
          <Button variant="ghost" className="flex items-center space-x-2 text-gray-600 hover:text-red-500">
            <Heart className="h-4 w-4" />
            <span className="hidden md:block">Favoritos</span>
          </Button>
        </Link>

        {user.name === 'igor' && (
          <Link href="/admin">
            <Button variant="ghost" className="flex items-center space-x-2 text-gray-600 hover:text-purple-600">
              <span className="text-purple-600">⚙️</span>
              <span className="hidden md:block">Admin</span>
            </Button>
          </Link>
        )}

        <div className="flex items-center space-x-2 text-gray-700">
          <span className="hidden md:block font-medium">Olá, {user.name?.split(' ')[0] || 'Usuário'}</span>
        </div>

        <Button 
          variant="ghost" 
          onClick={handleLogout}
          className="flex items-center space-x-2 text-gray-600 hover:text-red-600"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden md:block">Sair</span>
        </Button>

        <Link href="/postar-anuncios">
          <Button className="bg-primary-yellow text-white hover:bg-primary-yellow/90 font-medium">
            Postar
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-4">
      <Link href="/favoritos">
        <Button variant="ghost" className="flex items-center space-x-2 text-gray-600 hover:text-red-500">
          <Heart className="h-4 w-4" />
          <span className="hidden md:block">Favoritos</span>
        </Button>
      </Link>

      <Link href="/login">
        <Button variant="outline" className="border-primary-yellow text-primary-yellow hover:bg-primary-yellow hover:text-white">
          Entrar
        </Button>
      </Link>

      <Link href="/register">
        <Button variant="outline" className="border-primary-yellow text-primary-yellow hover:bg-primary-yellow hover:text-white">
          Cadastrar
        </Button>
      </Link>

      <Link href="/postar-anuncios">
        <Button className="bg-primary-yellow text-white hover:bg-primary-yellow/90 font-medium">
          Postar
        </Button>
      </Link>
    </div>
  );
}

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export default function Header({ searchQuery, onSearchChange }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
  };

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4">
        {/* Top banner */}
        <div className="bg-gradient-to-r from-primary-yellow to-secondary-yellow text-white text-center py-2 text-sm">
          🚀 Marketplace completo - Serviços, Produtos, Vagas e Notícias!
        </div>
        
        {/* Main header */}
        <div className="flex items-center justify-between py-4">
          <div className="flex items-center space-x-8">
            <Link href="/" className="flex items-center">
              <img 
                src="/attached_assets/ChatGPT Image 1 de ago. de 2025, 11_29_20_1756924509649.png" 
                alt="Capivara Elisa" 
                className="h-16 w-16 object-cover rounded-full hover:scale-105 transition-transform duration-200"
              />
            </Link>
          </div>

          {/* Search bar */}
          <div className="flex-1 max-w-2xl mx-8">
            <form onSubmit={handleSearchSubmit} className="relative">
              <Input
                type="text"
                placeholder="Busque por serviços, produtos, vagas..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full pl-4 pr-12 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-yellow focus:border-transparent"
              />
              <Button
                type="submit"
                size="sm"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-primary-yellow hover:bg-primary-yellow/90"
              >
                <Search className="h-4 w-4" />
              </Button>
            </form>
          </div>

          {/* User actions */}
          <UserActions />
        </div>

        {/* Navigation menu */}
        <nav className="border-t border-gray-200">
          <div className="flex items-center justify-between py-3">
            <div className="hidden md:flex space-x-8">
              <Link href="/servicos" className="text-gray-600 hover:text-primary-yellow font-medium">
                Serviços
              </Link>
              <Link href="/produtos" className="text-gray-600 hover:text-primary-yellow font-medium">
                Produtos
              </Link>
              <Link href="/vagas" className="text-gray-600 hover:text-primary-yellow font-medium">
                Vagas
              </Link>
              <Link href="/noticias" className="text-gray-600 hover:text-primary-yellow font-medium">
                Notícias
              </Link>
            </div>

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              className="md:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>

          {/* Mobile menu */}
          {isMenuOpen && (
            <div className="md:hidden py-4 border-t border-gray-200">
              <div className="flex flex-col space-y-3">
                <Link href="/servicos" className="text-gray-600 hover:text-primary-yellow font-medium py-2">
                  Serviços
                </Link>
                <Link href="/produtos" className="text-gray-600 hover:text-primary-yellow font-medium py-2">
                  Produtos
                </Link>
                <Link href="/vagas" className="text-gray-600 hover:text-primary-yellow font-medium py-2">
                  Vagas
                </Link>
                <Link href="/noticias" className="text-gray-600 hover:text-primary-yellow font-medium py-2">
                  Notícias
                </Link>
              </div>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}