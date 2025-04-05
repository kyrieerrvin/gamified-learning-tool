'use client';

import { useState, useEffect, ReactNode } from 'react';

// A wrapper component that only renders its children on the client side
// This prevents hydration issues by ensuring content is only rendered client-side
export default function ClientOnly({ children, fallback = null }: { children: ReactNode, fallback?: ReactNode }) {
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  if (!isClient) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
}
