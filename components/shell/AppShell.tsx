'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, Search, X } from 'lucide-react';
import { useAtlasStore } from '@/lib/store';
import { buyerNav, buyerProfileNav, sellerNav, sellerProfileNav } from '@/lib/nav';
import { RoleSwitcher } from './RoleSwitcher';
import { HelpButton } from './HelpButton';
import { NotificationsBell } from './NotificationsBell';
import { TourOverlay } from '@/components/tour/TourOverlay';
import { DemoPanel } from '@/components/demo/DemoPanel';

export function AppShell({ children }: { children: React.ReactNode }) {
  const role = useAtlasStore((s) => s.role);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const nav = role === 'buyer' ? buyerNav : sellerNav;
  const profileItem = role === 'buyer' ? buyerProfileNav : sellerProfileNav;

  return (
    <div className="min-h-screen bg-paper">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-60 flex-col border-r border-line bg-surface lg:flex">
        <div className="flex h-16 items-center px-5">
          <Link href="/" className="text-base font-semibold text-ink">
            Atlas
          </Link>
        </div>
        <SidebarNav nav={nav} profileItem={profileItem} />
      </aside>

      <div className="lg:pl-60">
        <TopBar onOpenMobileNav={() => setMobileNavOpen(true)} role={role} />
        <main className="mx-auto max-w-[1200px] px-4 pb-24 pt-5 sm:px-6 sm:pb-8 lg:px-8">{children}</main>
      </div>

      {/* Mobile bottom tabs */}
      <nav className="fixed inset-x-0 bottom-0 z-30 flex border-t border-line bg-surface sm:hidden" aria-label="Primary">
        {nav.map((item) => (
          <BottomTabLink key={item.href} href={item.href} label={item.label} icon={item.icon} />
        ))}
      </nav>

      {/* Tablet / mobile nav drawer (also serves as the mobile "account sheet") */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-ink/30" onClick={() => setMobileNavOpen(false)} />
          <div className="absolute inset-y-0 left-0 flex w-72 flex-col gap-4 bg-surface p-5 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-base font-semibold">Atlas</span>
              <button type="button" aria-label="Close menu" onClick={() => setMobileNavOpen(false)} className="text-ink-muted hover:text-ink">
                <X size={18} />
              </button>
            </div>
            <RoleSwitcher />
            <SidebarNav nav={nav} profileItem={profileItem} onNavigate={() => setMobileNavOpen(false)} />
          </div>
        </div>
      )}

      <TourOverlay />
      <DemoPanel />
    </div>
  );
}

function SidebarNav({
  nav,
  profileItem,
  onNavigate,
}: {
  nav: { label: string; href: string; icon: React.ElementType }[];
  profileItem: { label: string; href: string; icon: React.ElementType };
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const isActive = (href: string) => (href === '/buyer' || href === '/seller' ? pathname === href : pathname.startsWith(href));
  return (
    <nav className="flex flex-1 flex-col justify-between px-3 py-4">
      <ul className="space-y-0.5">
        {nav.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              onClick={onNavigate}
              className={`flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium ${
                isActive(item.href) ? 'bg-primary-soft text-primary' : 'text-ink-muted hover:bg-primary-soft hover:text-ink'
              }`}
            >
              <item.icon size={16} />
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
      <Link
        href={profileItem.href}
        onClick={onNavigate}
        className={`flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium ${
          isActive(profileItem.href) ? 'bg-primary-soft text-primary' : 'text-ink-muted hover:bg-primary-soft hover:text-ink'
        }`}
      >
        <profileItem.icon size={16} />
        {profileItem.label}
      </Link>
    </nav>
  );
}

function BottomTabLink({ href, label, icon: Icon }: { href: string; label: string; icon: React.ElementType }) {
  const pathname = usePathname();
  const active = href === '/buyer' || href === '/seller' ? pathname === href : pathname.startsWith(href);
  return (
    <Link href={href} className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium ${active ? 'text-primary' : 'text-ink-muted'}`}>
      <Icon size={18} />
      {label}
    </Link>
  );
}

function TopBar({ onOpenMobileNav, role }: { onOpenMobileNav: () => void; role: 'buyer' | 'seller' }) {
  const router = useRouter();
  const [query, setQuery] = useState('');

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-line bg-surface px-4 sm:px-6 lg:px-8">
      <button type="button" aria-label="Open menu" onClick={onOpenMobileNav} className="text-ink-muted hover:text-ink lg:hidden">
        <Menu size={20} />
      </button>

      {role === 'buyer' ? (
        <form
          className="hidden flex-1 max-w-sm items-center gap-2 rounded-md border border-line bg-paper px-3 sm:flex"
          onSubmit={(e) => {
            e.preventDefault();
            router.push(`/buyer/lots?q=${encodeURIComponent(query)}`);
          }}
        >
          <Search size={15} className="text-ink-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search lots"
            className="h-9 w-full bg-transparent text-sm text-ink outline-none placeholder:text-ink-muted"
          />
        </form>
      ) : (
        <div className="flex-1" />
      )}

      <div className="flex items-center gap-1.5">
        <NotificationsBell />
        <HelpButton />
        <div className="ml-2 hidden lg:block">
          <RoleSwitcher />
        </div>
      </div>
    </header>
  );
}
