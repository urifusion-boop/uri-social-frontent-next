'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, Suspense } from 'react';

function SocialAccountsRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const params = searchParams.toString();
    router.replace(`/workspace?tab=connections${params ? `&${params}` : ''}`);
  }, [router, searchParams]);

  return null;
}

export default function SocialAccountsPage() {
  return (
    <Suspense>
      <SocialAccountsRedirect />
    </Suspense>
  );
}
