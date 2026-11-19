import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Sparkles, Cake, Heart, Flower2, Star, Shirt, Truck, PhoneCall,
  MapPin, CheckCircle2, ShieldCheck, Package, ChevronDown,
} from 'lucide-react';
import { ScrollReveal } from '../components/ScrollReveal';
import { EditorialImage } from '../components/EditorialImage';
import {
  OCCASION_PACKAGES,
  DISTRIBUTION_CENTERS,
  RECENT_OCCASIONS,
  CLOTH_DROP_HUBS,
  LEFTOVER_RESCUE_CENTERS,
  OccasionPackage,
} from '../data/communityDrives';

type DriveTab = 'OCCASION_FOOD' | 'CLOTH_DONATION' | 'LEFTOVER_RESCUE';
type Accent = 'green' | 'cyan' | 'lime';

/* ---------- tokens & helpers ---------- */

const ACCENTS: Record<Accent, { focus: string; solid: string; text: string }> = {
  green: { focus: 'focus:border-[#49E619] focus:ring-[#49E619]/15', solid: 'bg-[#49E619]', text: 'text-[#49E619]' },
  cyan: { focus: 'focus:border-[#4EDBE2] focus:ring-[#4EDBE2]/15', solid: 'bg-[#4EDBE2]', text: 'text-[#4EDBE2]' },
  lime: { focus: 'focus:border-[#B9FF2C] focus:ring-[#B9FF2C]/15', solid: 'bg-[#B9FF2C]', text: 'text-[#B9FF2C]' },
};

const OCCASIONS = [
  { value: 'Birthday', label: 'Birthday', Icon: Cake },
  { value: 'Wedding Anniversary', label: 'Anniversary', Icon: Heart },
  { value: 'Memorial / In Remembrance', label: 'Remembrance', Icon: Flower2 },
  { value: 'Personal Milestone', label: 'Milestone', Icon: Star },
];

const ordinal = (n: number) => {
  const s = ['TH', 'ST', 'ND', 'RD'];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] || s[v] || s[0]}`;
};

const fmtDate = (iso: string) => {
  const d = new Date(`${iso}T00:00:00`);
  return iso && !isNaN(d.getTime())
    ? d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : 'Pick a date';
};

const fmtPrice = (v: number | string) => (typeof v === 'number' ? v.toLocaleString('en-IN') : v);

const card = 'rounded-3xl bg-[#122023] border border-white/10 shadow-2xl shadow-black/40 p-5 sm:p-9';
const panel = 'rounded-2xl bg-[#122023] border border-white/10 p-6';

/* ---------- small reusable pieces ---------- */

interface FieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  accent?: Accent;
  hint?: React.ReactNode;
  className?: string;
  options?: [string, string][]; // renders a dropdown
  rows?: number; // renders a textarea
  maxLength?: number;
  optional?: boolean;
}

const Field: React.FC<FieldProps> = ({
  label, value, onChange, placeholder, type = 'text', accent = 'green',
  hint, className = '', options, rows, maxLength, optional,
}) => {
  const cls = `w-full rounded-xl bg-[#080808] border border-white/15 px-4 py-3 text-sm text-white placeholder:text-white/35 hover:border-white/30 focus:outline-none focus:ring-4 [color-scheme:dark] ${ACCENTS[accent].focus}`;
  const common = { value, required: !optional, onChange: (e: React.ChangeEvent<any>) => onChange(e.target.value) };
  return (
    <label className={`block ${className}`}>
      <span className="block text-sm font-medium text-white/85 mb-2">{label}</span>
      {options ? (
        <div className="relative">
          <select {...common} className={`${cls} appearance-none pr-10 ${value ? '' : 'text-white/35'}`}>
            <option value="" disabled>{placeholder || 'Select…'}</option>
            {options.map(([v, l]) => <option key={v} value={v} className="text-white">{l}</option>)}
          </select>
          <ChevronDown className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
        </div>
      ) : rows ? (
        <textarea {...common} rows={rows} maxLength={maxLength} placeholder={placeholder} className={`${cls} resize-none leading-relaxed`} />
      ) : (
        <input {...common} type={type} placeholder={placeholder} className={cls} />
      )}
      {hint && <span className="block mt-1.5 text-xs text-white/50">{hint}</span>}
    </label>
  );
};

const Group: React.FC<{ title: string; hint?: string; children: React.ReactNode }> = ({ title, hint, children }) => (
  <section className="pt-7 border-t border-white/10 first:border-0 first:pt-0">
    <h3 className="font-display-sans text-base font-bold text-white">{title}</h3>
    {hint && <p className="mt-0.5 text-xs text-white/55">{hint}</p>}
    <div className="mt-4 space-y-4">{children}</div>
  </section>
);

const Heading: React.FC<{ kicker: string; title: string; accent: Accent }> = ({ kicker, title, accent }) => (
  <div className="pb-5 mb-6 border-b border-white/10">
    <p className={`text-xs font-semibold ${ACCENTS[accent].text}`}>{kicker}</p>
    <h2 className="font-display-sans uppercase text-2xl sm:text-3xl font-black text-white mt-1 leading-tight">{title}</h2>
  </div>
);

const SubmitBtn: React.FC<{ accent: Accent; Icon: typeof Truck; children: React.ReactNode; className?: string }> = ({
  accent, Icon, children, className = 'w-full',
}) => (
  <button
    type="submit"
    className={`${className} ${ACCENTS[accent].solid} py-3.5 px-7 rounded-xl text-[#080808] text-sm font-bold inline-flex items-center justify-center gap-2 hover:brightness-110 transition cursor-pointer`}
  >
    <Icon className="w-4 h-4" />
    {children}
  </button>
);

interface DoneProps {
  accent: Accent;
  eyebrow: string;
  title: string;
  code: string;
  resetLabel: string;
  onReset: () => void;
  extra?: React.ReactNode;
  children: React.ReactNode;
}

const Done: React.FC<DoneProps> = ({ accent, eyebrow, title, code, resetLabel, onReset, extra, children }) => (
  <div className="py-8 text-center">
    <div className={`w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center text-[#080808] ${ACCENTS[accent].solid}`}>
      <CheckCircle2 className="w-8 h-8" />
    </div>
    <p className={`text-sm font-semibold ${ACCENTS[accent].text}`}>{eyebrow}</p>
    <h3 className="font-display-sans uppercase text-3xl font-black text-white mt-2">{title}</h3>
    <p className="mt-4 inline-block px-4 py-2 rounded-lg bg-white/10 font-mono-tabular text-sm text-white">
      Reference: <strong className={ACCENTS[accent].text}>{code}</strong>
    </p>
    <div className="mt-4 text-sm text-white/75 max-w-md mx-auto leading-relaxed space-y-3">{children}</div>
    <div className="mt-7 flex flex-wrap justify-center gap-3">
      {extra}
      <button type="button" onClick={onReset} className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-bold cursor-pointer">
        {resetLabel}
      </button>
    </div>
  </div>
);

/* ---------- page ---------- */

const EMPTY = {
  // celebration
  occasion: 'Birthday', name: '', age: '', message: '', centerId: '', date: '',
  sName: '', sEmail: '', sPhone: '',
  // clothes
  bags: '', clothType: '', clothDate: '', clothAddr: '', cName: '', cPhone: '',
  // food rescue
  servings: '', eventType: '', cooked: '', items: '', venue: '', rName: '', rPhone: '',
};

export const CelebrateAndGive: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<DriveTab>((searchParams.get('tab') as DriveTab) || 'OCCASION_FOOD');
  const [clothMode, setClothMode] = useState<'PICKUP' | 'DROP_OFF'>('PICKUP');
  const [pkg, setPkg] = useState<OccasionPackage>(OCCASION_PACKAGES[1]);
  const [f, setF] = useState(EMPTY);
  const [codes, setCodes] = useState<Record<string, string>>({});

  const set = (k: keyof typeof EMPTY) => (v: string) => setF((p) => ({ ...p, [k]: v }));
  const goTab = (t: DriveTab) => { setActiveTab(t); setSearchParams({ tab: t }); };
  const submit = (key: string, prefix: string) => (e: React.FormEvent) => {
    e.preventDefault();
    setCodes((c) => ({ ...c, [key]: `${prefix}-${Math.random().toString(36).slice(2, 7).toUpperCase()}` }));
  };
  const reset = (key: string) => () => setCodes((c) => ({ ...c, [key]: '' }));

  // Placard falls back to sample text until the user types
  const center = DISTRIBUTION_CENTERS.find((c) => c.id === f.centerId);
  const name = (f.name.trim() || 'Aarav').toUpperCase();
  const n = parseInt(f.age, 10);
  const num = n > 0 ? `${ordinal(n)} ` : '';
  const heading =
    f.occasion === 'Birthday' ? `HAPPY ${num}BIRTHDAY ${name}!`
    : f.occasion === 'Wedding Anniversary' ? `HAPPY ${num}ANNIVERSARY ${name}!`
    : f.occasion === 'Memorial / In Remembrance' ? `IN SACRED MEMORY OF ${name}`
    : `CELEBRATING ${name}`;

  const tabs: { id: DriveTab; label: string; Icon: typeof Cake; accent: Accent }[] = [
    { id: 'OCCASION_FOOD', label: 'Celebrate birthdays & anniversaries', Icon: Cake, accent: 'green' },
    { id: 'CLOTH_DONATION', label: 'Donate clothes', Icon: Shirt, accent: 'cyan' },
    { id: 'LEFTOVER_RESCUE', label: 'Leftover food rescue', Icon: Truck, accent: 'lime' },
  ];

  return (
    <div className="bg-[#080808] text-white min-h-screen">
      {/* ================= HERO ================= */}
      <section
        className="relative isolate overflow-hidden pt-28 sm:pt-36 pb-14 sm:pb-20 border-b border-white/10"
        style={{
          backgroundImage: `linear-gradient(rgba(0,0,0,0.25), rgba(0,0,0,0.45)), url("/images/Kindness%20in%20Every%20Gift.webp")`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="max-w-[1360px] mx-auto px-5 sm:px-8 lg:px-12 text-center">
          <ScrollReveal>
            <span className="text-[11px] sm:text-xs font-mono-tabular font-bold uppercase tracking-[0.2em] text-[#49E619] block mb-3">
              COMMUNITY CELEBRATIONS & ZERO-WASTE DRIVES
            </span>
            <h1 className="font-display-sans uppercase text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-[-0.035em] leading-[1.05] max-w-5xl mx-auto">
              SHARE YOUR <span className="text-[#49E619]">JOY.</span>
              <br />
              FEED & CLOTHE WITH DIGNITY.
            </h1>
            <p className="mt-5 text-sm sm:text-base md:text-lg text-white/90 max-w-2xl mx-auto leading-relaxed">
              Celebrate your birthdays and wedding anniversaries by sponsoring hot meals where children hold your
              personalized placards and send video gratitude. Donate clothes at local drop boxes, or call our 24/7
              rescue vans for leftover party food.
            </p>

            <div role="tablist" className="mt-8 sm:mt-10 grid grid-cols-1 md:grid-cols-3 gap-1.5 p-1.5 rounded-2xl bg-[#122023]/90 backdrop-blur-sm border border-white/15 max-w-3xl mx-auto">
              {tabs.map(({ id, label, Icon, accent }) => (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={activeTab === id}
                  onClick={() => goTab(id)}
                  className={`flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl text-sm font-semibold transition-colors cursor-pointer ${
                    activeTab === id ? `${ACCENTS[accent].solid} text-[#080808]` : 'text-white/80 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {label}
                </button>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </section>

      <div className="max-w-[1360px] mx-auto px-5 sm:px-8 lg:px-12 py-12 sm:py-20">
        {/* ================= TAB 1: CELEBRATE ================= */}
        {activeTab === 'OCCASION_FOOD' && (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
              {/* Form */}
              <div className={`lg:col-span-7 ${card}`}>
                <Heading kicker="Placard guaranteed" title="Sponsor meals & send placards" accent="green" />

                {codes.occasion ? (
                  <Done
                    accent="green"
                    eyebrow="Booking confirmed"
                    title={`Thank you, ${f.sName}!`}
                    code={codes.occasion}
                    resetLabel="Sponsor another occasion"
                    onReset={reset('occasion')}
                    extra={
                      <Link to={`/track-meal?token=${codes.occasion}`} className="px-6 py-3 rounded-xl bg-[#49E619] text-[#080808] text-sm font-bold">
                        Track meal & proof live →
                      </Link>
                    }
                  >
                    <p>
                      {pkg.mealsCount} meals (₹{fmtPrice(pkg.priceInr)}) for <strong className="text-white">{f.name}</strong> will be
                      served on <strong className="text-white">{fmtDate(f.date)}</strong> at{' '}
                      <strong className="text-white">{center?.name}</strong>.
                    </p>
                    <p className="text-white/60">
                      We print your placard, record the children’s thank-you, and send photos and video to {f.sEmail} and
                      WhatsApp within 24 hours of the meal.
                    </p>
                  </Done>
                ) : (
                  <form onSubmit={submit('occasion', 'OCC-2026')} className="space-y-7">
                    <Group title="What are you celebrating?">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        {OCCASIONS.map(({ value, label, Icon }) => {
                          const on = f.occasion === value;
                          return (
                            <button
                              key={value}
                              type="button"
                              aria-pressed={on}
                              onClick={() => set('occasion')(value)}
                              className={`flex flex-col items-center gap-2 py-4 rounded-2xl border text-sm font-semibold transition cursor-pointer ${
                                on ? 'bg-[#49E619]/15 border-[#49E619] text-white' : 'bg-[#080808] border-white/15 text-white/70 hover:border-white/35'
                              }`}
                            >
                              <Icon className={`w-5 h-5 ${on ? 'text-[#49E619]' : 'text-white/50'}`} />
                              {label}
                            </button>
                          );
                        })}
                      </div>
                    </Group>

                    <Group title="Your placard" hint="The preview on the right updates as you type.">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <Field className="sm:col-span-2" label="Name on the placard" value={f.name} onChange={set('name')} placeholder="e.g. Aarav, or Ramesh & Sunita" />
                        <Field
                          label={f.occasion === 'Birthday' ? 'Turning age' : f.occasion === 'Wedding Anniversary' ? 'Anniversary year' : 'Number (optional)'}
                          value={f.age} onChange={set('age')} placeholder="e.g. 10" optional
                        />
                      </div>
                      <Field
                        label="Blessing message" rows={3} maxLength={120}
                        value={f.message} onChange={set('message')}
                        placeholder="e.g. Wishing you good health, wisdom and sunshine always!"
                        hint={`The children will read this aloud · ${f.message.length}/120`}
                      />
                    </Group>

                    <Group title="Choose a feast package" hint="Every package includes the placard, a thank-you video and an 80G receipt.">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {OCCASION_PACKAGES.slice(0, 3).map((p) => {
                          const on = pkg.id === p.id;
                          return (
                            <button
                              key={p.id}
                              type="button"
                              aria-pressed={on}
                              onClick={() => setPkg(p)}
                              className={`p-4 rounded-2xl text-left border transition cursor-pointer ${
                                on ? 'bg-[#49E619]/15 border-[#49E619]' : 'bg-[#080808] border-white/15 hover:border-white/35'
                              }`}
                            >
                              <span className="text-xs text-white/60">{p.mealsCount} meals</span>
                              <span className="block font-display-sans text-2xl font-black">₹{fmtPrice(p.priceInr)}</span>
                              <span className="block mt-2 text-sm font-semibold">{p.name}</span>
                              <span className="block mt-1 text-xs text-white/60 line-clamp-2">{p.suitableFor}</span>
                            </button>
                          );
                        })}
                      </div>
                    </Group>

                    <Group title="Where and when">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Field
                          label="Distribution center" value={f.centerId} onChange={set('centerId')}
                          placeholder="Choose a center"
                          options={DISTRIBUTION_CENTERS.map((c) => [c.id, `${c.name} (${c.area})`])}
                        />
                        <Field label="Celebration date" type="date" value={f.date} onChange={set('date')} />
                      </div>
                    </Group>

                    <Group title="Your details" hint="Your 80G receipt, video and photos are sent here.">
                      <Field label="Full name" value={f.sName} onChange={set('sName')} placeholder="e.g. Vikram Malhotra" />
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Field label="Email" type="email" value={f.sEmail} onChange={set('sEmail')} placeholder="you@example.com" />
                        <Field label="WhatsApp number" type="tel" value={f.sPhone} onChange={set('sPhone')} placeholder="+91 98765 43210" />
                      </div>
                    </Group>

                    <div className="rounded-2xl bg-[#080808] border border-white/10 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div>
                        <p className="text-xs text-white/55">Your sponsorship</p>
                        <p className="font-display-sans text-xl font-black">
                          {pkg.mealsCount} meals <span className="text-white/30 mx-1">·</span>
                          <span className="text-[#49E619]">₹{fmtPrice(pkg.priceInr)}</span>
                        </p>
                      </div>
                      <SubmitBtn accent="green" Icon={Sparkles} className="w-full sm:w-auto">
                        Sponsor {pkg.mealsCount} meals
                      </SubmitBtn>
                    </div>
                  </form>
                )}
              </div>

              {/* Live preview */}
              <div className="lg:col-span-5 space-y-6">
              <aside className={card}>
                <div className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-2 text-sm font-semibold">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#49E619] animate-pulse" />
                    Live placard preview
                  </span>
                  <span className="text-xs text-white/50">Held by the children</span>
                </div>

                <div className="mt-5 relative rounded-2xl bg-[#F2F4F3] text-[#122023] p-3 shadow-xl shadow-black/50">
                  <span className="absolute top-4 left-4 w-3 h-3 rounded-full bg-[#122023]" />
                  <span className="absolute top-4 right-4 w-3 h-3 rounded-full bg-[#122023]" />
                  <div className="rounded-xl border-2 border-dashed border-[#122023]/25 px-5 pt-9 pb-5 text-center">
                    <p className="text-[11px] font-semibold tracking-[0.14em] uppercase text-[#0F6B33]">
                      Zero Hunger Initiative · Hyderabad
                    </p>
                    <h3 className="mt-4 font-display-sans uppercase text-3xl font-black leading-[1.05] tracking-tight break-words">
                      {heading}
                    </h3>
                    <p className="mt-4 font-serif-editorial italic text-base text-[#122023]/85 leading-snug break-words">
                      “{f.message.trim() || 'Your blessing message will appear here.'}”
                    </p>
                    <span className="mt-5 inline-block px-3.5 py-1.5 rounded-full bg-[#49E619] text-xs font-bold">
                      {pkg.mealsCount} warm meals dedicated
                    </span>
                    <div className="mt-5 pt-3 border-t border-[#122023]/15 flex justify-between gap-3 text-[11px] text-[#122023]/70">
                      <span className="truncate">{center?.name || 'Your chosen center'}</span>
                      <span className="shrink-0 font-medium">{fmtDate(f.date)}</span>
                    </div>
                  </div>
                </div>

                <ul className="mt-6 space-y-3 text-sm text-white/75 leading-relaxed">
                  {[
                    'Children hold this exact printed placard in front of their hot lunch.',
                    'A thank-you video reaches you on WhatsApp the same afternoon.',
                    '50% tax exemption under Section 80G, with an instant receipt.',
                  ].map((t) => (
                    <li key={t} className="flex gap-3">
                      <CheckCircle2 className="w-4 h-4 text-[#49E619] shrink-0 mt-1" />
                      {t}
                    </li>
                  ))}
                </ul>
              </aside>

              {/* Recent occasions as row cards */}
              <div className={panel}>
                <h2 className="font-display-sans uppercase text-lg font-black">Recently celebrated with us</h2>
                <div className="mt-4 space-y-3">
                  {RECENT_OCCASIONS.map((item) => (
                    <article key={item.id} className="flex gap-3.5 p-3 rounded-xl bg-[#080808] border border-white/10">
                      <div className="w-20 h-20 shrink-0 rounded-lg overflow-hidden bg-white/10">
                        <EditorialImage src={item.image} alt={item.occasionType} className="w-full h-full" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-display-sans uppercase text-sm font-black leading-snug">{item.occasionType}</h3>
                        <p className="mt-0.5 text-xs font-semibold text-[#49E619]">By {item.sponsorName} · {item.mealsServed} meals</p>
                        <p className="mt-1.5 text-xs text-white/65 italic font-serif-editorial leading-relaxed line-clamp-2">
                          “{item.beneficiaryQuote}”
                        </p>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            </div>
            </div>
          </>
        )}

        {/* ================= TAB 2: CLOTHES ================= */}
        {activeTab === 'CLOTH_DONATION' && (
          <>
            <div className="text-center max-w-3xl mx-auto mb-10">
              <h2 className="font-display-sans uppercase text-3xl sm:text-5xl font-black">Give new or gently used clothes</h2>
              <p className="mt-3 text-white/75 text-sm sm:text-base leading-relaxed">
                Clean, wearable garments, blankets, school shoes and children’s wear are sorted by our volunteers and
                given to pavement families and rural homes.
              </p>
              <div className="mt-8 inline-flex flex-col sm:flex-row w-full sm:w-auto p-1.5 rounded-2xl bg-[#122023] border border-white/15 gap-1.5">
                {([['PICKUP', 'Free doorstep pickup', Truck], ['DROP_OFF', 'Drop at a collection bin', MapPin]] as const).map(([m, label, Icon]) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setClothMode(m)}
                    className={`flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold transition-colors cursor-pointer ${
                      clothMode === m ? 'bg-[#4EDBE2] text-[#080808]' : 'text-white/80 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {clothMode === 'PICKUP' ? (
              <div className={`max-w-2xl mx-auto ${card}`}>
                {codes.cloth ? (
                  <Done
                    accent="cyan"
                    eyebrow="Pickup confirmed"
                    title={`Thank you, ${f.cName}!`}
                    code={codes.cloth}
                    resetLabel="Book another pickup"
                    onReset={reset('cloth')}
                  >
                    <p>Our van will reach your address on <strong className="text-white">{fmtDate(f.clothDate)}</strong> to collect your clothes.</p>
                  </Done>
                ) : (
                  <form onSubmit={submit('cloth', 'CLOTH')} className="space-y-5">
                    <Heading kicker="Hyderabad & Cyberabad" title="Book a free volunteer pickup" accent="cyan" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Field
                        accent="cyan" label="Bags of clothes" value={f.bags} onChange={set('bags')} placeholder="How many bags?"
                        options={[['1', '1 bag (10-15 garments)'], ['2', '2 bags (25-35 garments)'], ['3', '3-5 bags (full wardrobe)'], ['10', '6-10+ bags (society drive)']]}
                      />
                      <Field accent="cyan" label="Pickup date" type="date" value={f.clothDate} onChange={set('clothDate')} />
                    </div>
                    <Field accent="cyan" label="What are you donating?" value={f.clothType} onChange={set('clothType')} placeholder="e.g. Sarees, men’s shirts, blankets, kids’ shoes" />
                    <Field accent="cyan" label="Pickup address" rows={3} value={f.clothAddr} onChange={set('clothAddr')} placeholder="Flat/house no., apartment, street, landmark, pin code" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Field accent="cyan" label="Contact name" value={f.cName} onChange={set('cName')} placeholder="Your name" />
                      <Field accent="cyan" label="Phone" type="tel" value={f.cPhone} onChange={set('cPhone')} placeholder="For the van driver" />
                    </div>
                    <SubmitBtn accent="cyan" Icon={Package}>Schedule free pickup</SubmitBtn>
                  </form>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                {CLOTH_DROP_HUBS.map((hub) => (
                  <div key={hub.id} className={`${panel} flex flex-col justify-between`}>
                    <div>
                      <div className="flex justify-between gap-3 pb-3 border-b border-white/10 text-xs">
                        <span className="font-semibold text-[#4EDBE2]">Drop bin</span>
                        <span className="text-white/60">{hub.hours}</span>
                      </div>
                      <h3 className="font-display-sans uppercase text-xl font-black mt-4">{hub.name}</h3>
                      <p className="text-sm text-white/80 mt-1.5">{hub.address}</p>
                      <p className="text-xs text-[#B9FF2C] mt-1.5">Landmark: {hub.landmark}</p>
                      <div className="mt-4 flex flex-wrap gap-1.5">
                        {hub.accepts.map((item) => (
                          <span key={item} className="px-2.5 py-1 rounded-md bg-white/10 text-xs">✓ {item}</span>
                        ))}
                      </div>
                    </div>
                    <div className="mt-6 pt-4 border-t border-white/10 flex justify-between text-sm">
                      <span className="text-white/60">Helpline</span>
                      <a href={`tel:${hub.phone}`} className="text-[#4EDBE2] font-bold hover:underline">{hub.phone}</a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ================= TAB 3: FOOD RESCUE ================= */}
        {activeTab === 'LEFTOVER_RESCUE' && (
          <>
            <div className="rounded-3xl bg-[#B9FF2C] text-[#122023] p-7 sm:p-12 mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#122023] text-white text-xs font-semibold mb-4">
                  <PhoneCall className="w-3.5 h-3.5 text-[#B9FF2C]" />
                  24/7 food rescue helpline
                </span>
                <h2 className="font-display-sans uppercase text-3xl sm:text-5xl font-black leading-[1.02]">
                  Have leftover cooked food? Call us now.
                </h2>
                <p className="mt-4 text-sm sm:text-base font-medium max-w-2xl leading-relaxed text-[#122023]/85">
                  Our thermal vans collect fresh food from weddings, banquets, tech parks and parties within 45 minutes
                  and deliver it to night shelters and hospitals.
                </p>
              </div>
              <a href="tel:+919848024190" className="shrink-0 px-8 py-4 rounded-xl bg-[#122023] text-white text-sm font-bold inline-flex items-center justify-center gap-2.5">
                <PhoneCall className="w-4 h-4 text-[#B9FF2C]" />
                Call +91 98480 24190
              </a>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
              <div className={`lg:col-span-7 ${card}`}>
                {codes.rescue ? (
                  <Done
                    accent="lime"
                    eyebrow="Request logged · van dispatched"
                    title="Rescue on the way"
                    code={codes.rescue}
                    resetLabel="Raise another pickup"
                    onReset={reset('rescue')}
                  >
                    <p>Our nearest team has been assigned to <strong className="text-white">{f.venue}</strong>. Expected arrival: 35 – 45 minutes. Please keep {f.rPhone} on.</p>
                  </Done>
                ) : (
                  <form onSubmit={submit('rescue', 'FOOD-RESCUE')} className="space-y-5">
                    <Heading kicker="Online dispatch form" title="Request immediate food pickup" accent="lime" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Field
                        accent="lime" label="Servings available" value={f.servings} onChange={set('servings')} placeholder="How many people?"
                        options={[['25-50', '25 – 50 servings'], ['50-100', '50 – 100 servings'], ['100-250', '100 – 250 servings'], ['250-500+', '250 – 500+ servings']]}
                      />
                      <Field
                        accent="lime" label="Event type" value={f.eventType} onChange={set('eventType')} placeholder="Where is it from?"
                        options={[['Wedding / Banquet', 'Wedding / banquet'], ['Birthday / Party', 'Birthday / party'], ['Corporate Cafeteria', 'Corporate cafeteria'], ['Restaurant / Cloud Kitchen', 'Restaurant / cloud kitchen'], ['Temple Feast', 'Religious / temple feast']]}
                      />
                    </div>
                    <Field
                      accent="lime" label="When was the food cooked?" hint="Required for food safety"
                      value={f.cooked} onChange={set('cooked')} placeholder="Choose a time"
                      options={[['1-2h', '1 – 2 hours ago (hot & fresh)'], ['2-4h', '2 – 4 hours ago (clean vessels)'], ['4-6h', '4 – 6 hours ago (safety cutoff)']]}
                    />
                    <Field accent="lime" label="Food items" value={f.items} onChange={set('items')} placeholder="e.g. Biryani, dal, chapati, paneer curry" />
                    <Field accent="lime" label="Pickup address" rows={3} value={f.venue} onChange={set('venue')} placeholder="Function hall name, gate number, street, landmark" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Field accent="lime" label="Coordinator name" value={f.rName} onChange={set('rName')} placeholder="Your name" />
                      <Field accent="lime" label="Direct phone" type="tel" value={f.rPhone} onChange={set('rPhone')} placeholder="Keep it on for the driver" />
                    </div>
                    <SubmitBtn accent="lime" Icon={Truck}>Dispatch rescue van now</SubmitBtn>
                  </form>
                )}
              </div>

              <div className="lg:col-span-5 space-y-6">
                <div className={panel}>
                  <h3 className="font-display-sans text-base font-bold text-[#B9FF2C] mb-4">Food safety rules</h3>
                  <ul className="space-y-3 text-sm text-white/80 leading-relaxed">
                    {[
                      ['Freshly cooked only', 'cooked the same day, within 6 hours.'],
                      ['Clean vessels', 'covered, food-grade containers or buffet chafers.'],
                      ['Thermal transit', 'insulated boxes keep the food warm in the van.'],
                    ].map(([b, t]) => (
                      <li key={b} className="flex gap-3">
                        <ShieldCheck className="w-4 h-4 text-[#49E619] shrink-0 mt-1" />
                        <span><strong className="text-white">{b}:</strong> {t}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className={panel}>
                  <h3 className="font-display-sans text-base font-bold text-[#4EDBE2] mb-4">Nearest shelters</h3>
                  <div className="space-y-3">
                    {LEFTOVER_RESCUE_CENTERS.map((c) => (
                      <div key={c.id} className="p-4 rounded-xl bg-[#080808] border border-white/10">
                        <div className="font-display-sans uppercase text-sm font-black">{c.name}</div>
                        <div className="text-xs font-semibold text-[#49E619] mt-1">{c.distanceKm}</div>
                        <div className="text-xs text-white/70 mt-1.5">Capacity: {c.acceptedVolume}</div>
                        <div className="text-xs text-white/60 mt-1">Call: {c.contactNumber}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};