"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// data for nav items
const navItems = [
  { href: "/", label: "Overview" },
  { href: "/property-estimator", label: "Property Estimator" },
  { href: "/market-analysis", label: "Market Analysis" },
];

// nav component for the portal shell
// renders the top navigation bar with active link highlighting based on the current pathname
export function PortalShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="portal-shell">
      <header className="topbar">
        <div className="brand-group">
          <div className="brand-mark">P</div>
          <div>
            <p className="eyebrow">Property intelligence</p>
            <h1>Portal</h1>
          </div>
        </div>

        <nav className="topnav" aria-label="Main navigation">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={pathname === item.href ? "nav-link active" : "nav-link"}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>

      <main className="content-area">{children}</main>

      <footer className="footer">
        <span>Integrated ML portfolio</span>
        <span>Task 1 model + Task 2 portal</span>
      </footer>
    </div>
  );
}
