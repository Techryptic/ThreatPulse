import { ReactNode, useEffect } from 'react';

export function ThemeProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    // Initialize dark mode by default
    document.documentElement.classList.add('dark');
  }, []);

  return <>{children}</>;
}
