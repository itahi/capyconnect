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
        <div className="bg-gradient-to-r from-primary-purple to-secondary-purple text-white text-center py-2 text-sm">
          🚀 Marketplace completo - Serviços, Produtos, Vagas e Notícias!
        </div>
        
        {/* Main header */}
        <div className="flex items-center justify-between py-4">
          <div className="flex items-center space-x-8">
            <Link href="/" className="flex items-center">
              <h1 className="text-2xl font-bold text-primary-purple">ServiçoHub</h1>
              <span className="ml-2 bg-accent-purple text-white text-xs px-2 py-1 rounded-full font-semibold">BRASIL</span>
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
                className="w-full pl-12 pr-20 py-3 border-2 border-gray-200 rounded-lg focus:border-primary-purple"
              />
              <i className="fas fa-search absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
              <Button 
                type="submit"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-primary-purple text-white px-4 py-1 rounded-md text-sm font-medium hover:bg-primary-purple"
              >
                Buscar
              </Button>
            </form>
          </div>

          {/* User actions */}
          <div className="flex items-center space-x-4">
            <Button variant="ghost" className="flex items-center space-x-2 text-gray-600 hover:text-primary-purple">
              <i className="fas fa-heart"></i>
              <span className="hidden md:block">Favoritos</span>
            </Button>
            <Button variant="ghost" className="flex items-center space-x-2 text-gray-600 hover:text-primary-purple">
              <i className="fas fa-bell"></i>
              <span className="hidden md:block">Alertas</span>
            </Button>
            <Link href="/postar">
              <Button className="bg-primary-purple text-white hover:bg-primary-purple font-medium">
                Postar
              </Button>
            </Link>
          </div>
        </div>

        {/* Navigation menu */}
        <nav className="border-t border-gray-200 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-8">
              <Button variant="ghost" className="flex items-center space-x-2 text-gray-700 hover:text-primary-purple">
                <i className="fas fa-bars"></i>
                <span>Todas as Categorias</span>
              </Button>
              <Link href="/categoria/limpeza" className="text-gray-700 hover:text-primary-purple transition-colors">Limpeza</Link>
              <Link href="/categoria/eletronicos" className="text-gray-700 hover:text-primary-purple transition-colors">Eletrônicos</Link>
              <Link href="/categoria/tecnologia" className="text-gray-700 hover:text-primary-purple transition-colors">Tech Jobs</Link>
              <Link href="/categoria/economia" className="text-gray-700 hover:text-primary-purple transition-colors">Notícias</Link>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-accent-purple font-semibold">⭐ Destaques</span>
              <span className="text-primary-purple font-semibold">📱 WhatsApp Direct</span>
            </div>
          </div>
        </nav>
      </div>
    </header>
  );
}
