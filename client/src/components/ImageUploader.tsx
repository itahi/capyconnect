import { useState, useRef } from "react";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface ImageUploaderProps {
  onImagesChange: (imageUrls: string[]) => void;
  maxImages?: number;
  currentImages?: string[];
  disabled?: boolean;
}

export function ImageUploader({ 
  onImagesChange, 
  maxImages = 3, 
  currentImages = [],
  disabled = false 
}: ImageUploaderProps) {
  const [images, setImages] = useState<string[]>(currentImages);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    if (files.length === 0) return;

    // Check if adding these files would exceed the limit
    if (images.length + files.length > maxImages) {
      toast({
        title: "Limite excedido",
        description: `Você pode fazer upload de no máximo ${maxImages} imagens.`,
        variant: "destructive",
      });
      return;
    }

    // Validate file types and sizes
    const validFiles = files.filter(file => {
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Formato inválido",
          description: `O arquivo ${file.name} não é uma imagem válida.`,
          variant: "destructive",
        });
        return false;
      }
      
      // 10MB limit
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "Arquivo muito grande",
          description: `O arquivo ${file.name} é muito grande. Limite: 10MB.`,
          variant: "destructive",
        });
        return false;
      }
      
      return true;
    });

    if (validFiles.length === 0) return;

    setUploading(true);

    try {
      // Create FormData for multiple file upload
      const formData = new FormData();
      validFiles.forEach((file) => {
        formData.append('images', file);
      });

      // Upload with automatic processing
      const response = await fetch('/api/images/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const data = await response.json();
      const newImages = [...images, ...data.imageUrls];
      setImages(newImages);
      onImagesChange(newImages);

      toast({
        title: "Upload concluído",
        description: data.message || `${validFiles.length} imagem(ns) enviada(s) e otimizada(s) com sucesso.`,
      });

    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Erro no upload",
        description: "Não foi possível enviar as imagens. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    setImages(newImages);
    onImagesChange(newImages);
  };

  const canAddMoreImages = images.length < maxImages;

  return (
    <div className="space-y-4">
      {/* Upload Button */}
      {canAddMoreImages && (
        <div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
            disabled={disabled || uploading}
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || uploading}
            className="w-full h-24 border-2 border-dashed border-gray-300 hover:border-primary-yellow hover:bg-primary-yellow/5"
          >
            <div className="flex flex-col items-center gap-2">
              {uploading ? (
                <>
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-yellow"></div>
                  <span className="text-sm">Enviando...</span>
                </>
              ) : (
                <>
                  <Upload className="h-6 w-6 text-gray-400" />
                  <span className="text-sm text-gray-600">
                    Clique para adicionar imagens ({images.length}/{maxImages})
                  </span>
                  <span className="text-xs text-gray-500">
                    PNG, JPG, GIF até 10MB cada
                  </span>
                </>
              )}
            </div>
          </Button>
        </div>
      )}

      {/* Image Preview Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {images.map((imageUrl, index) => (
            <div key={index} className="relative group">
              <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden border-2 border-gray-200">
                <img
                  src={imageUrl}
                  alt={`Upload ${index + 1}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Fallback for broken images
                    const target = e.target as HTMLImageElement;
                    target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23f3f4f6'/%3E%3Cpath d='M30 70h40v-5L60 55l-10 10-15-15-5 20z' fill='%23d1d5db'/%3E%3Ccircle cx='40' cy='40' r='5' fill='%23d1d5db'/%3E%3C/svg%3E";
                  }}
                />
              </div>
              
              {/* Remove button */}
              {!disabled && (
                <button
                  type="button"
                  onClick={() => handleRemoveImage(index)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
              
              {/* Image number indicator */}
              <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                {index + 1}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {images.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <ImageIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p className="text-sm">Nenhuma imagem adicionada</p>
          <p className="text-xs">As imagens serão automaticamente redimensionadas para o tamanho padrão</p>
        </div>
      )}
    </div>
  );
}