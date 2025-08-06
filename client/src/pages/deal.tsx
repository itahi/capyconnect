import { useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { DealWithRelations } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import Header from "@/components/header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

export default function Deal() {
  const { id } = useParams();
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: deal, isLoading } = useQuery<DealWithRelations>({
    queryKey: ["/api/deals", id],
    enabled: !!id,
  });

  const useDealMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/deals/${id}/use`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/deals", id] });
      toast({
        title: "Redirecionando...",
        description: "Você será redirecionado para a loja em instantes.",
      });
      // In a real app, redirect to the deal URL
      window.open(deal?.dealUrl, '_blank');
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível processar a solicitação. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price / 100);
  };

  const formatTimeRemaining = (expiresAt: string | null) => {
    if (!expiresAt) return "Sem data de expiração";
    
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diffMs = expiry.getTime() - now.getTime();
    
    if (diffMs <= 0) return "Expirado";
    
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffDays > 0) {
      return `Expira em ${diffDays} dia${diffDays > 1 ? 's' : ''}`;
    } else {
      return `Expira em ${diffHours}h`;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header searchQuery={searchQuery} onSearchChange={setSearchQuery} />
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="w-full h-96 bg-gray-200 rounded"></div>
                <div className="space-y-4">
                  <div className="h-8 bg-gray-200 rounded"></div>
                  <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-12 bg-gray-200 rounded"></div>
                  <div className="h-10 bg-gray-200 rounded"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!deal) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header searchQuery={searchQuery} onSearchChange={setSearchQuery} />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">Oferta não encontrada</h1>
            <p className="text-gray-600">A oferta que você procura não existe ou foi removida.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header searchQuery={searchQuery} onSearchChange={setSearchQuery} />
      
      <main className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-6">
            {/* Image */}
            <div className="relative">
              <img 
                src={deal.imageUrl} 
                alt={deal.title}
                className="w-full h-96 object-cover rounded-lg"
              />
              {deal.isHot && (
                <Badge className="absolute top-4 left-4 bg-red-500 text-white">
                  🔥 Oferta Quente
                </Badge>
              )}
              {deal.isVerified && (
                <Badge className="absolute top-4 right-4 bg-green-500 text-white">
                  ✓ Verificado
                </Badge>
              )}
            </div>

            {/* Details */}
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-800 mb-2">{deal.title}</h1>
                {deal.description && (
                  <p className="text-gray-600">{deal.description}</p>
                )}
              </div>

              {/* Store info */}
              {deal.store && (
                <div className="flex items-center space-x-3">
                  {deal.store.logoUrl && (
                    <img 
                      src={deal.store.logoUrl} 
                      alt={deal.store.name}
                      className="h-8 w-auto"
                    />
                  )}
                  <span className="font-medium text-gray-800">{deal.store.name}</span>
                  {deal.store.isVerified && (
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      Loja Verificada
                    </Badge>
                  )}
                </div>
              )}

              {/* Category */}
              {deal.category && (
                <div className="flex items-center space-x-2">
                  <i className={`${deal.category.icon} text-brasil-blue`}></i>
                  <span className="text-gray-600">{deal.category.name}</span>
                </div>
              )}

              {/* Pricing */}
              <div className="space-y-2">
                <div className="flex items-center space-x-4">
                  <span className="text-4xl font-bold text-brasil-green">
                    {formatPrice(deal.salePrice)}
                  </span>
                  <span className="text-xl text-gray-500 line-through">
                    {formatPrice(deal.originalPrice)}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge className="bg-red-500 text-white">
                    -{deal.discountPercentage}%
                  </Badge>
                  <span className="text-sm text-gray-600">
                    Economia de {formatPrice(deal.originalPrice - deal.salePrice)}
                  </span>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                <div>
                  <span className="font-medium">⏰ {formatTimeRemaining(deal.expiresAt)}</span>
                </div>
                <div>
                  <span className="font-medium">👥 {deal.usageCount} pessoas usaram</span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex space-x-4">
                <Button 
                  className="flex-1 bg-brasil-green hover:bg-brasil-green text-white font-semibold py-3 text-lg"
                  onClick={() => useDealMutation.mutate()}
                  disabled={useDealMutation.isPending}
                >
                  {useDealMutation.isPending ? "Redirecionando..." : "Ver Oferta"}
                </Button>
                <Button variant="outline" size="icon">
                  <i className="fas fa-heart"></i>
                </Button>
                <Button variant="outline" size="icon">
                  <i className="fas fa-share-alt"></i>
                </Button>
              </div>

              {/* Additional info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold mb-2">ℹ️ Informações Importantes</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Oferta verificada pela nossa equipe</li>
                  <li>• Preços sujeitos a alteração sem aviso prévio</li>
                  <li>• Disponibilidade limitada ao estoque da loja</li>
                  <li>• Clique em "Ver Oferta" para ser redirecionado</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
