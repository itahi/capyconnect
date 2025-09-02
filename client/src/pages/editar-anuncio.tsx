import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, ImagePlus, X, Upload } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import type { Category, Post } from "@shared/schema";

const editPostSchema = z.object({
  title: z.string().min(1, "Título é obrigatório").max(100, "Título muito longo"),
  description: z.string().min(1, "Descrição é obrigatória").max(1000, "Descrição muito longa"),
  categoryId: z.string().min(1, "Categoria é obrigatória"),
  price: z.coerce.number().optional(),
  location: z.string().min(1, "Localização é obrigatória"),
  whatsappNumber: z.string().optional(),
  externalLink: z.string().url("URL inválida").optional().or(z.literal("")),
});

type EditPostData = z.infer<typeof editPostSchema>;

export default function EditarAnuncio() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  const postId = params.id;

  // Fetch post data
  const { data: post, isLoading: postLoading } = useQuery<Post>({
    queryKey: [`/api/posts/${postId}`],
    enabled: !!postId && isAuthenticated,
  });

  // Fetch categories
  const { data: categories } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const form = useForm<EditPostData>({
    resolver: zodResolver(editPostSchema),
    defaultValues: {
      title: "",
      description: "",
      categoryId: "",
      price: undefined,
      location: "",
      whatsappNumber: "",
      externalLink: "",
    },
  });

  // Update form when post data loads
  useEffect(() => {
    if (post) {
      form.reset({
        title: post.title,
        description: post.description,
        categoryId: post.categoryId,
        price: post.price ? post.price / 100 : undefined, // Convert from cents
        location: post.location,
        whatsappNumber: post.whatsappNumber ?? "",
        externalLink: post.externalLink ?? "",
      });
      setImages(post.imageUrls || []);
    }
  }, [post, form]);

  const updatePostMutation = useMutation({
    mutationFn: async (data: EditPostData) => {
      const postData = {
        ...data,
        price: data.price ? Math.round(data.price * 100) : null, // Convert to cents
        imageUrls: images,
      };
      return apiRequest("PUT", `/api/posts/${postId}`, postData);
    },
    onSuccess: () => {
      toast({
        title: "Anúncio atualizado!",
        description: "Suas alterações foram salvas com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user/posts"] });
      queryClient.invalidateQueries({ queryKey: [`/api/posts/${postId}`] });
      setLocation("/meus-anuncios");
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar anúncio",
        description: error.message || "Tente novamente mais tarde.",
        variant: "destructive",
      });
    },
  });

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    if (images.length + files.length > 8) {
      toast({
        title: "Limite de imagens",
        description: "Você pode adicionar no máximo 8 imagens.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    const formData = new FormData();
    Array.from(files).forEach((file) => {
      formData.append("images", file);
    });

    try {
      const response = await fetch("/api/images/upload-simple", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Falha no upload");
      }

      const result = await response.json();
      setImages(prev => [...prev, ...result.imageUrls]);
      
      toast({
        title: "Imagens enviadas!",
        description: `${result.imageUrls.length} imagem(ns) adicionada(s) com sucesso.`,
      });
    } catch (error) {
      toast({
        title: "Erro no upload",
        description: "Não foi possível enviar as imagens. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const onSubmit = (data: EditPostData) => {
    updatePostMutation.mutate(data);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Acesso negado</h2>
          <p className="text-gray-600">Você precisa estar logado para editar anúncios.</p>
        </div>
      </div>
    );
  }

  if (postLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header searchQuery="" onSearchChange={() => {}} />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
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
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Anúncio não encontrado</h2>
            <p className="text-gray-600 mb-4">O anúncio que você está tentando editar não existe.</p>
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
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Acesso negado</h2>
            <p className="text-gray-600 mb-4">Você só pode editar seus próprios anúncios.</p>
            <Button onClick={() => setLocation("/meus-anuncios")}>
              Voltar para meus anúncios
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header searchQuery="" onSearchChange={() => {}} />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
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
              <h1 className="text-3xl font-bold text-gray-900">Editar Anúncio</h1>
              <p className="text-gray-600">Faça as alterações necessárias no seu anúncio</p>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Informações do Anúncio</CardTitle>
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
                            placeholder="Ex: iPhone 13 Pro Max seminovo"
                            {...field}
                            data-testid="input-title"
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
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-category">
                              <SelectValue placeholder="Selecione uma categoria" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {categories?.map((category) => (
                              <SelectItem key={category.id} value={category.id}>
                                {category.icon} {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
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
                            placeholder="Descreva seu produto ou serviço..."
                            className="min-h-[120px]"
                            {...field}
                            data-testid="textarea-description"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Price */}
                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Preço (R$)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="0.00"
                            step="0.01"
                            min="0"
                            {...field}
                            data-testid="input-price"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Location */}
                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Localização *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Ex: São Paulo, SP"
                            {...field}
                            data-testid="input-location"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* WhatsApp */}
                  <FormField
                    control={form.control}
                    name="whatsappNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>WhatsApp</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="(11) 99999-9999"
                            {...field}
                            data-testid="input-whatsapp"
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
                            placeholder="https://..."
                            {...field}
                            data-testid="input-external-link"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Images */}
                  <div className="space-y-4">
                    <Label>Imagens (máximo 8)</Label>
                    
                    {/* Image Grid */}
                    {images.length > 0 && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {images.map((imageUrl, index) => (
                          <div key={index} className="relative group">
                            <img
                              src={imageUrl}
                              alt={`Imagem ${index + 1}`}
                              className="w-full h-24 object-cover rounded-lg"
                            />
                            <button
                              type="button"
                              onClick={() => removeImage(index)}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* Upload Button */}
                    {images.length < 8 && (
                      <div>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleImageUpload}
                          className="hidden"
                          id="image-upload"
                          disabled={uploading}
                        />
                        <label
                          htmlFor="image-upload"
                          className="flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-primary-yellow hover:bg-gray-50 transition-colors"
                        >
                          <div className="text-center">
                            {uploading ? (
                              <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2 animate-pulse" />
                            ) : (
                              <ImagePlus className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                            )}
                            <p className="text-sm text-gray-600">
                              {uploading ? "Enviando..." : "Clique para adicionar imagens"}
                            </p>
                          </div>
                        </label>
                      </div>
                    )}
                  </div>

                  {/* Submit Button */}
                  <div className="flex space-x-4 pt-6">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setLocation("/meus-anuncios")}
                      className="flex-1"
                      data-testid="button-cancel"
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      disabled={updatePostMutation.isPending}
                      className="flex-1 bg-primary-yellow text-white hover:bg-primary-yellow/90"
                      data-testid="button-update"
                    >
                      {updatePostMutation.isPending ? "Salvando..." : "Salvar Alterações"}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}