import { useQuery } from "@tanstack/react-query";
import type { Category, PostWithRelations } from "@shared/schema";
import Header from "@/components/header";
import CategoryTabs from "@/components/category-tabs";
import PostCard from "@/components/post-card";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  const { data: categories, isLoading: categoriesLoading } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const { data: featuredPosts, isLoading: featuredLoading } = useQuery<PostWithRelations[]>({
    queryKey: ["/api/posts", { isFeatured: true, limit: 6 }],
  });

  const { data: allPosts, isLoading: allPostsLoading } = useQuery<PostWithRelations[]>({
    queryKey: ["/api/posts", { 
      limit: 12, 
      search: searchQuery,
      type: activeTab !== "all" ? activeTab : undefined
    }],
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Header searchQuery={searchQuery} onSearchChange={setSearchQuery} />
      
      {/* Hero Banner */}
      <section className="bg-gradient-to-r from-primary-purple to-secondary-purple text-white py-8">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 h-64 flex items-center">
                <div className="flex-1">
                  <h2 className="text-3xl font-bold mb-4">ServiçoHub - Seu Marketplace Completo</h2>
                  <p className="text-xl mb-4">Serviços, Produtos, Notícias e Vagas em um só lugar</p>
                  <Button className="bg-white text-primary-purple hover:bg-gray-100 font-semibold">
                    Postar Anúncio
                  </Button>
                </div>
                <div className="flex-1 text-right">
                  <img 
                    src="https://images.unsplash.com/photo-1556761175-b413da4baf72?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400" 
                    alt="Marketplace de serviços" 
                    className="rounded-lg shadow-lg w-full h-auto max-w-sm ml-auto"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <h3 className="font-semibold mb-2">🔧 Serviços</h3>
                <p className="text-sm opacity-90">Encontre profissionais para qualquer necessidade</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <h3 className="font-semibold mb-2">📱 WhatsApp</h3>
                <p className="text-sm opacity-90">Contato direto com um clique</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <h3 className="font-semibold mb-2">💼 Oportunidades</h3>
                <p className="text-sm opacity-90">Vagas e negócios atualizados diariamente</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Category Tabs */}
      <section className="bg-white shadow-sm">
        <div className="container mx-auto px-4">
          <CategoryTabs 
            categories={categories} 
            activeTab={activeTab} 
            onTabChange={setActiveTab}
            isLoading={categoriesLoading}
          />
        </div>
      </section>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Featured Posts Section */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center">
              ⭐ Destaques
              <span className="ml-3 bg-accent-purple text-white text-sm px-2 py-1 rounded-full">Especiais</span>
            </h2>
            <a href="#" className="text-primary-purple hover:underline">Ver todos</a>
          </div>

          {featuredLoading ? (
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
              {featuredPosts?.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          )}
        </section>

        {/* All Posts Section */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-800">
              {activeTab === "all" && "Todos os Posts"}
              {activeTab === "service" && "Serviços"}
              {activeTab === "product" && "Produtos"}
              {activeTab === "job" && "Vagas"}
              {activeTab === "news" && "Notícias"}
            </h2>
          </div>

          {allPostsLoading ? (
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
              {allPosts?.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          )}

          <div className="text-center mt-8">
            <Button variant="outline" className="border-primary-purple text-primary-purple hover:bg-primary-purple hover:text-white">
              Carregar Mais Posts
            </Button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 mt-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4 text-primary-purple">ServiçoHub</h3>
              <p className="text-gray-300 mb-4">O marketplace completo do Brasil. Serviços, produtos, vagas e notícias em um só lugar.</p>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-primary-purple transition-colors">
                  <i className="fab fa-facebook-f"></i>
                </a>
                <a href="#" className="text-gray-400 hover:text-primary-purple transition-colors">
                  <i className="fab fa-instagram"></i>
                </a>
                <a href="#" className="text-gray-400 hover:text-primary-purple transition-colors">
                  <i className="fab fa-twitter"></i>
                </a>
                <a href="#" className="text-gray-400 hover:text-primary-purple transition-colors">
                  <i className="fab fa-youtube"></i>
                </a>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Links Rápidos</h4>
              <ul className="space-y-2 text-gray-300">
                <li><a href="#" className="hover:text-primary-purple transition-colors">Como Funciona</a></li>
                <li><a href="#" className="hover:text-primary-purple transition-colors">Postar Anúncio</a></li>
                <li><a href="#" className="hover:text-primary-purple transition-colors">Para Empresas</a></li>
                <li><a href="#" className="hover:text-primary-purple transition-colors">API Desenvolvedores</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Categorias Populares</h4>
              <ul className="space-y-2 text-gray-300">
                <li><a href="#" className="hover:text-primary-purple transition-colors">Limpeza</a></li>
                <li><a href="#" className="hover:text-primary-purple transition-colors">Encanamento</a></li>
                <li><a href="#" className="hover:text-primary-purple transition-colors">Tecnologia</a></li>
                <li><a href="#" className="hover:text-primary-purple transition-colors">Produtos</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Suporte</h4>
              <ul className="space-y-2 text-gray-300">
                <li><a href="#" className="hover:text-primary-purple transition-colors">Central de Ajuda</a></li>
                <li><a href="#" className="hover:text-primary-purple transition-colors">Contato</a></li>
                <li><a href="#" className="hover:text-primary-purple transition-colors">Política de Privacidade</a></li>
                <li><a href="#" className="hover:text-primary-purple transition-colors">Termos de Uso</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-gray-400 text-sm">© 2024 ServiçoHub. Todos os direitos reservados.</p>
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
