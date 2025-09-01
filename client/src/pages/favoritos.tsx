import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Heart, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PostCard } from "@/components/PostCard";
import { useAuth } from "@/hooks/useAuth";

export default function FavoritosPage() {
  const { isAuthenticated, user } = useAuth();

  const { data: favorites = [], isLoading } = useQuery({
    queryKey: ["/api/user/favorites"],
    enabled: isAuthenticated,
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Heart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Faça login para ver seus favoritos</h1>
          <Link href="/login">
            <Button>Fazer login</Button>
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
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
                <Heart className="h-8 w-8 text-red-500" />
                Meus Favoritos
              </h1>
              <p className="text-gray-600 mt-1">
                {favorites.length} {favorites.length === 1 ? 'anúncio favoritado' : 'anúncios favoritados'}
              </p>
            </div>
          </div>
        </div>

        {/* Favorites Grid */}
        {favorites.length === 0 ? (
          <div className="text-center py-12">
            <Heart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Nenhum anúncio favoritado ainda
            </h2>
            <p className="text-gray-600 mb-6">
              Quando você curtir anúncios com ❤️, eles aparecerão aqui
            </p>
            <Link href="/">
              <Button className="bg-primary-yellow hover:bg-secondary-yellow text-white">
                Explorar anúncios
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {favorites.map((post: any) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}