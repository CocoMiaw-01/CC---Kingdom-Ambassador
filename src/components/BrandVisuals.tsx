import React, { useState, useEffect } from 'react';

const HERO_BACKGROUND_IMAGES = [
  {
    src: '/assets/aistudio/da4d912a-c6c0-4c13-bed2-500c99697c41_7271609d.jpeg',
    alt: 'Kingdom Ambassador Conference 2026',
  },
  {
    src: '/assets/aistudio/IMG_6080_fcdc691f.jpeg',
    alt: 'Kingdom Ambassadors Campus Fellowship',
  },
  {
    src: '/assets/aistudio/4751a124-a8a7-4c8e-ae5b-6096b2c9ecd5_cddce778.jpeg',
    alt: 'Kingdom Ambassador Conference XPAND',
  },
];

export const KACrestLogo: React.FC = () => {
  return (
    <div className="flex flex-col items-center text-center select-none pt-2 pb-4">
      {/* Uploaded Logo Image */}
      <div className="relative w-24 h-24 rounded-2xl bg-white p-1.5 shadow-sm border border-white/20 flex items-center justify-center mb-3 overflow-hidden">
        <img
          src="/assets/aistudio/c1a6d72f-b60f-4381-9412-bd3387ff38b1_ecd883aa.jpeg"
          alt="Kingdom Ambassador Logo"
          referrerPolicy="no-referrer"
          className="w-full h-full object-contain"
        />
      </div>

      {/* Main Title */}
      <h1 className="text-white font-bold text-[17px] leading-[1.18] tracking-[0.08em] uppercase">
        KINGDOM
        <br />
        AMBASSADOR
      </h1>

      {/* Subtitle */}
      <p className="mt-2 text-[9.5px] leading-[1.35] tracking-[0.09em] text-slate-300/90 font-medium uppercase max-w-[190px]">
        CHRISTIAN UNIVERSITY &amp; COLLEGE
        <br />
        YOUTH COMMITTEE
      </p>
    </div>
  );
};

export const WorshipHeroBanner: React.FC = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % HERO_BACKGROUND_IMAGES.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full rounded-2xl overflow-hidden shadow-sm border border-[#5B21B6]/20 bg-[#1E1145] min-h-[196px] sm:min-h-[212px] flex flex-col justify-between p-6 md:px-9 md:py-7 select-none">
      {/* 3-Second Transitioning Background Image Slideshow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {HERO_BACKGROUND_IMAGES.map((image, idx) => {
          const isActive = idx === currentSlide;
          return (
            <img
              key={image.src}
              src={image.src}
              alt={image.alt}
              referrerPolicy="no-referrer"
              className={`absolute inset-0 w-full h-full object-cover object-center transition-all duration-700 ease-in-out ${
                isActive ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
              }`}
            />
          );
        })}

        {/* Readability Gradient Overlay so text remains crisp while showing background imagery */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(90deg, rgba(20, 14, 56, 0.86) 0%, rgba(46, 16, 101, 0.68) 48%, rgba(20, 14, 56, 0.62) 100%)',
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(180deg, rgba(15, 10, 40, 0.25) 0%, rgba(15, 10, 40, 0.72) 100%)',
          }}
        />
      </div>

      {/* Foreground Content */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6 w-full my-auto">
        {/* Left Hero Text */}
        <div>
          <p className="text-[#D4AF37] text-xs font-bold uppercase tracking-[0.14em] mb-1.5 drop-shadow-xs">
            KINGDOM AMBASSADOR
          </p>
          <div className="relative inline-block">
            <h2 className="text-white text-3xl sm:text-4xl md:text-[42px] font-extrabold tracking-tight leading-[1.12] drop-shadow-sm">
              Welcome, Ambassadors
            </h2>
            {/* Gold curved underline swish under "Welcome," */}
            <svg
              viewBox="0 0 190 12"
              className="w-36 sm:w-44 h-3 mt-1 overflow-visible"
              aria-hidden="true"
            >
              <path
                d="M 2 9 Q 88 2 178 6"
                fill="none"
                stroke="#D4AF37"
                strokeWidth="3.2"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <p className="text-white/95 text-[15px] sm:text-[17px] font-medium mt-1.5 tracking-[0.01em] drop-shadow-xs">
            Every Campus. Every Student. Multiplying Disciples.
          </p>
        </div>

        {/* Right Scripture Quote & Slide Indicators */}
        <div className="md:text-right shrink-0 pb-0.5 flex flex-col md:items-end justify-between gap-3">
          <div>
            <p className="font-serif-editorial italic text-white/95 text-base sm:text-[17px] leading-snug drop-shadow-xs">
              &ldquo;Let your light shine before others.&rdquo;
            </p>
            <p className="font-serif-editorial italic text-white/85 text-xs sm:text-[13.5px] mt-1 drop-shadow-xs">
              Matthew 5:16
            </p>
          </div>

          {/* Slide Indicator Dots */}
          <div className="flex items-center gap-1.5">
            {HERO_BACKGROUND_IMAGES.map((img, idx) => (
              <button
                key={img.src}
                type="button"
                onClick={() => setCurrentSlide(idx)}
                aria-label={`Show slide ${idx + 1}`}
                className={`h-1.5 rounded-full transition-all cursor-pointer ${
                  idx === currentSlide
                    ? 'w-5 bg-[#D4AF37]'
                    : 'w-1.5 bg-white/45 hover:bg-white/75'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

interface OverviewReachUsSectionProps {
  onNavigate?: (section: 'overview' | 'committee' | 'events' | 'resources' | 'advisory' | 'profile') => void;
}

export const OverviewReachUsSection: React.FC<OverviewReachUsSectionProps> = ({ onNavigate }) => {
  return (
    <section className="w-full rounded-2xl bg-[#090D16] text-white p-7 sm:p-10 md:p-12 shadow-sm border border-[#1E293B]">
      <div className="max-w-5xl">
        {/* Brand Title & Tagline (Inspired by SIBKL reference layout) */}
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white p-1.5 flex items-center justify-center shrink-0 shadow-xs">
            <img
              src="/assets/aistudio/c1a6d72f-b60f-4381-9412-bd3387ff38b1_ecd883aa.jpeg"
              alt="Kingdom Ambassador Logo"
              referrerPolicy="no-referrer"
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-[0.06em] uppercase text-white leading-none">
              KINGDOM AMBASSADOR
            </h2>
            <p className="text-[10px] sm:text-xs tracking-[0.2em] uppercase text-slate-300 font-semibold mt-2">
              EVERY CAMPUS &bull; EVERY STUDENT &bull; MULTIPLYING DISCIPLES
            </p>
          </div>
        </div>

        {/* Reach Us Social Icons & Direct Buttons */}
        <div className="mt-8">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#D4AF37] mb-4">
            Reach Us
          </p>
          <div className="flex flex-wrap items-center gap-4 sm:gap-5">
            {/* TikTok */}
            <a
              href="https://www.tiktok.com/@unicoco_comm?_r=1&_t=ZS-9B6zCCITCuS"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Reach us on TikTok"
              className="group flex items-center gap-3 px-4 py-2.5 rounded-xl bg-white/8 hover:bg-white/15 border border-white/12 hover:border-[#D4AF37]/60 transition-all"
            >
              <svg
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-6 h-6 text-white group-hover:text-[#D4AF37] transition-colors shrink-0"
              >
                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1Z" />
              </svg>
              <div className="leading-tight">
                <span className="block text-sm font-bold text-white">TikTok</span>
                <span className="block text-[11px] text-slate-400">@unicoco_comm</span>
              </div>
            </a>

            {/* Instagram */}
            <a
              href="https://www.instagram.com/unicoco_comm?cplk=YjR3OG5peTlpM25o"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Reach us on Instagram"
              className="group flex items-center gap-3 px-4 py-2.5 rounded-xl bg-white/8 hover:bg-white/15 border border-white/12 hover:border-[#D4AF37]/60 transition-all"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-6 h-6 text-white group-hover:text-[#D4AF37] transition-colors shrink-0"
              >
                <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
              </svg>
              <div className="leading-tight">
                <span className="block text-sm font-bold text-white">Instagram</span>
                <span className="block text-[11px] text-slate-400">@unicoco_comm</span>
              </div>
            </a>

            {/* WhatsApp */}
            <a
              href="https://wa.link/2ki568"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Reach us on WhatsApp"
              className="group flex items-center gap-3 px-4 py-2.5 rounded-xl bg-white/8 hover:bg-white/15 border border-white/12 hover:border-[#D4AF37]/60 transition-all"
            >
              <svg
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-6 h-6 text-white group-hover:text-[#D4AF37] transition-colors shrink-0"
              >
                <path d="M12.031 2c-5.516 0-9.999 4.484-9.999 10 0 1.768.463 3.489 1.341 5.008L2 22l5.125-1.344A9.956 9.956 0 0 0 12.031 22c5.515 0 9.999-4.484 9.999-10s-4.484-10-9.999-10Zm5.824 14.129c-.246.691-1.434 1.326-1.988 1.409-.51.076-1.155.109-1.869-.118-.434-.137-.993-.322-1.711-.632-3.016-1.302-4.985-4.343-5.136-4.544-.15-.201-1.227-1.632-1.227-3.113 0-1.481.777-2.209 1.053-2.51.276-.301.602-.376.803-.376.2 0 .401.002.576.011.185.009.433-.07.677.518.251.602.852 2.084.927 2.234.075.151.125.326.025.527-.1.201-.15.326-.3.502-.151.176-.317.393-.452.527-.15.151-.307.314-.132.615.176.301.78 1.287 1.674 2.084 1.15.999 2.119 1.309 2.42 1.46.301.151.476.125.652-.076.175-.2.752-.878.953-1.179.2-.301.401-.251.677-.151.276.1 1.755.828 2.056.979.301.151.501.226.577.351.075.126.075.728-.171 1.419Z" />
              </svg>
              <div className="leading-tight">
                <span className="block text-sm font-bold text-white">WhatsApp</span>
                <span className="block text-[11px] text-slate-400">Chat with Us</span>
              </div>
            </a>
          </div>
        </div>

        {/* Lower Info Grid (Location, Contact, Pages) matching the reference screenshot style */}
        <div className="mt-10 pt-8 border-t border-white/12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 text-[15px] leading-relaxed">
          {/* Column 1: Location / Ministry Coverage */}
          <div className="space-y-1.5">
            <h3 className="text-base font-bold text-white mb-2">Location</h3>
            <p className="text-slate-300">University College Conference (UCC)</p>
            <p className="text-slate-300">Christ Church Likas (CCL) &amp; Campus Hubs</p>
            <p className="text-slate-300">Kota Kinabalu, Sabah</p>
          </div>

          {/* Column 2: Contact & Direct Links */}
          <div className="space-y-1.5">
            <h3 className="text-base font-bold text-white mb-2">Contact</h3>
            <p className="text-slate-300">unicoco.comm@gmail.com</p>
            <p className="text-slate-300">
              <a
                href="https://wa.link/2ki568"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[#D4AF37] underline underline-offset-4 transition-colors"
              >
                WhatsApp Direct Inquiry
              </a>
            </p>
            <p className="text-slate-300">
              <a
                href="https://www.instagram.com/unicoco_comm?cplk=YjR3OG5peTlpM25o"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[#D4AF37] underline underline-offset-4 transition-colors"
              >
                @unicoco_comm
              </a>
            </p>
          </div>

          {/* Column 3: Pages */}
          <div className="space-y-1.5">
            <h3 className="text-base font-bold text-white mb-2">Pages</h3>
            <ul className="space-y-1.5 text-slate-300">
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate?.('committee')}
                  className="hover:text-[#D4AF37] transition-colors cursor-pointer"
                >
                  Committee Directory
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate?.('events')}
                  className="hover:text-[#D4AF37] transition-colors cursor-pointer"
                >
                  Upcoming Events
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate?.('advisory')}
                  className="hover:text-[#D4AF37] transition-colors cursor-pointer"
                >
                  Advisory Council
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};


