export const createCheckoutSession = async (priceId: string) => {
  const res = await fetch('/api/create-checkout-session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ priceId, successUrl: window.location.origin + '/?checkout=success', cancelUrl: window.location.origin + '/?checkout=cancel' }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error || 'Failed to create checkout session');
  }

  const data = await res.json();
  return data;
};
