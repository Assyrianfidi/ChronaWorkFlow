import React, { createContext, useContext, useState, ReactNode } from 'react';

interface Entity {
  id: string;
  name: string;
  type: 'company' | 'department' | 'team';
  currency: string;
  timezone: string;
  logoUrl?: string;
}

interface EntityContextType {
  currentEntity: Entity | null;
  setCurrentEntity: (entity: Entity) => void;
  availableEntities: Entity[];
  loading: boolean;
  error: Error | null;
}

const EntityContext = createContext<EntityContextType | undefined>(undefined);

export const EntityProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // In a real app, this would be fetched from an API
  const [currentEntity, setCurrentEntity] = useState<Entity>({
    id: 'ent-001',
    name: 'Acme Corp HQ',
    type: 'company',
    currency: 'USD',
    timezone: 'America/New_York',
    logoUrl: '/logos/acme-corp.png',
  });

  const availableEntities: Entity[] = [
    {
      id: 'ent-001',
      name: 'Acme Corp HQ',
      type: 'company',
      currency: 'USD',
      timezone: 'America/New_York',
      logoUrl: '/logos/acme-corp.png',
    },
    {
      id: 'ent-002',
      name: 'EMEA Region',
      type: 'department',
      currency: 'EUR',
      timezone: 'Europe/Paris',
    },
    {
      id: 'ent-003',
      name: 'APAC Division',
      type: 'department',
      currency: 'SGD',
      timezone: 'Asia/Singapore',
    },
  ];

  return (
    <EntityContext.Provider
      value={{
        currentEntity,
        setCurrentEntity,
        availableEntities,
        loading: false,
        error: null,
      }}
    >
      {children}
    </EntityContext.Provider>
  );
};

export const useEntityContext = () => {
  const context = useContext(EntityContext);
  if (context === undefined) {
    throw new Error('useEntityContext must be used within an EntityProvider');
  }
  return context;
};
