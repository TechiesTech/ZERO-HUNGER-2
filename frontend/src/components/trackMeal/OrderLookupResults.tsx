import React from 'react';

interface OrderLookupResultsProps {
  searchPerformed: boolean;
  orderError: string;
}

export const OrderLookupResults: React.FC<OrderLookupResultsProps> = ({
  searchPerformed,
  orderError,
}) => (
  <div className="mx-auto max-w-4xl space-y-6">
    {!searchPerformed && !orderError && (
      <div className="mx-auto max-w-lg rounded-[18px] border border-white/15 bg-[#080808] p-8 text-center">
        <p className="font-display-sans text-xl font-black uppercase text-white">Track your meal</p>
        <p className="mt-2 text-sm text-white/70">
          Enter your order number and checkout email to view verified tracking details.
        </p>
      </div>
    )}
    {orderError && !orderError.toLowerCase().includes('not found') && (
      <div role="alert" className="rounded-[14px] border border-red-400/40 bg-red-950/40 p-5 text-sm text-red-100">
        <p className="font-mono-tabular text-xs font-bold uppercase tracking-widest">Order lookup error</p>
        <p className="mt-2 text-white/75">{orderError}</p>
      </div>
    )}
    {searchPerformed && (orderError.toLowerCase().includes('not found') || !orderError) && (
      <div role="status" className="mx-auto max-w-lg rounded-[18px] border border-white/15 bg-[#080808] p-12 text-center">
        <p className="font-display-sans text-2xl font-black uppercase text-white">Order not found</p>
        <p className="mt-2 text-sm text-white/70">
          Please verify your order number and checkout email, or place a meal box order to generate a new order number.
        </p>
      </div>
    )}
  </div>
);
