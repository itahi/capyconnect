import { useState } from "react";
import { Link } from "wouter";
import { Heart, MessageCircle, ThumbsUp, MapPin, Phone, ExternalLink, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Post {
  id: string;
  title: string;
  description: string;
  price?: number | null;
  location: string;
  whatsappNumber?: string | null;
  externalLink?: string | null;
  createdAt: string;
  likesCount: number;
  commentsCount: number;
  imageUrls?: string[] | null;
  user: {
    id: string;
    name: string;
    avatar?: string | null;
  };
  category: {
    id: string;
    name: string;
    icon: string;
  };
}

interface PostCardProps {
  post: Post;
}

export function PostCard({ post }: PostCardProps) {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isLiked, setIsLiked] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likesCount);

  const likeMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest(`/api/posts/${post.id}/like`, {
        method: "POST",
      });
      return response;
    },
    onSuccess: (data: any) => {
      setIsLiked(data.liked);
      setLikesCount(data.likesCount);
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
    },
    onError: () => {
      if (!isAuthenticated) {
        toast({
          title: "Login necessário",
          description: "Faça login para curtir posts",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Erro",
          description: "Não foi possível curtir o post",
          variant: "destructive",
        });
      }
    },
  });

  const favoriteMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest(`/api/posts/${post.id}/favorite`, {
        method: "POST",
      });
      return response;
    },
    onSuccess: (data: any) => {
      setIsFavorited(data.favorited);
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      toast({
        title: data.favorited ? "Adicionado aos favoritos!" : "Removido dos favoritos",
        description: data.favorited ? "Post salvo na sua lista de favoritos" : "Post removido dos favoritos",
      });
    },
    onError: () => {
      if (!isAuthenticated) {
        toast({
          title: "Login necessário",
          description: "Faça login para favoritar posts",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Erro",
          description: "Não foi possível favoritar o post",
          variant: "destructive",
        });
      }
    },
  });

  const handleLike = () => {
    if (!isAuthenticated) {
      toast({
        title: "Login necessário",
        description: "Faça login para curtir posts",
        variant: "destructive",
      });
      return;
    }
    likeMutation.mutate();
  };

  const handleFavorite = () => {
    if (!isAuthenticated) {
      toast({
        title: "Login necessário",
        description: "Faça login para favoritar posts",
        variant: "destructive",
      });
      return;
    }
    favoriteMutation.mutate();
  };

  const handleWhatsApp = () => {
    if (post.whatsappNumber) {
      const message = `Olá! Vi seu anúncio "${post.title}" no CapyConnect e tenho interesse.`;
      const whatsappUrl = `https://wa.me/55${post.whatsappNumber.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price / 100);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Agora há pouco';
    if (diffInHours < 24) return `${diffInHours}h atrás`;
    if (diffInHours < 48) return 'Ontem';
    
    return date.toLocaleDateString('pt-BR');
  };

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden">
      {/* Post Image */}
      <div className="h-48 bg-gradient-to-br from-primary-yellow/20 to-secondary-yellow/20 relative">
        <div className="absolute inset-0 flex items-center justify-center">
          <i className={`${post.category.icon} text-4xl text-primary-yellow/60`}></i>
        </div>
        
        {/* Favorite Button */}
        <Button
          variant="ghost"
          size="sm"
          className={`absolute top-2 right-2 h-8 w-8 rounded-full ${
            isFavorited 
              ? 'bg-red-100 text-red-600 hover:bg-red-200' 
              : 'bg-white/80 text-gray-600 hover:bg-white'
          }`}
          onClick={handleFavorite}
          disabled={favoriteMutation.isPending}
          data-testid={`button-favorite-${post.id}`}
        >
          <Heart className={`h-4 w-4 ${isFavorited ? 'fill-current' : ''}`} />
        </Button>

        {/* Category Badge */}
        <div className="absolute bottom-2 left-2 bg-primary-yellow text-white px-2 py-1 rounded-full text-xs font-medium">
          {post.category.name}
        </div>
      </div>

      {/* Post Content */}
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <Link href={`/post/${post.id}`}>
              <h3 className="font-semibold text-gray-900 hover:text-primary-yellow cursor-pointer line-clamp-2 mb-1">
                {post.title}
              </h3>
            </Link>
            {post.price && (
              <p className="text-2xl font-bold text-primary-yellow">
                {formatPrice(post.price)}
              </p>
            )}
          </div>
        </div>

        {/* Description */}
        <p className="text-gray-600 text-sm mb-3 line-clamp-3">
          {post.description}
        </p>

        {/* Location */}
        <div className="flex items-center text-gray-500 text-sm mb-3">
          <MapPin className="h-4 w-4 mr-1" />
          <span>{post.location}</span>
        </div>

        {/* User Info */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-primary-yellow/20 rounded-full flex items-center justify-center mr-2">
              <span className="text-primary-yellow font-medium text-sm">
                {post.user.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">{post.user.name}</p>
              <p className="text-xs text-gray-500">{formatDate(post.createdAt)}</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          {/* Social Actions */}
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              className={`flex items-center space-x-1 ${
                isLiked ? 'text-blue-600' : 'text-gray-600 hover:text-blue-600'
              }`}
              onClick={handleLike}
              disabled={likeMutation.isPending}
              data-testid={`button-like-${post.id}`}
            >
              <ThumbsUp className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
              <span className="text-sm">{likesCount}</span>
            </Button>

            <Link href={`/post/${post.id}#comments`}>
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center space-x-1 text-gray-600 hover:text-green-600"
                data-testid={`button-comments-${post.id}`}
              >
                <MessageCircle className="h-4 w-4" />
                <span className="text-sm">{post.commentsCount}</span>
              </Button>
            </Link>

            <Button
              variant="ghost"
              size="sm"
              className="text-gray-600 hover:text-gray-800"
              data-testid={`button-share-${post.id}`}
            >
              <Share2 className="h-4 w-4" />
            </Button>
          </div>

          {/* Contact Actions */}
          <div className="flex items-center space-x-2">
            {post.whatsappNumber && (
              <Button
                size="sm"
                className="bg-green-600 hover:bg-green-700 text-white flex items-center space-x-1"
                onClick={handleWhatsApp}
                data-testid={`button-whatsapp-${post.id}`}
              >
                <Phone className="h-4 w-4" />
                <span className="hidden sm:inline">WhatsApp</span>
              </Button>
            )}

            {post.externalLink && (
              <Button
                size="sm"
                variant="outline"
                className="border-primary-yellow text-primary-yellow hover:bg-primary-yellow hover:text-white flex items-center space-x-1"
                onClick={() => window.open(post.externalLink, '_blank')}
                data-testid={`button-external-${post.id}`}
              >
                <ExternalLink className="h-4 w-4" />
                <span className="hidden sm:inline">Ver mais</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}