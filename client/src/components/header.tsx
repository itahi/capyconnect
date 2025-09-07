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
      <div className="flex items-center space-x-2 md:space-x-4">
        {/* Meus Anúncios */}
        <Link href="/meus-anuncios">
          <Button variant="ghost" size="sm" className="text-gray-600 hover:text-purple-600 font-medium">
            <span className="hidden md:inline">Meus Anúncios</span>
            <span className="md:hidden text-lg">📄</span>
          </Button>
        </Link>

        {/* Favoritos */}
        <Link href="/favoritos">
          <Button variant="ghost" size="sm" className="text-gray-600 hover:text-red-500 font-medium">
            <Heart className="h-4 w-4 md:mr-2" />
            <span className="hidden md:inline">Favoritos</span>
          </Button>
        </Link>

        {/* Botão Admin - só para igor */}
        {user.name === 'igor' && (
          <Link href="/admin">
            <Button variant="ghost" size="sm" className="text-purple-600 hover:text-purple-700 font-medium">
              <span className="text-lg md:mr-2">⚙️</span>
              <span className="hidden md:inline">Administrador</span>
            </Button>
          </Link>
        )}

        {/* Logout */}
        <Button 
          variant="ghost"
          size="sm" 
          onClick={handleLogout}
          className="text-gray-600 hover:text-red-600 font-medium"
        >
          <LogOut className="h-4 w-4 md:mr-2" />
          <span className="hidden md:inline">Sair</span>
        </Button>

        {/* Postar Anúncio */}
        <Link href="/postar-anuncios">
          <Button size="sm" className="bg-primary-yellow text-white hover:bg-primary-yellow/90 font-medium px-4 py-2">
            <span className="hidden md:inline">Postar Anúncio</span>
            <span className="md:hidden">+</span>
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2 md:space-x-4">
      <Link href="/favoritos">
        <Button variant="ghost" size="sm" className="p-2 text-gray-600 hover:text-red-500">
          <Heart className="h-4 w-4" />
        </Button>
      </Link>

      <Link href="/login">
        <Button variant="outline" size="sm" className="border-primary-yellow text-primary-yellow hover:bg-primary-yellow hover:text-white text-xs md:text-sm px-2 md:px-4">
          <span className="hidden md:inline">Entrar</span>
          <span className="md:hidden">👤</span>
        </Button>
      </Link>

      <Link href="/cadastro">
        <Button variant="outline" size="sm" className="border-gray-300 text-gray-700 hover:bg-gray-100 text-xs md:text-sm px-2 md:px-4 hidden md:inline-flex">
          Cadastrar
        </Button>
      </Link>

      <Link href="/postar-anuncios">
        <Button size="sm" className="bg-primary-yellow text-white hover:bg-primary-yellow/90 font-medium text-xs md:text-sm px-3 py-2">
          <span className="hidden md:inline">Postar Anúncio</span>
          <span className="md:hidden">+</span>
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
      {/* Top banner - Full width */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-800 text-white text-center py-2 text-xs sm:text-sm font-medium">
        <span className="hidden sm:inline">🚀 Marketplace completo - Serviços, Produtos, Vagas e Notícias!</span>
        <span className="sm:hidden">🚀 CapyConnect - Marketplace Brasileiro!</span>
      </div>
      
      <div className="container mx-auto px-4">
        {/* Mobile layout */}
        <div className="md:hidden flex flex-col space-y-3 py-3">
          {/* Top row: Logo + User actions */}
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-2 group">
              <img 
                src="/attached_assets/ChatGPT Image 1 de ago. de 2025, 11_29_20_1756924509649.png" 
                alt="Capivara Elisa" 
                className="h-12 w-12 object-cover rounded-full group-hover:scale-105 transition-transform duration-200"
              />
              <div className="flex flex-col">
                <h1 className="text-lg font-bold bg-gradient-to-r from-purple-600 to-purple-800 bg-clip-text text-transparent group-hover:from-purple-700 group-hover:to-purple-900 transition-all duration-200">
                  CapyConnect
                </h1>
              </div>
            </Link>
            
            <UserActions />
          </div>

          {/* Search bar - full width on mobile */}
          <form onSubmit={handleSearchSubmit} className="relative">
            <Input
              type="text"
              placeholder="Buscar..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-4 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-yellow focus:border-transparent text-base"
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

        {/* Desktop layout */}
        <div className="hidden md:flex items-center justify-between py-4">
          <Link href="/" className="flex items-center space-x-3 group">
            <img 
              src="/attached_assets/ChatGPT Image 1 de ago. de 2025, 11_29_20_1756924509649.png" 
              alt="Capivara Elisa" 
              className="h-16 w-16 object-cover rounded-full group-hover:scale-105 transition-transform duration-200"
            />
            <div className="flex flex-col">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-purple-800 bg-clip-text text-transparent group-hover:from-purple-700 group-hover:to-purple-900 transition-all duration-200">
                CapyConnect
              </h1>
              <span className="text-sm text-purple-600 font-medium">
                Marketplace Brasileiro
              </span>
            </div>
          </Link>
          
          {/* Search bar - desktop center */}
          <div className="flex-1 max-w-2xl mx-8">
            <form onSubmit={handleSearchSubmit} className="relative">
              <Input
                type="text"
                placeholder="Busque por serviços, produtos, vagas e notícias..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full pl-4 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-yellow focus:border-transparent text-base"
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