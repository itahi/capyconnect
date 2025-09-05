import { useQuery } from "@tanstack/react-query";
import type { Category, PostWithRelations } from "@shared/schema";
import Header from "@/components/header";
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

export default function ServicosPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    search: "",
    categoryId: "all",
    minPrice: "",
    maxPrice: "",
    location: "",
    store: "",
    type: "service",
  });

  const { data: categories, isLoading: categoriesLoading } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  // Filter categories to show only services
  const serviceCategories = categories?.filter(cat => cat.type === 'service') || [];

  // Build query parameters from search filters
  const buildQueryParams = (filters: SearchFilters) => {
    const params = new URLSearchParams();
    if (filters.search) params.append('search', filters.search);
    if (filters.categoryId && filters.categoryId !== 'all') params.append('categoryId', filters.categoryId);
    if (filters.minPrice) params.append('minPrice', filters.minPrice);
    if (filters.maxPrice) params.append('maxPrice', filters.maxPrice);
    if (filters.location) params.append('location', filters.location);
    if (filters.store) params.append('store', filters.store);
    if (filters.type) params.append('type', filters.type);
    return params.toString();
  };

  const { data: servicePosts, isLoading: postsLoading } = useQuery<PostWithRelations[]>({
    queryKey: ["/api/posts", "service", searchFilters],
    queryFn: () => {
      const queryParams = buildQueryParams(searchFilters);
      const url = queryParams ? `/api/posts?${queryParams}` : '/api/posts?type=service';
      return fetch(url).then(res => res.json());
    },
  });

  const handleHeaderSearchChange = (newSearch: string) => {
    setSearchQuery(newSearch);
    setSearchFilters(prev => ({ ...prev, search: newSearch }));
  };

  const handleAdvancedSearch = (filters: SearchFilters) => {
    setSearchFilters({ ...filters, type: "service" });
    setSearchQuery(filters.search);
  };

  if (categoriesLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-yellow"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header searchQuery={searchQuery} onSearchChange={handleHeaderSearchChange} />
      
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
        {/* Page Title */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Serviços</h1>
          <p className="text-sm sm:text-base text-gray-600">Encontre os melhores serviços profissionais</p>
        </div>

        {/* Categories Grid */}
        <div className="mb-6 sm:mb-8">
          <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Categorias de Serviços</h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-4">
            {serviceCategories.map((category) => (
              <Link 
                key={category.id} 
                href={`/categoria/${category.id}`}
                className="bg-white p-2 sm:p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow border"
              >
                <div className="text-center">
                  <div className="text-lg sm:text-2xl mb-1 sm:mb-2">{category.icon}</div>
                  <span className="text-xs sm:text-sm font-medium text-gray-700 leading-tight">{category.name}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Advanced Search */}
        <div className="mb-6 sm:mb-8">
          <AdvancedSearch 
            onSearch={handleAdvancedSearch}
            initialFilters={{ type: "service" }}
          />
        </div>

        {/* Add Service Button */}
        <div className="mb-6 sm:mb-8 text-center">
          <Link href="/postar?type=service">
            <Button className="bg-primary-yellow hover:bg-primary-yellow/90 text-white px-6 sm:px-8 py-2 sm:py-3 text-sm sm:text-base">
              Anunciar Serviço
            </Button>
          </Link>
        </div>

        {/* Posts Grid */}
        <div className="mb-8">
          <h2 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6">Serviços Disponíveis</h2>
          {postsLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white p-6 rounded-lg shadow-sm animate-pulse">
                  <div className="h-48 bg-gray-200 rounded mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </div>
              ))}
            </div>
          ) : servicePosts && servicePosts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {servicePosts.filter(post => post.category && post.user).map((post) => (
                <PostCard 
                  key={post.id} 
                  post={{
                    ...post,
                    createdAt: post.createdAt instanceof Date ? post.createdAt.toISOString() : post.createdAt,
                    category: post.category!,
                    user: {
                      id: post.user!.id,
                      name: post.user!.name,
                      avatar: post.user!.avatar
                    }
                  }} 
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">Nenhum serviço encontrado</p>
              <Link href="/postar?type=service">
                <Button className="bg-primary-yellow hover:bg-primary-yellow/90 text-white">
                  Seja o primeiro a anunciar
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}