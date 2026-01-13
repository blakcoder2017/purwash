
import React, { useEffect, useState } from 'react';
import { useOrder } from '../../hooks/useOrder';
import Stepper from '../../components/Stepper';
import PricingFooter from '../../components/PricingFooter';
import Header from '../../components/Header';
import Loading from '../../components/Loading';
import ErrorDisplay from '../../components/ErrorDisplay';
import SearchAndFilter from '../../components/SearchAndFilter';
import CatalogItemCard from '../../components/CatalogItemCard';
import { api } from '../../services/api';
import { LaundryItem } from '../../types';

interface SelectionStepProps {
  onNext: () => void;
}

const SelectionStep: React.FC<SelectionStepProps> = ({ onNext }) => {
  const { order, updateItems, setCatalog, pricingPreview, isCalculatingPrice } = useOrder();
  const [catalog, setCatalogState] = useState<LaundryItem[]>([]);
  const [filteredCatalog, setFilteredCatalog] = useState<LaundryItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        setError(null);
        const { items } = await api.getCatalog();
        setCatalogState(items);
        setFilteredCatalog(items);
        setCatalog(items);
        
        // Extract unique categories
        const uniqueCategories = [...new Set(items.map(item => item.category))];
        setCategories(uniqueCategories);
      } catch(error) {
        console.error("Failed to load catalog", error);
        setError(error instanceof Error ? error.message : "Failed to load catalog");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchCatalog();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getItemQuantity = (itemId: string) => {
    return order.items.find(item => item.itemId === itemId)?.quantity || 0;
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    filterCatalog(query, 'all', 0, 1000);
  };

  const handleCategoryFilter = (category: string) => {
    filterCatalog(searchQuery, category, 0, 1000);
  };

  const handlePriceFilter = (minPrice: number, maxPrice: number) => {
    filterCatalog(searchQuery, 'all', minPrice, maxPrice);
  };

  const filterCatalog = (query: string, category: string, minPrice: number, maxPrice: number) => {
    let filtered = catalog;

    // Filter by search query
    if (query) {
      filtered = filtered.filter(item => 
        item.name.toLowerCase().includes(query.toLowerCase()) ||
        item.description.toLowerCase().includes(query.toLowerCase())
      );
    }

    // Filter by category
    if (category) {
      filtered = filtered.filter(item => item.category === category);
    }

    // Filter by price range
    filtered = filtered.filter(item => 
      item.pricing.clientPrice >= minPrice && item.pricing.clientPrice <= maxPrice
    );

    setFilteredCatalog(filtered);
  };

  const handleRetry = () => {
    setIsLoading(true);
    setError(null);
    // Refetch catalog
    const fetchCatalog = async () => {
      try {
        const { items } = await api.getCatalog();
        setCatalogState(items);
        setFilteredCatalog(items);
        setCatalog(items);
      } catch(error) {
        setError(error instanceof Error ? error.message : "Failed to load catalog");
      } finally {
        setIsLoading(false);
      }
    };
    fetchCatalog();
  };

  if (isLoading) {
    return (
      <div>
        <Header title="What are we washing?" />
        <Loading message="Loading laundry items..." />
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <Header title="What are we washing?" />
        <ErrorDisplay 
          message={error} 
          onRetry={handleRetry}
          onDismiss={() => setError(null)}
        />
      </div>
    );
  }

  return (
    <div>
      <Header title="What are we washing?" />
      
      {/* Search and Filters */}
      <SearchAndFilter
        onSearch={handleSearch}
        onCategoryFilter={handleCategoryFilter}
        onPriceFilter={handlePriceFilter}
        categories={categories}
        isLoading={isCalculatingPrice}
      />

      {/* Catalog Items */}
      <div className="p-4 pb-40">
        {filteredCatalog.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">🔍</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No items found</h3>
            <p className="text-gray-600">
              Try adjusting your filters or search terms
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredCatalog.map(item => (
              <CatalogItemCard
                key={item._id}
                item={item}
                quantity={getItemQuantity(item._id)}
                onQuantityChange={updateItems}
                isLoading={isCalculatingPrice}
              />
            ))}
          </div>
        )}
      </div>

      <PricingFooter
        total={pricingPreview?.pricing.totalAmount || 0}
        onNext={onNext}
        disabled={order.items.length === 0 || isCalculatingPrice}
        buttonText={isCalculatingPrice ? "Calculating..." : "Next"}
      />
    </div>
  );
};

export default SelectionStep;
