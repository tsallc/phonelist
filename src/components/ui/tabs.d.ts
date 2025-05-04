import { ReactNode } from 'react';

export interface TabsProps {
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  children: ReactNode;
  className?: string;
}

export interface TabsListProps {
  children: ReactNode;
  className?: string;
}

export interface TabsTriggerProps {
  value: string;
  disabled?: boolean;
  children: ReactNode;
  className?: string;
}

export interface TabsContentProps {
  value: string;
  children: ReactNode;
  className?: string;
}

export const Tabs: React.FC<TabsProps>;
export const TabsList: React.FC<TabsListProps>;
export const TabsTrigger: React.FC<TabsTriggerProps>;
export const TabsContent: React.FC<TabsContentProps>; 