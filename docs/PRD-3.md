# Atlas Marketplace: Product Requirements Document (Prototype)

Version 1.0 | Prepared for the Greenstone Intern, Technology interview task

---

## 1. Overview

### 1.1 Product summary

Atlas is a B2B auction marketplace for surplus stock held in UAE warehouses: stranded re-export stock, end-of-season goods, discontinued models and cancelled orders. Verified sellers list sealed, manifested lots. Verified buyers submit sealed bids with terms attached. Money moves through escrow and is released only after the buyer counts the stock at collection.

**Positioning line:** Existing liquidation platforms move the risk onto the buyer. Atlas makes the lot provable: sealed, counted at handover, and paid through escrow only when it matches.

### 1.2 Purpose of this prototype

The prototype is a clickable, working front end with mock data. It must let the panel see the full buyer and seller journeys, from discovery to completed purchase, in a single app with a role switcher. It is not a production system. There is no real backend, payment, authentication or file processing.

### 1.3 Goals

1. Demonstrate all three required marketplace areas: buyer and seller relationship, listing and valuation, bidding and purchase.
2. Show every lot state and key decision point in the journeys.
3. Be understandable without explanation, through a skippable guided tour and clear in-screen guidance.
4. Run smoothly in a 15-minute live presentation on desktop, and be usable on mobile.

### 1.4 Non-goals

- Real authentication, payments, escrow, KYC or document verification.
- Real file parsing beyond a simple CSV manifest import (a prepared sample file is enough).
- Admin or operations back office.
- Arabic language support (noted as a later release).

---

## 2. Assumptions (confirm before building)

| # | Assumption | Default used in this PRD |
|---|---|---|
| A1 | Currency | AED, all prices shown excluding 5% VAT, with VAT shown as a separate line |
| A2 | Language | English only |
| A3 | Seller commission | 5% of the winning bid, charged only on completed sales |
| A4 | Buyer fees | None. Buyers pay only optional services (inspection, delivery) |
| A5 | Bid deposit | 5% of the bid amount, minimum AED 2,000, held when a bid is placed |
| A6 | Escrow funding window | 48 hours after award |
| A7 | Inspection window | 72 hours after the collection count is submitted |
| A8 | Collection area | Dubai, Sharjah and Ajman warehouses only |
| A9 | Excluded goods | Food, medicines, restricted and regulated goods |
| A10 | Brand name and domain | "Atlas" (no real domain) |
| A11 | Escrow provider | A named partner bank, shown as "Held by partner bank" |
| A12 | Demo time | Simulated clock controlled from a demo panel, so 48h and 72h windows can be skipped live |

---

## 3. Technical approach

### 3.1 Stack

- **Framework:** Next.js (App Router) with TypeScript.
- **Styling:** Tailwind CSS with design tokens defined as CSS variables (see section 5).
- **State:** Zustand (or React Context) as a single client-side store.
- **Persistence:** localStorage, so the demo survives a page refresh. Include a "Reset demo data" action.
- **Mock data:** typed JSON or TS files in `/data`, loaded into the store on first run.
- **Icons:** Lucide.
- **Charts (only where needed):** Recharts, for the recovery benchmark on the lot page.
- **Deployment:** Vercel, public link with no login wall.

### 3.2 Suggested structure

```
/app
  /(public)/page.tsx                 Landing and role selection
  /buyer/...                         Buyer routes
  /seller/...                        Seller routes
  /lots/[lotId]/page.tsx             Shared lot detail (view depends on role)
/components
  /ui                                Buttons, inputs, badges, tables, dialogs
  /lot                               LotCard, ManifestTable, GradeEvidence, LandedCost
  /bid                               BidForm, BidRanking, CounterDialog
  /deal                              DealTimeline, CollectionCount, DisputePanel
  /tour                              TourOverlay, TourStep, HelpButton
  /demo                              DemoPanel (clock, scenario triggers)
/data                                Mock data files
/lib
  store.ts                           Zustand store and actions
  rules.ts                           Business rules (section 9)
  clock.ts                           Simulated time
  format.ts                          AED, dates, percentages
/types                               TypeScript interfaces (section 10)
```

### 3.3 Simulated clock

All deadlines (bidding close, 48h funding, 72h inspection) use `clock.now()`, not the real time. The demo panel can advance the clock by 1 hour, 1 day, or jump to the next deadline. State transitions triggered by deadlines run when the clock advances.

---

## 4. Users, roles and the role switcher

### 4.1 Demo accounts

| Role | Company | Location | Notes |
|---|---|---|---|
| Seller (primary) | Al Noor General Trading LLC | Jebel Ali, Dubai | SME re-exporter, 14 lots sold, manifest accuracy 98% |
| Buyer (primary) | Horizon Exports FZE | Sharjah (SAIF Zone) | Exports to East Africa, 22 lots won, completion rate 96% |

Other mock sellers and buyers exist in the data to populate lists and competing bids (section 10).

### 4.2 Role switcher

- Located in the top bar on desktop and in the account sheet on mobile.
- Segmented control: **Buyer** / **Seller**. Shows the active company name beneath.
- Switching role keeps the same data store, so an action taken as the seller (for example, accepting a bid) is visible immediately as the buyer.
- On switch, route to the equivalent page if one exists (for example, from the seller's deal tracker for LOT-1042 to the buyer's deal tracker for LOT-1042), otherwise to that role's dashboard.
- Show a short toast: "Now viewing as Horizon Exports FZE (buyer)."

---

## 5. Design system

### 5.1 Direction

The subject is warehouse stock, manifests, cartons and customs paperwork. The interface should feel like a well-run trade desk: calm, precise and document-like. Minimal colour, strong hierarchy, numbers that are easy to scan. Spend the one distinctive element on the **seal tag**: carton seal IDs appear as small tag-shaped chips throughout (listing, bid, collection count), reinforcing the product's core idea that lots are sealed and provable.

### 5.2 Colour tokens

| Token | Hex | Use |
|---|---|---|
| `--ink` | #1B2330 | Primary text, headings |
| `--ink-muted` | #5B6573 | Secondary text, labels |
| `--paper` | #F6F7F5 | App background |
| `--surface` | #FFFFFF | Panels, tables |
| `--line` | #DDE1E4 | Borders, dividers |
| `--primary` | #1F5A48 | Primary actions, active states, links |
| `--primary-soft` | #E6EFEB | Selected rows, active tab background |
| `--kraft` | #C8A26B | Seal tag accent only |
| `--warning` | #A86A12 | Pending, deadlines approaching |
| `--danger` | #B3261E | Disputes, shortages, errors |
| `--info` | #2F5D8A | Informational notes |

Status colours are always paired with an icon and text, never colour alone.

### 5.3 Typography

- **Typeface:** Public Sans for everything (a utilitarian, highly legible family). Load via `next/font/google`.
- **Numbers:** enable tabular figures (`font-variant-numeric: tabular-nums`) in all tables, prices and counts.
- **Scale:** 12 / 14 / 16 / 20 / 24 / 32 px. Body 14px on desktop tables, 16px elsewhere.
- **Weights:** 400 body, 500 labels, 600 headings. No 700+.
- **Case:** sentence case everywhere. No all-caps labels, no tracked-out eyebrows.

### 5.4 Layout

- **Desktop (≥1024px):** left sidebar navigation (240px), top bar with search, notifications, role switcher. Content max width 1200px, left aligned.
- **Tablet (640 to 1023px):** collapsible sidebar.
- **Mobile (<640px):** bottom tab bar with 4 tabs per role; tables become stacked cards; wide tables (manifest) scroll horizontally inside their container.
- **Spacing:** 4px base unit. Radius 6px on inputs and buttons, 10px on panels, 2px on seal tags.
- **Shadows:** none on cards; use borders. A single subtle shadow only on dialogs and the tour popover.

### 5.5 Core components

| Component | Notes |
|---|---|
| Button | Primary (filled `--primary`), secondary (outline), ghost, danger. Labels state the action: "Place bid", "Fund escrow", not "Submit". No arrow glyphs appended. |
| Badge | Verification badges (Licence verified, Deposit held), grade badges, state badges |
| SealTag | Kraft-coloured tag chip with a notch, showing seal ID (e.g. S-4821) |
| StateBadge | Lot and deal states with icon + colour |
| DealTimeline | Horizontal on desktop, vertical on mobile. Shows completed, current and upcoming states with timestamps and deadlines |
| NextStepPanel | A box at the top of every deal page: "What happens next" with one sentence and one primary action |
| Countdown | Deadline text: "Fund escrow within 31h 12m". Turns `--warning` under 6h |
| ManifestTable | Sortable, with line totals and a totals row |
| MoneyRow | Label left, AED amount right, tabular figures |
| EmptyState | One sentence of direction and one action, e.g. "No bids yet. Lots you bid on appear here. Browse lots" |

### 5.6 Copy rules

- Plain, active verbs. The same action keeps the same name through the flow: "Place bid" produces the toast "Bid placed".
- Errors state what happened and how to fix it: "Deposit could not be held. Add a payment method to place bids."
- No exclamation marks in system copy. No em dashes.

### 5.7 Accessibility and motion

- Visible keyboard focus on all interactive elements. WCAG AA contrast.
- Respect `prefers-reduced-motion`.
- Motion only in response to user actions: tour step transitions, dialog open, timeline step completing.

---

## 6. Guided introduction (onboarding tour)

### 6.1 Behaviour

- Shown on first visit to each role. A full-screen welcome card, then a sequence of popovers anchored to real interface elements.
- Controls on every step: **Back**, **Next**, **Skip tour**. Progress shown as "Step 3 of 8".
- Keyboard: Esc skips, arrow keys move between steps.
- Skipping or finishing sets a flag in the store so the tour does not reappear.
- A persistent **Help** button (question mark icon, top bar) offers "Restart tour" and "How Atlas works" (a one-page summary of the journey).
- If a step's anchor element is not on the current page, the tour navigates to that page first.

### 6.2 Buyer tour steps

| Step | Anchor | Text |
|---|---|---|
| 1 | Welcome card | Atlas is where verified businesses buy sealed surplus lots from UAE warehouses. Your money is only released to the seller after you count the stock. |
| 2 | Verification badges on profile | Your trade licence is verified, so sellers can trust your bids. |
| 3 | Browse filters | Find lots by category, grade, location and cost per unit. Save a search to get alerts. |
| 4 | Manifest table on a lot | Every lot lists exactly what is inside. Cartons are sealed and each seal is tied to this list. |
| 5 | Landed cost panel | This is what you actually pay per unit, including delivery or collection. |
| 6 | Place bid button | Bids are sealed. Add your price and terms. A small refundable deposit is held when you bid. |
| 7 | Deal timeline | If you win, fund escrow within 48 hours, then book a collection slot. |
| 8 | Collection count | Count the cartons against their seals. If anything is missing, the price adjusts automatically. |

### 6.3 Seller tour steps

| Step | Anchor | Text |
|---|---|---|
| 1 | Welcome card | Atlas helps you clear surplus stock to verified buyers, with payment secured before collection. |
| 2 | Create listing button | Upload your manifest, choose a grade and seal your cartons. |
| 3 | Terms step (reserve and conditions) | Set a hidden reserve price and any conditions, such as export only. |
| 4 | Active buyers indicator | See how many verified buyers are active in your category before you list. |
| 5 | Bid ranking | Bids are ranked by net value to you, with each buyer's reliability shown. |
| 6 | Accept / counter actions | Accept a bid, counter once, or call a best and final round. |
| 7 | Deal timeline | The buyer funds escrow within 48 hours. If they do not, the lot goes to your backup bidder. |
| 8 | Payout panel | You are paid once the count is confirmed and the inspection window closes. |

### 6.4 In-flow guidance (beyond the tour)

- Every multi-step flow (create listing, place bid, collection count) shows a step indicator and a short line of guidance per step.
- Every deal page has the NextStepPanel (section 5.5).
- Terms with specific meaning (reserve price, landed cost, tolerance, backup bidder) show a small info tooltip with a one-sentence definition.

---

## 7. Information architecture and routes

### 7.1 Buyer navigation

Desktop sidebar / mobile tabs: **Dashboard**, **Browse lots**, **My bids**, **Deals**, plus **Profile** (sidebar, and account sheet on mobile).

| Route | Screen |
|---|---|
| `/buyer` | Buyer dashboard |
| `/buyer/lots` | Browse lots |
| `/buyer/compare?ids=` | Compare lots |
| `/lots/[lotId]` | Lot detail (buyer view) |
| `/lots/[lotId]/bid` | Place bid |
| `/buyer/bids` | My bids |
| `/buyer/deals` | My deals |
| `/buyer/deals/[dealId]` | Deal tracker (fund, book collection, count, dispute) |
| `/buyer/deals/[dealId]/count` | Collection count flow |
| `/buyer/profile` | Buyer profile |

### 7.2 Seller navigation

Desktop sidebar / mobile tabs: **Dashboard**, **My lots**, **Deals**, **Create listing**, plus **Profile**.

| Route | Screen |
|---|---|
| `/seller` | Seller dashboard |
| `/seller/lots` | My lots |
| `/seller/lots/new` | Create listing wizard |
| `/lots/[lotId]` | Lot detail (seller view, with Q&A answering) |
| `/seller/lots/[lotId]/bids` | Bid review and decision |
| `/seller/deals` | My deals |
| `/seller/deals/[dealId]` | Deal tracker (collection, dispute response, payout) |
| `/seller/profile` | Seller profile |

### 7.3 Shared

| Route | Screen |
|---|---|
| `/` | Landing and role selection |
| `/sellers/[sellerId]`, `/buyers/[buyerId]` | Public profile pages |
| Notifications drawer | Opened from the bell icon |

---

## 8. Screen specifications

Each screen lists purpose, content, actions and acceptance criteria. "AC" items must work in the prototype.

### 8.1 Landing and role selection (`/`)

- **Purpose:** introduce Atlas in one line and start the demo.
- **Content:** product name, positioning line, three short points (Sealed lots, Sealed bids, Escrow until counted), two large choices: "Continue as buyer (Horizon Exports FZE)" and "Continue as seller (Al Noor General Trading LLC)".
- **AC:** choosing a role opens that dashboard and starts the tour on first visit.

### 8.2 Buyer dashboard (`/buyer`)

- **Content:**
  - Verification and deposit status strip (Licence verified, Deposit balance available).
  - Action items: deals needing action, sorted by nearest deadline (e.g. "Fund escrow for LOT-1042 within 31h").
  - Active bids with bidding close times.
  - Lots matching saved searches.
- **AC:** each action item links to the correct deal step.

### 8.3 Browse lots (`/buyer/lots`)

- **Filters:** category, grade, emirate, lot size (units), landed cost per unit range, seller manifest accuracy (≥95%), "closing within 24h".
- **Sort:** closing soonest, lowest cost per unit, highest recovery discount, newest.
- **Lot card content:** title, category, grade badge, units and cartons, total retail value, reserve status ("Reserve not shown"), landed cost per unit estimate, seller type and verification ("Verified distributor, Jebel Ali"), manifest accuracy, closing countdown, number of bids (count only, never amounts).
- **Actions:** open lot, add to compare (max 3), save search.
- **AC:** filters update results instantly; empty results show guidance ("No lots match. Widen the cost range or clear filters").

### 8.4 Lot detail, buyer view (`/lots/[lotId]`)

Sections, in order:

1. **Header:** title, state badge, closing countdown, seller card (verification, manifest accuracy, lots sold, dispute rate; seller name hidden until award if the seller chose anonymity).
2. **Summary:** units, cartons, total retail value, grade, location, collection availability.
3. **Manifest table:** SKU, product, quantity, unit retail value, line total, expiry (if relevant), grade. Totals row. High-value lines (top 20% by line value) flagged with a subtle marker, since shortages on these carry more weight.
4. **Grade evidence:** grade definition, tolerance statement ("Up to 10% of units may fall one grade below"), sample photos (placeholders) and test results for sampled units, with "Samples selected by Atlas" note.
5. **Provenance:** commercial invoice / bill of entry shown as a verified document chip.
6. **Seals:** list of cartons with SealTags.
7. **Valuation panel:**
   - Recovery benchmark: comparable closed lots in the same category and grade, shown as a small range chart (e.g. 18% to 26% of retail value).
   - Landed cost calculator: buyer enters a bid amount and chooses collection or delivery; shows cost per unit, VAT and total.
8. **Terms:** channel conditions set by the seller (e.g. "Export only", "No Amazon or Noon listings"), per-buyer cap, collection window.
9. **Questions and answers:** public thread; buyer can ask a question; answered questions visible to all.
10. **Inspection:** "Request inspection" (opens a dialog with a fixed fee, AED 750, and a mock booking). If an inspection report exists, show it as a document chip visible to all bidders.

- **Actions:** Place bid, Add to compare, Ask a question, Request inspection.
- **AC:** landed cost calculator updates live; Q&A posts appear in the thread; Place bid is disabled with an explanation if the deposit cannot be held.

### 8.5 Compare lots (`/buyer/compare`)

- Side-by-side columns (max 3): grade, units, retail value, landed cost per unit at the buyer's entered bid, recovery benchmark, seller manifest accuracy, conditions, closing time.
- **AC:** removing a lot updates the view; mobile shows lots as swipeable columns.

### 8.6 Place bid (`/lots/[lotId]/bid`)

A three-step form.

1. **Price:** bid amount (AED). Live display of: recovery % of retail, cost per unit, deposit to be held (5%, min AED 2,000).
2. **Terms:** proposed collection date (within the seller's window), destination market (dropdown), acceptance of the seller's channel conditions (checkbox, required), optional note to seller (max 280 characters).
3. **Review:** summary, deposit statement ("AED X will be held and released if you do not win"), sealed bid statement ("Other bidders cannot see your bid. You can raise it until bidding closes").

- **Actions:** Place bid.
- **AC:** the bid appears in My bids with state "Submitted"; deposit balance reduces; the seller's bid count increases; buyer can raise (not lower) the bid until close.

### 8.7 My bids (`/buyer/bids`)

- Tabs: Active, Won, Lost, Withdrawn.
- Each row: lot, bid amount, state, closing time, next action (Raise bid, Respond to counter, Submit best and final, Fund escrow).
- **AC:** counter and best-and-final requests appear here with a deadline and a response dialog.

### 8.8 Buyer deal tracker (`/buyer/deals/[dealId]`)

- **Top:** NextStepPanel and DealTimeline (states in section 9.2).
- **Panels by state:**
  - **Awarded:** amount due = winning bid + VAT + delivery (if chosen) − deposit already held. Button "Fund escrow". Countdown to 48h deadline.
  - **Funded:** "Book collection slot" (choose from 3 to 5 mock slots).
  - **Collection scheduled:** warehouse address, slot, what to bring, seal list.
  - **Counted / Inspection window:** results summary, countdown to 72h, "Raise dispute" button.
  - **Completed:** final amount, any credit applied, documents (tax invoice, count record).
- **AC:** each button advances state and updates the seller's view immediately.

### 8.9 Collection count (`/buyer/deals/[dealId]/count`)

A guided flow, designed mobile first since it is used in a warehouse.

1. **Check seals:** list of SealTags; for each, mark "Intact" or "Broken". Broken seals require a photo (mock upload).
2. **Count by line:** for each manifest line, enter units received (defaults to expected). Lines with a shortfall highlight in `--danger`.
3. **Grade check:** optional, mark units below the stated grade by line.
4. **Summary:** expected vs received value, shortage % by value, the outcome from the tolerance table (section 9.4), and the resulting price adjustment.
5. **Confirm and submit:** both parties' confirmation is simulated ("Seller representative confirmed count").

- **AC:** the outcome and adjusted price are calculated with the rules in section 9; the deal moves to Inspection window, or offers "Reject lot" if above the rejection threshold.

### 8.10 Dispute (within deal tracker)

- Buyer selects a reason (units missing after count, grade below tolerance, wrong items), adds description and evidence (mock photos), and sees the expected outcome from the published outcome table before submitting.
- Seller sees the claim with a response deadline (48h) and can Accept claim, Propose partial credit, or Contest with evidence.
- If the seller does not respond before the deadline, the claim resolves in the buyer's favour (triggered by the demo clock).
- **AC:** resolution adjusts payout and updates both parties' scores.

### 8.11 Seller dashboard (`/seller`)

- Verification strip, active buyers by category ("38 verified buyers active in Electronics"), lots by state, action items sorted by deadline (bids to review, disputes to answer, collections to prepare), recent payouts.

### 8.12 Create listing wizard (`/seller/lots/new`)

Six steps with a step indicator and save-as-draft.

1. **Basics:** title, category, warehouse location, collection availability, seller visibility (Show company name / Show as "Verified distributor, [area]").
2. **Manifest:** upload CSV (provide `/public/sample-manifest.csv`) or add lines manually; preview table with validation (missing quantity, missing retail value). Show totals.
3. **Grade and evidence:** choose grade from a fixed list for the category (definitions shown); Atlas "selects" sample SKUs at random; seller uploads photos (mock) and test results for tested grades.
4. **Provenance:** upload commercial invoice or bill of entry (mock); shows "Verified" after a short simulated check.
5. **Seal cartons:** enter carton count; system generates seal IDs; seller confirms "Cartons sealed and photographed". Show SealTags.
6. **Terms and price:** auction type (sealed bid; "Private auction" shown as coming later), bidding duration (3, 5 or 7 days), hidden reserve price, optional Buy now price, lot split option (single lot or split into N lots), per-buyer cap, channel conditions (checkbox list), recovery benchmark shown for context, active buyers in category.

- **Review and publish:** summary, note that stock is locked once bidding opens and withdrawing after that carries a penalty. Button "Submit for review". The state becomes Under review, then Live after a simulated review (instant, or advanced by the demo clock).
- **AC:** the new lot appears in the buyer's Browse lots once Live.

### 8.13 My lots (`/seller/lots`)

- Tabs: Drafts, Under review, Live, Bidding closed, In deal, Completed, Unsold.
- Row: lot, state, bids count, highest net value (seller can see amounts after close only), closing time, next action.

### 8.14 Bid review and decision (`/seller/lots/[lotId]/bids`)

Available once bidding closes.

- **Ranking table**, sorted by net value by default:
  - Buyer (verified company, markets served, completion rate, strikes).
  - Bid amount, commission, **net value to seller**.
  - Recovery % of retail.
  - Terms: collection date, destination, conditions accepted.
  - Reserve met (yes / no).
- **Decisions:**
  - **Accept** (selects the winner; the next-best eligible bid becomes the backup bidder automatically, shown clearly).
  - **Counter** (one counter per bidder, to up to the top 3 bidders, with a 24h response window).
  - **Call best and final** (one round, all bidders above a chosen threshold, 24h window).
  - **Relist** (if reserve not met and no acceptable bid).
- **AC:** accepting a bid moves the lot to Awarded, notifies the winner, releases losing bidders' deposits (except the backup, whose deposit stays held until the deal is funded).

### 8.15 Seller deal tracker (`/seller/deals/[dealId]`)

- NextStepPanel and DealTimeline.
- **Panels by state:** awaiting funding (countdown, backup bidder shown), funded (prepare collection; buyer's booked slot), counted (count summary and any adjustment), inspection window, dispute response, completed (payout breakdown: winning bid, credits, commission, net payout, "Paid by partner bank").
- **AC:** if the buyer misses the funding deadline (demo clock), the deal shows "Offered to backup bidder" and a new deal is created with the backup.

### 8.16 Profiles

- **Seller profile:** verification (licence, provenance history), manifest accuracy with a small history, lots sold, dispute rate, average time to collection readiness, categories.
- **Buyer profile:** verification, deposit status, markets served, lots won, completion rate, collection reliability, strikes with dates and reasons.

### 8.17 Notifications drawer

- Event list with timestamps: new bid on your lot (count only), bidding closed, you won, counter received, escrow funded, collection booked, count submitted, dispute opened, payout sent.
- Each item links to the relevant screen.

### 8.18 Demo panel

- A small floating button (bottom right, desktop only by default, hidden from the tour) opening a panel:
  - Simulated clock: current time, "+1 hour", "+1 day", "Jump to next deadline".
  - Scenario triggers: "Add a competing bid", "Buyer misses funding deadline", "Simulate a shortage at collection", "Seller does not respond to dispute".
  - "Reset demo data".
- **AC:** each trigger produces visible state changes in both roles.

---

## 9. Business rules and state machines

### 9.1 Lot states

```
Draft → Under review → Live → Bidding closed → Awarded → In deal → Completed
                         │           │
                         │           └→ Unsold → Relisted (new Live) or Archived
                         └→ Withdrawn (penalty if any bids exist)
```

| Transition | Triggered by |
|---|---|
| Draft → Under review | Seller submits listing |
| Under review → Live | Simulated review (instant or demo clock) |
| Live → Bidding closed | Clock reaches closing time |
| Bidding closed → Awarded | Seller accepts a bid |
| Bidding closed → Unsold | Seller chooses Relist or no bids meet reserve |
| Awarded → In deal | Buyer funds escrow |
| In deal → Completed | Deal completes (9.2) |

### 9.2 Deal states

```
Awarded → Funded → Collection scheduled → Counted → Inspection window → Completed
   │                                          │               │
   │                                          │               └→ Disputed → Resolved → Completed
   │                                          └→ Rejected (above rejection threshold) → Refunded
   └→ Unfunded (48h passed) → Buyer strike, deposit forfeited → Offered to backup bidder (new deal)
```

### 9.3 Bid states

`Submitted → (Raised) → Countered / Best and final requested → Won | Lost | Backup | Withdrawn`

- Buyers can raise a bid until close, never lower it.
- Buyers cannot withdraw a bid in the last 24 hours before close.
- Backup bidder: the next-best eligible bid after the winner. Their deposit stays held until the winner funds escrow.

### 9.4 Collection outcome and tolerance table

Shortage is measured by **value**, not unit count:

```
shortageValue = Σ (expectedQty − receivedQty) × unitRetailValue, for lines with a shortfall
shortagePct   = shortageValue / totalManifestRetailValue
creditAmount  = winningBid × shortagePct
```

| Shortage by value | Outcome |
|---|---|
| 0% to 2% | Automatic credit of `creditAmount`. No effect on seller score. |
| Over 2% to 10% | Automatic credit of `creditAmount`. Seller manifest accuracy reduced. |
| Over 10%, or any broken seal | Buyer may reject the lot for a full refund (including deposit), or accept with credit. Seller receives a strike. |

Grade shortfalls beyond the stated tolerance are handled the same way, valuing each below-grade unit at 50% of its unit retail value for the calculation (assumption, shown in the outcome table).

### 9.5 Money calculations

```
deposit          = max(2000, 0.05 × bidAmount)
recoveryPct      = bidAmount / totalManifestRetailValue
commission       = 0.05 × winningBid
netToSeller      = winningBid − commission
vat              = 0.05 × (winningBid + deliveryFee)
buyerTotal       = winningBid + deliveryFee + vat
amountToFund     = buyerTotal − deposit
landedCostUnit   = (bidAmount + deliveryFee) / totalUnits   (VAT shown separately)
finalPayout      = netToSeller − creditAmount × (1 − 0.05)
```

Delivery fees (mock, per lot):

| Pallets | Same emirate | Other emirate |
|---|---|---|
| 1 to 4 | AED 450 | AED 750 |
| 5 to 10 | AED 900 | AED 1,400 |
| 11+ | AED 1,600 | AED 2,400 |

### 9.6 Strikes

- Buyer strike: missed funding deadline, missed collection slot without rescheduling.
- Seller strike: withdrawal after bids, shortage over 10%, broken seals.
- Three strikes within 12 months suspend bidding or listing (shown as a notice; not enforced in the demo).

### 9.7 Channel conditions (fixed list)

- Export only
- No resale on Amazon, Noon or other online marketplaces in the UAE
- No resale to UAE retail stores
- Destination limited to selected markets
- Remove brand labels before resale (apparel only)

Buyers must accept the conditions to bid. In this release conditions are declared and accepted; export proof and lot-code enforcement are shown as "Coming later" in the terms step.

---

## 10. Data model and mock data

### 10.1 Types

```ts
type Role = 'buyer' | 'seller';

interface Company {
  id: string;
  name: string;
  role: Role;
  emirate: 'Dubai' | 'Sharjah' | 'Ajman';
  area: string;                    // e.g. "Jebel Ali", "Al Quoz", "SAIF Zone"
  licenceVerified: boolean;
  memberSince: string;             // ISO date
  categories: Category[];
  // seller metrics
  manifestAccuracy?: number;       // 0 to 1
  lotsSold?: number;
  disputeRate?: number;            // 0 to 1
  avgReadyHours?: number;
  // buyer metrics
  marketsServed?: string[];
  lotsWon?: number;
  completionRate?: number;
  collectionReliability?: number;
  depositBalance?: number;         // AED available for holds
  strikes: Strike[];
}

type Category = 'Electronics' | 'Cosmetics' | 'Apparel' | 'Household';

type Grade =
  | 'New sealed' | 'New open box' | 'Returns tested'
  | 'Returns untested' | 'Salvage';

interface ManifestLine {
  sku: string;
  product: string;
  qty: number;
  unitRetailValue: number;
  expiry?: string;
  grade: Grade;
  sampled?: boolean;
}

interface Lot {
  id: string;                      // "LOT-1042"
  sellerId: string;
  title: string;
  category: Category;
  grade: Grade;
  gradeTolerancePct: number;       // 0.10
  warehouse: { emirate: string; area: string; };
  showSellerName: boolean;
  manifest: ManifestLine[];
  cartons: { sealId: string; lines: string[] }[];
  pallets: number;
  provenanceDoc: { type: 'Commercial invoice' | 'Bill of entry'; verified: boolean };
  sampleEvidence: { sku: string; photos: string[]; testResult?: string }[];
  inspectionReport?: { date: string; summary: string };
  reserve: number;                 // hidden from buyers
  buyNow?: number;
  splitInto?: number;
  perBuyerCap?: number;
  conditions: string[];
  collectionWindow: { from: string; to: string };
  state: LotState;
  opensAt: string;
  closesAt: string;
  questions: { id: string; askedBy: string; q: string; a?: string; at: string }[];
}

type LotState =
  | 'Draft' | 'Under review' | 'Live' | 'Bidding closed'
  | 'Awarded' | 'In deal' | 'Completed' | 'Unsold' | 'Withdrawn';

interface Bid {
  id: string;
  lotId: string;
  buyerId: string;
  amount: number;
  collectionDate: string;
  destination: string;
  conditionsAccepted: boolean;
  note?: string;
  deposit: number;
  state: 'Submitted' | 'Countered' | 'Best and final requested'
       | 'Won' | 'Lost' | 'Backup' | 'Withdrawn';
  counterAmount?: number;
  history: { at: string; amount: number }[];
}

interface Deal {
  id: string;
  lotId: string;
  bidId: string;
  buyerId: string;
  sellerId: string;
  backupBidId?: string;
  state: 'Awarded' | 'Funded' | 'Collection scheduled' | 'Counted'
       | 'Inspection window' | 'Disputed' | 'Resolved' | 'Completed'
       | 'Rejected' | 'Unfunded';
  fundBy: string;
  delivery: 'Collection' | 'Delivery';
  deliveryFee: number;
  collectionSlot?: string;
  count?: {
    seals: { sealId: string; intact: boolean }[];
    lines: { sku: string; received: number; belowGrade: number }[];
    shortagePct: number;
    creditAmount: number;
    outcome: 'Auto credit' | 'Credit with score impact' | 'Reject available';
  };
  inspectionEndsAt?: string;
  dispute?: {
    reason: string;
    description: string;
    evidence: string[];
    sellerResponse?: 'Accepted' | 'Partial credit' | 'Contested';
    respondBy: string;
    resolution?: { credit: number; note: string };
  };
  payout?: { gross: number; credit: number; commission: number; net: number };
  timeline: { state: string; at: string }[];
}

interface Comparable {
  category: Category;
  grade: Grade;
  closedAt: string;
  recoveryPct: number;
}

interface Strike { at: string; reason: string; }
```

### 10.2 Mock companies

**Sellers**

| id | Name | Area | Accuracy | Lots sold | Dispute rate |
|---|---|---|---|---|---|
| s1 | Al Noor General Trading LLC | Jebel Ali, Dubai | 98% | 14 | 3% |
| s2 | Gulf Bridge Distribution LLC | Al Quoz, Dubai | 95% | 31 | 6% |
| s3 | Crescent Home Supplies Trading | Industrial Area 13, Sharjah | 91% | 9 | 11% |
| s4 | Meridian Fashion Retail LLC | Dubai Investments Park | 99% | 6 | 0% |

**Buyers**

| id | Name | Area | Markets | Lots won | Completion |
|---|---|---|---|---|---|
| b1 | Horizon Exports FZE | SAIF Zone, Sharjah | Kenya, Tanzania, Uganda | 22 | 96% |
| b2 | Deira Value Traders LLC | Deira, Dubai | UAE, Oman | 41 | 93% |
| b3 | Karachi Link General Trading | Al Ras, Dubai | Pakistan | 15 | 100% |
| b4 | Silk Route Wholesale FZCO | Jebel Ali Free Zone | Uzbekistan, Kazakhstan | 8 | 88% |
| b5 | Ajman Closeout Centre | Al Jurf, Ajman | UAE | 27 | 92% |
| b6 | Nile Star Import Export | Al Qusais, Dubai | Egypt, Sudan | 11 | 91% |

### 10.3 Mock lots

Create 8 lots so every state can be demonstrated.

| id | Title | Seller | Category | Grade | Units | Retail value (AED) | Reserve (AED) | State for demo |
|---|---|---|---|---|---|---|---|---|
| LOT-1042 | Wireless earbuds and power banks, stranded East Africa order | s1 | Electronics | New sealed | 4,800 | 912,400 | 170,000 | Bidding closed (primary demo lot, 5 bids) |
| LOT-1043 | Smartwatch straps and chargers, discontinued models | s1 | Electronics | New open box | 12,000 | 360,000 | 60,000 | Live, closes in 2 days |
| LOT-1051 | Skincare sets, end of season, expiry Aug 2027 | s2 | Cosmetics | New sealed | 6,200 | 1,054,000 | 190,000 | Live, closes in 20 hours |
| LOT-1055 | Hair dryers and straighteners, customer returns | s2 | Electronics | Returns tested | 900 | 243,000 | 35,000 | Live |
| LOT-1060 | Kitchen storage and cookware bundles | s3 | Household | New sealed | 3,400 | 272,000 | 48,000 | Live |
| LOT-1063 | Men's and women's footwear, previous season | s4 | Apparel | New sealed | 2,600 | 780,000 | 140,000 | Live, conditions: No UAE retail, Remove labels |
| LOT-1038 | Bluetooth speakers, cancelled Iraq order | s1 | Electronics | New sealed | 1,500 | 405,000 | 80,000 | In deal (Funded, collection booked with b1) |
| LOT-1029 | Air fryers, discontinued colourway | s3 | Household | New open box | 700 | 196,000 | 32,000 | Completed (with a 3.1% shortage credit, for history) |

**LOT-1042 manifest (primary demo lot)**

| SKU | Product | Qty | Unit retail (AED) | Line total |
|---|---|---|---|---|
| EB-210 | Wireless earbuds, ANC, black | 1,200 | 249 | 298,800 |
| EB-180 | Wireless earbuds, standard, white | 1,600 | 149 | 238,400 |
| PB-20K | Power bank 20,000 mAh, 22.5W | 1,400 | 199 | 278,600 |
| PB-10K | Power bank 10,000 mAh | 600 | 161 | 96,600 |
| **Total** | | **4,800** | | **912,400** |

60 cartons (80 units each), seal IDs S-4801 to S-4860, 6 pallets. Warehouse: Jebel Ali. Conditions: Export only. Collection window: next 7 days.

**LOT-1042 bids**

| Buyer | Amount (AED) | Recovery | Destination | Collection | Notes |
|---|---|---|---|---|---|
| b1 Horizon Exports FZE | 205,000 | 22.5% | Kenya | Day 2 | Demo user's bid |
| b3 Karachi Link | 212,000 | 23.2% | Pakistan | Day 5 | Highest price, later collection |
| b4 Silk Route Wholesale | 198,000 | 21.7% | Uzbekistan | Day 1 | 88% completion, 1 strike |
| b6 Nile Star | 184,000 | 20.2% | Egypt | Day 3 | Above reserve |
| b2 Deira Value Traders | 176,000 | 19.3% | UAE, Oman | Day 1 | Cannot meet "Export only" for UAE share; flag as condition conflict |

This gives the seller a real decision: highest price (b3) versus earliest collection and strongest record (b1), with a counter or best-and-final round available.

**Comparables (recovery % of retail)**

| Category | Grade | Recent closed lots |
|---|---|---|
| Electronics | New sealed | 19%, 21%, 23%, 24%, 26% |
| Electronics | New open box | 14%, 16%, 17%, 19% |
| Electronics | Returns tested | 10%, 12%, 13% |
| Cosmetics | New sealed | 16%, 18%, 20%, 22% |
| Household | New sealed | 17%, 19%, 20% |
| Apparel | New sealed | 15%, 17%, 18%, 21% |

### 10.4 Sample manifest CSV (`/public/sample-manifest.csv`)

```
sku,product,qty,unit_retail_value,expiry,grade
KT-500,Electric kettle 1.7L steel,800,119,,New sealed
KT-320,Electric kettle 1.2L white,1000,89,,New sealed
TS-220,Two-slice toaster,600,139,,New sealed
```

---

## 11. Demo script (target: 6 to 7 minutes of the 15-minute presentation)

1. **Landing:** positioning line. Continue as buyer. Show the first 3 tour steps, then skip.
2. **Browse and assess (buyer):** filter Electronics, New sealed. Open LOT-1051. Walk through manifest, grade evidence, provenance, seals, recovery benchmark and landed cost calculator. Ask a question. Place a bid (3 steps).
3. **Switch to seller:** open LOT-1042 bid review. Show ranking by net value, the condition conflict flag on b2, and the reliability data. Send a counter to b1 matching b3's price.
4. **Switch to buyer:** accept the counter in My bids. Deal created.
5. **Switch to seller:** accept; show the backup bidder.
6. **Buyer:** fund escrow, book collection slot.
7. **Demo panel:** "Simulate a shortage at collection". Buyer runs the count flow: one PB-20K carton short (80 units × AED 199 = AED 15,920, about 1.7% by value). Outcome: automatic credit, calculated live.
8. **Demo panel:** jump past the 72h inspection window. Deal completes.
9. **Seller:** payout breakdown with the credit and commission.
10. **Optional, if asked:** "Buyer misses funding deadline" to show the backup bidder taking over.

---

## 12. Out of scope for this release (show as "Coming later" where relevant)

- Private auctions and invite-only buyer lists.
- Export proof upload and deposit hold until customs export declaration.
- Lot codes and marketplace leak reporting.
- Third-party inspection marketplace (the prototype has a single mock inspection booking).
- Delivery partner integration and live freight quotes.
- Machine-learning valuation (the prototype uses the static comparables table).
- Arabic language and right-to-left layout.
- Expansion beyond Dubai, Sharjah and Ajman.

---

## 13. Acceptance checklist

- [ ] Role switcher changes role instantly and keeps shared state.
- [ ] Buyer and seller tours run, can be skipped, and can be restarted from Help.
- [ ] Every lot state and deal state in section 9 can be reached in the demo.
- [ ] Bid ranking shows net value, reliability and condition conflicts.
- [ ] Counter and best-and-final rounds work end to end.
- [ ] Escrow funding deadline and backup bidder hand-over work with the demo clock.
- [ ] Collection count calculates shortage by value and applies the tolerance table.
- [ ] Dispute flow resolves by seller response or by deadline.
- [ ] Payout breakdown matches the formulas in section 9.5.
- [ ] Layout works at 375px, 768px and 1280px widths.
- [ ] Keyboard focus visible; contrast meets AA; reduced motion respected.
- [ ] Deployed link opens without login or permission requests.
- [ ] "Reset demo data" restores the initial state.
