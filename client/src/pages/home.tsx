import { useQuery } from "@tanstack/react-query";
import type { Category, DealWithRelations, CouponWithStore } from "@shared/schema";
import Header from "@/components/header";
import CategorySidebar from "@/components/category-sidebar";
import DealCard from "@/components/deal-card";
import CouponCard from "@/components/coupon-card";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: categories, isLoading: categoriesLoading } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const { data: hotDeals, isLoading: hotDealsLoading } = useQuery<DealWithRelations[]>({
    queryKey: ["/api/deals", { isHot: true, limit: 6 }],
  });

  const { data: regularDeals, isLoading: regularDealsLoading } = useQuery<DealWithRelations[]>({
    queryKey: ["/api/deals", { limit: 12, search: searchQuery }],
  });

  const { data: coupons, isLoading: couponsLoading } = useQuery<CouponWithStore[]>({
    queryKey: ["/api/coupons", { isActive: true, limit: 4 }],
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Header searchQuery={searchQuery} onSearchChange={setSearchQuery} />
      
      {/* Hero Banner */}
      <section className="bg-gradient-to-r from-brasil-blue to-brasil-green text-white py-8">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 h-64 flex items-center">
                <div className="flex-1">
                  <h2 className="text-3xl font-bold mb-4">Ofertas Especiais Dia dos Pais</h2>
                  <p className="text-xl mb-4">Smartphones, Notebooks e Eletrônicos com até 70% OFF</p>
                  <Button className="bg-brasil-yellow text-black hover:bg-yellow-400 font-semibold">
                    Ver Todas as Ofertas
                  </Button>
                </div>
                <div className="flex-1 text-right">
                  <img 
                    src="https://images.unsplash.com/photo-1563013544-824ae1b704d3?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400" 
                    alt="Ofertas especiais de eletrônicos" 
                    className="rounded-lg shadow-lg w-full h-auto max-w-sm ml-auto"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <h3 className="font-semibold mb-2">🏆 Ofertas Verificadas</h3>
                <p className="text-sm opacity-90">Mais de 10.000 ofertas verificadas diariamente</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <h3 className="font-semibold mb-2">💰 Economia Total</h3>
                <p className="text-sm opacity-90">R$ 2.5M economizados pelos usuários este mês</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <h3 className="font-semibold mb-2">📱 App Móvel</h3>
                <p className="text-sm opacity-90">Alertas instantâneos no seu celular</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <aside className="lg:w-1/4">
            <CategorySidebar categories={categories} isLoading={categoriesLoading} />
          </aside>

          {/* Main Content */}
          <div className="lg:w-3/4">
            {/* Hot Deals Section */}
            <section className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                  🔥 Ofertas Quentes
                  <span className="ml-3 bg-red-100 text-red-600 text-sm px-2 py-1 rounded-full">Limitadas</span>
                </h2>
                <a href="#" className="text-brasil-blue hover:underline">Ver todas</a>
              </div>

              {hotDealsLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="bg-white rounded-xl shadow-sm p-4 animate-pulse">
                      <div className="w-full h-48 bg-gray-200 rounded mb-4"></div>
                      <div className="h-4 bg-gray-200 rounded mb-2"></div>
                      <div className="h-6 bg-gray-200 rounded mb-2"></div>
                      <div className="flex gap-2">
                        <div className="h-8 bg-gray-200 rounded flex-1"></div>
                        <div className="h-8 w-8 bg-gray-200 rounded"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {hotDeals?.map((deal) => (
                    <DealCard key={deal.id} deal={deal} />
                  ))}
                </div>
              )}
            </section>

            {/* Coupon Codes Section */}
            <section className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                  🎫 Cupons de Desconto
                  <span className="ml-3 bg-brasil-yellow text-black text-sm px-2 py-1 rounded-full">Novos</span>
                </h2>
                <a href="#" className="text-brasil-blue hover:underline">Ver todos</a>
              </div>

              {couponsLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[...Array(2)].map((_, i) => (
                    <div key={i} className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl p-6 animate-pulse">
                      <div className="h-6 bg-white/20 rounded mb-2 w-1/3"></div>
                      <div className="h-4 bg-white/20 rounded mb-3 w-2/3"></div>
                      <div className="h-8 bg-white/20 rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {coupons?.map((coupon) => (
                    <CouponCard key={coupon.id} coupon={coupon} />
                  ))}
                </div>
              )}
            </section>

            {/* Regular Deals Section */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-800">Todas as Ofertas</h2>
              </div>

              {regularDealsLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {[...Array(12)].map((_, i) => (
                    <div key={i} className="bg-white rounded-xl shadow-sm p-4 animate-pulse">
                      <div className="w-full h-48 bg-gray-200 rounded mb-4"></div>
                      <div className="h-4 bg-gray-200 rounded mb-2"></div>
                      <div className="h-6 bg-gray-200 rounded mb-2"></div>
                      <div className="flex gap-2">
                        <div className="h-8 bg-gray-200 rounded flex-1"></div>
                        <div className="h-8 w-8 bg-gray-200 rounded"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {regularDeals?.map((deal) => (
                    <DealCard key={deal.id} deal={deal} />
                  ))}
                </div>
              )}

              <div className="text-center mt-8">
                <Button variant="outline" className="border-brasil-green text-brasil-green hover:bg-brasil-green hover:text-white">
                  Carregar Mais Ofertas
                </Button>
              </div>
            </section>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 mt-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4 text-brasil-green">PromoHub</h3>
              <p className="text-gray-300 mb-4">A maior plataforma de ofertas e promoções do Brasil. Economia garantida em milhares de produtos.</p>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-brasil-green transition-colors">
                  <i className="fab fa-facebook-f"></i>
                </a>
                <a href="#" className="text-gray-400 hover:text-brasil-green transition-colors">
                  <i className="fab fa-instagram"></i>
                </a>
                <a href="#" className="text-gray-400 hover:text-brasil-green transition-colors">
                  <i className="fab fa-twitter"></i>
                </a>
                <a href="#" className="text-gray-400 hover:text-brasil-green transition-colors">
                  <i className="fab fa-youtube"></i>
                </a>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Links Rápidos</h4>
              <ul className="space-y-2 text-gray-300">
                <li><a href="#" className="hover:text-brasil-green transition-colors">Como Funciona</a></li>
                <li><a href="#" className="hover:text-brasil-green transition-colors">Enviar Oferta</a></li>
                <li><a href="#" className="hover:text-brasil-green transition-colors">Programa de Afiliados</a></li>
                <li><a href="#" className="hover:text-brasil-green transition-colors">API Desenvolvedores</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Categorias Populares</h4>
              <ul className="space-y-2 text-gray-300">
                <li><a href="#" className="hover:text-brasil-green transition-colors">Smartphones</a></li>
                <li><a href="#" className="hover:text-brasil-green transition-colors">Eletrônicos</a></li>
                <li><a href="#" className="hover:text-brasil-green transition-colors">Moda</a></li>
                <li><a href="#" className="hover:text-brasil-green transition-colors">Casa e Jardim</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Suporte</h4>
              <ul className="space-y-2 text-gray-300">
                <li><a href="#" className="hover:text-brasil-green transition-colors">Central de Ajuda</a></li>
                <li><a href="#" className="hover:text-brasil-green transition-colors">Contato</a></li>
                <li><a href="#" className="hover:text-brasil-green transition-colors">Política de Privacidade</a></li>
                <li><a href="#" className="hover:text-brasil-green transition-colors">Termos de Uso</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-gray-400 text-sm">© 2024 PromoHub. Todos os direitos reservados.</p>
              <div className="flex items-center space-x-4 mt-4 md:mt-0">
                <span className="text-gray-400 text-sm">Baixe nosso app:</span>
                <a href="#" className="hover:opacity-80 transition-opacity">
                  <img 
                    src="https://developer.apple.com/assets/elements/badges/download-on-the-app-store.svg" 
                    alt="Download na App Store" 
                    className="h-10 w-auto"
                  />
                </a>
                <a href="#" className="hover:opacity-80 transition-opacity">
                  <img 
                    src="https://play.google.com/intl/en_us/badges/static/images/badges/en_badge_web_generic.png" 
                    alt="Baixar no Google Play" 
                    className="h-10 w-auto"
                  />
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
