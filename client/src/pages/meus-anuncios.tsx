import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Edit, Trash2, Eye, Heart, MessageCircle, Plus, Search, Zap } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface UserPost {
  id: string;
  title: string;
  description: string;
  price?: number | null;
  location: string;
  whatsappNumber?: string | null;
  externalLink?: string | null;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  isFeatured: boolean;
  viewCount: number;
  contactCount: number;
  likesCount: number;
  commentsCount: number;
  imageUrls?: string[] | null;
  category: {
    id: string;
    name: string;
    icon: string;
    type: string;
  };
}

export default function MeusAnuncios() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: userPosts, isLoading } = useQuery<UserPost[]>({
    queryKey: ["/api/user/posts"],
    enabled: isAuthenticated,
  });

  const { data: userFavorites, isLoading: favoritesLoading } = useQuery<UserPost[]>({
    queryKey: ["/api/user/favorites"], 
    enabled: isAuthenticated,
  });

  const deletePostMutation = useMutation({
    mutationFn: async (postId: string) => {
      return apiRequest("DELETE", `/api/posts/${postId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/posts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      toast({
        title: "Anúncio excluído",
        description: "Seu anúncio foi removido com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível excluir o anúncio.",
        variant: "destructive",
      });
    },
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price / 100);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const filteredPosts = userPosts?.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         post.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === "all" || post.category.type === activeTab;
    return matchesSearch && matchesTab;
  }) || [];

  const filteredFavorites = userFavorites?.filter(post => {
    return post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
           post.description.toLowerCase().includes(searchQuery.toLowerCase());
  }) || [];

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header searchQuery={searchQuery} onSearchChange={setSearchQuery} />
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Acesso Restrito</h1>
          <p className="text-gray-600 mb-8">Você precisa estar logado para acessar seus anúncios.</p>
          <Link href="/login">
            <Button className="bg-primary-yellow text-white hover:bg-primary-yellow/90">
              Fazer Login
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header searchQuery={searchQuery} onSearchChange={setSearchQuery} />
      
      <div className="container mx-auto px-4 py-8">
        {/* User Profile Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-primary-yellow/20 rounded-full flex items-center justify-center">
                <span className="text-2xl font-bold text-primary-yellow">
                  {user?.name?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{user?.name}</h1>
                <p className="text-gray-600">{user?.email}</p>
                {user?.location && (
                  <p className="text-sm text-gray-500">📍 {user.location}</p>
                )}
              </div>
            </div>
            <Link href="/postar-anuncios">
              <Button className="bg-primary-yellow text-white hover:bg-primary-yellow/90">
                <Plus className="h-4 w-4 mr-2" />
                Novo Anúncio
              </Button>
            </Link>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary-yellow">{userPosts?.length || 0}</div>
                <div className="text-sm text-gray-600">Anúncios Ativos</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {userPosts?.reduce((sum, post) => sum + post.viewCount, 0) || 0}
                </div>
                <div className="text-sm text-gray-600">Visualizações</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {userPosts?.reduce((sum, post) => sum + post.contactCount, 0) || 0}
                </div>
                <div className="text-sm text-gray-600">Contatos</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{userFavorites?.length || 0}</div>
                <div className="text-sm text-gray-600">Favoritos</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="meus-posts" className="space-y-6">
          <div className="flex items-center justify-between">
            <TabsList className="grid w-full max-w-md grid-cols-3">
              <TabsTrigger value="meus-posts">Meus Anúncios</TabsTrigger>
              <TabsTrigger value="favoritos">Favoritos</TabsTrigger>
              <TabsTrigger value="estatisticas">Estatísticas</TabsTrigger>
            </TabsList>

            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar nos seus anúncios..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-64"
                  data-testid="input-search-posts"
                />
              </div>
            </div>
          </div>

          <TabsContent value="meus-posts" className="space-y-6">
            {/* Category Filter for Posts */}
            <div className="flex space-x-2">
              <Button
                variant={activeTab === "all" ? "default" : "outline"}
                onClick={() => setActiveTab("all")}
                size="sm"
              >
                Todos
              </Button>
              <Button
                variant={activeTab === "product" ? "default" : "outline"}
                onClick={() => setActiveTab("product")}
                size="sm"
              >
                Produtos
              </Button>
              <Button
                variant={activeTab === "service" ? "default" : "outline"}
                onClick={() => setActiveTab("service")}
                size="sm"
              >
                Serviços
              </Button>
              <Button
                variant={activeTab === "job" ? "default" : "outline"}
                onClick={() => setActiveTab("job")}
                size="sm"
              >
                Vagas
              </Button>
              <Button
                variant={activeTab === "news" ? "default" : "outline"}
                onClick={() => setActiveTab("news")}
                size="sm"
              >
                Notícias
              </Button>
            </div>

            {/* Posts Grid */}
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }, (_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-4">
                      <div className="h-4 bg-gray-200 rounded mb-3"></div>
                      <div className="h-3 bg-gray-200 rounded mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredPosts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredPosts.map((post) => (
                  <Card key={post.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg line-clamp-2">{post.title}</CardTitle>
                          <div className="flex items-center space-x-2 mt-2">
                            <Badge variant={post.isActive ? "default" : "secondary"}>
                              {post.isActive ? "Ativo" : "Inativo"}
                            </Badge>
                            <Badge variant="outline">
                              <i className={`${post.category.icon} mr-1`}></i>
                              {post.category.name}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-4">
                      <p className="text-gray-600 text-sm line-clamp-3">{post.description}</p>
                      
                      {post.price && (
                        <div className="text-xl font-bold text-primary-yellow">
                          {formatPrice(post.price)}
                        </div>
                      )}
                      
                      <div className="text-sm text-gray-500">
                        📍 {post.location}
                      </div>
                      
                      {/* Stats */}
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <div className="flex space-x-4">
                          <span className="flex items-center">
                            <Eye className="h-4 w-4 mr-1" />
                            {post.viewCount}
                          </span>
                          <span className="flex items-center">
                            <Heart className="h-4 w-4 mr-1" />
                            {post.likesCount}
                          </span>
                          <span className="flex items-center">
                            <MessageCircle className="h-4 w-4 mr-1" />
                            {post.commentsCount}
                          </span>
                        </div>
                        <span>{formatDate(post.createdAt)}</span>
                      </div>
                      
                      {/* Actions */}
                      <div className="flex space-x-2 pt-2">
                        <Link href={`/editar-anuncio/${post.id}`} className="flex-1">
                          <Button variant="outline" size="sm" className="w-full">
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                          </Button>
                        </Link>
                        
                        <Link href={`/impulsionar/${post.id}`} className="flex-1">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 hover:from-purple-600 hover:to-pink-600"
                            data-testid="button-boost-post"
                          >
                            <Zap className="h-4 w-4 mr-2" />
                            Impulsionar
                          </Button>
                        </Link>
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja excluir o anúncio "{post.title}"?
                                Esta ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deletePostMutation.mutate(post.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Excluir
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Plus className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum anúncio encontrado</h3>
                <p className="text-gray-600 mb-4">
                  {searchQuery ? "Tente buscar por outros termos" : "Você ainda não criou nenhum anúncio"}
                </p>
                <Link href="/postar-anuncios">
                  <Button className="bg-primary-yellow text-white hover:bg-primary-yellow/90">
                    Criar primeiro anúncio
                  </Button>
                </Link>
              </div>
            )}
          </TabsContent>

          <TabsContent value="favoritos" className="space-y-6">
            {favoritesLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }, (_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-4">
                      <div className="h-4 bg-gray-200 rounded mb-3"></div>
                      <div className="h-3 bg-gray-200 rounded mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredFavorites.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredFavorites.map((post) => (
                  <Card key={post.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-4">
                      <h3 className="font-semibold mb-2 line-clamp-2">{post.title}</h3>
                      <p className="text-gray-600 text-sm mb-3 line-clamp-3">{post.description}</p>
                      {post.price && (
                        <div className="text-lg font-bold text-primary-yellow mb-2">
                          {formatPrice(post.price)}
                        </div>
                      )}
                      <div className="text-sm text-gray-500">📍 {post.location}</div>
                      <Link href={`/post/${post.id}`}>
                        <Button variant="outline" size="sm" className="w-full mt-3">
                          Ver anúncio
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Heart className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum favorito</h3>
                <p className="text-gray-600">Você ainda não favoritou nenhum anúncio</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="estatisticas" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Resumo dos Anúncios</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span>Total de anúncios:</span>
                    <span className="font-semibold">{userPosts?.length || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Anúncios ativos:</span>
                    <span className="font-semibold text-green-600">
                      {userPosts?.filter(p => p.isActive).length || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total de visualizações:</span>
                    <span className="font-semibold">
                      {userPosts?.reduce((sum, post) => sum + post.viewCount, 0) || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total de contatos:</span>
                    <span className="font-semibold">
                      {userPosts?.reduce((sum, post) => sum + post.contactCount, 0) || 0}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Engajamento</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span>Total de curtidas:</span>
                    <span className="font-semibold">
                      {userPosts?.reduce((sum, post) => sum + post.likesCount, 0) || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total de comentários:</span>
                    <span className="font-semibold">
                      {userPosts?.reduce((sum, post) => sum + post.commentsCount, 0) || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Anúncios favoritos:</span>
                    <span className="font-semibold">{userFavorites?.length || 0}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}