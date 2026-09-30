// Data model, PRD section 10.1.

export type Role = 'buyer' | 'seller';

export type Category = 'Electronics' | 'Cosmetics' | 'Apparel' | 'Household';

export type Grade =
  | 'New sealed'
  | 'New open box'
  | 'Returns tested'
  | 'Returns untested'
  | 'Salvage';

export type Emirate = 'Dubai' | 'Sharjah' | 'Ajman';

export interface Strike {
  at: string; // ISO date
  reason: string;
}

export interface Company {
  id: string;
  name: string;
  role: Role;
  emirate: Emirate;
  area: string;
  licenceVerified: boolean;
  memberSince: string; // ISO date
  categories: Category[];
  // seller metrics
  manifestAccuracy?: number; // 0 to 1
  manifestAccuracyHistory?: { at: string; value: number }[];
  lotsSold?: number;
  disputeRate?: number; // 0 to 1
  avgReadyHours?: number;
  // buyer metrics
  marketsServed?: string[];
  lotsWon?: number;
  completionRate?: number;
  collectionReliability?: number;
  depositBalance?: number; // AED available for holds
  strikes: Strike[];
}

export interface ManifestLine {
  sku: string;
  product: string;
  qty: number;
  unitRetailValue: number;
  expiry?: string;
  grade: Grade;
  sampled?: boolean;
}

export interface Carton {
  sealId: string;
  lines: string[]; // SKUs inside this carton
}

export type LotState =
  | 'Draft'
  | 'Under review'
  | 'Live'
  | 'Bidding closed'
  | 'Awarded'
  | 'In deal'
  | 'Completed'
  | 'Unsold'
  | 'Withdrawn';

export interface SampleEvidence {
  sku: string;
  photos: string[];
  testResult?: string;
}

export interface LotQuestion {
  id: string;
  askedBy: string; // company id
  q: string;
  a?: string;
  at: string;
}

export interface Lot {
  id: string; // "LOT-1042"
  sellerId: string;
  title: string;
  category: Category;
  grade: Grade;
  gradeTolerancePct: number; // 0.10
  warehouse: { emirate: Emirate; area: string };
  showSellerName: boolean;
  manifest: ManifestLine[];
  cartons: Carton[];
  pallets: number;
  provenanceDoc: { type: 'Commercial invoice' | 'Bill of entry'; verified: boolean };
  sampleEvidence: SampleEvidence[];
  inspectionReport?: { date: string; summary: string };
  reserve: number; // hidden from buyers
  buyNow?: number;
  splitInto?: number;
  perBuyerCap?: number;
  conditions: string[];
  collectionWindow: { from: string; to: string };
  state: LotState;
  opensAt: string;
  closesAt: string;
  questions: LotQuestion[];
  backupBidId?: string;
}

export type BidState =
  | 'Submitted'
  | 'Countered'
  | 'Best and final requested'
  | 'Won'
  | 'Lost'
  | 'Backup'
  | 'Withdrawn';

export interface Bid {
  id: string;
  lotId: string;
  buyerId: string;
  amount: number;
  collectionDate: string;
  destination: string;
  conditionsAccepted: boolean;
  conditionConflict?: string; // set when the buyer's terms conflict with a channel condition
  note?: string;
  deposit: number;
  state: BidState;
  counterAmount?: number;
  counterRespondBy?: string;
  counterUsed?: boolean; // a bidder can only be countered once (PRD 8.14)
  bestAndFinalRespondBy?: string;
  history: { at: string; amount: number }[];
}

export type DealState =
  | 'Awarded'
  | 'Funded'
  | 'Collection scheduled'
  | 'Counted'
  | 'Inspection window'
  | 'Disputed'
  | 'Resolved'
  | 'Completed'
  | 'Rejected'
  | 'Unfunded';

export interface CollectionCount {
  seals: { sealId: string; intact: boolean; photo?: string }[];
  lines: { sku: string; received: number; belowGrade: number }[];
  shortagePct: number;
  creditAmount: number;
  outcome: 'Auto credit' | 'Credit with score impact' | 'Reject available';
}

export interface Dispute {
  reason: string;
  description: string;
  evidence: string[];
  sellerResponse?: 'Accepted' | 'Partial credit' | 'Contested';
  sellerOfferedCredit?: number;
  respondBy: string;
  resolution?: { credit: number; note: string };
}

export interface Payout {
  gross: number;
  credit: number;
  commission: number;
  net: number;
}

export interface Deal {
  id: string;
  lotId: string;
  bidId: string;
  buyerId: string;
  sellerId: string;
  backupBidId?: string;
  state: DealState;
  fundBy: string;
  delivery: 'Collection' | 'Delivery';
  deliveryFee: number;
  collectionSlot?: string;
  count?: CollectionCount;
  inspectionEndsAt?: string;
  dispute?: Dispute;
  payout?: Payout;
  timeline: { state: string; at: string }[];
}

export interface Comparable {
  category: Category;
  grade: Grade;
  closedAt: string;
  recoveryPct: number;
}

export interface Notification {
  id: string;
  at: string;
  forCompanyId: string;
  text: string;
  href: string;
  read: boolean;
}

export interface SavedSearch {
  id: string;
  buyerId: string;
  label: string;
  filters: Partial<{
    category: Category;
    grade: Grade;
    emirate: Emirate;
    closingWithin24h: boolean;
  }>;
}
