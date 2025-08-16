import { useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import type { PostWithRelations } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import Header from "@/components/header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

export default function Post() {
  const { id } = useParams();
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: post, isLoading } = useQuery<PostWithRelations>({
    queryKey: ["/api/posts", id],
    enabled: !!id,
  });

  const viewPostMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/posts/${id}/view`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts", id] });
    },
  });

  const contactPostMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/posts/${id}/contact`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts", id] });
      if (post?.whatsappNumber) {
        const whatsappUrl = `https://wa.me/55${post.whatsappNumber.replace(/\D/g, '')}`;
        window.open(whatsappUrl, '_blank');
      } else if (post?.externalLink) {
        window.open(post.externalLink, '_blank');
      }
      toast({
        title: "Redirecionando...",
        description: "Você será redirecionado para entrar em contato.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível processar a solicitação. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  // Increment view count when post loads
  useEffect(() => {
    if (post && !viewPostMutation.isPending) {
      viewPostMutation.mutate();
    }
  }, [post, viewPostMutation]);

  const formatPrice = (price: number | null) => {
    if (!price) return null;
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price / 100);
  };

  const formatTimeAgo = (createdAt: string) => {
    const now = new Date();
    const created = new Date(createdAt);
    const diffMs = now.getTime() - created.getTime();
    
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      if (diffHours === 0) {
        const diffMinutes = Math.floor(diffMs / (1000 * 60));
        return `${diffMinutes} minuto${diffMinutes !== 1 ? 's' : ''} atrás`;
      }
      return `${diffHours} hora${diffHours !== 1 ? 's' : ''} atrás`;
    }
    
    return `${diffDays} dia${diffDays !== 1 ? 's' : ''} atrás`;
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

  if (!post) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header searchQuery={searchQuery} onSearchChange={setSearchQuery} />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">Post não encontrado</h1>
            <p className="text-gray-600">O post que você procura não existe ou foi removido.</p>
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
              {post.imageUrl ? (
                <img 
                  src={post.imageUrl} 
                  alt={post.title}
                  className="w-full h-96 object-cover rounded-lg"
                />
              ) : (
                <div className="w-full h-96 bg-gray-200 rounded-lg flex items-center justify-center">
                  <i className="fas fa-image text-gray-400 text-6xl"></i>
                </div>
              )}
              {post.isFeatured && (
                <Badge className="absolute top-4 left-4 bg-primary-purple text-white">
                  ⭐ Destaque
                </Badge>
              )}
            </div>

            {/* Details */}
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-800 mb-2">{post.title}</h1>
                <p className="text-gray-600">{post.description}</p>
              </div>

              {/* User info */}
              {post.user && (
                <div className="flex items-center space-x-3">
                  <div className="bg-primary-purple text-white rounded-full w-10 h-10 flex items-center justify-center font-semibold">
                    {post.user.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <span className="font-medium text-gray-800">{post.user.name}</span>
                    {post.user.isVerified && (
                      <Badge variant="outline" className="ml-2 text-green-600 border-green-600 text-xs">
                        Verificado
                      </Badge>
                    )}
                    <p className="text-sm text-gray-500">{post.location}</p>
                  </div>
                </div>
              )}

              {/* Category */}
              {post.category && (
                <div className="flex items-center space-x-2">
                  <i className={`${post.category.icon} text-primary-purple`}></i>
                  <span className="text-gray-600">{post.category.name}</span>
                  <Badge variant="outline" className="text-xs">
                    {post.category.type === 'service' && 'Serviço'}
                    {post.category.type === 'product' && 'Produto'}
                    {post.category.type === 'job' && 'Vaga'}
                    {post.category.type === 'news' && 'Notícia'}
                  </Badge>
                </div>
              )}

              {/* Pricing (if applicable) */}
              {post.price && (
                <div className="space-y-2">
                  <div className="flex items-center space-x-4">
                    <span className="text-4xl font-bold text-primary-purple">
                      {formatPrice(post.price)}
                    </span>
                  </div>
                </div>
              )}

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                <div>
                  <span className="font-medium">👀 {post.viewCount} visualizações</span>
                </div>
                <div>
                  <span className="font-medium">📱 {post.contactCount} contatos</span>
                </div>
                <div>
                  <span className="font-medium">📅 {formatTimeAgo(post.createdAt.toString())}</span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex space-x-4">
                <Button 
                  className="flex-1 bg-primary-purple hover:bg-primary-purple text-white font-semibold py-3 text-lg"
                  onClick={() => contactPostMutation.mutate()}
                  disabled={contactPostMutation.isPending}
                >
                  {contactPostMutation.isPending ? "Redirecionando..." : 
                   post.whatsappNumber ? "💬 WhatsApp" : 
                   post.externalLink ? "🔗 Ver Link" : "Entrar em Contato"}
                </Button>
                <Button variant="outline" size="icon">
                  <i className="fas fa-heart"></i>
                </Button>
                <Button variant="outline" size="icon">
                  <i className="fas fa-share-alt"></i>
                </Button>
              </div>

              {/* Contact info */}
              <div className="bg-light-purple rounded-lg p-4">
                <h3 className="font-semibold mb-2">📞 Informações de Contato</h3>
                <div className="space-y-2 text-sm">
                  {post.whatsappNumber && (
                    <p className="flex items-center space-x-2">
                      <i className="fab fa-whatsapp text-green-500"></i>
                      <span>WhatsApp: {post.whatsappNumber}</span>
                    </p>
                  )}
                  {post.externalLink && (
                    <p className="flex items-center space-x-2">
                      <i className="fas fa-external-link-alt text-primary-purple"></i>
                      <span>Link externo disponível</span>
                    </p>
                  )}
                  {post.location && (
                    <p className="flex items-center space-x-2">
                      <i className="fas fa-map-marker-alt text-red-500"></i>
                      <span>{post.location}</span>
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}