// src/app/providers.tsx
'use client';

import { AuthProvider } from '@/context/AuthContext';
import { UserProvider } from '@/context/UserContext';
import GameProgressInitializer from '@/components/common/GameProgressInitializer';
import ClientOnly from '@/components/common/ClientOnly';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ClientOnly 
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      }
    >
      <AuthProvider>
        <UserProvider>
          <GameProgressInitializer />
          {children}
        </UserProvider>
      </AuthProvider>
    </ClientOnly>
  );
}