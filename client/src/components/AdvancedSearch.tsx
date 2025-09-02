import { useState } from "react";
import { Search, Filter, X, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useQuery } from "@tanstack/react-query";
import type { Category } from "@shared/schema";

interface SearchFilters {
  search: string;
  categoryId: string;
  minPrice: string;
  maxPrice: string;
  location: string;
  store: string;
  type: string;
}

interface AdvancedSearchProps {
  onSearch: (filters: SearchFilters) => void;
  initialFilters?: Partial<SearchFilters>;
}

export function AdvancedSearch({ onSearch, initialFilters = {} }: AdvancedSearchProps) {
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    search: initialFilters.search || "",
    categoryId: initialFilters.categoryId || "",
    minPrice: initialFilters.minPrice || "",
    maxPrice: initialFilters.maxPrice || "",
    location: initialFilters.location || "",
    store: initialFilters.store || "",
    type: initialFilters.type || "",
  });

  const { data: categories } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const handleFilterChange = (key: keyof SearchFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(filters);
  };

  const clearFilters = () => {
    const emptyFilters = {
      search: "",
      categoryId: "",
      minPrice: "",
      maxPrice: "",
      location: "",
      store: "",
      type: "",
    };
    setFilters(emptyFilters);
    onSearch(emptyFilters);
  };

  const hasActiveFilters = Object.values(filters).some(value => value !== "");
  const hasAdvancedFilters = filters.categoryId || filters.minPrice || filters.maxPrice || filters.location || filters.store || filters.type;

  const categoryTypes = [
    { value: "", label: "Todos os tipos" },
    { value: "service", label: "Serviços" },
    { value: "product", label: "Produtos" },
    { value: "job", label: "Vagas" },
    { value: "news", label: "Notícias" },
  ];

  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        <form onSubmit={handleSearch}>
          {/* Main Search Bar */}
          <div className="flex gap-3 mb-4">
            <div className="flex-1 relative">
              <Input
                type="text"
                placeholder="Busque por serviços, produtos, vagas..."
                value={filters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
                className="pl-10 pr-4"
                data-testid="input-search"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
            
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsFiltersOpen(!isFiltersOpen)}
              className={`flex items-center gap-2 ${hasAdvancedFilters ? 'border-purple-500 text-purple-600' : ''}`}
              data-testid="button-toggle-filters"
            >
              <Filter className="h-4 w-4" />
              Filtros
              {hasAdvancedFilters && (
                <span className="bg-purple-500 text-white text-xs px-2 py-1 rounded-full">
                  {Object.values(filters).filter(v => v !== "" && v !== filters.search).length}
                </span>
              )}
              <ChevronDown className={`h-4 w-4 transition-transform ${isFiltersOpen ? 'rotate-180' : ''}`} />
            </Button>

            <Button
              type="submit"
              className="bg-purple-600 hover:bg-purple-700 text-white px-8"
              data-testid="button-search"
            >
              Buscar
            </Button>
          </div>

          {/* Advanced Filters */}
          <Collapsible open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
            <CollapsibleContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 bg-purple-50 rounded-lg">
                {/* Type Filter */}
                <div className="space-y-2">
                  <Label htmlFor="type-filter">Tipo</Label>
                  <Select 
                    value={filters.type} 
                    onValueChange={(value) => handleFilterChange("type", value)}
                  >
                    <SelectTrigger data-testid="select-type">
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {categoryTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Category Filter */}
                <div className="space-y-2">
                  <Label htmlFor="category-filter">Categoria</Label>
                  <Select 
                    value={filters.categoryId} 
                    onValueChange={(value) => handleFilterChange("categoryId", value)}
                  >
                    <SelectTrigger data-testid="select-category">
                      <SelectValue placeholder="Selecione a categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todas as categorias</SelectItem>
                      {categories?.filter(cat => !filters.type || cat.type === filters.type).map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.icon} {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Location Filter */}
                <div className="space-y-2">
                  <Label htmlFor="location-filter">Localização</Label>
                  <Input
                    id="location-filter"
                    type="text"
                    placeholder="Ex: São Paulo, SP"
                    value={filters.location}
                    onChange={(e) => handleFilterChange("location", e.target.value)}
                    data-testid="input-location"
                  />
                </div>

                {/* Price Range */}
                <div className="space-y-2">
                  <Label>Faixa de Preço (R$)</Label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="Min"
                      value={filters.minPrice}
                      onChange={(e) => handleFilterChange("minPrice", e.target.value)}
                      min="0"
                      step="0.01"
                      data-testid="input-min-price"
                    />
                    <Input
                      type="number"
                      placeholder="Max"
                      value={filters.maxPrice}
                      onChange={(e) => handleFilterChange("maxPrice", e.target.value)}
                      min="0"
                      step="0.01"
                      data-testid="input-max-price"
                    />
                  </div>
                </div>

                {/* Store Filter */}
                <div className="space-y-2">
                  <Label htmlFor="store-filter">Loja/Vendedor</Label>
                  <Input
                    id="store-filter"
                    type="text"
                    placeholder="Nome da loja ou vendedor"
                    value={filters.store}
                    onChange={(e) => handleFilterChange("store", e.target.value)}
                    data-testid="input-store"
                  />
                </div>

                {/* Clear Filters Button */}
                <div className="space-y-2">
                  <Label>&nbsp;</Label>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={clearFilters}
                    disabled={!hasActiveFilters}
                    className="w-full flex items-center gap-2"
                    data-testid="button-clear-filters"
                  >
                    <X className="h-4 w-4" />
                    Limpar Filtros
                  </Button>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </form>

        {/* Active Filters Display */}
        {hasAdvancedFilters && (
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="text-sm text-gray-600">Filtros ativos:</span>
            {filters.type && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs">
                Tipo: {categoryTypes.find(t => t.value === filters.type)?.label}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => handleFilterChange("type", "")}
                />
              </span>
            )}
            {filters.categoryId && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs">
                Categoria: {categories?.find(c => c.id === filters.categoryId)?.name}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => handleFilterChange("categoryId", "")}
                />
              </span>
            )}
            {filters.location && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs">
                Local: {filters.location}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => handleFilterChange("location", "")}
                />
              </span>
            )}
            {(filters.minPrice || filters.maxPrice) && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs">
                Preço: R$ {filters.minPrice || "0"} - R$ {filters.maxPrice || "∞"}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => {
                    handleFilterChange("minPrice", "");
                    handleFilterChange("maxPrice", "");
                  }}
                />
              </span>
            )}
            {filters.store && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs">
                Loja: {filters.store}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => handleFilterChange("store", "")}
                />
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}