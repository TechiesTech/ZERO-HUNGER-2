import React from 'react';
import { Link } from 'react-router-dom';
import {
  Cake,
  Shirt,
  Truck,
  Building2,
  ArrowRight,
} from 'lucide-react';
import { ScrollReveal } from './ScrollReveal';

interface CommunityDriveItem {
  id: string;
  badge: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  borderColor: string;
  hoverBorderColor: string;
  textColor: string;
  hoverTextColor: string;
  linkText: string;
  linkTo: string;
  cartoonImage?: string;
  cartoonAlt?: string;
  cartoonPosition?: 'left' | 'right';
  isHighlighted?: boolean; // Controls permanent default styling for featured cards
  customGlow?: string;
}

const COMMUNITY_DRIVES: CommunityDriveItem[] = [
  {
    id: 'birthdays',
    badge: 'CUSTOM PLACARDS & GRATITUDE',
    title: 'Celebrate Birthdays & Anniversaries',
    description:
      'Sponsor 25 to 500 meals on your special day. Children and elders hold personalized physical placards with your message and record thank-you videos sent to your WhatsApp.',
    icon: <Cake className="w-6 h-6" />,
    iconBg: 'bg-[#49E619]',
    iconColor: 'text-[#122023]',
    borderColor: 'border-[#49E619]/40 shadow-[0_0_25px_rgba(73,230,25,0.2)]', // Permanent clean default border/glow
    hoverBorderColor: 'hover:border-[#49E619]',
    textColor: 'text-[#49E619]',
    hoverTextColor: 'hover:text-[#B9FF2C]',
    linkText: 'Design Placard & Sponsor',
    linkTo: '/celebrate-and-give',
    cartoonImage: '/images/girl_divcard.png',
    cartoonAlt: 'Celebrate and give illustration',
    cartoonPosition: 'left',
    isHighlighted: true,
  },
  {
    id: 'clothes',
    badge: 'VASTRA DAAN · DROP BOXES & PICKUP',
    title: 'Donate New or Gently Used Clothes',
    description:
      'Drop wearable clothes and blankets at our 4 monitored steel bins in Secunderabad, Banjara Hills, Hitec City, and Afzalgunj—or schedule a free doorstep van pickup.',
    icon: <Shirt className="w-6 h-6" />,
    iconBg: 'bg-[#4EDBE2]',
    iconColor: 'text-[#122023]',
    borderColor: 'border-white/15',
    hoverBorderColor: 'hover:border-[#4EDBE2]',
    textColor: 'text-[#4EDBE2]',
    hoverTextColor: 'hover:text-white',
    linkText: 'Drop-Off Bins & Free Pickup',
    linkTo: '/celebrate-and-give?tab=CLOTH_DONATION',
    isHighlighted: false,
  },
  {
    id: 'rescue',
    badge: '24/7 RAPID VEHICLE DISPATCH',
    title: 'Leftover Food Fast Rescue',
    description:
      'Have excess cooked food from weddings, parties, or corporate cafeterias? Raise a rescue request or call our hotline. Our thermal vans pick it up within 45 minutes.',
    icon: <Truck className="w-6 h-6" />,
    iconBg: 'bg-[#B9FF2C]',
    iconColor: 'text-[#122023]',
    borderColor: 'border-white/15',
    hoverBorderColor: 'hover:border-[#B9FF2C]',
    textColor: 'text-[#B9FF2C]',
    hoverTextColor: 'hover:text-white',
    linkText: 'Request Emergency Pickup',
    linkTo: '/celebrate-and-give?tab=LEFTOVER_RESCUE',
    isHighlighted: false,
  },
  {
    id: 'csr',
    badge: 'MCA CSR-1 & SECTION 80G(5)',
    title: 'CSR & Corporate Tax Benefits',
    description:
      '50% tax deduction on donations. We provide 80G certificate, 12A exemption, MCA CSR-1 registration, Form 10BE, CA-audited statements, and bilateral MoUs.',
    icon: <Building2 className="w-6 h-6 text-[#188D44]" />,
    iconBg: 'bg-white',
    iconColor: 'text-[#122023]',
    borderColor: 'border-[#4EDBE2]/40 shadow-[0_0_20px_rgba(78,219,226,0.1)]',
    hoverBorderColor: 'hover:border-[#4EDBE2]',
    textColor: 'text-[#49E619]',
    hoverTextColor: 'hover:text-[#49E619]',
    linkText: 'Download Document Kit',
    linkTo: '/csr-tax-benefits',
    cartoonImage: '/images/boy_divcard.png',
    cartoonAlt: 'CSR tax benefits illustration',
    cartoonPosition: 'right',
    isHighlighted: true,
  },
];

export const CommunityDrivesShowcase: React.FC = () => {
  return (
    <section className="bg-[#080808] text-white py-20 sm:py-28 border-t border-white/10">
      <div className="max-w-[1360px] mx-auto px-5 sm:px-8 lg:px-12">
        <ScrollReveal className="text-center max-w-3xl mx-auto mb-14">
          <span className="text-xs font-mono-tabular font-bold uppercase tracking-[0.22em] text-[#49E619] block mb-3">
            COMMUNITY GIVING & DIGNITY DRIVES
          </span>
          <h2 className="font-display-sans uppercase text-3xl sm:text-5xl lg:text-6xl font-black tracking-[-0.04em] leading-[0.94] text-white">
            MORE WAYS TO <span className="text-[#49E619]">SERVE.</span>
          </h2>
          <p className="mt-4 text-sm sm:text-base text-white/80 leading-relaxed">
            Turn your personal birthdays and wedding anniversaries into hot feasts where beneficiaries hold your custom placards, donate clean clothes at drop boxes, or call our rescue vans for leftover event food.
          </p>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-20 lg:gap-6 pt-16">
          {COMMUNITY_DRIVES.map((item, idx) => (
            <ScrollReveal key={item.id} delay={0.08 * (idx + 1)} className="h-full">
              <div
                className={`relative rounded-[18px] bg-brand-slate border ${
                  item.borderColor
                } p-7 flex flex-col justify-between h-full ${
                  item.hoverBorderColor
                } transition-all duration-300 group overflow-visible`}
              >
                {/* Glowing Top Ledge / Highlight Line for Featured Cards */}
                {item.isHighlighted && (
                  <div className="absolute top-12 left-20 inset-x-8 h-1 bg-linear-to-r from-transparent via-brand-green to-transparent opacity-90 rounded-t-[18px]" />
                )}

                {/* Cartoon Character Overlay Sitting on the Ledge */}
                {item.cartoonImage && (
                  <div
                    className={`absolute -top-14 sm:-top-20 md:-top-20 lg:-top-20 ${
                      item.cartoonPosition === 'left' ? 'left-25 sm:left-4 md:left-20 lg:left-20' : 'right-25 sm:right-4 md:right-15 lg:right-10'
                    } w-36 h-36 sm:w-44 sm:h-44 pointer-events-none select-none z-20`}
                  >
                    {/* Character Shadow on the Top Border */}
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-3/4 h-3 bg-black/60 blur-md rounded-full -z-10" />

                    <img
                      src={item.cartoonImage}
                      alt={item.cartoonAlt}
                      className="w-full h-full object-contain drop-shadow-[0_10px_15px_rgba(0,0,0,0.5)]"
                    />
                  </div>
                )}

                <div>
                  <div
                    className={`w-12 h-12 rounded-[12px] ${item.iconBg} ${
                      item.iconColor
                    } flex items-center justify-center mb-5 font-black`}
                  >
                    {item.icon}
                  </div>
                  <span
                    className={`font-mono-tabular text-[10px] font-bold uppercase tracking-widest ${item.textColor} block mb-1`}
                  >
                    {item.badge}
                  </span>
                  <h3 className="font-display-sans uppercase text-2xl font-black text-white group-hover:text-current transition-colors leading-tight">
                    {item.title}
                  </h3>
                  <p className="mt-3 text-xs sm:text-sm text-white/75 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-white/10">
                  <Link
                    to={item.linkTo}
                    className={`font-mono-tabular text-xs font-bold uppercase tracking-wider ${item.textColor} ${item.hoverTextColor} inline-flex items-center gap-1.5 transition-colors`}
                  >
                    <span>{item.linkText}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
};