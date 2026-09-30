'use client';

import { use } from 'react';
import { BidForm } from '@/components/bid/BidForm';

export default function PlaceBidPage({ params }: { params: Promise<{ lotId: string }> }) {
  const { lotId } = use(params);
  return (
    <div className="space-y-5">
      <h1 className="text-xl font-semibold text-ink">Place bid</h1>
      <BidForm lotId={lotId} />
    </div>
  );
}
