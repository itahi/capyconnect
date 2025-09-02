import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Zap, Crown, Rocket, Star } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import Header from "@/components/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Post } from "@shared/schema";

const boostPlans = [
  {
    id: "basic",
    name: "Básico",
    icon: <Star className="h-6 w-6" />,
    price: 9.90,
    duration: "3 dias",
    features: [
      "Aparece no topo dos resultados",
      "Badge de destaque",
      "3x mais visualizações",
      "Válido por 3 dias"
    ],
    color: "bg-blue-500",
    gradient: "from-blue-500 to-blue-600"
  },
  {
    id: "premium",
    name: "Premium",
    icon: <Crown className="h-6 w-6" />,
    price: 19.90,
    duration: "7 dias",
    features: [
      "Prioridade máxima nos resultados",
      "Badge premium dourado",
      "5x mais visualizações",
      "Destaque na página inicial",
      "Válido por 7 dias"
    ],
    color: "bg-yellow-500",
    gradient: "from-yellow-500 to-orange-500",
    popular: true
  },
  {
    id: "turbo",
    name: "Turbo",
    icon: <Rocket className="h-6 w-6" />,
    price: 34.90,
    duration: "15 dias",
    features: [
      "Máxima visibilidade garantida",
      "Badge turbo especial",
      "10x mais visualizações",
      "Destaque em todas as seções",
      "Notificação push para usuários",
      "Válido por 15 dias"
    ],
    color: "bg-purple-500",
    gradient: "from-purple-500 to-pink-500"
  }
];

export default function Impulsionar() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<string>("premium");

  const postId = params.id;

  // Fetch post data
  const { data: post, isLoading: postLoading } = useQuery<Post>({
    queryKey: [`/api/posts/${postId}`],
    enabled: !!postId && isAuthenticated,
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(price);
  };

  const handleProceedToPayment = () => {
    const plan = boostPlans.find(p => p.id === selectedPlan);
    if (plan) {
      // Aqui você integraria com o Stripe para processar o pagamento
      setLocation(`/pagamento/impulsionar?postId=${postId}&planId=${selectedPlan}&amount=${plan.price}`);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Acesso negado</h2>
          <p className="text-gray-600">Você precisa estar logado para impulsionar anúncios.</p>
        </div>
      </div>
    );
  }

  if (postLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header searchQuery="" onSearchChange={() => {}} />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow-sm p-6 animate-pulse">
              <div className="h-8 bg-gray-200 rounded mb-4"></div>
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header searchQuery="" onSearchChange={() => {}} />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Anúncio não encontrado</h2>
            <p className="text-gray-600 mb-4">O anúncio que você está tentando impulsionar não existe.</p>
            <Button onClick={() => setLocation("/meus-anuncios")}>
              Voltar para meus anúncios
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Check if user owns this post
  if (post.userId !== user?.id) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header searchQuery="" onSearchChange={() => {}} />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Acesso negado</h2>
            <p className="text-gray-600 mb-4">Você só pode impulsionar seus próprios anúncios.</p>
            <Button onClick={() => setLocation("/meus-anuncios")}>
              Voltar para meus anúncios
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      <Header searchQuery="" onSearchChange={() => {}} />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center space-x-4 mb-8">
            <Button
              variant="ghost"
              onClick={() => setLocation("/meus-anuncios")}
              className="p-2"
              data-testid="button-back"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <Zap className="h-8 w-8 text-yellow-500 mr-3" />
                Impulsionar Anúncio
              </h1>
              <p className="text-gray-600">Aumente a visibilidade do seu anúncio e venda mais rápido</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Post Preview */}
            <div className="lg:col-span-1">
              <Card className="sticky top-8">
                <CardHeader>
                  <CardTitle className="text-lg">Anúncio a ser impulsionado</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {post.imageUrls && post.imageUrls.length > 0 && (
                    <img
                      src={post.imageUrls[0]}
                      alt={post.title}
                      className="w-full h-48 object-cover rounded-lg"
                    />
                  )}
                  
                  <div>
                    <h3 className="font-semibold text-lg line-clamp-2">{post.title}</h3>
                    <p className="text-gray-600 text-sm line-clamp-3 mt-2">{post.description}</p>
                  </div>
                  
                  {post.price && (
                    <div className="text-2xl font-bold text-green-600">
                      {formatPrice(post.price / 100)}
                    </div>
                  )}
                  
                  <div className="text-sm text-gray-500">
                    📍 {post.location}
                  </div>

                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span>👁️ {post.viewCount} visualizações</span>
                    <span>❤️ {post.likesCount} curtidas</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Boost Plans */}
            <div className="lg:col-span-2">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Escolha seu plano de impulsionamento</h2>
                <p className="text-gray-600">Selecione o plano que melhor atende às suas necessidades</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {boostPlans.map((plan) => (
                  <Card
                    key={plan.id}
                    className={`relative cursor-pointer transition-all duration-200 hover:shadow-lg ${
                      selectedPlan === plan.id
                        ? 'ring-2 ring-purple-500 shadow-lg'
                        : 'hover:shadow-md'
                    } ${plan.popular ? 'border-yellow-400' : ''}`}
                    onClick={() => setSelectedPlan(plan.id)}
                    data-testid={`plan-${plan.id}`}
                  >
                    {plan.popular && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                        <Badge className="bg-yellow-500 text-white px-3 py-1">
                          Mais Popular
                        </Badge>
                      </div>
                    )}
                    
                    <CardHeader className="text-center pb-2">
                      <div className={`w-12 h-12 mx-auto rounded-full bg-gradient-to-r ${plan.gradient} flex items-center justify-center text-white mb-3`}>
                        {plan.icon}
                      </div>
                      <CardTitle className="text-xl">{plan.name}</CardTitle>
                      <div className="text-3xl font-bold text-gray-900">
                        {formatPrice(plan.price)}
                      </div>
                      <p className="text-sm text-gray-600">{plan.duration}</p>
                    </CardHeader>
                    
                    <CardContent className="pt-2">
                      <ul className="space-y-2">
                        {plan.features.map((feature, index) => (
                          <li key={index} className="flex items-start text-sm">
                            <span className="text-green-500 mr-2 mt-1">✓</span>
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Resumo do pedido</h3>
                    <p className="text-gray-600">
                      Plano {boostPlans.find(p => p.id === selectedPlan)?.name} - {boostPlans.find(p => p.id === selectedPlan)?.duration}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-gray-900">
                      {formatPrice(boostPlans.find(p => p.id === selectedPlan)?.price || 0)}
                    </div>
                    <p className="text-sm text-gray-600">Pagamento único</p>
                  </div>
                </div>

                <div className="flex space-x-4">
                  <Button
                    variant="outline"
                    onClick={() => setLocation("/meus-anuncios")}
                    className="flex-1"
                    data-testid="button-cancel"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleProceedToPayment}
                    className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600"
                    data-testid="button-proceed-payment"
                  >
                    <Zap className="h-4 w-4 mr-2" />
                    Proceder ao Pagamento
                  </Button>
                </div>

                <div className="mt-4 text-xs text-gray-500 text-center">
                  Pagamento seguro processado via Stripe. Seus dados estão protegidos.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}