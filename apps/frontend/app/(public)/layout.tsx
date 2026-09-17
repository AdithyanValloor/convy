

import type { ReactNode } from "react";
import { Logo } from "../Logo";
import { GradientBackground } from "@/components/ui/iris-petal";
import CosmicPattern from "@/components/ui/CosmicPattern";

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <main className="relative isolate h-screen overflow-hidden">
      {/* Background */}

      <div className="absolute inset-0 z-10">
        <CosmicPattern/>
      </div>
      <div className="absolute inset-0 z-0">
        
        <GradientBackground className="h-full w-full" />
      </div>

      {/* Logo */}
      <div className="absolute left-10 top-10 z-20">
        <Logo isPublic />
      </div>

      {/* Content */}
      <div className="relative z-10 flex h-full w-full items-center justify-center px-4">
        {children}
      </div>
    </main>
  );
}