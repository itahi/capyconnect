import { useQuery } from "@tanstack/react-query";
import type { Category, PostWithRelations } from "@shared/schema";
import Header from "@/components/header";
import CategoryTabs from "@/components/category-tabs";
import { PostCard } from "@/components/PostCard";
import { AdvancedSearch } from "@/components/AdvancedSearch";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useState } from "react";

interface SearchFilters {
  search: string;
  categoryId: string;
  minPrice: string;
  maxPrice: string;
  location: string;
  store: string;
  type: string;
}

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    search: "",
    categoryId: "",
    minPrice: "",
    maxPrice: "",
    location: "",
    store: "",
    type: "",
  });

  const { data: categories, isLoading: categoriesLoading } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const { data: featuredPosts, isLoading: featuredLoading } = useQuery<PostWithRelations[]>({
    queryKey: ["/api/posts", "featured"],
    queryFn: () => fetch("/api/posts?isFeatured=true&limit=6").then(res => res.json()),
  });

  // Build query parameters from search filters
  const buildQueryParams = (filters: SearchFilters) => {
    const params = new URLSearchParams();
    if (filters.search) params.append('search', filters.search);
    if (filters.categoryId) params.append('categoryId', filters.categoryId);
    if (filters.minPrice) params.append('minPrice', filters.minPrice);
    if (filters.maxPrice) params.append('maxPrice', filters.maxPrice);
    if (filters.location) params.append('location', filters.location);
    if (filters.store) params.append('store', filters.store);
    if (filters.type) params.append('type', filters.type);
    return params.toString();
  };

  const { data: allPosts, isLoading: allPostsLoading } = useQuery<PostWithRelations[]>({
    queryKey: ["/api/posts", searchFilters],
    queryFn: () => {
      const queryParams = buildQueryParams(searchFilters);
      const url = queryParams ? `/api/posts?${queryParams}` : '/api/posts';
      return fetch(url).then(res => res.json());
    },
  });

  // Also update the search from header when user types
  const handleHeaderSearchChange = (newSearch: string) => {
    setSearchQuery(newSearch);
    setSearchFilters(prev => ({ ...prev, search: newSearch }));
  };

  const handleAdvancedSearch = (filters: SearchFilters) => {
    setSearchFilters(filters);
    setSearchQuery(filters.search); // Keep the header search in sync
  };

  return (
    <div className="min-h-screen bg-purple-50">
      <Header searchQuery={searchQuery} onSearchChange={handleHeaderSearchChange} />
      
      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Advanced Search */}
        <AdvancedSearch
          onSearch={handleAdvancedSearch}
          initialFilters={{
            search: searchQuery,
            categoryId: searchFilters.categoryId,
            minPrice: searchFilters.minPrice,
            maxPrice: searchFilters.maxPrice,
            location: searchFilters.location,
            store: searchFilters.store,
            type: searchFilters.type,
          }}
        />
        {/* Featured Posts Section */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">⭐ Anúncios em Destaque</h2>
              <p className="text-gray-600">Os melhores anúncios selecionados para você</p>
            </div>
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
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                {activeTab === "all" && "📋 Todos os Anúncios"}
                {activeTab === "service" && "🔧 Serviços"}
                {activeTab === "product" && "📱 Produtos"}
                {activeTab === "job" && "💼 Vagas"}
                {activeTab === "news" && "📰 Notícias"}
              </h2>
              <p className="text-gray-600">
                {activeTab === "all" && "Explore todas as oportunidades disponíveis"}
                {activeTab === "service" && "Encontre o profissional ideal para suas necessidades"}
                {activeTab === "product" && "Descubra produtos incríveis com ótimos preços"}
                {activeTab === "job" && "Oportunidades de trabalho atualizadas"}
                {activeTab === "news" && "Fique por dentro das últimas notícias"}
              </p>
            </div>
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

          {allPosts && allPosts.length > 0 && (
            <div className="text-center mt-12">
              <Button variant="outline" className="border-primary-yellow text-primary-yellow hover:bg-primary-yellow hover:text-white px-8 py-3">
                Carregar Mais Anúncios
              </Button>
            </div>
          )}
        </section>
      </main>

      {/* Simple Footer */}
      <footer className="bg-white border-t border-gray-200 py-6 mt-16">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-500 text-sm">
            © 2024 CapyConnect - O marketplace completo do Brasil
          </p>
          <div className="flex justify-center items-center gap-4 mt-2 text-sm">
            <Link href="/postar-anuncios" className="text-primary-yellow hover:underline">
              Postar Anúncio
            </Link>
            <span className="text-gray-300">•</span>
            <a href="#" className="text-gray-500 hover:text-primary-yellow">
              Contato
            </a>
            <span className="text-gray-300">•</span>
            <a href="#" className="text-gray-500 hover:text-primary-yellow">
              Ajuda
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
