import { createContext } from 'react';
import type { FeatureFlagsContextType } from './FeatureFlagsContext.types';

export const FeatureFlagsContext = createContext<FeatureFlagsContextType | undefined>(undefined);