'use client';

import { useState } from 'react';
import { Crown } from 'lucide-react';
import toast from 'react-hot-toast';

interface StripeCheckoutButtonProps {
  label?: string;
  className?: string;
}

export function StripeCheckoutButton({ label = 'Subscribe to Premium', className }: StripeCheckoutButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/stripe/checkout', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      if (data.url) window.location.href = data.url;
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Payment error');
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleCheckout}
      disabled={loading}
      className={className ?? 'btn-primary flex items-center gap-2'}
    >
      <Crown className="w-4 h-4" />
      {loading ? 'Redirecting...' : label}
    </button>
  );
}
