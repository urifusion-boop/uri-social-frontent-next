import { Suspense } from 'react';
import WorkspaceDashboard from '@/src/components/app/workspace/WorkspaceDashboard';

export default function WorkspacePage() {
  return (
    <Suspense>
      <WorkspaceDashboard />
    </Suspense>
  );
}
