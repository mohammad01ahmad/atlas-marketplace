// The single client-side store (PRD 3.1). Holds every domain record and every
// action a buyer or seller can take, plus the simulated clock and demo panel
// triggers. Persisted to localStorage so the demo survives a refresh.

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  Bid,
  BidState,
  Company,
  Deal,
  DealState,
  Lot,
  LotState,
  Notification,
  SavedSearch,
  Comparable,
  Role,
} from '@/types';
import { companies as seedCompanies } from '@/data/companies';
import { createSeedLots } from '@/data/lots';
import { createSeedBids } from '@/data/bids';
import { createSeedDeals } from '@/data/deals';
import { createComparables } from '@/data/comparables';
import { isoAt, isPast } from '@/lib/clock';
import {
  calcDeposit,
  calcCommission,
  calcNetToSeller,
  calcFinalPayout,
  calcShortageValue,
  calcGradeShortfallValue,
  calcShortagePct,
  calcCreditAmount,
  calcOutcome,
  pickBackupBid,
  rankBidsByNetValue,
  type ShortageLine,
  type GradeShortfallLine,
  type CollectionOutcome,
} from '@/lib/rules';

const STORAGE_KEY = 'atlas-demo-store';

function uid(prefix: string): string {
  return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
}

interface ActionResult {
  ok: boolean;
  error?: string;
}

export interface AtlasState {
  hasHydrated: boolean;
  role: Role;
  activeBuyerId: string;
  activeSellerId: string;

  /** @internal runs every deadline-driven transition; not a UI action */
  __sweep: () => void;
  /** @internal finishes the simulated listing review; not a UI action */
  __publish: (lotId: string) => void;

  clockBaseMs: number;
  clockOffsetMs: number;

  companies: Company[];
  lots: Lot[];
  bids: Bid[];
  deals: Deal[];
  comparables: Comparable[];
  notifications: Notification[];
  savedSearches: SavedSearch[];
  compareIds: string[];

  tourDone: Record<Role, boolean>;
  tourActive: boolean;
  tourStep: number;

  forcedShortageDealId?: string;

  // ---- lifecycle ----
  hydrate: () => void;
  resetDemo: () => void;
  switchRole: (role: Role) => void;

  // ---- clock ----
  advanceClock: (hours: number) => void;
  jumpToNextDeadline: () => void;

  // ---- browse / compare / search ----
  addToCompare: (lotId: string) => void;
  removeFromCompare: (lotId: string) => void;
  saveSearch: (search: Omit<SavedSearch, 'id' | 'buyerId'>) => void;

  // ---- Q&A ----
  askQuestion: (lotId: string, q: string) => void;
  answerQuestion: (lotId: string, questionId: string, a: string) => void;

  // ---- bidding ----
  placeBid: (
    lotId: string,
    input: { amount: number; collectionDate: string; destination: string; conditionsAccepted: boolean; note?: string },
  ) => ActionResult;
  raiseBid: (bidId: string, newAmount: number) => ActionResult;
  withdrawBid: (bidId: string) => ActionResult;
  respondToCounter: (bidId: string, accept: boolean) => void;
  respondToBestAndFinal: (bidId: string, amount: number) => ActionResult;
  buyNow: (lotId: string) => ActionResult;

  // ---- seller: bid review ----
  acceptBid: (lotId: string, bidId: string) => void;
  counterBid: (lotId: string, bidId: string, amount: number) => ActionResult;
  callBestAndFinal: (lotId: string, thresholdAmount: number) => void;
  markUnsold: (lotId: string) => void;
  relistLot: (lotId: string) => void;

  // ---- seller: listing wizard ----
  saveDraftLot: (lot: Lot) => void;
  submitListing: (lot: Lot) => void;

  // ---- deal tracker ----
  fundEscrow: (dealId: string) => ActionResult;
  bookCollectionSlot: (dealId: string, slotIso: string) => void;
  submitCollectionCount: (
    dealId: string,
    input: {
      seals: { sealId: string; intact: boolean; photo?: string }[];
      lines: { sku: string; received: number; belowGrade: number }[];
    },
  ) => void;
  rejectLot: (dealId: string) => void;
  acceptCollectionCredit: (dealId: string) => void;
  openDispute: (dealId: string, input: { reason: string; description: string; evidence: string[] }) => void;
  respondToDispute: (
    dealId: string,
    response: 'Accepted' | 'Partial credit' | 'Contested',
    offeredCredit?: number,
  ) => void;
  acceptDisputeCredit: (dealId: string) => void;

  // ---- notifications ----
  markNotificationRead: (id: string) => void;

  // ---- tour ----
  startTour: (role: Role) => void;
  skipTour: () => void;
  finishTour: () => void;
  setTourStep: (step: number) => void;

  // ---- demo panel scenario triggers ----
  scenarioAddCompetingBid: () => void;
  scenarioBuyerMissesFunding: (dealId?: string) => void;
  scenarioSimulateShortage: (dealId: string) => void;
  scenarioSellerNoDisputeResponse: () => void;
}

function seedState(baseMs: number) {
  const lots = createSeedLots(baseMs);
  const bids = createSeedBids(baseMs);
  const deals = createSeedDeals(baseMs);
  const comparables = createComparables(baseMs);
  const companies = seedCompanies.map((c) => ({ ...c, strikes: [...c.strikes] }));
  return { lots, bids, deals, comparables, companies };
}

function pushNotification(
  notifications: Notification[],
  nowIso: string,
  forCompanyId: string,
  text: string,
  href: string,
): Notification[] {
  return [
    { id: uid('N'), at: nowIso, forCompanyId, text, href, read: false },
    ...notifications,
  ];
}

export const useAtlasStore = create<AtlasState>()(
  persist(
    (set, get) => ({
      hasHydrated: false,
      role: 'buyer',
      activeBuyerId: 'b1',
      activeSellerId: 's1',

      clockBaseMs: 0,
      clockOffsetMs: 0,

      companies: [],
      lots: [],
      bids: [],
      deals: [],
      comparables: [],
      notifications: [],
      savedSearches: [],
      compareIds: [],

      tourDone: { buyer: false, seller: false },
      tourActive: false,
      tourStep: 0,

      hydrate: () => {
        const state = get();
        if (state.lots.length === 0) {
          const baseMs = Date.now();
          set({ clockBaseMs: baseMs, clockOffsetMs: 0, ...seedState(baseMs) });
        }
        set({ hasHydrated: true });
      },

      resetDemo: () => {
        const baseMs = Date.now();
        set({
          clockBaseMs: baseMs,
          clockOffsetMs: 0,
          role: 'buyer',
          notifications: [],
          savedSearches: [],
          compareIds: [],
          tourDone: { buyer: false, seller: false },
          tourActive: false,
          tourStep: 0,
          forcedShortageDealId: undefined,
          ...seedState(baseMs),
        });
      },

      switchRole: (role) => set({ role }),

      // ---- clock -------------------------------------------------------

      advanceClock: (hours) => {
        set((s) => ({ clockOffsetMs: s.clockOffsetMs + hours * 3600_000 }));
        get().__sweep();
      },

      jumpToNextDeadline: () => {
        const s = get();
        const now = s.clockBaseMs + s.clockOffsetMs;
        const candidates: number[] = [];
        for (const lot of s.lots) {
          if (lot.state === 'Live') candidates.push(new Date(lot.closesAt).getTime());
        }
        for (const deal of s.deals) {
          if (deal.state === 'Awarded') candidates.push(new Date(deal.fundBy).getTime());
          if (deal.state === 'Inspection window' && deal.inspectionEndsAt)
            candidates.push(new Date(deal.inspectionEndsAt).getTime());
          if (deal.state === 'Disputed' && deal.dispute) candidates.push(new Date(deal.dispute.respondBy).getTime());
        }
        for (const bid of s.bids) {
          if (bid.state === 'Countered' && bid.counterRespondBy) candidates.push(new Date(bid.counterRespondBy).getTime());
          if (bid.state === 'Best and final requested' && bid.bestAndFinalRespondBy)
            candidates.push(new Date(bid.bestAndFinalRespondBy).getTime());
        }
        const future = candidates.filter((t) => t > now);
        if (future.length === 0) return;
        const next = Math.min(...future);
        set({ clockOffsetMs: next - s.clockBaseMs + 60_000 });
        get().__sweep();
      },

      // Internal: runs every deadline-driven transition. Not part of the
      // public state machine surface, called after any clock move.
      __sweep: () => {
        const s = get();
        const now = s.clockBaseMs + s.clockOffsetMs;
        const nowIso = new Date(now).toISOString();
        let { lots, bids, deals, companies, notifications } = s;

        // a) Live lots past close -> Bidding closed
        lots = lots.map((lot) => {
          if (lot.state === 'Live' && isPast(lot.closesAt, now)) {
            notifications = pushNotification(notifications, nowIso, lot.sellerId, `Bidding closed for ${lot.id}`, `/seller/lots/${lot.id}/bids`);
            return { ...lot, state: 'Bidding closed' as LotState };
          }
          return lot;
        });

        // g) Under review -> Live (the simulated review is effectively instant)
        lots = lots.map((lot) => (lot.state === 'Under review' ? { ...lot, state: 'Live' as LotState } : lot));

        // e/f) expired counter / best-and-final on the demo buyer's bids
        bids = bids.map((bid) => {
          if (bid.state === 'Countered' && bid.counterRespondBy && isPast(bid.counterRespondBy, now)) {
            return { ...bid, state: 'Submitted' as BidState, counterAmount: undefined, counterRespondBy: undefined };
          }
          if (bid.state === 'Best and final requested' && bid.bestAndFinalRespondBy && isPast(bid.bestAndFinalRespondBy, now)) {
            return { ...bid, state: 'Submitted' as BidState, bestAndFinalRespondBy: undefined };
          }
          return bid;
        });

        // b) Awarded deals past fundBy -> Unfunded, buyer strike, backup takes over
        const newDeals: Deal[] = [];
        deals = deals.map((deal) => {
          if (deal.state === 'Awarded' && isPast(deal.fundBy, now)) {
            const lot = lots.find((l) => l.id === deal.lotId);
            const buyer = companies.find((c) => c.id === deal.buyerId);
            if (buyer) {
              buyer.strikes = [...buyer.strikes, { at: nowIso, reason: 'Missed the escrow funding deadline' }];
            }
            notifications = pushNotification(notifications, nowIso, deal.sellerId, `${deal.buyerId} missed the funding deadline for ${deal.lotId}`, `/seller/deals/${deal.id}`);
            if (lot && lot.backupBidId) {
              const backupBid = bids.find((b) => b.id === lot.backupBidId);
              if (backupBid) {
                bids = bids.map((b) => (b.id === backupBid.id ? { ...b, state: 'Won' as BidState } : b));
                const newDeal: Deal = {
                  id: uid('DEAL'),
                  lotId: lot.id,
                  bidId: backupBid.id,
                  buyerId: backupBid.buyerId,
                  sellerId: lot.sellerId,
                  state: 'Awarded',
                  fundBy: isoAt(now, 48),
                  delivery: 'Collection',
                  deliveryFee: deal.deliveryFee,
                  timeline: [{ state: 'Awarded', at: nowIso }],
                };
                newDeals.push(newDeal);
                notifications = pushNotification(notifications, nowIso, backupBid.buyerId, `You won ${lot.id} as the backup bidder`, `/buyer/deals/${newDeal.id}`);
              }
            } else if (lot) {
              lots = lots.map((l) => (l.id === lot.id ? { ...l, state: 'Unsold' as LotState } : l));
            }
            return { ...deal, state: 'Unfunded' as DealState };
          }
          return deal;
        });
        deals = [...deals, ...newDeals];

        // c) Inspection window elapsed -> Completed, payout computed
        deals = deals.map((deal) => {
          if (deal.state === 'Inspection window' && deal.inspectionEndsAt && isPast(deal.inspectionEndsAt, now)) {
            return completeDeal(deal, bids, nowIso);
          }
          return deal;
        });

        // d) Disputed deals whose response deadline passed without a seller response
        deals = deals.map((deal) => {
          if (deal.state === 'Disputed' && deal.dispute && !deal.dispute.sellerResponse && isPast(deal.dispute.respondBy, now)) {
            const credit = deal.count?.creditAmount ?? 0;
            const resolved: Deal = {
              ...deal,
              state: 'Resolved',
              dispute: { ...deal.dispute, resolution: { credit, note: 'Seller did not respond by the deadline. Resolved in the buyer\'s favour.' } },
            };
            notifications = pushNotification(notifications, nowIso, deal.sellerId, `Dispute on ${deal.lotId} resolved in the buyer's favour`, `/seller/deals/${deal.id}`);
            return completeDeal(resolved, bids, nowIso);
          }
          return deal;
        });

        // score impact: lower seller manifest accuracy for score-impacting credits already applied at count time (see submitCollectionCount)

        lots = lots.map((lot) => (deals.some((d) => d.lotId === lot.id && d.state === 'Completed') && lot.state === 'In deal' ? { ...lot, state: 'Completed' as LotState } : lot));

        set({ lots, bids, deals, companies: [...companies], notifications });
      },

      // ---- browse / compare / search -----------------------------------

      addToCompare: (lotId) =>
        set((s) => (s.compareIds.includes(lotId) || s.compareIds.length >= 3 ? s : { compareIds: [...s.compareIds, lotId] })),
      removeFromCompare: (lotId) => set((s) => ({ compareIds: s.compareIds.filter((id) => id !== lotId) })),
      saveSearch: (search) =>
        set((s) => ({ savedSearches: [...s.savedSearches, { id: uid('SEARCH'), buyerId: s.activeBuyerId, ...search }] })),

      // ---- Q&A -----------------------------------------------------------

      askQuestion: (lotId, q) => {
        const s = get();
        const now = s.clockBaseMs + s.clockOffsetMs;
        const nowIso = new Date(now).toISOString();
        const lot = s.lots.find((l) => l.id === lotId);
        if (!lot) return;
        const question = { id: uid('Q'), askedBy: s.activeBuyerId, q, at: nowIso };
        set({
          lots: s.lots.map((l) => (l.id === lotId ? { ...l, questions: [...l.questions, question] } : l)),
          notifications: pushNotification(s.notifications, nowIso, lot.sellerId, `New question on ${lot.id}`, `/lots/${lot.id}`),
        });
      },

      answerQuestion: (lotId, questionId, a) => {
        const s = get();
        const lot = s.lots.find((l) => l.id === lotId);
        if (!lot) return;
        const question = lot.questions.find((q) => q.id === questionId);
        set({
          lots: s.lots.map((l) => (l.id === lotId ? { ...l, questions: l.questions.map((q) => (q.id === questionId ? { ...q, a } : q)) } : l)),
          notifications: question
            ? pushNotification(s.notifications, new Date(s.clockBaseMs + s.clockOffsetMs).toISOString(), question.askedBy, `Your question on ${lot.id} was answered`, `/lots/${lot.id}`)
            : s.notifications,
        });
      },

      // ---- bidding ---------------------------------------------------------

      placeBid: (lotId, input) => {
        const s = get();
        const now = s.clockBaseMs + s.clockOffsetMs;
        const nowIso = new Date(now).toISOString();
        const lot = s.lots.find((l) => l.id === lotId);
        const buyer = s.companies.find((c) => c.id === s.activeBuyerId);
        if (!lot || !buyer) return { ok: false, error: 'Lot not found.' };
        if (lot.state !== 'Live') return { ok: false, error: 'This lot is not open for bidding.' };
        const deposit = calcDeposit(input.amount);
        if ((buyer.depositBalance ?? 0) < deposit) {
          return { ok: false, error: 'Deposit could not be held. Add funds to your deposit balance to place bids.' };
        }
        const bid: Bid = {
          id: uid('BID'),
          lotId,
          buyerId: buyer.id,
          amount: input.amount,
          collectionDate: input.collectionDate,
          destination: input.destination,
          conditionsAccepted: input.conditionsAccepted,
          conditionConflict: undefined,
          note: input.note,
          deposit,
          state: 'Submitted',
          history: [{ at: nowIso, amount: input.amount }],
        };
        set({
          bids: [...s.bids, bid],
          companies: s.companies.map((c) => (c.id === buyer.id ? { ...c, depositBalance: (c.depositBalance ?? 0) - deposit } : c)),
          notifications: pushNotification(s.notifications, nowIso, lot.sellerId, `New bid on ${lot.id}`, `/seller/lots/${lot.id}/bids`),
        });
        return { ok: true };
      },

      raiseBid: (bidId, newAmount) => {
        const s = get();
        const bid = s.bids.find((b) => b.id === bidId);
        if (!bid) return { ok: false, error: 'Bid not found.' };
        if (newAmount <= bid.amount) return { ok: false, error: 'A raised bid must be higher than your current bid.' };
        const lot = s.lots.find((l) => l.id === bid.lotId);
        if (!lot || lot.state !== 'Live') return { ok: false, error: 'Bidding has closed on this lot.' };
        const buyer = s.companies.find((c) => c.id === bid.buyerId);
        if (!buyer) return { ok: false, error: 'Buyer not found.' };
        const newDeposit = calcDeposit(newAmount);
        const extra = newDeposit - bid.deposit;
        if ((buyer.depositBalance ?? 0) < extra) {
          return { ok: false, error: 'Deposit could not be topped up. Add funds to your deposit balance to raise this bid.' };
        }
        const nowIso = new Date(s.clockBaseMs + s.clockOffsetMs).toISOString();
        set({
          bids: s.bids.map((b) =>
            b.id === bidId
              ? { ...b, amount: newAmount, deposit: newDeposit, history: [...b.history, { at: nowIso, amount: newAmount }] }
              : b,
          ),
          companies: s.companies.map((c) => (c.id === buyer.id ? { ...c, depositBalance: (c.depositBalance ?? 0) - extra } : c)),
        });
        return { ok: true };
      },

      withdrawBid: (bidId) => {
        const s = get();
        const bid = s.bids.find((b) => b.id === bidId);
        if (!bid) return { ok: false, error: 'Bid not found.' };
        const lot = s.lots.find((l) => l.id === bid.lotId);
        const now = s.clockBaseMs + s.clockOffsetMs;
        if (lot && new Date(lot.closesAt).getTime() - now < 24 * 3600_000) {
          return { ok: false, error: 'Bids cannot be withdrawn in the last 24 hours before close.' };
        }
        set({
          bids: s.bids.map((b) => (b.id === bidId ? { ...b, state: 'Withdrawn' as BidState } : b)),
          companies: s.companies.map((c) => (c.id === bid.buyerId ? { ...c, depositBalance: (c.depositBalance ?? 0) + bid.deposit } : c)),
        });
        return { ok: true };
      },

      respondToCounter: (bidId, accept) => {
        const s = get();
        const bid = s.bids.find((b) => b.id === bidId);
        if (!bid || bid.state !== 'Countered' || bid.counterAmount === undefined) return;
        if (accept) {
          const newDeposit = calcDeposit(bid.counterAmount);
          const extra = newDeposit - bid.deposit;
          set({
            bids: s.bids.map((b) =>
              b.id === bidId
                ? { ...b, amount: bid.counterAmount!, deposit: newDeposit, state: 'Submitted' as BidState, counterAmount: undefined, counterRespondBy: undefined }
                : b,
            ),
            companies: s.companies.map((c) => (c.id === bid.buyerId ? { ...c, depositBalance: (c.depositBalance ?? 0) - extra } : c)),
          });
        } else {
          set({
            bids: s.bids.map((b) =>
              b.id === bidId ? { ...b, state: 'Submitted' as BidState, counterAmount: undefined, counterRespondBy: undefined } : b,
            ),
          });
        }
      },

      respondToBestAndFinal: (bidId, amount) => {
        const s = get();
        const bid = s.bids.find((b) => b.id === bidId);
        if (!bid || bid.state !== 'Best and final requested') return { ok: false, error: 'No best and final request is open.' };
        if (amount < bid.amount) return { ok: false, error: 'Your best and final amount cannot be lower than your current bid.' };
        const buyer = s.companies.find((c) => c.id === bid.buyerId);
        const newDeposit = calcDeposit(amount);
        const extra = newDeposit - bid.deposit;
        if (buyer && (buyer.depositBalance ?? 0) < extra) {
          return { ok: false, error: 'Deposit could not be topped up. Add funds to your deposit balance.' };
        }
        const nowIso = new Date(s.clockBaseMs + s.clockOffsetMs).toISOString();
        set({
          bids: s.bids.map((b) =>
            b.id === bidId
              ? { ...b, amount, deposit: newDeposit, state: 'Submitted' as BidState, bestAndFinalRespondBy: undefined, history: [...b.history, { at: nowIso, amount }] }
              : b,
          ),
          companies: s.companies.map((c) => (c.id === bid.buyerId ? { ...c, depositBalance: (c.depositBalance ?? 0) - extra } : c)),
        });
        return { ok: true };
      },

      buyNow: (lotId) => {
        const s = get();
        const lot = s.lots.find((l) => l.id === lotId);
        const buyer = s.companies.find((c) => c.id === s.activeBuyerId);
        if (!lot || !buyer || !lot.buyNow) return { ok: false, error: 'Buy now is not available for this lot.' };
        if (lot.state !== 'Live') return { ok: false, error: 'This lot is not open for bidding.' };
        const deposit = calcDeposit(lot.buyNow);
        if ((buyer.depositBalance ?? 0) < deposit) {
          return { ok: false, error: 'Deposit could not be held. Add funds to your deposit balance.' };
        }
        const nowIso = new Date(s.clockBaseMs + s.clockOffsetMs).toISOString();
        const bid: Bid = {
          id: uid('BID'),
          lotId,
          buyerId: buyer.id,
          amount: lot.buyNow,
          collectionDate: lot.collectionWindow.from,
          destination: buyer.marketsServed?.[0] ?? buyer.emirate,
          conditionsAccepted: true,
          deposit,
          state: 'Won',
          history: [{ at: nowIso, amount: lot.buyNow }],
        };
        const deal = createDeal(lot, bid, s.clockBaseMs + s.clockOffsetMs);
        set({
          bids: [...s.bids, bid],
          deals: [...s.deals, deal],
          lots: s.lots.map((l) => (l.id === lotId ? { ...l, state: 'Awarded' as LotState } : l)),
          companies: s.companies.map((c) => (c.id === buyer.id ? { ...c, depositBalance: (c.depositBalance ?? 0) - deposit } : c)),
          notifications: pushNotification(s.notifications, nowIso, lot.sellerId, `${buyer.name} bought ${lot.id} now`, `/seller/deals/${deal.id}`),
        });
        return { ok: true };
      },

      // ---- seller: bid review ------------------------------------------

      acceptBid: (lotId, bidId) => {
        const s = get();
        const lot = s.lots.find((l) => l.id === lotId);
        const winner = s.bids.find((b) => b.id === bidId);
        if (!lot || !winner || lot.state !== 'Bidding closed') return;
        const lotBids = s.bids.filter((b) => b.lotId === lotId);
        const backup = pickBackupBid(lotBids, lot, bidId);
        const now = s.clockBaseMs + s.clockOffsetMs;
        const nowIso = new Date(now).toISOString();

        let companies = s.companies;
        let notifications = s.notifications;
        const bids = s.bids.map((b) => {
          if (b.id === bidId) return { ...b, state: 'Won' as BidState };
          if (backup && b.id === backup.id) return { ...b, state: 'Backup' as BidState };
          if (b.lotId === lotId && (b.state === 'Submitted' || b.state === 'Countered' || b.state === 'Best and final requested')) {
            companies = companies.map((c) => (c.id === b.buyerId ? { ...c, depositBalance: (c.depositBalance ?? 0) + b.deposit } : c));
            return { ...b, state: 'Lost' as BidState };
          }
          return b;
        });

        const deal = createDeal(lot, winner, now);
        notifications = pushNotification(notifications, nowIso, winner.buyerId, `You won ${lot.id}`, `/buyer/deals/${deal.id}`);
        if (backup) {
          notifications = pushNotification(notifications, nowIso, backup.buyerId, `You are the backup bidder for ${lot.id}`, `/buyer/bids`);
        }

        set({
          lots: s.lots.map((l) => (l.id === lotId ? { ...l, state: 'Awarded' as LotState, backupBidId: backup?.id } : l)),
          bids,
          deals: [...s.deals, deal],
          companies,
          notifications,
        });
      },

      counterBid: (lotId, bidId, amount) => {
        const s = get();
        const lot = s.lots.find((l) => l.id === lotId);
        const bid = s.bids.find((b) => b.id === bidId);
        if (!lot || !bid || lot.state !== 'Bidding closed') return { ok: false, error: 'Bidding has not closed on this lot.' };
        if (bid.counterUsed) return { ok: false, error: 'This bidder has already been countered once.' };
        const top3 = rankBidsByNetValue(s.bids.filter((b) => b.lotId === lotId)).slice(0, 3);
        if (!top3.some((b) => b.id === bidId)) return { ok: false, error: 'Only the top 3 bidders by net value can be countered.' };
        const now = s.clockBaseMs + s.clockOffsetMs;
        set({
          bids: s.bids.map((b) =>
            b.id === bidId
              ? { ...b, state: 'Countered' as BidState, counterAmount: amount, counterRespondBy: isoAt(now, 24), counterUsed: true }
              : b,
          ),
          notifications: pushNotification(s.notifications, new Date(now).toISOString(), bid.buyerId, `Counter received on ${lot.id}`, '/buyer/bids'),
        });
        return { ok: true };
      },

      callBestAndFinal: (lotId, thresholdAmount) => {
        const s = get();
        const lot = s.lots.find((l) => l.id === lotId);
        if (!lot || lot.state !== 'Bidding closed') return;
        const now = s.clockBaseMs + s.clockOffsetMs;
        const respondBy = isoAt(now, 24);
        let notifications = s.notifications;
        const bids = s.bids.map((b) => {
          if (b.lotId !== lotId || b.state !== 'Submitted' || b.amount < thresholdAmount) return b;
          if (b.buyerId === s.activeBuyerId) {
            notifications = pushNotification(notifications, new Date(now).toISOString(), b.buyerId, `Best and final round called on ${lot.id}`, '/buyer/bids');
            return { ...b, state: 'Best and final requested' as BidState, bestAndFinalRespondBy: respondBy };
          }
          // Mock competing buyers respond immediately with a small, deterministic raise.
          const bump = 1 + seededPct(b.id);
          return { ...b, amount: Math.round(b.amount * bump), history: [...b.history, { at: new Date(now).toISOString(), amount: Math.round(b.amount * bump) }] };
        });
        set({ bids, notifications });
      },

      markUnsold: (lotId) => {
        const s = get();
        const lot = s.lots.find((l) => l.id === lotId);
        if (!lot || lot.state !== 'Bidding closed') return;
        let companies = s.companies;
        const bids = s.bids.map((b) => {
          if (b.lotId !== lotId || b.state !== 'Submitted') return b;
          companies = companies.map((c) => (c.id === b.buyerId ? { ...c, depositBalance: (c.depositBalance ?? 0) + b.deposit } : c));
          return { ...b, state: 'Lost' as BidState };
        });
        set({ lots: s.lots.map((l) => (l.id === lotId ? { ...l, state: 'Unsold' as LotState } : l)), bids, companies });
      },

      relistLot: (lotId) => {
        const s = get();
        const lot = s.lots.find((l) => l.id === lotId);
        if (!lot || lot.state !== 'Unsold') return;
        const now = s.clockBaseMs + s.clockOffsetMs;
        set({
          lots: s.lots.map((l) => (l.id === lotId ? { ...l, state: 'Live' as LotState, opensAt: new Date(now).toISOString(), closesAt: isoAt(now, 24 * 5) } : l)),
        });
      },

      // ---- seller: listing wizard ---------------------------------------

      saveDraftLot: (lot) =>
        set((s) => {
          const exists = s.lots.some((l) => l.id === lot.id);
          return { lots: exists ? s.lots.map((l) => (l.id === lot.id ? lot : l)) : [...s.lots, lot] };
        }),

      submitListing: (lot) => {
        const s = get();
        const now = s.clockBaseMs + s.clockOffsetMs;
        const published = { ...lot, state: 'Under review' as LotState, opensAt: new Date(now).toISOString() };
        const exists = s.lots.some((l) => l.id === lot.id);
        set({ lots: exists ? s.lots.map((l) => (l.id === lot.id ? published : l)) : [...s.lots, published] });
        // The simulated review is near-instant; also finishes on the next clock advance.
        setTimeout(() => {
          const cur = get().lots.find((l) => l.id === lot.id);
          if (cur && cur.state === 'Under review') {
            get().__publish(lot.id);
          }
        }, 2000);
      },
      __publish: (lotId) => set((s) => ({ lots: s.lots.map((l) => (l.id === lotId ? { ...l, state: 'Live' as LotState } : l)) })),

      // ---- deal tracker ---------------------------------------------------

      fundEscrow: (dealId) => {
        const s = get();
        const deal = s.deals.find((d) => d.id === dealId);
        if (!deal || deal.state !== 'Awarded') return { ok: false, error: 'This deal is not awaiting funding.' };
        const now = s.clockBaseMs + s.clockOffsetMs;
        const nowIso = new Date(now).toISOString();
        set({
          deals: s.deals.map((d) => (d.id === dealId ? { ...d, state: 'Funded' as DealState, timeline: [...d.timeline, { state: 'Funded', at: nowIso }] } : d)),
          lots: s.lots.map((l) => (l.id === deal.lotId ? { ...l, state: 'In deal' as LotState } : l)),
          notifications: pushNotification(s.notifications, nowIso, deal.sellerId, `Escrow funded for ${deal.lotId}`, `/seller/deals/${dealId}`),
        });
        return { ok: true };
      },

      bookCollectionSlot: (dealId, slotIso) => {
        const s = get();
        const deal = s.deals.find((d) => d.id === dealId);
        if (!deal || deal.state !== 'Funded') return;
        const nowIso = new Date(s.clockBaseMs + s.clockOffsetMs).toISOString();
        set({
          deals: s.deals.map((d) =>
            d.id === dealId
              ? { ...d, state: 'Collection scheduled' as DealState, collectionSlot: slotIso, timeline: [...d.timeline, { state: 'Collection scheduled', at: nowIso }] }
              : d,
          ),
          notifications: pushNotification(s.notifications, nowIso, deal.sellerId, `Collection slot booked for ${deal.lotId}`, `/seller/deals/${dealId}`),
        });
      },

      submitCollectionCount: (dealId, input) => {
        const s = get();
        const deal = s.deals.find((d) => d.id === dealId);
        const lot = deal && s.lots.find((l) => l.id === deal.lotId);
        const bid = deal && s.bids.find((b) => b.id === deal.bidId);
        if (!deal || !lot || !bid || deal.state !== 'Collection scheduled') return;

        const totalManifestValue = lot.manifest.reduce((sum, m) => sum + m.qty * m.unitRetailValue, 0);
        const shortageLines: ShortageLine[] = input.lines.map((l) => {
          const m = lot.manifest.find((line) => line.sku === l.sku)!;
          return { sku: l.sku, expectedQty: m.qty, receivedQty: l.received, unitRetailValue: m.unitRetailValue };
        });
        const gradeLines: GradeShortfallLine[] = input.lines
          .filter((l) => l.belowGrade > 0)
          .map((l) => {
            const m = lot.manifest.find((line) => line.sku === l.sku)!;
            return { sku: l.sku, belowGradeUnits: l.belowGrade, unitRetailValue: m.unitRetailValue };
          });
        const totalUnits = lot.manifest.reduce((sum, m) => sum + m.qty, 0);

        const shortageValue = calcShortageValue(shortageLines) + calcGradeShortfallValue(gradeLines, totalUnits, lot.gradeTolerancePct);
        const shortagePct = calcShortagePct(shortageValue, totalManifestValue);
        const anyBrokenSeal = input.seals.some((sl) => !sl.intact);
        const outcome: CollectionOutcome = calcOutcome(shortagePct, anyBrokenSeal);
        const creditAmount = calcCreditAmount(bid.amount, shortagePct);
        const now = s.clockBaseMs + s.clockOffsetMs;
        const nowIso = new Date(now).toISOString();

        const count = { seals: input.seals, lines: input.lines, shortagePct, creditAmount, outcome };
        let nextState: DealState = outcome === 'Reject available' ? 'Counted' : 'Inspection window';
        let companies = s.companies;
        if (outcome === 'Credit with score impact') {
          companies = companies.map((c) =>
            c.id === lot.sellerId ? { ...c, manifestAccuracy: Math.max(0, (c.manifestAccuracy ?? 1) - 0.01) } : c,
          );
        }

        const timeline = [...deal.timeline, { state: 'Counted', at: nowIso }];
        if (nextState === 'Inspection window') timeline.push({ state: 'Inspection window', at: nowIso });

        set({
          deals: s.deals.map((d) =>
            d.id === dealId
              ? {
                  ...d,
                  state: nextState,
                  count,
                  inspectionEndsAt: nextState === 'Inspection window' ? isoAt(now, 72) : undefined,
                  timeline,
                }
              : d,
          ),
          companies,
          forcedShortageDealId: s.forcedShortageDealId === dealId ? undefined : s.forcedShortageDealId,
        });
      },

      rejectLot: (dealId) => {
        const s = get();
        const deal = s.deals.find((d) => d.id === dealId);
        const bid = deal && s.bids.find((b) => b.id === deal.bidId);
        if (!deal || !bid || deal.state !== 'Counted' || deal.count?.outcome !== 'Reject available') return;
        const now = s.clockBaseMs + s.clockOffsetMs;
        const nowIso = new Date(now).toISOString();
        set({
          deals: s.deals.map((d) =>
            d.id === dealId ? { ...d, state: 'Rejected' as DealState, timeline: [...d.timeline, { state: 'Rejected', at: nowIso }] } : d,
          ),
          lots: s.lots.map((l) => (l.id === deal.lotId ? { ...l, state: 'Unsold' as LotState } : l)),
          companies: s.companies.map((c) => {
            if (c.id === bid.buyerId) return { ...c, depositBalance: (c.depositBalance ?? 0) + bid.deposit };
            if (c.id === deal.sellerId) return { ...c, strikes: [...c.strikes, { at: nowIso, reason: `Lot ${deal.lotId} rejected at collection` }] };
            return c;
          }),
          notifications: pushNotification(s.notifications, nowIso, deal.sellerId, `${deal.lotId} was rejected at collection`, `/seller/deals/${dealId}`),
        });
      },

      acceptCollectionCredit: (dealId) => {
        const s = get();
        const deal = s.deals.find((d) => d.id === dealId);
        if (!deal || deal.state !== 'Counted' || deal.count?.outcome !== 'Reject available') return;
        const now = s.clockBaseMs + s.clockOffsetMs;
        const nowIso = new Date(now).toISOString();
        set({
          deals: s.deals.map((d) =>
            d.id === dealId
              ? { ...d, state: 'Inspection window' as DealState, inspectionEndsAt: isoAt(now, 72), timeline: [...d.timeline, { state: 'Inspection window', at: nowIso }] }
              : d,
          ),
        });
      },

      openDispute: (dealId, input) => {
        const s = get();
        const deal = s.deals.find((d) => d.id === dealId);
        if (!deal || deal.state !== 'Inspection window') return;
        const now = s.clockBaseMs + s.clockOffsetMs;
        const nowIso = new Date(now).toISOString();
        set({
          deals: s.deals.map((d) =>
            d.id === dealId
              ? { ...d, state: 'Disputed' as DealState, dispute: { ...input, respondBy: isoAt(now, 48) }, timeline: [...d.timeline, { state: 'Disputed', at: nowIso }] }
              : d,
          ),
          notifications: pushNotification(s.notifications, nowIso, deal.sellerId, `Dispute opened on ${deal.lotId}`, `/seller/deals/${dealId}`),
        });
      },

      respondToDispute: (dealId, response, offeredCredit) => {
        const s = get();
        const deal = s.deals.find((d) => d.id === dealId);
        if (!deal || deal.state !== 'Disputed' || !deal.dispute) return;
        const now = s.clockBaseMs + s.clockOffsetMs;
        const nowIso = new Date(now).toISOString();

        if (response === 'Partial credit') {
          set({
            deals: s.deals.map((d) =>
              d.id === dealId ? { ...d, dispute: { ...d.dispute!, sellerResponse: response, sellerOfferedCredit: offeredCredit } } : d,
            ),
            notifications: pushNotification(s.notifications, nowIso, deal.buyerId, `Seller offered a partial credit on ${deal.lotId}`, `/buyer/deals/${dealId}`),
          });
          return;
        }

        // Both Accepted and Contested resolve to the outcome table's credit
        // (PRD gap; a contest gets the same figure "Reviewed by Atlas").
        const credit = deal.count?.creditAmount ?? 0;
        const note = response === 'Accepted' ? 'Seller accepted the claim.' : 'Contested; resolved by the published outcome table. Reviewed by Atlas.';
        const resolved: Deal = {
          ...deal,
          state: 'Resolved',
          dispute: { ...deal.dispute, sellerResponse: response, resolution: { credit, note } },
        };
        set({ deals: s.deals.map((d) => (d.id === dealId ? completeDeal(resolved, s.bids, nowIso) : d)) });
      },

      acceptDisputeCredit: (dealId) => {
        const s = get();
        const deal = s.deals.find((d) => d.id === dealId);
        if (!deal || deal.state !== 'Disputed' || !deal.dispute || deal.dispute.sellerOfferedCredit === undefined) return;
        const nowIso = new Date(s.clockBaseMs + s.clockOffsetMs).toISOString();
        const resolved: Deal = {
          ...deal,
          state: 'Resolved',
          dispute: {
            ...deal.dispute,
            resolution: { credit: deal.dispute.sellerOfferedCredit, note: "Buyer accepted the seller's partial credit offer." },
          },
        };
        set({ deals: s.deals.map((d) => (d.id === dealId ? completeDeal(resolved, s.bids, nowIso) : d)) });
      },

      // ---- notifications --------------------------------------------------

      markNotificationRead: (id) =>
        set((s) => ({ notifications: s.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)) })),

      // ---- tour -------------------------------------------------------------

      startTour: (role) => set({ tourActive: true, tourStep: 0, role }),
      skipTour: () => set((s) => ({ tourActive: false, tourDone: { ...s.tourDone, [s.role]: true } })),
      finishTour: () => set((s) => ({ tourActive: false, tourDone: { ...s.tourDone, [s.role]: true } })),
      setTourStep: (step) => set({ tourStep: step }),

      // ---- demo panel scenario triggers --------------------------------

      scenarioAddCompetingBid: () => {
        const s = get();
        const target = s.lots
          .filter((l) => l.state === 'Live')
          .sort((a, b) => s.bids.filter((x) => x.lotId === a.id).length - s.bids.filter((x) => x.lotId === b.id).length)[0];
        if (!target) return;
        const existingBidders = new Set(s.bids.filter((b) => b.lotId === target.id).map((b) => b.buyerId));
        const buyer = s.companies.find((c) => c.role === 'buyer' && c.id !== s.activeBuyerId && !existingBidders.has(c.id));
        if (!buyer) return;
        const amount = Math.round(target.reserve * (1.05 + seededPct(target.id)));
        const nowIso = new Date(s.clockBaseMs + s.clockOffsetMs).toISOString();
        const bid: Bid = {
          id: uid('BID'),
          lotId: target.id,
          buyerId: buyer.id,
          amount,
          collectionDate: target.collectionWindow.from,
          destination: buyer.marketsServed?.[0] ?? buyer.emirate,
          conditionsAccepted: true,
          deposit: calcDeposit(amount),
          state: 'Submitted',
          history: [{ at: nowIso, amount }],
        };
        set({
          bids: [...s.bids, bid],
          companies: s.companies.map((c) => (c.id === buyer.id ? { ...c, depositBalance: (c.depositBalance ?? 0) - bid.deposit } : c)),
          notifications: pushNotification(s.notifications, nowIso, target.sellerId, `New bid on ${target.id}`, `/seller/lots/${target.id}/bids`),
        });
      },

      scenarioBuyerMissesFunding: (dealId) => {
        const s = get();
        const target = dealId ? s.deals.find((d) => d.id === dealId) : s.deals.find((d) => d.state === 'Awarded');
        if (!target) return;
        set({ deals: s.deals.map((d) => (d.id === target.id ? { ...d, fundBy: new Date(s.clockBaseMs + s.clockOffsetMs - 1000).toISOString() } : d)) });
        get().advanceClock(0);
      },

      scenarioSimulateShortage: (dealId) => set({ forcedShortageDealId: dealId }),

      scenarioSellerNoDisputeResponse: () => {
        const s = get();
        const target = s.deals.find((d) => d.state === 'Disputed' && d.dispute && !d.dispute.sellerResponse);
        if (!target) return;
        set({
          deals: s.deals.map((d) =>
            d.id === target.id ? { ...d, dispute: { ...d.dispute!, respondBy: new Date(s.clockBaseMs + s.clockOffsetMs - 1000).toISOString() } } : d,
          ),
        });
        get().advanceClock(0);
      },
    }),
    {
      name: STORAGE_KEY,
      skipHydration: true,
    },
  ),
);

// ---- module-private helpers (not store actions) --------------------------

function seededPct(id: string): number {
  let sum = 0;
  for (let i = 0; i < id.length; i++) sum += id.charCodeAt(i);
  return (sum % 4) / 100; // 0% to 3%
}

function createDeal(lot: Lot, bid: Bid, nowMs: number): Deal {
  // ponytail: every deal defaults to Collection with no fee; the buyer's
  // Collection/Delivery choice on the lot page only previews landed cost
  // (PRD 8.8's "delivery (if chosen)" — this prototype never has it chosen).
  const nowIso = new Date(nowMs).toISOString();
  return {
    id: uid('DEAL'),
    lotId: lot.id,
    bidId: bid.id,
    buyerId: bid.buyerId,
    sellerId: lot.sellerId,
    state: 'Awarded',
    fundBy: isoAt(nowMs, 48),
    delivery: 'Collection',
    deliveryFee: 0,
    timeline: [{ state: 'Awarded', at: nowIso }],
  };
}

function completeDeal(deal: Deal, bids: Bid[], nowIso: string): Deal {
  const bid = bids.find((b) => b.id === deal.bidId);
  const gross = bid?.amount ?? 0;
  const credit = deal.dispute?.resolution?.credit ?? deal.count?.creditAmount ?? 0;
  const commission = calcCommission(gross);
  const net = calcFinalPayout(calcNetToSeller(gross), credit);
  return {
    ...deal,
    state: 'Completed',
    payout: { gross, credit, commission, net },
    timeline: [...deal.timeline, { state: 'Completed', at: nowIso }],
  };
}

export function useNow(): number {
  const base = useAtlasStore((s) => s.clockBaseMs);
  const offset = useAtlasStore((s) => s.clockOffsetMs);
  return base + offset;
}
