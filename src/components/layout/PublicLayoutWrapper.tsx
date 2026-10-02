"use client";

import { usePathname } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { KSRAssistantWidget } from "@/components/ui/KSRAssistantWidget";
import { Toaster } from "sonner";
import { BackToTopButton } from "@/components/ui/BackToTopButton";

export function PublicLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith('/admin');

  if (isAdmin) {
    return (
      <div className="min-h-screen w-full">
        {children}
        <Toaster 
          position="top-right" 
          richColors 
          closeButton 
          toastOptions={{
            classNames: {
              closeButton: '!absolute !right-4 !left-auto !top-[50%] !-translate-y-[50%] !mt-2 !bg-transparent !border-0 !shadow-none !text-current opacity-70 hover:opacity-100 !w-6 !h-6 [&_svg]:!w-4 [&_svg]:!h-4 flex justify-center items-center transition-opacity'
            }
          }}
        />
      </div>
    );
  }

  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:rounded-lg focus:bg-orange-500 focus:px-4 focus:py-2 focus:text-white focus:font-semibold focus:shadow-lg"
      >
        Skip to main content
      </a>
      <Navbar />
      <main id="main-content" tabIndex={-1} className="flex-1 outline-none">
        {children}
      </main>
      <Footer />
      <KSRAssistantWidget />
      <BackToTopButton />
      <Toaster 
        position="top-right" 
        richColors 
        closeButton 
        toastOptions={{
          classNames: {
            closeButton: '!absolute !right-4 !left-auto !top-[50%] !-translate-y-[50%] !mt-2 !bg-transparent !border-0 !shadow-none !text-current opacity-70 hover:opacity-100 !w-6 !h-6 [&_svg]:!w-4 [&_svg]:!h-4 flex justify-center items-center transition-opacity'
          }
        }}
      />
    </>
  );
}
