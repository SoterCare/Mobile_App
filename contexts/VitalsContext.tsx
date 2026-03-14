import React, { createContext, useContext, useState, ReactNode } from 'react';

// Define the shape of our vitals data
export interface VitalsData {
  heartRate: number | null;
  spO2: number | null;
  fallDetected: boolean;
  batteryLevel: number | null;
  accelerometer: { x: number; y: number; z: number } | null;
}

// Define the context shape
interface VitalsContextType {
  vitals: VitalsData;
  updateVitals: (newData: Partial<VitalsData>) => void;
  resetVitals: () => void;
}

// Initial empty state
const defaultVitals: VitalsData = {
  heartRate: null,
  spO2: null,
  fallDetected: false,
  batteryLevel: null,
  accelerometer: null,
};

// Create the context
const VitalsContext = createContext<VitalsContextType | undefined>(undefined);

interface VitalsProviderProps {
  children: ReactNode;
}

export const VitalsProvider: React.FC<VitalsProviderProps> = ({ children }) => {
  const [vitals, setVitals] = useState<VitalsData>(defaultVitals);

  // Helper to update specific vitals without overwriting others
  const updateVitals = (newData: Partial<VitalsData>) => {
    setVitals((prev) => ({
      ...prev,
      ...newData,
    }));
  };

  // Reset to default when disconnecting
  const resetVitals = () => {
    setVitals(defaultVitals);
  };

  const value: VitalsContextType = {
    vitals,
    updateVitals,
    resetVitals,
  };

  return (
    <VitalsContext.Provider value={value}>
      {children}
    </VitalsContext.Provider>
  );
};

// Custom hook to consume the context
export const useVitals = (): VitalsContextType => {
  const context = useContext(VitalsContext);
  if (context === undefined) {
    throw new Error('useVitals must be used within a VitalsProvider');
  }
  return context;
};
