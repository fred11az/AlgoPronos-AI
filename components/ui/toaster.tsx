'use client';

import { Toaster as HotToaster } from 'react-hot-toast';

export function Toaster() {
  return (
    <HotToaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          background: '#1E293B',
          color: '#F8FAFC',
          border: '1px solid #334155',
          borderRadius: '12px',
          padding: '12px 16px',
        },
        success: {
          iconTheme: {
            primary: '#10B981',
            secondary: '#F8FAFC',
          },
        },
        error: {
          iconTheme: {
            primary: '#EF4444',
            secondary: '#F8FAFC',
          },
        },
      }}
    />
  );
}
