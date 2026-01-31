import { useState, useEffect, useCallback } from "react";

const FORM_STORAGE_KEY = "auralis_form_data";
const DEBOUNCE_MS = 300;

interface FormData {
  [formId: string]: {
    data: Record<string, any>;
    lastUpdated: number;
  };
}

export const useFormPersistence = <T extends Record<string, any>>(
  formId: string,
  initialData: T
) => {
  const [formData, setFormData] = useState<T>(() => {
    try {
      const saved = sessionStorage.getItem(FORM_STORAGE_KEY);
      if (saved) {
        const allForms = JSON.parse(saved) as FormData;
        if (allForms[formId]) {
          // Check if data is fresh (within 1 hour)
          if (Date.now() - allForms[formId].lastUpdated < 60 * 60 * 1000) {
            return { ...initialData, ...allForms[formId].data };
          }
        }
      }
    } catch (error) {
      console.error("Error loading form data:", error);
    }
    return initialData;
  });

  const [saveTimeout, setSaveTimeout] = useState<NodeJS.Timeout | null>(null);

  // Debounced save
  const saveFormData = useCallback((data: T) => {
    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }

    const timeout = setTimeout(() => {
      try {
        const savedStr = sessionStorage.getItem(FORM_STORAGE_KEY);
        const allForms: FormData = savedStr ? JSON.parse(savedStr) : {};
        
        allForms[formId] = {
          data,
          lastUpdated: Date.now(),
        };
        
        sessionStorage.setItem(FORM_STORAGE_KEY, JSON.stringify(allForms));
      } catch (error) {
        console.error("Error saving form data:", error);
      }
    }, DEBOUNCE_MS);

    setSaveTimeout(timeout);
  }, [formId, saveTimeout]);

  // Update form data
  const updateFormData = useCallback((updates: Partial<T>) => {
    setFormData(prev => {
      const newData = { ...prev, ...updates };
      saveFormData(newData);
      return newData;
    });
  }, [saveFormData]);

  // Set a single field
  const setField = useCallback(<K extends keyof T>(key: K, value: T[K]) => {
    setFormData(prev => {
      const newData = { ...prev, [key]: value };
      saveFormData(newData);
      return newData;
    });
  }, [saveFormData]);

  // Clear form data
  const clearFormData = useCallback(() => {
    try {
      const savedStr = sessionStorage.getItem(FORM_STORAGE_KEY);
      if (savedStr) {
        const allForms: FormData = JSON.parse(savedStr);
        delete allForms[formId];
        sessionStorage.setItem(FORM_STORAGE_KEY, JSON.stringify(allForms));
      }
    } catch (error) {
      console.error("Error clearing form data:", error);
    }
    setFormData(initialData);
  }, [formId, initialData]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (saveTimeout) {
        clearTimeout(saveTimeout);
      }
    };
  }, [saveTimeout]);

  // Save immediately when page becomes hidden
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        try {
          const savedStr = sessionStorage.getItem(FORM_STORAGE_KEY);
          const allForms: FormData = savedStr ? JSON.parse(savedStr) : {};
          
          allForms[formId] = {
            data: formData,
            lastUpdated: Date.now(),
          };
          
          sessionStorage.setItem(FORM_STORAGE_KEY, JSON.stringify(allForms));
        } catch (error) {
          console.error("Error saving form on hide:", error);
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [formId, formData]);

  return {
    formData,
    setFormData: updateFormData,
    setField,
    clearFormData,
  };
};
