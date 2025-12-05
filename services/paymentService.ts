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

export const createRazorpayOrder = async (amountPaise: number, description?: string) => {
  const res = await fetch('/api/create-razorpay-order', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      amount: amountPaise,
      currency: 'INR',
      description: description || 'Timeloop AI Payment',
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error || 'Failed to create Razorpay order');
  }

  const data = await res.json();
  return data;
};

interface RazorpayCheckoutOptions {
  orderId: string;
  amount: number;
  keyId: string;
  description?: string;
  prefill?: {
    name?: string;
    email?: string;
  };
}

export const openRazorpayCheckout = (options: RazorpayCheckoutOptions): Promise<any> => {
  return new Promise((resolve, reject) => {
    const { orderId, amount, keyId, description = 'Timeloop AI', prefill = {} } = options;

    const checkoutOptions: any = {
      key: keyId,
      order_id: orderId,
      amount,
      currency: 'INR',
      name: 'Timeloop AI',
      description,
      handler: function (response: any) {
        console.log('✓ Payment successful', response);
        resolve({
          success: true,
          paymentId: response.razorpay_payment_id,
          orderId: response.razorpay_order_id,
          signature: response.razorpay_signature,
        });
      },
      modal: {
        ondismiss: function () {
          console.log('Payment modal closed');
          reject(new Error('Payment cancelled'));
        },
      },
      prefill,
      theme: {
        color: '#3399cc',
      },
    };

    const rzp = new (window as any).Razorpay(checkoutOptions);
    rzp.open();
  });
};
