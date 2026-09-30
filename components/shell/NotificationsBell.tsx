'use client';

import { useState } from 'react';
import { Bell } from 'lucide-react';
import Link from 'next/link';
import { useAtlasStore } from '@/lib/store';
import { Dialog } from '@/components/ui/Dialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatDateTime } from '@/lib/format';

/** PRD 8.17. */
export function NotificationsBell() {
  const [open, setOpen] = useState(false);
  const role = useAtlasStore((s) => s.role);
  const activeBuyerId = useAtlasStore((s) => s.activeBuyerId);
  const activeSellerId = useAtlasStore((s) => s.activeSellerId);
  const notifications = useAtlasStore((s) => s.notifications);
  const markRead = useAtlasStore((s) => s.markNotificationRead);
  const companyId = role === 'buyer' ? activeBuyerId : activeSellerId;
  const mine = notifications.filter((n) => n.forCompanyId === companyId);
  const unread = mine.filter((n) => !n.read).length;

  return (
    <>
      <button
        type="button"
        aria-label="Notifications"
        onClick={() => setOpen(true)}
        className="relative flex h-9 w-9 items-center justify-center rounded-md text-ink-muted hover:bg-primary-soft hover:text-ink"
      >
        <Bell size={18} />
        {unread > 0 && <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-danger" />}
      </button>
      <Dialog open={open} onClose={() => setOpen(false)} title="Notifications">
        {mine.length === 0 ? (
          <EmptyState text="No notifications yet. Activity on your lots, bids and deals appears here." />
        ) : (
          <ul className="-m-5 divide-y divide-line">
            {mine.map((n) => (
              <li key={n.id}>
                <Link
                  href={n.href}
                  onClick={() => {
                    markRead(n.id);
                    setOpen(false);
                  }}
                  className={`block px-5 py-3 text-sm hover:bg-primary-soft ${n.read ? 'text-ink-muted' : 'font-medium text-ink'}`}
                >
                  <div>{n.text}</div>
                  <div className="mt-0.5 text-xs font-normal text-ink-muted">{formatDateTime(n.at)}</div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Dialog>
    </>
  );
}
