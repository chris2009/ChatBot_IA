"use client";

import Sidebar from "@/components/Sidebar";
import Footer from "@/components/Footer";
import { SidebarProvider, useSidebar } from "@/context/SidebarContext";

function LayoutInner({ children }: { children: React.ReactNode }) {
  const { refreshTrigger } = useSidebar();

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-1 overflow-hidden">
        <Sidebar refreshTrigger={refreshTrigger} />
        <main className="flex-1 flex flex-col overflow-hidden">{children}</main>
      </div>
      <Footer />
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
