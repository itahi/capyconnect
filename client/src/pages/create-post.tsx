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
import { X } from "lucide-react";

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

export default function CreatePost() {
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

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setLocation("/login");
    }
  }, [isAuthenticated, isLoading, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-yellow"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const { data: categories } = useQuery<Category[]>({
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
    if (!user) return;

    try {
      const postData: InsertPost = {
        title: data.title,
        description: data.description,
        categoryId: data.categoryId,
        imageUrls: uploadedImages.length > 0 ? uploadedImages : null,
        price: data.price ? parseInt(data.price.replace(/\D/g, '')) : null,
        whatsappNumber: data.whatsappNumber || null,
        externalLink: data.externalLink || null,
        location: data.location,
        userId: user.id,
        isActive: true,
        isFeatured: false,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      };

      createPostMutation.mutate(postData);
    } catch (error) {
      toast({
        title: "Erro ao criar post",
        description: "Não foi possível criar o post. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const categoriesByType = categories?.filter(cat => cat.type === selectedType) || [];

  const getTypeInfo = (type: string) => {
    switch (type) {
      case 'service':
        return {
          title: 'Postar Serviço',
          description: 'Ofereça seus serviços profissionais',
          icon: '🔧',
          priceLabel: 'Preço do serviço',
          placeholder: 'Ex: Limpeza residencial completa com produtos inclusos...'
        };
      case 'product':
        return {
          title: 'Vender Produto',
          description: 'Venda seus produtos',
          icon: '📦',
          priceLabel: 'Preço de venda',
          placeholder: 'Ex: Notebook gamer em ótimo estado, usado por apenas 6 meses...'
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
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Publicar no Marketplace</h1>
            <p className="text-gray-600">Escolha o tipo de conteúdo que deseja publicar</p>
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
                className={`cursor-pointer transition-all ${
                  selectedType === item.type 
                    ? 'ring-2 ring-primary-yellow bg-light-yellow' 
                    : 'hover:shadow-md'
                }`}
                onClick={() => setSelectedType(item.type)}
              >
                <CardContent className="p-4 text-center">
                  <div className="text-2xl mb-2">{item.icon}</div>
                  <span className="font-medium text-gray-800">{item.label}</span>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <span>{typeInfo.icon}</span>
                <span>{typeInfo.title}</span>
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
                        <FormLabel>Título *</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder={selectedType === 'job' ? 'Ex: Desenvolvedor Frontend - React' : 'Ex: Limpeza Residencial Profissional'}
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
                        <FormLabel>Descrição *</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder={typeInfo.placeholder}
                            rows={4}
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Category */}
                  <FormField
                    control={form.control}
                    name="categoryId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Categoria *</FormLabel>
                        <FormControl>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione uma categoria" />
                            </SelectTrigger>
                            <SelectContent>
                              {categoriesByType.map((category) => (
                                <SelectItem key={category.id} value={category.id}>
                                  <div className="flex items-center space-x-2">
                                    <i className={category.icon}></i>
                                    <span>{category.name}</span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Image Upload Section */}
                  <div className="space-y-4">
                    <div>
                      <FormLabel>Imagens (até 3)</FormLabel>
                      <p className="text-sm text-gray-600 mb-3">
                        Adicione até 3 imagens. Elas serão automaticamente redimensionadas e otimizadas.
                      </p>
                    </div>
                    
                    <ImageUploader
                      onImagesChange={handleImagesChange}
                      maxImages={3}
                      currentImages={uploadedImages}
                      disabled={createPostMutation.isPending}
                    />
                  </div>

                  {/* Price (if not news) */}
                  {selectedType !== 'news' && (
                    <FormField
                      control={form.control}
                      name="price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{typeInfo.priceLabel}</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="R$ 150,00"
                              {...field}
                              onChange={(e) => {
                                const value = e.target.value.replace(/\D/g, '');
                                field.onChange(value);
                              }}
                              value={field.value ? formatPrice(field.value) : ''}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* WhatsApp */}
                    <FormField
                      control={form.control}
                      name="whatsappNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>WhatsApp para Contato</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="11999990000"
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
                          <FormLabel>Link Externo</FormLabel>
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



                  {/* Submit Button */}
                  <div className="flex space-x-4 pt-6">
                    <Button 
                      type="submit" 
                      className="flex-1 bg-primary-purple text-white hover:bg-primary-purple font-semibold py-3"
                      disabled={createPostMutation.isPending || createUserMutation.isPending}
                    >
                      {createPostMutation.isPending || createUserMutation.isPending ? "Publicando..." : "Publicar no Marketplace"}
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