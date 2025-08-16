import type { Category } from "@shared/schema";
import { Button } from "@/components/ui/button";

interface CategoryTabsProps {
  categories?: Category[];
  activeTab: string;
  onTabChange: (tab: string) => void;
  isLoading?: boolean;
}

export default function CategoryTabs({ categories, activeTab, onTabChange, isLoading }: CategoryTabsProps) {
  if (isLoading) {
    return (
      <div className="py-4">
        <div className="flex space-x-4 overflow-x-auto">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-gray-200 h-10 w-24 rounded-lg animate-pulse flex-shrink-0"></div>
          ))}
        </div>
      </div>
    );
  }

  const tabs = [
    { key: "all", label: "Todos", icon: "fas fa-th-large" },
    { key: "service", label: "Serviços", icon: "fas fa-tools" },
    { key: "product", label: "Produtos", icon: "fas fa-shopping-bag" },
    { key: "job", label: "Vagas", icon: "fas fa-briefcase" },
    { key: "news", label: "Notícias", icon: "fas fa-newspaper" },
  ];

  return (
    <div className="py-4">
      <div className="flex space-x-2 overflow-x-auto">
        {tabs.map((tab) => {
          const categoryCount = tab.key === "all" 
            ? categories?.length || 0
            : categories?.filter(cat => cat.type === tab.key).length || 0;

          return (
            <Button
              key={tab.key}
              variant={activeTab === tab.key ? "default" : "ghost"}
              className={`flex items-center space-x-2 flex-shrink-0 ${
                activeTab === tab.key 
                  ? "bg-primary-purple text-white hover:bg-primary-purple" 
                  : "text-gray-600 hover:text-primary-purple"
              }`}
              onClick={() => onTabChange(tab.key)}
            >
              <i className={tab.icon}></i>
              <span>{tab.label}</span>
              {categoryCount > 0 && (
                <span className={`text-xs px-2 py-1 rounded-full ${
                  activeTab === tab.key 
                    ? "bg-white/20" 
                    : "bg-gray-200 text-gray-600"
                }`}>
                  {categoryCount}
                </span>
              )}
            </Button>
          );
        })}
      </div>
    </div>
  );
}