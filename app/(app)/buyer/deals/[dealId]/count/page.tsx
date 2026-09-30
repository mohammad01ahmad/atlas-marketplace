'use client';

import { use } from 'react';
import { CollectionCount } from '@/components/deal/CollectionCount';

export default function CollectionCountPage({ params }: { params: Promise<{ dealId: string }> }) {
  const { dealId } = use(params);
  return (
    <div className="space-y-5">
      <h1 className="text-xl font-semibold text-ink">Collection count</h1>
      <CollectionCount dealId={dealId} />
    </div>
  );
}
