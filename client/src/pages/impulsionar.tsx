import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "wouter";
import { ArrowLeft, Zap, TrendingUp, Eye, Calendar, CreditCard, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface BoostPlan {
  id: string;
  name: string;
  description: string;
  duration: number; // in days
  price: number; // in cents
  features: string[];
  multiplier: number; // visibility multiplier
  popular?: boolean;
}

const boostPlans: BoostPlan[] = [
  {
    id: "basic",
    name: "Impulsionamento Básico",
    description: "Ideal para dar uma primeira exposição ao seu anúncio",
    duration: 3,
    price: 1500, // R$ 15,00
    features: [
      "3 dias de impulsionamento",
      "2x mais visualizações",
      "Aparece em posições destacadas",
      "Badge de 'Impulsionado'"
    ],
    multiplier: 2
  },
  {
    id: "premium",
    name: "Impulsionamento Premium",
    description: "Máxima exposição para resultados rápidos",
    duration: 7,
    price: 3500, // R$ 35,00
    features: [
      "7 dias de impulsionamento",
      "5x mais visualizações",
      "Prioridade máxima nas buscas",
      "Badge de 'Premium'",
      "Destaque na página inicial"
    ],
    multiplier: 5,
    popular: true
  },
  {
    id: "pro",
    name: "Impulsionamento Pro",
    description: "Para quem quer resultados duradouros",
    duration: 15,
    price: 6000, // R$ 60,00
    features: [
      "15 dias de impulsionamento",
      "3x mais visualizações",
      "Posição privilegiada por 2 semanas",
      "Badge de 'Pro'",
      "Relatórios de performance"
    ],
    multiplier: 3
  }
];

export default function ImpulsionarPage() {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedPlan, setSelectedPlan] = useState<string>("");

  const { data: post, isLoading } = useQuery({
    queryKey: [`/api/posts/${id}`],
    enabled: !!id,
  });

  const { data: activeBoosts } = useQuery({
    queryKey: [`/api/posts/${id}/boosts`],
    enabled: !!id && isAuthenticated,
  });

  const boostMutation = useMutation({
    mutationFn: async (planId: string) => {
      return apiRequest("POST", `/api/posts/${id}/boost`, { planId });
    },
    onSuccess: (data: any) => {
      toast({
        title: "Impulsionamento ativado!",
        description: "Seu anúncio será impulsionado nos próximos minutos.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/posts/${id}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/posts/${id}/boosts`] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro no impulsionamento",
        description: error.message || "Não foi possível processar o pagamento.",
        variant: "destructive",
      });
    },
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Zap className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Faça login para impulsionar</h1>
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

  if (!post || post.userId !== user?.id) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Anúncio não encontrado</h1>
          <p className="text-gray-600 mb-6">Você só pode impulsionar seus próprios anúncios</p>
          <Link href="/meus-anuncios">
            <Button>Ver meus anúncios</Button>
          </Link>
        </div>
      </div>
    );
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price / 100);
  };

  const handleBoost = () => {
    if (!selectedPlan) {
      toast({
        title: "Selecione um plano",
        description: "Escolha um plano de impulsionamento antes de continuar.",
        variant: "destructive",
      });
      return;
    }
    
    boostMutation.mutate(selectedPlan);
  };

  const hasActiveBoost = activeBoosts && activeBoosts.length > 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href={`/post/${id}`}>
              <Button variant="ghost" size="sm" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Zap className="h-8 w-8 text-yellow-500" />
                Impulsionar Anúncio
              </h1>
              <p className="text-gray-600 mt-1">
                Aumente a visibilidade do seu anúncio e alcance mais pessoas
              </p>
            </div>
          </div>
        </div>

        {/* Post Preview */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Seu Anúncio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-4">
              {post.imageUrls && post.imageUrls[0] && (
                <img
                  src={post.imageUrls[0]}
                  alt={post.title}
                  className="w-24 h-24 object-cover rounded-lg"
                />
              )}
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{post.title}</h3>
                <p className="text-gray-600 text-sm mb-2">{post.description}</p>
                {post.price && (
                  <p className="text-xl font-bold text-green-600">
                    {formatPrice(post.price)}
                  </p>
                )}
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <Eye className="h-4 w-4" />
                    {post.viewCount} visualizações
                  </span>
                  {hasActiveBoost && (
                    <Badge className="bg-yellow-100 text-yellow-800">
                      <Zap className="h-3 w-3 mr-1" />
                      Impulsionado
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Active Boost Status */}
        {hasActiveBoost && (
          <Card className="mb-8 border-yellow-200 bg-yellow-50">
            <CardHeader>
              <CardTitle className="text-yellow-800 flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Impulsionamento Ativo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {activeBoosts.map((boost: any) => (
                  <div key={boost.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-yellow-800">{boost.plan.name}</p>
                      <p className="text-sm text-yellow-700">
                        Expira em {new Date(boost.expiresAt).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <Badge variant="outline" className="border-yellow-300 text-yellow-800">
                      {boost.multiplier}x visibilidade
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Boost Plans */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {boostPlans.map((plan) => (
            <Card 
              key={plan.id}
              className={`cursor-pointer transition-all duration-200 ${
                selectedPlan === plan.id 
                  ? 'ring-2 ring-yellow-500 shadow-lg' 
                  : 'hover:shadow-md'
              } ${plan.popular ? 'border-yellow-300' : ''}`}
              onClick={() => setSelectedPlan(plan.id)}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{plan.name}</CardTitle>
                  {plan.popular && (
                    <Badge className="bg-yellow-500 text-white">Mais Popular</Badge>
                  )}
                </div>
                <CardDescription>{plan.description}</CardDescription>
                <div className="text-3xl font-bold text-yellow-600">
                  {formatPrice(plan.price)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">{plan.duration} dias</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">{plan.multiplier}x mais visualizações</span>
                  </div>
                </div>
                <ul className="space-y-1">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Action Button */}
        <div className="text-center">
          <Button
            size="lg"
            className="bg-yellow-500 hover:bg-yellow-600 text-white px-12 py-3 text-lg"
            onClick={handleBoost}
            disabled={boostMutation.isPending || hasActiveBoost}
          >
            {boostMutation.isPending ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                Processando...
              </div>
            ) : hasActiveBoost ? (
              <div className="flex items-center gap-2">
                <Check className="h-5 w-5" />
                Anúncio já impulsionado
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Impulsionar Agora
              </div>
            )}
          </Button>
          {!hasActiveBoost && (
            <p className="text-sm text-gray-500 mt-3">
              Pagamento seguro via Stripe • Resultados em até 24 horas
            </p>
          )}
        </div>

        {/* Info Section */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Como funciona o impulsionamento?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Mais Visibilidade
                </h4>
                <p className="text-sm text-gray-600">
                  Seu anúncio aparece nas primeiras posições das buscas e recebe um badge especial
                  que chama atenção dos usuários.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Alcance Ampliado
                </h4>
                <p className="text-sm text-gray-600">
                  Multiplicamos as visualizações do seu anúncio, chegando a muito mais pessoas
                  interessadas no que você oferece.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  Resultados Rápidos
                </h4>
                <p className="text-sm text-gray-600">
                  Os efeitos do impulsionamento começam imediatamente após a confirmação do
                  pagamento, sem demora.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Pagamento Seguro
                </h4>
                <p className="text-sm text-gray-600">
                  Utilizamos o Stripe para processar pagamentos de forma 100% segura,
                  sem armazenar dados do seu cartão.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}