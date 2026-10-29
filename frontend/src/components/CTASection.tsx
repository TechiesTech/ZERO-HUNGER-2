import React from 'react';
import { motion } from 'motion/react';
import { ArrowUpRight, HeartHandshake } from 'lucide-react';
import { ScrollReveal } from './ScrollReveal';
import { SupportTab } from './SupportModal';

interface CTASectionProps {
  onOpenSupport: (tab?: SupportTab) => void;
}

export const CTASection: React.FC<CTASectionProps> = ({ onOpenSupport }) => {
  return (
    <section className="relative bg-[#122023] text-white py-20 sm:py-28 lg:py-32 overflow-hidden border-t border-white/10">
      {/* Animated Horizon Green Rule */}
      <motion.div
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
        className="origin-left h-[2px] w-full max-w-[1360px] mx-auto bg-gradient-to-r from-[#49E619] via-[#B9FF2C]/50 to-transparent mb-12 sm:mb-18"
        aria-hidden="true"
      />

      <div className="relative z-10 max-w-[1360px] mx-auto px-5 sm:px-8 lg:px-12">
        {/* Main Green Banner Card */}
        <div className="relative rounded-[28px] bg-[#49E619] text-[#122023] p-6 sm:p-10 lg:p-16 shadow-2xl overflow-visible">
          
          {/* Mobile Character Display (Stacked cleanly above content on small screens) */}
          <div className="block lg:hidden w-full flex justify-center mb-6">
            <img
              src="/assets/images/BePartOfTheChange.png"
              alt="Volunteering Character"
              className="w-full max-w-[280px] h-auto object-contain drop-shadow-lg"
            />
          </div>

          {/* Grid Layout for Desktop/Tablet */}
          <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Left Content Column */}
            <div className="lg:col-span-7 z-10">
              <ScrollReveal>
                <span className="text-xs font-mono font-bold uppercase tracking-[0.22em] text-[#122023]/80 block mb-3">
                  JOIN THE HUMANITARIAN MOVEMENT
                </span>

                <h2 className="font-display-sans uppercase text-3xl sm:text-5xl lg:text-7xl font-black tracking-[-0.04em] leading-[0.92] text-[#122023]">
                  BE PART OF
                  <br />
                  THE CHANGE.
                </h2>

                <p className="mt-4 sm:mt-5 text-sm sm:text-base lg:text-lg text-[#122023]/85 font-medium max-w-lg leading-relaxed">
                  Whether you sponsor a month of warm courtyard meals or join our
                  dawn kitchen volunteers in Hyderabad, your presence turns
                  compassion into daily nourishment.
                </p>
              </ScrollReveal>
            </div>

            {/* Right Action Buttons Column */}
            <div className="lg:col-span-5 flex flex-col sm:flex-row lg:flex-col gap-3.5 z-10 w-full max-w-xs justify-self-start lg:justify-self-end">
              <ScrollReveal delay={0.14} className="w-full">
                <button
                  type="button"
                  onClick={() => onOpenSupport('donate')}
                  className="w-full py-4 px-7 rounded-[12px] bg-[#122023] hover:bg-[#080808] text-white font-bold text-sm inline-flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
                >
                  <span>Donate Now</span>
                  <ArrowUpRight className="w-4 h-4 text-[#49E619]" />
                </button>
              </ScrollReveal>

              <ScrollReveal delay={0.22} className="w-full">
                <button
                  type="button"
                  onClick={() => onOpenSupport('volunteer')}
                  className="w-full py-4 px-7 rounded-[12px] bg-white hover:bg-[#F2F4F3] text-[#122023] font-bold text-sm inline-flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
                >
                  <HeartHandshake className="w-4 h-4 text-[#188D44]" />
                  <span>Volunteer With Us</span>
                </button>
              </ScrollReveal>
            </div>

          </div>

          {/* Desktop Absolute Positioned Character Artwork (Overflowing Bottom & Right) */}
          <div className="hidden lg:block absolute right-[260px] xl:right-[300px] bottom-0 pointer-events-none z-20">
            <img
              src="/assets/images/BePartOfTheChange.png"
              alt="Volunteering Character"
              className="w-[420px] xl:w-[480px] max-w-none object-contain translate-y-[14%]"
            />
          </div>

        </div>
      </div>
    </section>
  );
};