import type { PostWithRelations } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface PostCardProps {
  post: PostWithRelations;
}

export default function PostCard({ post }: PostCardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const contactPostMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/posts/${post.id}/contact`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      if (post.whatsappNumber) {
        const whatsappUrl = `https://wa.me/55${post.whatsappNumber.replace(/\D/g, '')}`;
        window.open(whatsappUrl, '_blank');
      } else if (post.externalLink) {
        window.open(post.externalLink, '_blank');
      }
      toast({
        title: "Redirecionando...",
        description: "Você será redirecionado para entrar em contato.",
      });
    },
  });

  const formatPrice = (price: number | null) => {
    if (!price) return null;
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price / 100);
  };

  const formatTimeAgo = (createdAt: Date | string) => {
    const now = new Date();
    const created = new Date(createdAt);
    const diffMs = now.getTime() - created.getTime();
    
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      if (diffHours === 0) {
        const diffMinutes = Math.floor(diffMs / (1000 * 60));
        return `${diffMinutes}min`;
      }
      return `${diffHours}h`;
    }
    
    return `${diffDays}d`;
  };

  const getTypeIcon = (type?: string) => {
    switch (type) {
      case 'service': return '🔧';
      case 'product': return '📦';
      case 'job': return '💼';
      case 'news': return '📰';
      default: return '📋';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-shadow border border-gray-100 relative overflow-hidden">
      <div className="absolute top-3 left-3 z-10">
        <Badge className={`${post.isFeatured ? 'bg-accent-purple' : 'bg-primary-purple'} text-white font-semibold`}>
          {post.isFeatured ? '⭐ Destaque' : getTypeIcon(post.category?.type)}
        </Badge>
      </div>
      <div className="absolute top-3 right-3 z-10">
        <Button variant="ghost" size="icon" className="bg-white/80 backdrop-blur-sm rounded-full hover:bg-white">
          <i className="fas fa-heart text-gray-400 hover:text-red-500"></i>
        </Button>
      </div>
      
      <Link href={`/post/${post.id}`}>
        {post.imageUrl ? (
          <img 
            src={post.imageUrl} 
            alt={post.title} 
            className="w-full h-48 object-cover cursor-pointer"
          />
        ) : (
          <div className="w-full h-48 bg-gray-200 flex items-center justify-center cursor-pointer">
            <i className="fas fa-image text-gray-400 text-4xl"></i>
          </div>
        )}
      </Link>
      
      <div className="p-4">
        <div className="flex items-center space-x-2 mb-2">
          {post.user && (
            <div className="flex items-center space-x-2">
              <div className="bg-primary-purple text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-semibold">
                {post.user.name.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm text-gray-600">{post.user.name}</span>
              {post.user.isVerified && (
                <Badge variant="outline" className="text-green-600 border-green-600 text-xs">
                  ✓
                </Badge>
              )}
            </div>
          )}
        </div>
        
        <Link href={`/post/${post.id}`}>
          <h3 className="font-semibold text-gray-800 mb-2 hover:text-primary-purple cursor-pointer line-clamp-2">
            {post.title}
          </h3>
        </Link>
        
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
          {post.description}
        </p>

        {post.price && (
          <div className="flex items-center space-x-2 mb-3">
            <span className="text-2xl font-bold text-primary-purple">
              {formatPrice(post.price)}
            </span>
          </div>
        )}
        
        <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
          <div className="flex items-center space-x-3">
            <span>👀 {post.viewCount}</span>
            <span>📱 {post.contactCount}</span>
          </div>
          <span>{formatTimeAgo(post.createdAt)}</span>
        </div>

        {post.location && (
          <div className="flex items-center space-x-1 mb-3">
            <i className="fas fa-map-marker-alt text-red-500 text-xs"></i>
            <span className="text-xs text-gray-600">{post.location}</span>
          </div>
        )}
        
        <div className="flex items-center space-x-2">
          <Button 
            className="flex-1 bg-primary-purple text-white hover:bg-primary-purple font-medium"
            onClick={() => contactPostMutation.mutate()}
            disabled={contactPostMutation.isPending}
            size="sm"
          >
            {contactPostMutation.isPending ? "..." : 
             post.whatsappNumber ? "💬 WhatsApp" : 
             post.externalLink ? "🔗 Link" : "Contatar"}
          </Button>
          <Button variant="outline" size="icon">
            <i className="fas fa-share-alt text-gray-600"></i>
          </Button>
        </div>
      </div>
    </div>
  );
}