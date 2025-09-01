import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { ArrowLeft, Heart, MessageCircle, ThumbsUp, MapPin, Phone, ExternalLink, Share2, Send, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import React from "react";

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

export default function PostPage() {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isLiked, setIsLiked] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const { data: post, isLoading } = useQuery<Post>({
    queryKey: [`/api/posts/${id}`],
    enabled: !!id,
  });

  // Check like/favorite status when authenticated
  const { data: likeStatus } = useQuery({
    queryKey: [`/api/posts/${id}/like-status`],
    enabled: !!id && isAuthenticated,
  });

  // Update states when data changes
  React.useEffect(() => {
    if (post) {
      setLikesCount(post.likesCount);
    }
  }, [post]);

  React.useEffect(() => {
    if (likeStatus) {
      setIsLiked(likeStatus.liked);
      setIsFavorited(likeStatus.favorited);
    }
  }, [likeStatus]);

  const { data: comments } = useQuery({
    queryKey: [`/api/posts/${id}/comments`],
    enabled: showComments && !!id,
  });

  const likeMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", `/api/posts/${id}/like`);
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
      }
    },
  });

  const favoriteMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", `/api/posts/${id}/favorite`);
    },
    onSuccess: (data: any) => {
      setIsFavorited(data.favorited);
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
    },
    onError: () => {
      if (!isAuthenticated) {
        toast({
          title: "Login necessário",
          description: "Faça login para favoritar posts",
          variant: "destructive",
        });
      }
    },
  });

  const commentMutation = useMutation({
    mutationFn: async (content: string) => {
      return apiRequest("POST", `/api/posts/${id}/comments`, { content });
    },
    onSuccess: () => {
      setNewComment("");
      queryClient.invalidateQueries({ queryKey: [`/api/posts/${id}/comments`] });
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
      }
    },
  });

  const handleWhatsApp = () => {
    if (post?.whatsappNumber) {
      const message = `Olá! Vi seu anúncio "${post.title}" no CapyConnect e tenho interesse.`;
      const whatsappUrl = `https://wa.me/55${post.whatsappNumber.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');
    }
  };

  const handleExternalLink = () => {
    if (post?.externalLink) {
      let url = post.externalLink;
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
      }
      window.open(url, '_blank');
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
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded mb-4 w-32"></div>
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="h-96 bg-gray-200"></div>
              <div className="p-6">
                <div className="h-8 bg-gray-200 rounded mb-4"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Post não encontrado</h1>
          <Link href="/">
            <Button>Voltar ao início</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Back Button */}
        <Link href="/">
          <Button variant="ghost" className="mb-6 flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Voltar aos anúncios
          </Button>
        </Link>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Image Gallery */}
          {post.imageUrls && post.imageUrls.length > 0 && (
            <div className="relative">
              <div className="h-96 bg-gray-100">
                <img
                  src={post.imageUrls[currentImageIndex]}
                  alt={post.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
              
              {/* Image Navigation */}
              {post.imageUrls.length > 1 && (
                <>
                  <div className="absolute top-1/2 left-4 transform -translate-y-1/2">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="bg-black/50 text-white hover:bg-black/70"
                      onClick={() => setCurrentImageIndex(prev => 
                        prev > 0 ? prev - 1 : post.imageUrls!.length - 1
                      )}
                    >
                      ←
                    </Button>
                  </div>
                  <div className="absolute top-1/2 right-4 transform -translate-y-1/2">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="bg-black/50 text-white hover:bg-black/70"
                      onClick={() => setCurrentImageIndex(prev => 
                        prev < post.imageUrls!.length - 1 ? prev + 1 : 0
                      )}
                    >
                      →
                    </Button>
                  </div>
                  
                  {/* Image Indicators */}
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                    {post.imageUrls.map((_, index) => (
                      <button
                        key={index}
                        className={`w-2 h-2 rounded-full ${
                          index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                        }`}
                        onClick={() => setCurrentImageIndex(index)}
                      />
                    ))}
                  </div>
                  
                  {/* Image Counter */}
                  <div className="absolute top-4 right-4 bg-black/70 text-white text-sm px-3 py-1 rounded-full">
                    {currentImageIndex + 1} / {post.imageUrls.length}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Post Content */}
          <div className="p-6">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">{post.category.icon}</span>
                  <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2 py-1 rounded-full">
                    {post.category.name}
                  </span>
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {post.title}
                </h1>
                {post.price && (
                  <p className="text-3xl font-bold text-green-600 mb-4">
                    {formatPrice(post.price)}
                  </p>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Descrição</h2>
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                {post.description}
              </p>
            </div>

            {/* Location */}
            {post.location && (
              <div className="flex items-center text-gray-600 mb-6">
                <MapPin className="h-5 w-5 mr-2" />
                <span className="text-lg">{post.location}</span>
              </div>
            )}

            {/* User Info */}
            <div className="flex items-center justify-between mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mr-3">
                  {post.user.avatar ? (
                    <img src={post.user.avatar} alt={post.user.name} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <User className="h-6 w-6 text-yellow-600" />
                  )}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{post.user.name}</p>
                  <p className="text-sm text-gray-500">
                    Publicado em {formatDate(post.createdAt)}
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 mb-6">
              {/* WhatsApp Button */}
              {post.whatsappNumber && (
                <Button
                  onClick={handleWhatsApp}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white flex items-center justify-center gap-2"
                  data-testid="button-whatsapp"
                >
                  <Phone className="h-5 w-5" />
                  Entrar em contato
                </Button>
              )}
              
              {/* External Link Button */}
              {post.externalLink && (
                <Button
                  onClick={handleExternalLink}
                  variant="outline"
                  className="flex-1 flex items-center justify-center gap-2 border-yellow-500 text-yellow-600 hover:bg-yellow-500 hover:text-white"
                  data-testid="button-visit"
                >
                  <ExternalLink className="h-5 w-5" />
                  Ir para página
                </Button>
              )}
            </div>

            {/* Social Actions */}
            <div className="flex items-center justify-between py-4 border-t border-gray-200">
              <div className="flex items-center space-x-6">
                <Button
                  variant="ghost"
                  size="sm"
                  className={`flex items-center space-x-2 ${
                    isLiked ? 'text-blue-600' : 'text-gray-600 hover:text-blue-600'
                  }`}
                  onClick={() => {
                    if (!isAuthenticated) {
                      toast({
                        title: "Login necessário",
                        description: "Faça login para curtir posts",
                        variant: "destructive",
                      });
                      return;
                    }
                    likeMutation.mutate();
                  }}
                  disabled={likeMutation.isPending}
                  data-testid={`button-like-${post.id}`}
                >
                  <ThumbsUp className={`h-5 w-5 ${isLiked ? 'fill-current' : ''}`} />
                  <span>{likesCount}</span>
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  className="flex items-center space-x-2 text-gray-600 hover:text-gray-800"
                  onClick={() => setShowComments(!showComments)}
                  data-testid={`button-comments-${post.id}`}
                >
                  <MessageCircle className="h-5 w-5" />
                  <span>{post.commentsCount}</span>
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  className={`flex items-center space-x-2 ${
                    isFavorited ? 'text-red-600' : 'text-gray-600 hover:text-red-600'
                  }`}
                  onClick={() => {
                    if (!isAuthenticated) {
                      toast({
                        title: "Login necessário",
                        description: "Faça login para favoritar posts",
                        variant: "destructive",
                      });
                      return;
                    }
                    favoriteMutation.mutate();
                  }}
                  disabled={favoriteMutation.isPending}
                  data-testid={`button-favorite-${post.id}`}
                >
                  <Heart className={`h-5 w-5 ${isFavorited ? 'fill-current' : ''}`} />
                </Button>
              </div>

              <Button
                variant="ghost"
                size="sm"
                className="text-gray-600 hover:text-gray-800"
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: post.title,
                      text: post.description,
                      url: window.location.href,
                    });
                  } else {
                    navigator.clipboard.writeText(window.location.href);
                    toast({
                      title: "Link copiado!",
                      description: "O link foi copiado para sua área de transferência.",
                    });
                  }
                }}
                data-testid={`button-share-${post.id}`}
              >
                <Share2 className="h-5 w-5" />
              </Button>
            </div>

            {/* Comments Section */}
            {showComments && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Comentários ({post.commentsCount})
                </h3>

                {/* Add Comment */}
                {isAuthenticated && (
                  <div className="mb-6">
                    <Textarea
                      placeholder="Escreva um comentário..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      className="mb-3"
                      data-testid="textarea-comment"
                    />
                    <Button
                      onClick={() => {
                        if (newComment.trim()) {
                          commentMutation.mutate(newComment.trim());
                        }
                      }}
                      disabled={!newComment.trim() || commentMutation.isPending}
                      className="bg-yellow-500 hover:bg-yellow-600 text-white"
                      data-testid="button-submit-comment"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      {commentMutation.isPending ? "Enviando..." : "Comentar"}
                    </Button>
                  </div>
                )}

                {/* Comments List */}
                <div className="space-y-4">
                  {comments?.map((comment: any) => (
                    <div key={comment.id} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                          <span className="text-yellow-600 font-medium text-sm">
                            {comment.user.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="font-medium text-gray-900">{comment.user.name}</span>
                            <span className="text-xs text-gray-500">
                              {new Date(comment.createdAt).toLocaleDateString('pt-BR')}
                            </span>
                          </div>
                          <p className="text-gray-700">{comment.content}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}