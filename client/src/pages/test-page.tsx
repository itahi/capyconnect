export default function TestPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Página de Teste - Postar Anúncio</h1>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Formulário de Teste</h2>
          
          <form className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Título
              </label>
              <input 
                type="text" 
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Digite o título do anúncio"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descrição
              </label>
              <textarea 
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Descreva seu anúncio"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categoria
              </label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-md">
                <option value="">Selecione uma categoria</option>
                <option value="service">Serviços</option>
                <option value="product">Produtos</option>
                <option value="job">Vagas</option>
                <option value="news">Notícias</option>
              </select>
            </div>
            
            <button 
              type="submit"
              className="w-full bg-yellow-500 text-white py-2 px-4 rounded-md hover:bg-yellow-600"
            >
              Publicar Anúncio
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}