import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "wouter";

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export default function Header({ searchQuery, onSearchChange }: HeaderProps) {
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Search functionality is handled by the parent component through onSearchChange
  };

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4">
        {/* Top banner */}
        <div className="bg-gradient-to-r from-brasil-green to-brasil-blue text-white text-center py-2 text-sm">
          🎉 Ofertas especiais do Dia dos Pais - Até 70% de desconto!
        </div>
        
        {/* Main header */}
        <div className="flex items-center justify-between py-4">
          <div className="flex items-center space-x-8">
            <Link href="/" className="flex items-center">
              <h1 className="text-2xl font-bold text-brasil-green">PromoHub</h1>
              <span className="ml-2 bg-brasil-yellow text-black text-xs px-2 py-1 rounded-full font-semibold">BRASIL</span>
            </Link>
          </div>

          {/* Search bar */}
          <div className="flex-1 max-w-2xl mx-8">
            <form onSubmit={handleSearchSubmit} className="relative">
              <Input 
                type="text" 
                placeholder="Buscar ofertas, produtos ou lojas..." 
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full pl-12 pr-20 py-3 border-2 border-gray-200 rounded-lg focus:border-brasil-blue"
              />
              <i className="fas fa-search absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
              <Button 
                type="submit"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-brasil-blue text-white px-4 py-1 rounded-md text-sm font-medium hover:bg-brasil-blue"
              >
                Buscar
              </Button>
            </form>
          </div>

          {/* User actions */}
          <div className="flex items-center space-x-4">
            <Button variant="ghost" className="flex items-center space-x-2 text-gray-600 hover:text-brasil-green">
              <i className="fas fa-heart"></i>
              <span className="hidden md:block">Favoritos</span>
            </Button>
            <Button variant="ghost" className="flex items-center space-x-2 text-gray-600 hover:text-brasil-green">
              <i className="fas fa-bell"></i>
              <span className="hidden md:block">Alertas</span>
            </Button>
            <Button className="bg-brasil-green text-white hover:bg-brasil-green font-medium">
              Entrar
            </Button>
          </div>
        </div>

        {/* Navigation menu */}
        <nav className="border-t border-gray-200 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-8">
              <Button variant="ghost" className="flex items-center space-x-2 text-gray-700 hover:text-brasil-green">
                <i className="fas fa-bars"></i>
                <span>Todas as Categorias</span>
              </Button>
              <Link href="/categoria/smartphones" className="text-gray-700 hover:text-brasil-green transition-colors">Celulares</Link>
              <Link href="/categoria/eletronicos" className="text-gray-700 hover:text-brasil-green transition-colors">Eletrônicos</Link>
              <Link href="/categoria/casa-jardim" className="text-gray-700 hover:text-brasil-green transition-colors">Casa</Link>
              <Link href="/categoria/moda" className="text-gray-700 hover:text-brasil-green transition-colors">Moda</Link>
              <Link href="/categoria/games" className="text-gray-700 hover:text-brasil-green transition-colors">Games</Link>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-red-600 font-semibold">🔥 Ofertas Quentes</span>
              <span className="text-green-600 font-semibold">📱 App Mobile</span>
            </div>
          </div>
        </nav>
      </div>
    </header>
  );
}
