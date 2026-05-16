"use client";

import { DesktopSidebar, MobileHeader } from "@/components/global/AppSidebar";
import * as React from "react";

export default function UserMainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop sidebar — sticky, full height */}
      <DesktopSidebar />

      {/* Right side — scrollable content area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Mobile top bar + drawer */}
        <MobileHeader />

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
