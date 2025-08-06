import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function NewsletterSignup() {
  const [email, setEmail] = useState("");
  const { toast } = useToast();

  const subscribeMutation = useMutation({
    mutationFn: (email: string) => apiRequest("POST", "/api/newsletter/subscribe", { email }),
    onSuccess: () => {
      setEmail("");
      toast({
        title: "Sucesso!",
        description: "Email cadastrado com sucesso! Você receberá as melhores ofertas.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível cadastrar o email. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      subscribeMutation.mutate(email);
    }
  };

  return (
    <div className="mt-8 p-4 bg-gradient-to-br from-brasil-green to-brasil-blue rounded-lg text-white">
      <h4 className="font-semibold mb-2">📧 Alertas de Ofertas</h4>
      <p className="text-sm mb-3 opacity-90">Receba as melhores promoções no seu email</p>
      
      <form onSubmit={handleSubmit} className="space-y-2">
        <Input 
          type="email" 
          placeholder="Seu email" 
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full text-gray-800 text-sm"
          required
        />
        <Button 
          type="submit"
          className="w-full bg-brasil-yellow text-black hover:bg-yellow-400 font-medium text-sm"
          disabled={subscribeMutation.isPending}
        >
          {subscribeMutation.isPending ? "Cadastrando..." : "Cadastrar"}
        </Button>
      </form>
    </div>
  );
}
