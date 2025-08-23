import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ImageUploaderProps {
  onImagesChange: (imageUrls: string[]) => void;
  maxImages?: number;
  className?: string;
}

export function ImageUploader({ onImagesChange, maxImages = 8, className = "" }: ImageUploaderProps) {
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    if (files.length === 0) return;

    // Check if adding these files would exceed max images
    if (uploadedImages.length + files.length > maxImages) {
      toast({
        title: "Muitas imagens",
        description: `Você pode adicionar no máximo ${maxImages} imagens`,
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      const newImageUrls: string[] = [];

      for (const file of files) {
        // Validate file type
        if (!file.type.startsWith('image/')) {
          toast({
            title: "Arquivo inválido",
            description: `${file.name} não é uma imagem válida`,
            variant: "destructive",
          });
          continue;
        }

        // Check file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
          toast({
            title: "Arquivo muito grande",
            description: `${file.name} excede o limite de 10MB`,
            variant: "destructive",
          });
          continue;
        }

        // Get upload URL from server
        const uploadResponse = await fetch('/api/images/upload', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!uploadResponse.ok) {
          throw new Error('Falha ao obter URL de upload');
        }

        const { uploadURL, imageId } = await uploadResponse.json();

        // Process image in browser before upload (basic resize)
        const processedFile = await processImageFile(file);

        // Upload to object storage
        const uploadResult = await fetch(uploadURL, {
          method: 'PUT',
          body: processedFile,
          headers: {
            'Content-Type': file.type,
          },
        });

        if (!uploadResult.ok) {
          throw new Error('Falha no upload da imagem');
        }

        // The processed image URL for display
        const imageUrl = `/api/images/${imageId}`;
        newImageUrls.push(imageUrl);
      }

      const updatedImages = [...uploadedImages, ...newImageUrls];
      setUploadedImages(updatedImages);
      onImagesChange(updatedImages);

      if (newImageUrls.length > 0) {
        toast({
          title: "Upload concluído!",
          description: `${newImageUrls.length} imagem(s) carregada(s) com sucesso`,
        });
      }

    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Erro no upload",
        description: "Ocorreu um erro ao fazer upload das imagens",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const processImageFile = async (file: File): Promise<File> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      const img = new Image();

      img.onload = () => {
        // Mercado Livre style dimensions
        const maxWidth = 1200;
        const maxHeight = 900;
        
        let { width, height } = img;

        // Calculate new dimensions maintaining aspect ratio
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(
          (blob) => {
            const processedFile = new File([blob!], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            resolve(processedFile);
          },
          'image/jpeg',
          0.85 // Quality similar to Mercado Livre
        );
      };

      img.src = URL.createObjectURL(file);
    });
  };

  const removeImage = (indexToRemove: number) => {
    const updatedImages = uploadedImages.filter((_, index) => index !== indexToRemove);
    setUploadedImages(updatedImages);
    onImagesChange(updatedImages);
  };

  const openFileSelector = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">Imagens do Anúncio</h3>
        <span className="text-sm text-gray-500">
          {uploadedImages.length} de {maxImages} imagens
        </span>
      </div>

      {/* Upload Area */}
      <Card className="border-2 border-dashed border-gray-300 hover:border-primary-yellow transition-colors">
        <CardContent className="p-6">
          <div className="text-center">
            <Button
              type="button"
              variant="outline"
              onClick={openFileSelector}
              disabled={isUploading || uploadedImages.length >= maxImages}
              className="mb-4"
            >
              <Upload className="h-4 w-4 mr-2" />
              {isUploading ? 'Fazendo upload...' : 'Adicionar Imagens'}
            </Button>
            
            <p className="text-sm text-gray-600 mb-2">
              Clique para selecionar imagens ou arraste aqui
            </p>
            <p className="text-xs text-gray-500">
              Formatos aceitos: JPG, PNG, WebP • Máximo 10MB por imagem
              <br />
              As imagens serão redimensionadas automaticamente para otimizar a visualização
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        className="hidden"
        data-testid="file-input"
      />

      {/* Image Preview Grid */}
      {uploadedImages.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {uploadedImages.map((imageUrl, index) => (
            <div key={index} className="relative group">
              <Card className="overflow-hidden">
                <div className="aspect-square relative bg-gray-100">
                  <img
                    src={imageUrl}
                    alt={`Upload ${index + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2Y3ZjdmNyIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OTk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlbTwvdGV4dD48L3N2Zz4=';
                    }}
                  />
                  
                  {/* Remove button */}
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => removeImage(index)}
                    data-testid={`remove-image-${index}`}
                  >
                    <X className="h-3 w-3" />
                  </Button>

                  {/* Image number badge */}
                  <div className="absolute bottom-1 left-1 bg-black/50 text-white text-xs px-2 py-1 rounded">
                    {index + 1}
                  </div>
                </div>
              </Card>
            </div>
          ))}
        </div>
      )}

      {/* Tips */}
      {uploadedImages.length === 0 && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <ImageIcon className="h-5 w-5 text-blue-500 mt-0.5" />
              <div className="text-sm text-blue-700">
                <p className="font-medium mb-1">Dicas para melhores fotos:</p>
                <ul className="space-y-1 text-xs">
                  <li>• Use boa iluminação natural</li>
                  <li>• Tire fotos de diferentes ângulos</li>
                  <li>• A primeira imagem será a capa do anúncio</li>
                  <li>• Imagens nítidas vendem mais</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}