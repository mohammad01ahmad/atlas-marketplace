// Lot, deal and bid states with icon + colour (never colour alone, PRD 5.2).

import {
  FileEdit,
  Clock,
  Radio,
  Gavel,
  Trophy,
  Handshake,
  CheckCircle2,
  Archive,
  Ban,
  Wallet,
  CalendarCheck,
  ClipboardCheck,
  ShieldAlert,
  AlertTriangle,
  Scale,
  XCircle,
  RotateCcw,
  FileCheck,
  ShieldCheck,
} from 'lucide-react';
import { Badge } from './Badge';

const STATE_META: Record<string, { icon: typeof Clock; tone: 'neutral' | 'primary' | 'warning' | 'danger' | 'info' }> = {
  Draft: { icon: FileEdit, tone: 'neutral' },
  'Under review': { icon: Clock, tone: 'info' },
  Live: { icon: Radio, tone: 'primary' },
  'Bidding closed': { icon: Gavel, tone: 'warning' },
  Awarded: { icon: Trophy, tone: 'primary' },
  'In deal': { icon: Handshake, tone: 'info' },
  Completed: { icon: CheckCircle2, tone: 'primary' },
  Unsold: { icon: Archive, tone: 'neutral' },
  Withdrawn: { icon: Ban, tone: 'neutral' },
  Funded: { icon: Wallet, tone: 'primary' },
  'Collection scheduled': { icon: CalendarCheck, tone: 'info' },
  Counted: { icon: ClipboardCheck, tone: 'info' },
  'Inspection window': { icon: ShieldAlert, tone: 'warning' },
  Disputed: { icon: AlertTriangle, tone: 'danger' },
  Resolved: { icon: Scale, tone: 'info' },
  Rejected: { icon: XCircle, tone: 'danger' },
  Unfunded: { icon: AlertTriangle, tone: 'danger' },
  Submitted: { icon: FileCheck, tone: 'neutral' },
  Countered: { icon: RotateCcw, tone: 'warning' },
  'Best and final requested': { icon: Gavel, tone: 'warning' },
  Won: { icon: Trophy, tone: 'primary' },
  Lost: { icon: XCircle, tone: 'neutral' },
  Backup: { icon: ShieldCheck, tone: 'info' },
};

export function StateBadge({ state }: { state: string }) {
  const meta = STATE_META[state] ?? { icon: Clock, tone: 'neutral' as const };
  return (
    <Badge tone={meta.tone} icon={meta.icon}>
      {state}
    </Badge>
  );
}
