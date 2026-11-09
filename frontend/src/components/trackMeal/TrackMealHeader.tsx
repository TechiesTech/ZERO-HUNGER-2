import React from 'react';
import { Clock, Search } from 'lucide-react';
import { ScrollReveal } from '../ScrollReveal';

interface TrackMealHeaderProps {
  orderNumberInput: string;
  setOrderNumberInput: (value: string) => void;
  email: string;
  setEmail: (value: string) => void;
  loading: boolean;
  onSubmit: (event: React.FormEvent) => void;
  clearResult: () => void;
}

export const TrackMealHeader: React.FC<TrackMealHeaderProps> = ({
  orderNumberInput,
  setOrderNumberInput,
  email,
  setEmail,
  loading,
  onSubmit,
  clearResult,
}) => (
  <section className="bg-[#080808] pt-28 sm:pt-36 pb-16 sm:pb-20 border-b border-white/10">
    <div className="max-w-[1160px] mx-auto px-5 sm:px-8 lg:px-12 text-center">
      <ScrollReveal>
        <span className="text-xs font-mono-tabular font-bold uppercase tracking-[0.22em] text-[#49E619] block mb-3">
          VERIFIABLE HUMANITARIAN LEDGER
        </span>
        <h1 className="font-display-sans uppercase text-4xl sm:text-6xl lg:text-7xl font-black tracking-[-0.04em] leading-[0.92] text-white">
          FOLLOW YOUR <span className="text-[#49E619]">IMPACT.</span>
        </h1>
        <p className="mt-4 font-display-sans uppercase text-lg sm:text-2xl text-[#B9FF2C] tracking-tight">
          “Your meal didn&apos;t end at checkout.”
        </p>
        <form
          onSubmit={onSubmit}
          autoComplete="off"
          className="mt-8 mx-auto grid max-w-4xl gap-3 text-left sm:grid-cols-[1.2fr_1fr_auto] sm:items-end"
        >
          <label htmlFor="order-number-input" className="block font-mono-tabular text-[10px] font-bold uppercase tracking-widest text-white/75">
            Order number
            <span className="relative mt-2 block">
              <Search className="w-4 h-4 text-[#49E619] absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                id="order-number-input"
                type="text"
                autoComplete="off"
                value={orderNumberInput}
                onChange={(event) => {
                  setOrderNumberInput(event.target.value);
                  clearResult();
                }}
                placeholder="ZH-ORD-ABC123"
                className="w-full rounded-[10px] bg-[#122023] border border-white/20 pl-11 pr-4 py-4 font-mono-tabular text-sm font-bold uppercase tracking-widest text-white focus:outline-none focus:border-[#49E619]"
              />
            </span>
          </label>
          <label htmlFor="order-checkout-email" className="block font-mono-tabular text-[10px] font-bold uppercase tracking-widest text-white/75">
            Checkout email
            <input
              id="order-checkout-email"
              type="email"
              autoComplete="off"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                clearResult();
              }}
              placeholder="you@example.com"
              className="mt-2 w-full rounded-[10px] border border-white/20 bg-[#122023] px-4 py-4 text-sm font-sans font-normal normal-case tracking-normal text-white placeholder:text-white/35 focus:border-[#49E619] focus:outline-none"
            />
          </label>
          <button
            type="submit"
            disabled={loading}
            className="min-h-[54px] px-7 py-4 rounded-[10px] bg-[#49E619] hover:bg-[#B9FF2C] text-[#080808] font-mono-tabular text-xs font-bold uppercase tracking-widest transition-colors cursor-pointer whitespace-nowrap inline-flex items-center justify-center gap-2 disabled:cursor-wait disabled:opacity-60"
          >
            {loading ? <Clock className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            <span>{loading ? 'SEARCHING' : 'TRACK MEAL'}</span>
          </button>
        </form>
      </ScrollReveal>
    </div>
  </section>
);
