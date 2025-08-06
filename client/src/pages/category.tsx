import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import type { Category, DealWithRelations } from "@shared/schema";
import Header from "@/components/header";
import CategorySidebar from "@/components/category-sidebar";
import DealCard from "@/components/deal-card";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export default function Category() {
  const { slug } = useParams();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: categories } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const { data: category } = useQuery<Category>({
    queryKey: ["/api/categories", slug],
    enabled: !!slug,
  });

  const { data: deals, isLoading } = useQuery<DealWithRelations[]>({
    queryKey: ["/api/deals", { categoryId: category?.id, search: searchQuery }],
    enabled: !!category?.id,
  });

  if (!category) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header searchQuery={searchQuery} onSearchChange={setSearchQuery} />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">Categoria não encontrada</h1>
            <p className="text-gray-600">A categoria que você procura não existe.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header searchQuery={searchQuery} onSearchChange={setSearchQuery} />
      
      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          <aside className="lg:w-1/4">
            <CategorySidebar categories={categories} />
          </aside>

          <div className="lg:w-3/4">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center">
                <i className={`${category.icon} mr-3 text-brasil-blue`}></i>
                {category.name}
              </h1>
              <p className="text-gray-600">{category.dealCount} ofertas disponíveis</p>
            </div>

            {isLoading ? (
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
            ) : deals && deals.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {deals.map((deal) => (
                    <DealCard key={deal.id} deal={deal} />
                  ))}
                </div>
                
                <div className="text-center mt-8">
                  <Button variant="outline" className="border-brasil-green text-brasil-green hover:bg-brasil-green hover:text-white">
                    Carregar Mais Ofertas
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Nenhuma oferta encontrada</h3>
                <p className="text-gray-600">Não há ofertas disponíveis para esta categoria no momento.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
