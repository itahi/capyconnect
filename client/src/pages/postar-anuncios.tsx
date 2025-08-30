import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import type { Category, InsertPost } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import Header from "@/components/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ImageUploader } from "@/components/ImageUploader";

const createPostSchema = z.object({
  title: z.string().min(10, "Título deve ter pelo menos 10 caracteres"),
  description: z.string().min(30, "Descrição deve ter pelo menos 30 caracteres"),
  categoryId: z.string().min(1, "Selecione uma categoria"),
  price: z.string().optional(),
  whatsappNumber: z.string().optional(),
  externalLink: z.string().url("URL inválida").optional().or(z.literal("")),
  location: z.string().min(5, "Localização deve ter pelo menos 5 caracteres"),
});

type CreatePostFormData = z.infer<typeof createPostSchema>;

export default function PostarAnuncios() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string>("service");
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { user, isAuthenticated, isLoading } = useAuth();

  const handleImagesChange = (imageUrls: string[]) => {
    setUploadedImages(imageUrls);
  };

  // Show login prompt if not authenticated but don't redirect immediately
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-yellow"></div>
      </div>
    );
  }

  const { data: categories, isLoading: categoriesLoading } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const form = useForm<CreatePostFormData>({
    resolver: zodResolver(createPostSchema),
    defaultValues: {
      title: "",
      description: "",
      categoryId: "",
      price: "",
      whatsappNumber: "",
      externalLink: "",
      location: "",
    },
  });

  const createPostMutation = useMutation({
    mutationFn: async (postData: InsertPost) => {
      return apiRequest("POST", "/api/posts", postData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      toast({
        title: "Post criado com sucesso!",
        description: "Seu anúncio foi publicado no marketplace.",
      });
      setLocation("/");
    },
    onError: () => {
      toast({
        title: "Erro ao criar post",
        description: "Não foi possível publicar seu anúncio. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: CreatePostFormData) => {
    if (!isAuthenticated) {
      toast({
        title: "Login necessário",
        description: "Você precisa estar logado para criar um post",
        variant: "destructive",
      });
      return;
    }

    const priceInCents = data.price && data.price.trim() ? Math.round(parseFloat(data.price) * 100) : null;
    
    const postData: InsertPost = {
      title: data.title.trim(),
      description: data.description.trim(),
      categoryId: data.categoryId,
      price: priceInCents,
      whatsappNumber: data.whatsappNumber?.trim() || null,
      externalLink: data.externalLink?.trim() || null,
      location: data.location.trim(),
      imageUrls: uploadedImages.length > 0 ? uploadedImages : null,
    };

    createPostMutation.mutate(postData);
  };

  const getTypeInfo = (type: string) => {
    switch (type) {
      case 'service':
        return {
          title: 'Oferecer Serviço',
          description: 'Divulgue seus serviços profissionais',
          icon: '🔧',
          priceLabel: 'Preço (opcional)',
          placeholder: 'Ex: Serviço de limpeza residencial com produtos próprios...'
        };
      case 'product':
        return {
          title: 'Vender Produto',
          description: 'Anuncie produtos novos ou usados',
          icon: '📦',
          priceLabel: 'Preço *',
          placeholder: 'Ex: Smartphone Samsung Galaxy em perfeito estado...'
        };
      case 'job':
        return {
          title: 'Postar Vaga',
          description: 'Divulgue vagas de emprego',
          icon: '💼',
          priceLabel: 'Salário (opcional)',
          placeholder: 'Ex: Vaga para desenvolvedor frontend com experiência em React...'
        };
      case 'news':
        return {
          title: 'Publicar Notícia',
          description: 'Compartilhe notícias relevantes',
          icon: '📰',
          priceLabel: '',
          placeholder: 'Ex: Mercado de startups registra crescimento de 40% no Brasil...'
        };
      default:
        return {
          title: 'Criar Post',
          description: 'Publique seu conteúdo',
          icon: '📝',
          priceLabel: 'Preço',
          placeholder: 'Descreva seu post...'
        };
    }
  };

  const typeInfo = getTypeInfo(selectedType);

  const formatPrice = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    const cents = parseInt(numbers) || 0;
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(cents / 100);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header searchQuery={searchQuery} onSearchChange={setSearchQuery} />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Postar Anúncio</h1>
            <p className="text-gray-600">Escolha o tipo de conteúdo que deseja publicar</p>
            {!isAuthenticated && (
              <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-yellow-800">
                  <i className="fas fa-info-circle mr-2"></i>
                  Você precisa estar logado para publicar anúncios. 
                  <button 
                    onClick={() => setLocation("/login")} 
                    className="ml-2 text-yellow-800 underline hover:text-yellow-900"
                  >
                    Fazer login
                  </button>
                </p>
              </div>
            )}
          </div>

          {/* Type Selection */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { type: 'service', label: 'Serviços', icon: '🔧' },
              { type: 'product', label: 'Produtos', icon: '📦' },
              { type: 'job', label: 'Vagas', icon: '💼' },
              { type: 'news', label: 'Notícias', icon: '📰' },
            ].map((item) => (
              <Card 
                key={item.type}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedType === item.type ? 'ring-2 ring-primary-yellow border-primary-yellow' : ''
                }`}
                onClick={() => setSelectedType(item.type)}
              >
                <CardContent className="p-4 text-center">
                  <div className="text-2xl mb-2">{item.icon}</div>
                  <h3 className="font-semibold text-sm">{item.label}</h3>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">{typeInfo.icon}</span>
                {typeInfo.title}
              </CardTitle>
              <CardDescription>{typeInfo.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* Title */}
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Título do Anúncio *</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Ex: Técnico em Informática - Formatação e Manutenção"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Description */}
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descrição Completa *</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder={typeInfo.placeholder}
                            rows={6}
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Category and Price Row */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Category */}
                    <FormField
                      control={form.control}
                      name="categoryId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Categoria *</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                            disabled={categoriesLoading}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione uma categoria" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {categories?.filter(cat => cat.type === selectedType).map((category) => (
                                <SelectItem key={category.id} value={category.id}>
                                  <i className={category.icon}></i> {category.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Price */}
                    {typeInfo.priceLabel && (
                      <FormField
                        control={form.control}
                        name="price"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{typeInfo.priceLabel}</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="R$ 0,00"
                                value={field.value ? formatPrice(field.value) : ''}
                                onChange={(e) => field.onChange(e.target.value)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </div>

                  {/* Contact Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* WhatsApp */}
                    <FormField
                      control={form.control}
                      name="whatsappNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>WhatsApp (Recomendado)</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="(11) 99999-0000"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* External Link */}
                    <FormField
                      control={form.control}
                      name="externalLink"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Site ou Link Externo</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="https://meusite.com"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Location */}
                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Localização *</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="São Paulo - SP"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Image Upload Section */}
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-3">📸 Fotos do anúncio</h3>
                      <ImageUploader onImagesChange={handleImagesChange} maxImages={8} />
                    </div>
                    
                    {/* Preview das imagens */}
                    {uploadedImages.length > 0 && (
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="text-md font-medium text-gray-800 mb-3">Pré-visualização das imagens</h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                          {uploadedImages.map((imageUrl, index) => (
                            <div key={index} className="relative group">
                              <img
                                src={imageUrl}
                                alt={`Pré-visualização ${index + 1}`}
                                className="w-full h-32 object-cover rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
                                onError={(e) => {
                                  console.error(`Erro ao carregar imagem ${index + 1}:`, imageUrl);
                                  const target = e.currentTarget;
                                  target.style.display = 'none';
                                }}
                              />
                              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded-lg flex items-center justify-center">
                                <span className="text-white opacity-0 group-hover:opacity-100 text-sm font-medium">
                                  Imagem {index + 1}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                        <p className="text-sm text-gray-500 mt-3 flex items-center gap-2">
                          <span className="inline-block w-2 h-2 bg-green-500 rounded-full"></span>
                          {uploadedImages.length} imagem{uploadedImages.length !== 1 ? 's' : ''} pronta{uploadedImages.length !== 1 ? 's' : ''} para publicação
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Submit Button */}
                  <div className="flex space-x-4 pt-6">
                    <Button 
                      type="submit" 
                      className="flex-1 bg-primary-yellow text-white hover:bg-primary-yellow/90 font-semibold py-3"
                      disabled={createPostMutation.isPending}
                    >
                      {createPostMutation.isPending ? "Publicando..." : "Publicar Anúncio"}
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setLocation("/")}
                      className="px-8"
                    >
                      Cancelar
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}