import React from 'react';
import { ScrollReveal } from './ScrollReveal';

const MISSION_SUBLINES = [
  'IT IS DIGNITY.',
  'IT IS OPPORTUNITY.',
  'IT IS HOPE.',
];

export const HomeConviction: React.FC = () => (
  <section className="bg-[#F2F4F3] text-[#122023] py-24 sm:py-32 border-t border-[#122023]/10">
    <div className="max-w-[1120px] mx-auto px-5 sm:px-8 lg:px-12 text-center">
      <ScrollReveal>
        <span className="text-xs font-mono-tabular font-bold uppercase tracking-[0.22em] text-[#188D44] block mb-4">
          OUR CONVICTION
        </span>
        <h2 className="font-display-sans uppercase text-4xl sm:text-6xl lg:text-7xl font-black tracking-[-0.04em] leading-[0.94] text-[#122023]">
          FOOD IS MORE THAN
          <br />
          <span className="text-[#188D44]">NOURISHMENT.</span>
        </h2>
      </ScrollReveal>

      <div className="mt-10 sm:mt-14 grid grid-cols-1 sm:grid-cols-3 gap-4">
        {MISSION_SUBLINES.map((line, index) => (
          <ScrollReveal key={line} delay={0.08 + index * 0.1} yOffset={16}>
            <div
              className={`rounded-[14px] py-6 px-5 font-display-sans uppercase text-2xl sm:text-3xl font-black tracking-tight ${
                index === 0
                  ? 'bg-[#49E619] text-[#122023]'
                  : index === 1
                    ? 'bg-[#4EDBE2] text-[#122023]'
                    : 'bg-[#B9FF2C] text-[#122023]'
              }`}
            >
              {line}
            </div>
          </ScrollReveal>
        ))}
      </div>

      <ScrollReveal delay={0.35} className="mt-10">
        <p className="text-sm sm:text-base text-[#122023]/80 max-w-xl mx-auto leading-relaxed font-medium">
          When a child sits down to a warm midday meal at school, or a family
          receives dry grain reserves before the monsoon floods, an entire
          trajectory shifts from survival toward human possibility.
        </p>
      </ScrollReveal>
    </div>
  </section>
);
