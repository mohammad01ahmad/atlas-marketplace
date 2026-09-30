import type { Role } from '@/types';

/**
 * Maps the current path to its equivalent under the other role (PRD 4.2).
 * Falls back to that role's dashboard when there's no direct equivalent.
 */
export function equivalentRoute(pathname: string, toRole: Role): string {
  const dealMatch = pathname.match(/^\/(buyer|seller)\/deals\/([^/]+)/);
  if (dealMatch) return `/${toRole}/deals/${dealMatch[2]}`;

  const bidsMatch = pathname.match(/^\/seller\/lots\/([^/]+)\/bids/);
  if (bidsMatch && toRole === 'buyer') return `/lots/${bidsMatch[1]}`;

  const bidFormMatch = pathname.match(/^\/lots\/([^/]+)\/bid/);
  if (bidFormMatch && toRole === 'seller') return `/seller/lots/${bidFormMatch[1]}/bids`;

  if (/^\/lots\//.test(pathname)) return pathname;

  return toRole === 'buyer' ? '/buyer' : '/seller';
}
