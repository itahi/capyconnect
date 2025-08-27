import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Heart, MessageCircle, ThumbsUp, MapPin, Phone, ExternalLink, Share2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Post {
  id: string;
  title: string;
  description: string;
  price?: number | null;
  location: string | null;
  whatsappNumber?: string | null;
  externalLink?: string | null;
  createdAt: string | Date;
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
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isLiked, setIsLiked] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likesCount);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState("");

  // Simplify like system - track state locally and sync with server
  useEffect(() => {
    setLikesCount(post.likesCount);
  }, [post.likesCount]);

  const likeMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", `/api/posts/${post.id}/like`);
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
      return apiRequest("POST", `/api/posts/${post.id}/favorite`);
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

  // Comments functionality
  const { data: comments } = useQuery({
    queryKey: [`/api/posts/${post.id}/comments`],
    enabled: showComments,
  });

  const commentMutation = useMutation({
    mutationFn: async (content: string) => {
      return apiRequest("POST", `/api/posts/${post.id}/comments`, { content });
    },
    onSuccess: () => {
      setNewComment("");
      queryClient.invalidateQueries({ queryKey: [`/api/posts/${post.id}/comments`] });
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      toast({
        title: "Comentário adicionado!",
        description: "Seu comentário foi publicado com sucesso.",
      });
    },
    onError: () => {
      if (!isAuthenticated) {
        toast({
          title: "Login necessário",
          description: "Faça login para comentar",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Erro",
          description: "Não foi possível adicionar o comentário",
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

  const handleComment = () => {
    setShowComments(!showComments);
  };

  const handleSubmitComment = () => {
    if (!isAuthenticated) {
      toast({
        title: "Login necessário",
        description: "Faça login para comentar",
        variant: "destructive",
      });
      return;
    }
    if (newComment.trim()) {
      commentMutation.mutate(newComment.trim());
    }
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

  const formatDate = (dateString: string | Date) => {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
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
      <div className="h-48 relative overflow-hidden">
        {post.imageUrls && post.imageUrls.length > 0 ? (
          <>
            <img
              src={post.imageUrls[0]}
              alt={post.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                // Fallback to category icon if image fails to load
                e.currentTarget.style.display = 'none';
                const fallback = e.currentTarget.nextElementSibling;
                if (fallback) fallback.classList.remove('hidden');
              }}
            />
            <div className="hidden absolute inset-0 bg-gradient-to-br from-primary-yellow/20 to-secondary-yellow/20 flex items-center justify-center">
              <i className={`${post.category.icon} text-4xl text-primary-yellow/60`}></i>
            </div>
            {post.imageUrls.length > 1 && (
              <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded-full">
                +{post.imageUrls.length - 1} fotos
              </div>
            )}
          </>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-primary-yellow/20 to-secondary-yellow/20 flex items-center justify-center">
            <i className={`${post.category.icon} text-4xl text-primary-yellow/60`}></i>
          </div>
        )}
        
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
        {post.location && (
          <div className="flex items-center text-gray-500 text-sm mb-3">
            <MapPin className="h-4 w-4 mr-1" />
            <span>{post.location}</span>
          </div>
        )}

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

            <Button
              variant="ghost"
              size="sm"
              onClick={handleComment}
              className={`flex items-center space-x-1 ${
                showComments ? 'text-blue-600' : 'text-gray-600 hover:text-blue-600'
              }`}
              data-testid={`button-comments-${post.id}`}
            >
              <MessageCircle className="h-4 w-4" />
              <span className="text-sm">{post.commentsCount}</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="text-gray-600 hover:text-gray-800"
              data-testid={`button-share-${post.id}`}
            >
              <Share2 className="h-4 w-4" />
            </Button>
          </div>

          {/* Ver mais button - directs to individual post page */}
          <Link href={`/post/${post.id}`}>
            <Button
              size="sm"
              className="bg-yellow-500 hover:bg-yellow-600 text-white"
              data-testid={`button-view-post-${post.id}`}
            >
              Ver anúncio
            </Button>
          </Link>
        </div>

        {/* Comments Section */}
        {showComments && (
          <div className="border-t border-gray-100 mt-4 pt-4">
            {/* Add Comment Form */}
            {isAuthenticated && (
              <div className="mb-4">
                <Textarea
                  placeholder="Escreva um comentário..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="mb-2"
                  rows={2}
                />
                <Button
                  onClick={handleSubmitComment}
                  disabled={!newComment.trim() || commentMutation.isPending}
                  size="sm"
                  className="bg-primary-yellow hover:bg-secondary-yellow"
                >
                  <Send className="h-4 w-4 mr-1" />
                  {commentMutation.isPending ? "Enviando..." : "Comentar"}
                </Button>
              </div>
            )}

            {/* Comments List */}
            <div className="space-y-3">
              {comments && Array.isArray(comments) && comments.length > 0 ? (
                comments.map((comment: any) => (
                  <div key={comment.id} className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-start space-x-2">
                      <div className="w-6 h-6 bg-primary-yellow/20 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-primary-yellow font-medium text-xs">
                          {comment.user.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="text-sm font-medium text-gray-900">
                            {comment.user.name}
                          </span>
                          <span className="text-xs text-gray-500">
                            {formatDate(comment.createdAt)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700">{comment.content}</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">
                  Ainda não há comentários. Seja o primeiro a comentar!
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}