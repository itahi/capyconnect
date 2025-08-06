import type { DealWithRelations } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface DealCardProps {
  deal: DealWithRelations;
}

export default function DealCard({ deal }: DealCardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const useDealMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/deals/${deal.id}/use`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/deals"] });
      toast({
        title: "Redirecionando...",
        description: "Você será redirecionado para a loja em instantes.",
      });
      window.open(deal.dealUrl, '_blank');
    },
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price / 100);
  };

  const formatTimeRemaining = (expiresAt: string | null) => {
    if (!expiresAt) return "Sem expiração";
    
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diffMs = expiry.getTime() - now.getTime();
    
    if (diffMs <= 0) return "Expirado";
    
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffDays > 0) {
      return `Expira em ${diffDays} dia${diffDays > 1 ? 's' : ''}`;
    } else {
      const remainingHours = diffHours % 24;
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      return `Expira em ${remainingHours}h ${minutes}m`;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-shadow border border-gray-100 relative overflow-hidden">
      <div className="absolute top-3 left-3 z-10">
        <Badge className={`${deal.isHot ? 'bg-red-500' : 'bg-orange-500'} text-white font-semibold`}>
          -{deal.discountPercentage}%
        </Badge>
      </div>
      <div className="absolute top-3 right-3 z-10">
        <Button variant="ghost" size="icon" className="bg-white/80 backdrop-blur-sm rounded-full hover:bg-white">
          <i className="fas fa-heart text-gray-400 hover:text-red-500"></i>
        </Button>
      </div>
      
      <Link href={`/oferta/${deal.id}`}>
        <img 
          src={deal.imageUrl} 
          alt={deal.title} 
          className="w-full h-48 object-cover cursor-pointer"
        />
      </Link>
      
      <div className="p-4">
        <div className="flex items-center space-x-2 mb-2">
          {deal.store?.logoUrl && (
            <img 
              src={deal.store.logoUrl} 
              alt={deal.store.name} 
              className="h-4 w-auto"
            />
          )}
          {deal.isVerified && (
            <Badge variant="outline" className="text-green-600 border-green-600 text-xs">
              Verificado
            </Badge>
          )}
        </div>
        
        <Link href={`/oferta/${deal.id}`}>
          <h3 className="font-semibold text-gray-800 mb-2 hover:text-brasil-blue cursor-pointer">
            {deal.title}
          </h3>
        </Link>
        
        <div className="flex items-center space-x-2 mb-3">
          <span className="text-2xl font-bold text-brasil-green">
            {formatPrice(deal.salePrice)}
          </span>
          <span className="text-gray-500 line-through">
            {formatPrice(deal.originalPrice)}
          </span>
        </div>
        
        <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
          <span>⏰ {formatTimeRemaining(deal.expiresAt)}</span>
          <span>👥 {deal.usageCount} usaram</span>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button 
            className="flex-1 bg-brasil-green text-white hover:bg-brasil-green font-medium"
            onClick={() => useDealMutation.mutate()}
            disabled={useDealMutation.isPending}
          >
            {useDealMutation.isPending ? "..." : "Ver Oferta"}
          </Button>
          <Button variant="outline" size="icon">
            <i className="fas fa-share-alt text-gray-600"></i>
          </Button>
        </div>
      </div>
    </div>
  );
}
