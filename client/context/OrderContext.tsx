
import React, { createContext, useState, ReactNode, useCallback } from 'react';
import { Order, OrderItem, Coordinates, LaundryItem, PricingPreview } from '../types';
import { api } from '../services/api';

interface OrderContextType {
  order: Order;
  catalog: LaundryItem[];
  pricingPreview: PricingPreview | null;
  setCatalog: (items: LaundryItem[]) => void;
  updateItems: (itemId: string, quantity: number) => void;
  updateLocation: (coordinates: Coordinates, landmark: string) => void;
  updateContact: (phone: string, email: string) => void;
  resetOrder: () => void;
  isCalculatingPrice: boolean;
}

const initialOrderState: Order = {
  items: [],
  coordinates: null,
  landmark: '',
  phone: '',
  email: '',
};

export const OrderContext = createContext<OrderContextType | undefined>(undefined);

export const OrderProvider = ({ children }: { children: ReactNode }) => {
  const [order, setOrder] = useState<Order>(initialOrderState);
  const [catalog, setCatalog] = useState<LaundryItem[]>([]);
  const [pricingPreview, setPricingPreview] = useState<PricingPreview | null>(null);
  const [isCalculatingPrice, setIsCalculatingPrice] = useState(false);
  
  const calculatePrice = async (items: OrderItem[]) => {
      if(items.length === 0) {
          setPricingPreview(null);
          return;
      }
      setIsCalculatingPrice(true);
      try {
          const preview = await api.calculatePreview(items);
          setPricingPreview(preview);
      } catch (error) {
          console.error("Failed to calculate price", error);
      } finally {
          setIsCalculatingPrice(false);
      }
  };

  const updateItems = useCallback((itemId: string, quantity: number) => {
    setOrder(prevOrder => {
      const existingItemIndex = prevOrder.items.findIndex(item => item.itemId === itemId);
      let newItems: OrderItem[];

      if (existingItemIndex > -1) {
        if (quantity > 0) {
          newItems = prevOrder.items.map((item, index) =>
            index === existingItemIndex ? { ...item, quantity } : item
          );
        } else {
          newItems = prevOrder.items.filter((_, index) => index !== existingItemIndex);
        }
      } else if (quantity > 0) {
        newItems = [...prevOrder.items, { itemId, quantity }];
      } else {
        newItems = prevOrder.items;
      }
      
      calculatePrice(newItems);
      return { ...prevOrder, items: newItems };
    });
  }, []);

  const updateLocation = useCallback((coordinates: Coordinates, landmark: string) => {
    setOrder(prevOrder => ({ ...prevOrder, coordinates, landmark }));
  }, []);

  const updateContact = useCallback((phone: string, email: string) => {
    setOrder(prevOrder => ({ ...prevOrder, phone, email }));
  }, []);

  const resetOrder = useCallback(() => {
    setOrder(initialOrderState);
    setPricingPreview(null);
  }, []);


  const value = {
    order,
    catalog,
    pricingPreview,
    isCalculatingPrice,
    setCatalog,
    updateItems,
    updateLocation,
    updateContact,
    resetOrder,
  };

  return (
    <OrderContext.Provider value={value}>
      {children}
    </OrderContext.Provider>
  );
};
