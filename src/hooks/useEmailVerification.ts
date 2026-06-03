import { useState } from 'react';
import { useAuth } from '@/src/providers/AuthProvider';

export function useEmailVerification() {
  const { userDetails } = useAuth();
  const [showVerifyModal, setShowVerifyModal] = useState(false);

  const isEmailVerified = userDetails?.emailVerified ?? true; // Default true for safety

  const requireEmailVerification = (callback?: () => void) => {
    if (!isEmailVerified) {
      setShowVerifyModal(true);
      return false;
    }
    callback?.();
    return true;
  };

  return {
    isEmailVerified,
    showVerifyModal,
    setShowVerifyModal,
    requireEmailVerification,
  };
}
