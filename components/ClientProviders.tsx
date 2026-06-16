// "use client" directive ensures client-side rendering
"use client";

import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/components/AuthProvider";
import { ConditionalLayout } from "@/components/ConditionalLayout";
import { VKBridgeInitializer } from "@/components/VKBridgeInitializer";
import Script from "next/script";

/**
 * Wraps all client‑side providers needed for the application.
 * This component is used inside the root server layout to keep the layout
 * itself a server component (required for exporting `metadata`).
 */
export default function ClientProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* VK Bridge script must be loaded before the bridge initializer */}
      <Script
        src="https://vk.com/js/api/openapi.js?168"
        strategy="beforeInteractive"
      />
      <VKBridgeInitializer />
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
        <AuthProvider>
          <ConditionalLayout>{children}</ConditionalLayout>
        </AuthProvider>
      </ThemeProvider>
    </>
  );
}
