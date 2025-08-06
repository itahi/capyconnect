import type { Category } from "@shared/schema";
import { Link } from "wouter";
import NewsletterSignup from "./newsletter-signup";

interface CategorySidebarProps {
  categories?: Category[];
  isLoading?: boolean;
}

export default function CategorySidebar({ categories, isLoading }: CategorySidebarProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 sticky top-24">
        <h3 className="font-bold text-lg mb-4 text-gray-800">Categorias</h3>
        <nav className="space-y-2">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="flex items-center justify-between py-2 px-3 rounded-lg animate-pulse">
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 bg-gray-200 rounded"></div>
                <div className="w-20 h-4 bg-gray-200 rounded"></div>
              </div>
              <div className="w-8 h-4 bg-gray-200 rounded"></div>
            </div>
          ))}
        </nav>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 sticky top-24">
      <h3 className="font-bold text-lg mb-4 text-gray-800">Categorias</h3>
      <nav className="space-y-2">
        {categories?.map((category) => (
          <Link 
            key={category.id} 
            href={`/categoria/${category.slug}`}
            className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <span className="flex items-center space-x-3">
              <i className={`${category.icon} text-brasil-blue`}></i>
              <span>{category.name}</span>
            </span>
            <span className="text-gray-400 text-sm">{category.dealCount}</span>
          </Link>
        ))}
      </nav>

      <NewsletterSignup />
    </div>
  );
}
