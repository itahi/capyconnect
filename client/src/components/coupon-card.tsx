import type { CouponWithStore } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface CouponCardProps {
  coupon: CouponWithStore;
}

export default function CouponCard({ coupon }: CouponCardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const useCouponMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/coupons/${coupon.id}/use`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/coupons"] });
      navigator.clipboard.writeText(coupon.code);
      toast({
        title: "Código copiado!",
        description: `O código ${coupon.code} foi copiado para sua área de transferência.`,
      });
    },
  });

  const formatTimeRemaining = (expiresAt: string | null) => {
    if (!expiresAt) return "Sem expiração";
    
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diffMs = expiry.getTime() - now.getTime();
    
    if (diffMs <= 0) return "Expirado";
    
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays > 0) {
      return `${diffDays} dia${diffDays > 1 ? 's' : ''}`;
    } else {
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      return `${diffHours}h`;
    }
  };

  const formatDiscount = () => {
    if (coupon.discountType === 'percentage') {
      return `${coupon.discountValue}% OFF`;
    } else {
      return `R$ ${(coupon.discountValue / 100).toFixed(0)} OFF`;
    }
  };

  const formatMinPurchase = () => {
    if (!coupon.minPurchase) return "";
    return `Em compras acima de R$ ${(coupon.minPurchase / 100).toFixed(0)}`;
  };

  const getGradientClass = () => {
    const gradients = [
      "from-purple-500 to-pink-500",
      "from-green-500 to-teal-500",
      "from-blue-500 to-indigo-500",
      "from-orange-500 to-red-500",
    ];
    
    // Simple hash to consistently assign colors based on coupon ID
    const hash = coupon.id.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    
    return gradients[Math.abs(hash) % gradients.length];
  };

  return (
    <div className={`bg-gradient-to-r ${getGradientClass()} rounded-xl p-6 text-white relative overflow-hidden`}>
      <div className="absolute top-2 right-2">
        {coupon.store && (
          <Badge className="bg-white/20 text-white text-xs">
            {coupon.store.name}
          </Badge>
        )}
      </div>
      
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-xl mb-2">{formatDiscount()}</h3>
          <p className="text-sm opacity-90 mb-3">{formatMinPurchase()}</p>
          <div className="bg-white/20 backdrop-blur-sm rounded-lg px-3 py-2 inline-block">
            <span className="font-mono font-bold">{coupon.code}</span>
          </div>
        </div>
        
        <div className="text-right">
          <p className="text-sm opacity-75">Expira em</p>
          <p className="font-semibold">{formatTimeRemaining(coupon.expiresAt)}</p>
          <Button 
            className="mt-3 bg-white text-gray-800 hover:bg-gray-100 font-medium text-sm"
            onClick={() => useCouponMutation.mutate()}
            disabled={useCouponMutation.isPending}
          >
            {useCouponMutation.isPending ? "Copiando..." : "Copiar Código"}
          </Button>
        </div>
      </div>
      
      <div className="mt-4 text-xs opacity-75">
        👥 {coupon.usageCount} pessoas usaram este cupom
      </div>
    </div>
  );
}
