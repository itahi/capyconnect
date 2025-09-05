import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Heart, MessageCircle, Eye, MapPin, Phone, ExternalLink, ThumbsUp, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface PostCardProps {
  post: {
    id: string;
    title: string;
    description: string;
    price?: number | null;
    location: string | null;
    imageUrls?: string[] | null;
    whatsappNumber?: string | null;
    externalLink?: string | null;
    viewCount: number;
    likesCount: number;
    commentsCount: number;
    createdAt: string;
    isFeatured?: boolean;
    category: {
      id: string;
      name: string;
      icon: string;
      type: string;
    };
    user: {
      id: string;
      name: string;
      avatar?: string | null;
    };
  };
}

export function PostCard({ post }: PostCardProps) {
  const { isAuthenticated, user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [localLiked, setLocalLiked] = useState(false);
  const [localFavorited, setLocalFavorited] = useState(false);
  const [localLikesCount, setLocalLikesCount] = useState(post.likesCount);

  // Get like/favorite status
  const { data: likeStatus } = useQuery<{liked: boolean; favorited: boolean}>({
    queryKey: [`/api/posts/${post.id}/like-status`],
    enabled: isAuthenticated,
  });

  useEffect(() => {
    if (likeStatus) {
      setLocalLiked(likeStatus.liked);
      setLocalFavorited(likeStatus.favorited);
    }
  }, [likeStatus]);

  const likeMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", `/api/posts/${post.id}/like`);
    },
    onMutate: async () => {
      // Optimistic update
      const newLiked = !localLiked;
      setLocalLiked(newLiked);
      setLocalLikesCount(prev => newLiked ? prev + 1 : prev - 1);
      return { previousLiked: localLiked, previousCount: localLikesCount };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context) {
        setLocalLiked(context.previousLiked);
        setLocalLikesCount(context.previousCount);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/posts/${post.id}/like-status`] });
    },
  });

  const favoriteMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", `/api/posts/${post.id}/favorite`);
    },
    onMutate: async () => {
      // Optimistic update
      setLocalFavorited(!localFavorited);
      return { previousFavorited: localFavorited };
    },
    onSuccess: async (response) => {
      // Parse response to get data
      const data = await response.json();
      
      // Show success notification
      if (data.favorited) {
        toast({
          title: "Favorito adicionado!",
          description: `O anúncio "${post.title}" foi adicionado aos seus favoritos.`,
          duration: 3000,
        });
      } else {
        toast({
          title: "Favorito removido",
          description: `O anúncio "${post.title}" foi removido dos seus favoritos.`,
          duration: 3000,
        });
      }
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context) {
        setLocalFavorited(context.previousFavorited);
      }
      toast({
        title: "Erro",
        description: "Não foi possível atualizar seus favoritos. Tente novamente.",
        variant: "destructive",
        duration: 3000,
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/posts/${post.id}/like-status`] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/favorites"] });
    },
  });

  const handleLike = () => {
    if (!isAuthenticated) return;
    likeMutation.mutate();
  };

  const handleFavorite = () => {
    if (!isAuthenticated) return;
    favoriteMutation.mutate();
  };

  const handleContact = async (type: 'whatsapp' | 'external') => {
    try {
      await apiRequest("POST", `/api/posts/${post.id}/contact`);
      
      if (type === 'whatsapp' && post.whatsappNumber) {
        const message = encodeURIComponent(`Olá! Vi seu anúncio "${post.title}" no CapyConnect e gostaria de mais informações.`);
        const whatsappUrl = `https://wa.me/55${post.whatsappNumber.replace(/\D/g, '')}?text=${message}`;
        window.open(whatsappUrl, '_blank');
      } else if (type === 'external' && post.externalLink) {
        window.open(post.externalLink, '_blank');
      }
    } catch (error) {
      console.error('Error tracking contact:', error);
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
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return 'Hoje';
    if (diffDays === 2) return 'Ontem';
    if (diffDays <= 7) return `${diffDays} dias atrás`;
    
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-200 group">
      <div className="relative">
        {/* Featured Badge */}
        {post.isFeatured && (
          <Badge className="absolute top-2 left-2 z-10 bg-yellow-500 text-white text-xs">
            <Zap className="h-3 w-3 mr-1" />
            <span className="hidden sm:inline">Impulsionado</span>
            <span className="sm:hidden">⚡</span>
          </Badge>
        )}

        {/* Image */}
        <Link href={`/post/${post.id}`} className="block">
          <div className="aspect-video sm:aspect-[4/3] bg-gray-200 overflow-hidden">
            {post.imageUrls && post.imageUrls[0] ? (
              <img
                src={post.imageUrls[0]}
                alt={post.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                onError={(e) => {
                  console.error("Erro ao carregar imagem:", post.imageUrls![0]);
                  e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjE4MCIgdmlld0JveD0iMCAwIDMyMCAxODAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMjAiIGhlaWdodD0iMTgwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xNDQgOTBMMTI4IDc0TDEwNCA5OEw4OCA4MkwxMjggMTIyTDE0NCA5MFoiIGZpbGw9IiNEMUQ1REIiLz4KPHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjE4MCIgdmlld0JveD0iMCAwIDMyMCAxODAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMjAiIGhlaWdodD0iMTgwIiBmaWxsPSIjRjNGNEY2Ii8+Cjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0iY2VudHJhbCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iIzlCA0E3QkEiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZm9udC13ZWlnaHQ9IjUwMCI+SW1hZ2VtIG7Do28gZGlzcG9uw612ZWw8L3RleHQ+Cjwvc3ZnPgo=';
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-100">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-2xl">{post.category.icon}</span>
                  </div>
                  <p className="text-sm text-gray-500">Sem imagem</p>
                </div>
              </div>
            )}
          </div>
        </Link>
      </div>

      <CardContent className="p-3 sm:p-4">
        {/* Category Badge */}
        <div className="flex items-center justify-between mb-3">
          <Badge variant="outline" className="text-xs">
            <span className="mr-1">{post.category.icon}</span>
            {post.category.name}
          </Badge>
          <span className="text-xs text-gray-500">{formatDate(post.createdAt)}</span>
        </div>

        {/* Title and Description */}
        <Link href={`/post/${post.id}`} className="block mb-3">
          <h3 className="font-semibold text-base sm:text-lg line-clamp-2 group-hover:text-primary-yellow transition-colors">
            {post.title}
          </h3>
          <p className="text-gray-600 text-xs sm:text-sm line-clamp-2 mt-1">
            {post.description}
          </p>
        </Link>

        {/* Price */}
        {post.price && (
          <div className="mb-3">
            <span className="text-xl sm:text-2xl font-bold text-green-600">
              {formatPrice(post.price)}
            </span>
          </div>
        )}

        {/* Location */}
        {post.location && (
          <div className="flex items-center text-sm text-gray-500 mb-3">
            <MapPin className="h-4 w-4 mr-1" />
            <span>{post.location}</span>
          </div>
        )}

        {/* User */}
        <div className="flex items-center mb-4">
          <div className="w-6 h-6 bg-primary-yellow rounded-full flex items-center justify-center text-xs font-medium text-white mr-2">
            {post.user.name.charAt(0).toUpperCase()}
          </div>
          <span className="text-sm text-gray-600">{post.user.name}</span>
        </div>

        {/* Actions */}
        <div className="space-y-2">
          {/* Contact Buttons */}
          <div className="flex flex-col sm:flex-row gap-2">
            {post.whatsappNumber && (
              <Button
                size="sm"
                className="flex-1 bg-green-500 hover:bg-green-600 text-white text-xs sm:text-sm"
                onClick={() => handleContact('whatsapp')}
              >
                <Phone className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                WhatsApp
              </Button>
            )}
            {post.externalLink && (
              <Button
                size="sm"
                variant="outline"
                className="flex-1 text-xs sm:text-sm"
                onClick={() => handleContact('external')}
              >
                <ExternalLink className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                Site
              </Button>
            )}
            {/* If user owns this post, show boost button */}
            {user && user.id === post.user.id && (
              <Link href={`/post/${post.id}/impulsionar`}>
                <Button
                  size="sm"
                  className="bg-yellow-500 hover:bg-yellow-600 text-white text-xs sm:text-sm"
                >
                  <Zap className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                  <span className="hidden sm:inline">Impulsionar</span>
                  <span className="sm:hidden">⚡</span>
                </Button>
              </Link>
            )}
          </div>

          {/* Stats and Actions */}
          <div className="flex items-center justify-between pt-2 border-t">
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                {post.viewCount}
              </span>
              <span className="flex items-center gap-1">
                <MessageCircle className="h-4 w-4" />
                {post.commentsCount}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={handleLike}
                disabled={!isAuthenticated}
                className={`flex items-center gap-1 transition-colors ${
                  localLiked 
                    ? 'text-blue-600 bg-blue-50 hover:bg-blue-100' 
                    : 'text-gray-500 hover:text-blue-600 hover:bg-blue-50'
                }`}
              >
                <ThumbsUp className={`h-4 w-4 ${localLiked ? 'fill-current' : ''}`} />
                <span className="text-sm">{localLikesCount}</span>
              </Button>
              
              <Button
                size="sm"
                variant="ghost"
                onClick={handleFavorite}
                disabled={!isAuthenticated}
                className={`flex items-center gap-1 transition-colors ${
                  localFavorited 
                    ? 'text-red-600 bg-red-50 hover:bg-red-100' 
                    : 'text-gray-500 hover:text-red-600 hover:bg-red-50'
                }`}
              >
                <Heart className={`h-4 w-4 ${localFavorited ? 'fill-current' : ''}`} />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}