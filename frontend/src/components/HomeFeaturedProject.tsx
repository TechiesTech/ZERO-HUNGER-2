import React from 'react';
import { ArrowUpRight } from 'lucide-react';
import { FEATURED_PROJECT } from '../data/homeFeaturedProject';
import { Button } from './Button';
import { EditorialImage } from './EditorialImage';
import { ScrollReveal } from './ScrollReveal';

export const HomeFeaturedProject: React.FC = () => (
  <section className="bg-[#122023] text-white py-20 sm:py-28 border-t border-white/10">
    <div className="max-w-[1360px] mx-auto px-5 sm:px-8 lg:px-12">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
        <ScrollReveal scale className="lg:col-span-7">
          <div className="relative rounded-[18px] overflow-hidden border border-white/15 aspect-[16/10] shadow-2xl">
            <EditorialImage
              src={FEATURED_PROJECT.image}
              alt={FEATURED_PROJECT.title}
              className="w-full h-full"
            />
            <div className="absolute bottom-4 left-4 bg-[#080808]/90 backdrop-blur-xs px-3.5 py-1.5 rounded-[8px] text-[11px] font-mono-tabular font-bold uppercase tracking-widest text-[#B9FF2C]">
              SECUNDERABAD & OLD CITY · DAILY DAWN SERVICE
            </div>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={0.14} className="lg:col-span-5">
          <span className="text-xs font-mono-tabular font-bold uppercase tracking-[0.22em] text-[#49E619] block mb-3">
            {FEATURED_PROJECT.eyebrow}
          </span>

          <h2 className="font-display-sans uppercase text-4xl sm:text-5xl font-black tracking-[-0.04em] leading-[0.94] text-white">
            {FEATURED_PROJECT.headlineLines.map((line, idx) => (
              <span
                key={line}
                className={`block ${idx === 1 ? 'text-[#49E619]' : ''}`}
              >
                {line}
              </span>
            ))}
          </h2>

          <p className="mt-5 text-sm sm:text-base text-white/80 leading-relaxed">
            {FEATURED_PROJECT.description}
          </p>

          <div className="mt-8 pt-6 pb-6 border-y border-white/15 grid grid-cols-3 gap-4">
            {FEATURED_PROJECT.stats.map((stat, idx) => (
              <div key={stat.label}>
                <div
                  className={`font-display-sans text-2xl sm:text-3xl font-black ${
                    idx === 0
                      ? 'text-[#49E619]'
                      : idx === 1
                        ? 'text-[#4EDBE2]'
                        : 'text-[#B9FF2C]'
                  }`}
                >
                  {stat.value}
                </div>
                <div className="text-[11px] font-mono-tabular uppercase tracking-wider text-white/70 mt-1">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Button
              to={`/projects/${FEATURED_PROJECT.slug}`}
              variant="primary"
              size="lg"
            >
              <span>Explore Featured Project</span>
              <ArrowUpRight className="w-4 h-4" />
            </Button>
          </div>
        </ScrollReveal>
      </div>
    </div>
  </section>
);
