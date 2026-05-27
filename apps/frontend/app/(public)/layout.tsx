import type { ReactNode } from "react";
import { Logo } from "../Logo";
import { Glows } from "@/components/Glows/Glows";

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <main>
      <div className="relative h-screen flex items-center justify-center bg-gradient-to-br from-base-300 via-base-200 to-base-100 px-4 overflow-hidden">
        {/* <Glows /> */}

        <div className="absolute top-8">
          <Logo isPublic />
        </div>
        
        {children}
      </div>
    </main>
  );
}
