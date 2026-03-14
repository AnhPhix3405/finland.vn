// Service for loading form options like property types and transaction types

import { getPropertyTypes, getTransactionTypes } from './property.service';

export interface SelectOption {
  id: string;
  name: string;
  hashtag?: string;
}

// Load property types for select dropdown
export const loadPropertyTypeOptions = async (): Promise<SelectOption[]> => {
  try {
    const result = await getPropertyTypes({ limit: 100 });
    if (result.success && result.data) {
      return result.data.map(item => ({
        id: item.id,
        name: item.name,
        hashtag: item.hashtag
      }));
    }
    return [];
  } catch (error) {
    console.error('Error loading property type options:', error);
    return [];
  }
};

// Load transaction types for select dropdown  
export const loadTransactionTypeOptions = async (): Promise<SelectOption[]> => {
  try {
    const result = await getTransactionTypes({ limit: 100 });
    if (result.success && result.data) {
      return result.data.map(item => ({
        id: item.id,
        name: item.name,
        hashtag: item.hashtag
      }));
    }
    return [];
  } catch (error) {
    console.error('Error loading transaction type options:', error);
    return [];
  }
};

// Load all form options at once
export const loadAllFormOptions = async () => {
  const [propertyTypes, transactionTypes] = await Promise.all([
    loadPropertyTypeOptions(),
    loadTransactionTypeOptions()
  ]);
  
  return {
    propertyTypes,
    transactionTypes
  };
};