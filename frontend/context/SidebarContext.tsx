"use client";

import { createContext, useContext, useState, useCallback } from "react";

interface SidebarContextValue {
  refreshTrigger: number;
  triggerRefresh: () => void;
}

const SidebarContext = createContext<SidebarContextValue>({
  refreshTrigger: 0,
  triggerRefresh: () => {},
});

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const triggerRefresh = useCallback(() => setRefreshTrigger((n) => n + 1), []);

  return (
    <SidebarContext.Provider value={{ refreshTrigger, triggerRefresh }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  return useContext(SidebarContext);
}
