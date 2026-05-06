"use client";

import Sidebar from "@/components/Sidebar";
import { SidebarProvider, useSidebar } from "@/context/SidebarContext";

function LayoutInner({ children }: { children: React.ReactNode }) {
  const { refreshTrigger } = useSidebar();

  return (
    <div className="flex h-full overflow-hidden">
      <Sidebar refreshTrigger={refreshTrigger} />
      <main className="flex-1 flex flex-col overflow-hidden">{children}</main>
    </div>
  );
}

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <LayoutInner>{children}</LayoutInner>
    </SidebarProvider>
  );
}
