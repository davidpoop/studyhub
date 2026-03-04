'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export function UpgradeButton() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/user/role', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'CREATOR' }),
      });
      if (!res.ok) throw new Error();
      toast.success('You are now a Creator! Sign in again to refresh your role.');
      router.refresh();
    } catch {
      toast.error('Failed to upgrade. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button onClick={handleUpgrade} disabled={loading} className="btn-primary text-sm">
      {loading ? 'Upgrading...' : 'Become a Creator (free)'}
    </button>
  );
}
