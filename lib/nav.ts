import { LayoutDashboard, Search, Gavel, Handshake, User, Package, PlusCircle } from 'lucide-react';

export interface NavItem {
  label: string;
  href: string;
  icon: typeof LayoutDashboard;
}

// PRD 7.1
export const buyerNav: NavItem[] = [
  { label: 'Dashboard', href: '/buyer', icon: LayoutDashboard },
  { label: 'Browse lots', href: '/buyer/lots', icon: Search },
  { label: 'My bids', href: '/buyer/bids', icon: Gavel },
  { label: 'Deals', href: '/buyer/deals', icon: Handshake },
];
export const buyerProfileNav: NavItem = { label: 'Profile', href: '/buyer/profile', icon: User };

// PRD 7.2
export const sellerNav: NavItem[] = [
  { label: 'Dashboard', href: '/seller', icon: LayoutDashboard },
  { label: 'My lots', href: '/seller/lots', icon: Package },
  { label: 'Deals', href: '/seller/deals', icon: Handshake },
  { label: 'Create listing', href: '/seller/lots/new', icon: PlusCircle },
];
export const sellerProfileNav: NavItem = { label: 'Profile', href: '/seller/profile', icon: User };
