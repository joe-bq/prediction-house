import type { Metadata } from "next";
import "./globals.css";
import { PortalShell } from "@/components/portal-shell";

export const metadata: Metadata = {
  title: "Property Intelligence Portal",
  description: "Unified portal for property estimation and market analysis applications.",
};

// root layout, use PortalShell to wrap all pages with consistent navigation and footer
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <PortalShell>{children}</PortalShell>
      </body>
    </html>
  );
}
