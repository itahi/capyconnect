import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "wouter";
import { 
  Shield, 
  Users, 
  FileText, 
  TrendingUp, 
  Eye, 
  Heart, 
  MessageCircle,
  ArrowLeft,
  Search,
  Filter,
  MoreVertical,
  Ban,
  CheckCircle,
  XCircle,
  Star
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface AdminPost {
  id: string;
  title: string;
  description: string;
  price?: number;
  location: string;
  isActive: boolean;
  isFeatured: boolean;
  viewCount: number;
  likesCount: number;
  commentsCount: number;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  category: {
    id: string;
    name: string;
    icon: string;
  };
}

export default function AdminPage() {
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  // Check if user is admin
  const { data: adminCheck } = useQuery({
    queryKey: ["/api/admin/check"],
    enabled: isAuthenticated,
  });

  const { data: posts = [], isLoading } = useQuery<AdminPost[]>({
    queryKey: ["/api/admin/posts"],
    enabled: isAuthenticated && adminCheck?.isAdmin,
  });

  const { data: stats } = useQuery({
    queryKey: ["/api/admin/stats"],
    enabled: isAuthenticated && adminCheck?.isAdmin,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["/api/categories"],
    enabled: isAuthenticated && adminCheck?.isAdmin,
  });

  // Mutations
  const togglePostStatus = useMutation({
    mutationFn: async ({ postId, isActive }: { postId: string; isActive: boolean }) => {
      return apiRequest("PATCH", `/api/admin/posts/${postId}/status`, { isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/posts"] });
      toast({
        title: "Status atualizado",
        description: "O status do post foi alterado com sucesso.",
      });
    },
  });

  const toggleFeatured = useMutation({
    mutationFn: async ({ postId, isFeatured }: { postId: string; isFeatured: boolean }) => {
      return apiRequest("PATCH", `/api/admin/posts/${postId}/featured`, { isFeatured });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/posts"] });
      toast({
        title: "Destaque atualizado",
        description: "O destaque do post foi alterado com sucesso.",
      });
    },
  });

  const deletePost = useMutation({
    mutationFn: async (postId: string) => {
      return apiRequest("DELETE", `/api/admin/posts/${postId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/posts"] });
      toast({
        title: "Post excluído",
        description: "O post foi removido com sucesso.",
      });
    },
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Acesso restrito</h1>
          <p className="text-gray-600 mb-6">Faça login para acessar o painel administrativo</p>
          <Link href="/login">
            <Button>Fazer login</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!adminCheck?.isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <XCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Acesso negado</h1>
          <p className="text-gray-600 mb-6">Você não tem permissão para acessar esta área</p>
          <Link href="/">
            <Button>Voltar ao início</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary-yellow border-t-transparent rounded-full" />
      </div>
    );
  }

  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.user.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || 
                         (statusFilter === "active" && post.isActive) ||
                         (statusFilter === "inactive" && !post.isActive) ||
                         (statusFilter === "featured" && post.isFeatured);
    const matchesCategory = categoryFilter === "all" || post.category.id === categoryFilter;
    
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price / 100);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="sm" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Shield className="h-8 w-8 text-primary-yellow" />
                Painel Administrativo
              </h1>
              <p className="text-gray-600 mt-1">
                Gerencie todos os anúncios da plataforma
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total de Posts</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.totalPosts}</p>
                </div>
                <FileText className="h-8 w-8 text-primary-yellow" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Posts Ativos</p>
                  <p className="text-3xl font-bold text-green-600">{stats.activePosts}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Usuários</p>
                  <p className="text-3xl font-bold text-blue-600">{stats.totalUsers}</p>
                </div>
                <Users className="h-8 w-8 text-blue-500" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Posts em Destaque</p>
                  <p className="text-3xl font-bold text-purple-600">{stats.featuredPosts}</p>
                </div>
                <Star className="h-8 w-8 text-purple-500" />
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar por título ou usuário..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full lg:w-48">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="active">Ativos</SelectItem>
                <SelectItem value="inactive">Inativos</SelectItem>
                <SelectItem value="featured">Em destaque</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full lg:w-48">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as categorias</SelectItem>
                {categories.map((category: any) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.icon} {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Posts Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Post</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Usuário</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Categoria</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Estatísticas</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Criado</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-900">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredPosts.map((post) => (
                  <tr key={post.id} className="hover:bg-gray-50">
                    <td className="py-4 px-4">
                      <div>
                        <Link href={`/post/${post.id}`}>
                          <h4 className="font-medium text-gray-900 hover:text-primary-yellow cursor-pointer">
                            {post.title}
                          </h4>
                        </Link>
                        <p className="text-sm text-gray-500 truncate max-w-xs">
                          {post.description}
                        </p>
                        {post.price && (
                          <p className="text-sm font-medium text-green-600">
                            {formatPrice(post.price)}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div>
                        <p className="font-medium text-gray-900">{post.user.name}</p>
                        <p className="text-sm text-gray-500">{post.user.email}</p>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <Badge variant="outline" className="flex items-center gap-1 w-fit">
                        <span>{post.category.icon}</span>
                        <span>{post.category.name}</span>
                      </Badge>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex flex-col gap-1">
                        <Badge variant={post.isActive ? "default" : "secondary"}>
                          {post.isActive ? "Ativo" : "Inativo"}
                        </Badge>
                        {post.isFeatured && (
                          <Badge variant="outline" className="text-purple-600 border-purple-200">
                            <Star className="h-3 w-3 mr-1" />
                            Destaque
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex gap-4 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <Eye className="h-4 w-4" />
                          {post.viewCount}
                        </span>
                        <span className="flex items-center gap-1">
                          <Heart className="h-4 w-4" />
                          {post.likesCount}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageCircle className="h-4 w-4" />
                          {post.commentsCount}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-500">
                      {formatDate(post.createdAt)}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => togglePostStatus.mutate({
                              postId: post.id,
                              isActive: !post.isActive
                            })}
                          >
                            {post.isActive ? (
                              <>
                                <Ban className="h-4 w-4 mr-2" />
                                Desativar
                              </>
                            ) : (
                              <>
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Ativar
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => toggleFeatured.mutate({
                              postId: post.id,
                              isFeatured: !post.isFeatured
                            })}
                          >
                            <Star className="h-4 w-4 mr-2" />
                            {post.isFeatured ? "Remover destaque" : "Destacar"}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => deletePost.mutate(post.id)}
                            className="text-red-600"
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredPosts.length === 0 && (
            <div className="text-center py-12">
              <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhum post encontrado
              </h3>
              <p className="text-gray-600">
                Tente ajustar os filtros para ver mais resultados
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}