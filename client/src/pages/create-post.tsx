import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import type { Category, InsertPost } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import Header from "@/components/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ObjectUploader } from "@/components/ObjectUploader";
import type { UploadResult } from "@uppy/core";
import { X, Upload } from "lucide-react";

const createPostSchema = z.object({
  title: z.string().min(10, "Título deve ter pelo menos 10 caracteres"),
  description: z.string().min(30, "Descrição deve ter pelo menos 30 caracteres"),
  categoryId: z.string().min(1, "Selecione uma categoria"),
  price: z.string().optional(),
  whatsappNumber: z.string().optional(),
  externalLink: z.string().url("URL inválida").optional().or(z.literal("")),
  location: z.string().min(5, "Localização deve ter pelo menos 5 caracteres"),
  userName: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  userEmail: z.string().email("Email inválido").optional().or(z.literal("")),
  userPhone: z.string().optional(),
});

type CreatePostFormData = z.infer<typeof createPostSchema>;

export default function CreatePost() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string>("service");
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

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
      userName: "",
      userEmail: "",
      userPhone: "",
    },
  });

  const createUserMutation = useMutation({
    mutationFn: async (userData: any) => {
      return apiRequest("POST", "/api/users", userData);
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
    try {
      // First create the user
      const userData = {
        name: data.userName,
        email: data.userEmail || null,
        phone: data.userPhone || null,
        whatsapp: data.whatsappNumber || null,
        location: data.location,
        isVerified: false,
      };

      const user = await createUserMutation.mutateAsync(userData);

      // Then create the post
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
        title: "Erro ao criar usuário",
        description: "Não foi possível criar o usuário. Tente novamente.",
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

  const handleGetUploadParameters = async () => {
    const response = await apiRequest("POST", "/api/objects/upload", {});
    return {
      method: 'PUT' as const,
      url: response.uploadURL,
    };
  };

  const handleUploadComplete = async (result: UploadResult<Record<string, unknown>, Record<string, unknown>>) => {
    if (result.successful && result.successful.length > 0) {
      const imageURLs = result.successful.map(file => file.uploadURL);
      
      try {
        // Process uploaded images to get normalized paths
        const response = await apiRequest("PUT", "/api/images", { imageURLs });
        setUploadedImages([...uploadedImages, ...response.objectPaths]);
        
        toast({
          title: "Imagens carregadas!",
          description: `${imageURLs.length} imagem(ns) carregada(s) com sucesso.`,
        });
      } catch (error) {
        toast({
          title: "Erro ao processar imagens",
          description: "Não foi possível processar as imagens carregadas.",
          variant: "destructive",
        });
      }
    }
  };

  const removeImage = (indexToRemove: number) => {
    setUploadedImages(uploadedImages.filter((_, index) => index !== indexToRemove));
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
                      <FormLabel>Imagens do Produto (até 3)</FormLabel>
                      <p className="text-sm text-gray-600 mb-3">
                        Adicione até 3 imagens para destacar melhor seu produto ou serviço.
                      </p>
                    </div>
                    
                    {/* Upload Button */}
                    {uploadedImages.length < 3 && (
                      <ObjectUploader
                        maxNumberOfFiles={3 - uploadedImages.length}
                        maxFileSize={5 * 1024 * 1024} // 5MB
                        onGetUploadParameters={handleGetUploadParameters}
                        onComplete={handleUploadComplete}
                        buttonClassName="bg-primary-yellow hover:bg-primary-yellow/90 text-white"
                      >
                        <div className="flex items-center gap-2">
                          <Upload className="h-4 w-4" />
                          <span>Adicionar Imagens</span>
                        </div>
                      </ObjectUploader>
                    )}

                    {/* Uploaded Images Preview */}
                    {uploadedImages.length > 0 && (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {uploadedImages.map((imagePath, index) => (
                          <div key={index} className="relative group">
                            <img
                              src={imagePath}
                              alt={`Imagem ${index + 1}`}
                              className="w-full h-24 object-cover rounded-lg border"
                            />
                            <button
                              type="button"
                              onClick={() => removeImage(index)}
                              className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
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

                  {/* User Information */}
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-semibold mb-4">Suas Informações</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* User Name */}
                      <FormField
                        control={form.control}
                        name="userName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Seu Nome *</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="João Silva"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* User Email */}
                      <FormField
                        control={form.control}
                        name="userEmail"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Seu Email</FormLabel>
                            <FormControl>
                              <Input 
                                type="email"
                                placeholder="joao@email.com"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* User Phone */}
                      <FormField
                        control={form.control}
                        name="userPhone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Seu Telefone</FormLabel>
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
                    </div>
                  </div>

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