// src/app/providers.tsx
'use client';

import { AuthProvider } from '@/context/AuthContext';
import { UserProvider } from '@/context/UserContext';
import GameProgressInitializer from '@/components/common/GameProgressInitializer';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <UserProvider>
        <GameProgressInitializer />
        {children}
      </UserProvider>
    </AuthProvider>
  );
}