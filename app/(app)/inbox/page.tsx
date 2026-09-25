import { Suspense } from 'react';
import InboxDashboard from '@/src/components/app/workspace/InboxDashboard';

export default function InboxPage() {
  return (
    <Suspense>
      <InboxDashboard />
    </Suspense>
  );
}
