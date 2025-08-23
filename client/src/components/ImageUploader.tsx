import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Upload, X, ImageIcon } from "lucide-react";

interface ImageUploaderProps {
  onImagesChange: (imageUrls: string[]) => void;
  maxImages?: number;
  existingImages?: string[];
}

export function ImageUploader({ 
  onImagesChange, 
  maxImages = 3, 
  existingImages = [] 
}: ImageUploaderProps) {
  const [images, setImages] = useState<string[]>(existingImages);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    if (files.length === 0) return;
    
    // Check total images limit
    if (images.length + files.length > maxImages) {
      toast({
        title: "Limite excedido",
        description: `Você pode enviar no máximo ${maxImages} imagens`,
        variant: "destructive",
      });
      return;
    }

    // Validate file types
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const invalidFiles = files.filter(file => !validTypes.includes(file.type));
    
    if (invalidFiles.length > 0) {
      toast({
        title: "Formato inválido",
        description: "Apenas arquivos PNG, JPG, JPEG e WEBP são aceitos",
        variant: "destructive",
      });
      return;
    }

    // Check file sizes (max 5MB each)
    const oversizedFiles = files.filter(file => file.size > 5 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      toast({
        title: "Arquivo muito grande",
        description: "Cada imagem deve ter no máximo 5MB",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      const uploadPromises = files.map(async (file) => {
        // Convert to base64 for preview (simplified for demo)
        return new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            resolve(reader.result as string);
          };
          reader.readAsDataURL(file);
        });
      });

      const imageUrls = await Promise.all(uploadPromises);
      const newImages = [...images, ...imageUrls];
      
      setImages(newImages);
      onImagesChange(newImages);
      
      toast({
        title: "Sucesso!",
        description: `${files.length} imagem(ns) carregada(s)`,
      });
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Erro no upload",
        description: "Não foi possível carregar as imagens",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    setImages(newImages);
    onImagesChange(newImages);
  };

  return (
    <div className="space-y-4">
      {/* Upload Button */}
      <div className="flex items-center justify-center">
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading || images.length >= maxImages}
          className="w-full max-w-md h-32 border-2 border-dashed border-primary-yellow/50 hover:border-primary-yellow text-primary-yellow hover:bg-primary-yellow/5"
          data-testid="button-upload-images"
        >
          <div className="text-center">
            {uploading ? (
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-yellow mx-auto mb-2"></div>
            ) : (
              <Upload className="h-8 w-8 mx-auto mb-2" />
            )}
            <div className="text-sm">
              {uploading ? "Carregando..." : "Clique para adicionar imagens"}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              PNG, JPG, JPEG, WEBP (máx. 5MB cada)
            </div>
            <div className="text-xs text-gray-500">
              {images.length}/{maxImages} imagens
            </div>
          </div>
        </Button>
        
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/jpg,image/webp"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          data-testid="input-image-files"
        />
      </div>

      {/* Image Preview Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {images.map((imageUrl, index) => (
            <div key={index} className="relative group">
              <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 border-2 border-gray-200">
                <img
                  src={imageUrl}
                  alt={`Preview ${index + 1}`}
                  className="w-full h-full object-cover"
                  data-testid={`img-preview-${index}`}
                />
              </div>
              
              {/* Remove Button */}
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => removeImage(index)}
                className="absolute top-2 right-2 h-6 w-6 p-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                data-testid={`button-remove-image-${index}`}
              >
                <X className="h-3 w-3" />
              </Button>
              
              {/* Image Number */}
              <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                {index + 1}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Instructions */}
      {images.length === 0 && (
        <div className="text-center py-4">
          <ImageIcon className="h-12 w-12 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-500">
            Adicione até {maxImages} imagens do seu produto ou serviço
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Imagens ajudam a atrair mais interesse no seu anúncio
          </p>
        </div>
      )}
    </div>
  );
}