export interface TourStep {
  text: string;
  href: string; // route the tour navigates to before looking for the anchor
  anchor: string | null; // data-tour value; null = full-screen welcome card
}

// PRD 6.2
export const BUYER_TOUR: TourStep[] = [
  {
    text: 'Atlas is where verified businesses buy sealed surplus lots from UAE warehouses. Your money is only released to the seller after you count the stock.',
    href: '/buyer',
    anchor: null,
  },
  { text: 'Your trade licence is verified, so sellers can trust your bids.', href: '/buyer/profile', anchor: 'verification-badges' },
  { text: 'Find lots by category, grade, location and cost per unit. Save a search to get alerts.', href: '/buyer/lots', anchor: 'browse-filters' },
  { text: 'Every lot lists exactly what is inside. Cartons are sealed and each seal is tied to this list.', href: '/lots/LOT-1042', anchor: 'manifest-table' },
  { text: 'This is what you actually pay per unit, including delivery or collection.', href: '/lots/LOT-1042', anchor: 'landed-cost' },
  { text: 'Bids are sealed. Add your price and terms. A small refundable deposit is held when you bid.', href: '/lots/LOT-1042', anchor: 'place-bid-button' },
  { text: 'If you win, fund escrow within 48 hours, then book a collection slot.', href: '/buyer/deals/DEAL-1038', anchor: 'deal-timeline' },
  { text: 'Count the cartons against their seals. If anything is missing, the price adjusts automatically.', href: '/buyer/deals/DEAL-1038/count', anchor: 'collection-count' },
];

// PRD 6.3
export const SELLER_TOUR: TourStep[] = [
  {
    text: 'Atlas helps you clear surplus stock to verified buyers, with payment secured before collection.',
    href: '/seller',
    anchor: null,
  },
  { text: 'Upload your manifest, choose a grade and seal your cartons.', href: '/seller/lots', anchor: 'create-listing-button' },
  { text: 'Set a hidden reserve price and any conditions, such as export only.', href: '/seller/lots/new?step=6', anchor: 'terms-step' },
  { text: 'See how many verified buyers are active in your category before you list.', href: '/seller/lots/new?step=6', anchor: 'active-buyers' },
  { text: "Bids are ranked by net value to you, with each buyer's reliability shown.", href: '/seller/lots/LOT-1042/bids', anchor: 'bid-ranking' },
  { text: 'Accept a bid, counter once, or call a best and final round.', href: '/seller/lots/LOT-1042/bids', anchor: 'bid-actions' },
  { text: 'The buyer funds escrow within 48 hours. If they do not, the lot goes to your backup bidder.', href: '/seller/deals/DEAL-1038', anchor: 'deal-timeline' },
  { text: 'You are paid once the count is confirmed and the inspection window closes.', href: '/seller/deals/DEAL-1029', anchor: 'payout-panel' },
];
