import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import ThreeDLogo from "@/components/branding/ThreeDLogo";

/** Rotating hero art for login (5 legacy-themed compositions). */
export const LoginHeroVisual = ({ variant, className }: { variant: number; className?: string }) => {
  const v = ((variant % 5) + 5) % 5;
  return (
    <div className={cn("relative overflow-hidden rounded-3xl border border-border/60 bg-card/70 p-4 shadow-premium backdrop-blur-xl", className)}>
      {v === 0 && (
        <svg viewBox="0 0 520 320" className="h-full w-full" role="img" aria-label="Will builder visual">
          <defs>
            <linearGradient id="lh0-bg" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="hsl(var(--primary) / 0.28)" />
              <stop offset="100%" stopColor="hsl(var(--accent) / 0.22)" />
            </linearGradient>
            <linearGradient id="lh0-cta" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="hsl(var(--primary))" />
              <stop offset="100%" stopColor="hsl(var(--accent))" />
            </linearGradient>
          </defs>
          <rect width="520" height="320" rx="24" fill="url(#lh0-bg)" />
          <rect x="40" y="48" width="200" height="224" rx="18" fill="hsl(var(--card))" opacity="0.95" />
          <rect x="64" y="76" width="152" height="14" rx="7" fill="hsl(var(--muted))" />
          <rect x="64" y="104" width="120" height="10" rx="5" fill="hsl(var(--muted))" />
          <rect x="64" y="186" width="152" height="40" rx="12" fill="url(#lh0-cta)" />
          <rect x="268" y="56" width="212" height="208" rx="20" fill="hsl(var(--card))" opacity="0.92" />
          <circle cx="320" cy="120" r="22" fill="hsl(var(--primary) / 0.35)" />
          <rect x="352" y="104" width="108" height="12" rx="6" fill="hsl(var(--muted))" />
          <rect x="352" y="128" width="88" height="10" rx="5" fill="hsl(var(--muted))" />
        </svg>
      )}
      {v === 1 && (
        <svg viewBox="0 0 520 320" className="h-full w-full" role="img" aria-label="Video and audio legacy visual">
          <defs>
            <linearGradient id="lh1-bg" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="hsl(var(--accent) / 0.2)" />
              <stop offset="100%" stopColor="hsl(var(--primary) / 0.28)" />
            </linearGradient>
          </defs>
          <rect width="520" height="320" rx="24" fill="url(#lh1-bg)" />
          <rect x="48" y="52" width="424" height="216" rx="22" fill="hsl(var(--card))" opacity="0.95" />
          <circle cx="260" cy="148" r="56" stroke="hsl(var(--primary) / 0.45)" strokeWidth="6" fill="hsl(var(--primary) / 0.12)" />
          <polygon points="248,128 248,176 288,152" fill="hsl(var(--card))" stroke="hsl(var(--accent))" strokeWidth="4" />
          <rect x="72" y="244" width="120" height="12" rx="6" fill="hsl(var(--muted))" />
          <rect x="328" y="244" width="120" height="12" rx="6" fill="hsl(var(--muted))" />
          <rect x="200" y="268" width="120" height="36" rx="14" fill="hsl(var(--accent) / 0.45)" />
        </svg>
      )}
      {v === 2 && (
        <svg viewBox="0 0 520 320" className="h-full w-full" role="img" aria-label="Family and recipients visual">
          <defs>
            <linearGradient id="lh2-bg" x1="0" y1="1" x2="1" y2="0">
              <stop offset="0%" stopColor="hsl(var(--primary) / 0.2)" />
              <stop offset="100%" stopColor="hsl(var(--accent) / 0.18)" />
            </linearGradient>
          </defs>
          <rect width="520" height="320" rx="24" fill="url(#lh2-bg)" />
          <rect x="40" y="64" width="440" height="192" rx="20" fill="hsl(var(--card))" opacity="0.94" />
          <circle cx="120" cy="140" r="28" fill="hsl(var(--primary) / 0.35)" />
          <circle cx="220" cy="140" r="28" fill="hsl(var(--accent) / 0.4)" />
          <circle cx="320" cy="140" r="28" fill="hsl(var(--primary) / 0.28)" />
          <circle cx="420" cy="140" r="28" fill="hsl(var(--accent) / 0.32)" />
          <path d="M 80 220 Q 260 260 440 220" stroke="hsl(var(--muted))" strokeWidth="4" fill="none" strokeLinecap="round" />
          <rect x="200" y="248" width="120" height="10" rx="5" fill="hsl(var(--muted))" />
        </svg>
      )}
      {v === 3 && (
        <svg viewBox="0 0 520 320" className="h-full w-full" role="img" aria-label="Assets overview visual">
          <defs>
            <linearGradient id="lh3-bg" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--primary) / 0.22)" />
              <stop offset="100%" stopColor="hsl(var(--accent) / 0.15)" />
            </linearGradient>
          </defs>
          <rect width="520" height="320" rx="24" fill="url(#lh3-bg)" />
          <rect x="56" y="56" width="408" height="208" rx="18" fill="hsl(var(--card))" opacity="0.95" />
          <rect x="88" y="200" width="56" height="56" rx="10" fill="hsl(var(--primary) / 0.35)" />
          <rect x="168" y="176" width="56" height="80" rx="10" fill="hsl(var(--accent) / 0.4)" />
          <rect x="248" y="152" width="56" height="104" rx="10" fill="hsl(var(--primary) / 0.45)" />
          <rect x="328" y="184" width="56" height="72" rx="10" fill="hsl(var(--accent) / 0.32)" />
          <rect x="408" y="168" width="56" height="88" rx="10" fill="hsl(var(--primary) / 0.38)" />
          <rect x="88" y="96" width="200" height="12" rx="6" fill="hsl(var(--muted))" />
          <rect x="88" y="120" width="140" height="10" rx="5" fill="hsl(var(--muted))" />
        </svg>
      )}
      {v === 4 && (
        <svg viewBox="0 0 520 320" className="h-full w-full" role="img" aria-label="Secure vault visual">
          <defs>
            <linearGradient id="lh4-bg" x1="1" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--primary) / 0.35)" />
              <stop offset="100%" stopColor="hsl(var(--accent) / 0.22)" />
            </linearGradient>
          </defs>
          <rect width="520" height="320" rx="24" fill="url(#lh4-bg)" />
          <rect x="160" y="72" width="200" height="176" rx="24" fill="hsl(var(--card))" opacity="0.95" />
          <rect x="188" y="104" width="144" height="112" rx="16" fill="hsl(var(--muted) / 0.45)" />
          <path
            d="M 220 168 L 244 192 L 292 140"
            stroke="hsl(var(--accent))"
            strokeWidth="10"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="260" cy="132" r="8" fill="hsl(var(--accent))" />
        </svg>
      )}
    </div>
  );
};

export const HeroLegacyVisual = ({ className }: { className?: string }) => (
  <div className={cn("relative overflow-hidden rounded-3xl border border-border/60 bg-card/70 p-4 shadow-premium backdrop-blur-xl", className)}>
    <svg viewBox="0 0 520 320" className="h-full w-full" role="img" aria-label="Digital legacy visual">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="hsl(var(--primary) / 0.25)" />
          <stop offset="100%" stopColor="hsl(var(--accent) / 0.25)" />
        </linearGradient>
        <linearGradient id="card1" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="hsl(var(--primary))" />
          <stop offset="100%" stopColor="hsl(var(--accent))" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="520" height="320" rx="24" fill="url(#bg)" />
      <g opacity="0.9">
        <rect x="34" y="42" width="190" height="236" rx="18" fill="hsl(var(--card))" />
        <rect x="56" y="70" width="146" height="18" rx="9" fill="hsl(var(--muted))" />
        <rect x="56" y="100" width="126" height="12" rx="6" fill="hsl(var(--muted))" />
        <rect x="56" y="126" width="110" height="12" rx="6" fill="hsl(var(--muted))" />
        <rect x="56" y="190" width="124" height="38" rx="12" fill="url(#card1)" />
      </g>
      <g>
        <rect x="248" y="66" width="238" height="90" rx="18" fill="hsl(var(--card))" />
        <circle cx="286" cy="111" r="18" fill="hsl(var(--primary) / 0.3)" />
        <rect x="316" y="98" width="136" height="12" rx="6" fill="hsl(var(--muted))" />
        <rect x="316" y="120" width="104" height="10" rx="5" fill="hsl(var(--muted))" />
        <rect x="248" y="174" width="238" height="104" rx="18" fill="hsl(var(--card))" />
        <rect x="272" y="198" width="80" height="56" rx="10" fill="hsl(var(--accent) / 0.35)" />
        <rect x="364" y="198" width="98" height="12" rx="6" fill="hsl(var(--muted))" />
        <rect x="364" y="220" width="72" height="10" rx="5" fill="hsl(var(--muted))" />
      </g>
    </svg>
  </div>
);

const FLOATING_CARD_SETS = [
  [
    { name: "Jordan M.", role: "Will in progress", pos: "top-[6%] left-[4%] -rotate-6", delay: 0 },
    { name: "Priya S.", role: "Assets mapped", pos: "top-[16%] right-[2%] rotate-6", delay: 0.15 },
    { name: "Alex R.", role: "Recipients added", pos: "bottom-[30%] left-[8%] rotate-3", delay: 0.3 },
    { name: "Sam T.", role: "Video message saved", pos: "bottom-[6%] right-[6%] -rotate-3", delay: 0.45 },
  ],
  [
    { name: "Maya K.", role: "Audio will saved", pos: "top-[8%] left-[6%] -rotate-3", delay: 0 },
    { name: "Chris P.", role: "Executor assigned", pos: "top-[12%] right-[4%] rotate-6", delay: 0.12 },
    { name: "Rina L.", role: "Vault encrypted", pos: "bottom-[28%] left-[6%] rotate-2", delay: 0.28 },
    { name: "Dev S.", role: "Review pending", pos: "bottom-[8%] right-[6%] -rotate-6", delay: 0.42 },
  ],
  [
    { name: "Elena V.", role: "Beneficiaries set", pos: "top-[6%] left-[3%] -rotate-6", delay: 0 },
    { name: "Noah B.", role: "Property listed", pos: "top-[18%] right-[3%] rotate-3", delay: 0.14 },
    { name: "Zara H.", role: "Messages recorded", pos: "bottom-[32%] left-[10%] -rotate-2", delay: 0.3 },
    { name: "Omar F.", role: "Plan finalized", pos: "bottom-[6%] right-[4%] rotate-6", delay: 0.46 },
  ],
  [
    { name: "Kim S.", role: "Allocations updated", pos: "top-[10%] left-[5%] rotate-3", delay: 0 },
    { name: "Leo A.", role: "Documents linked", pos: "top-[14%] right-[6%] -rotate-6", delay: 0.16 },
    { name: "Ana J.", role: "Family notified", pos: "bottom-[26%] left-[4%] -rotate-3", delay: 0.32 },
    { name: "Vik T.", role: "Secure backup", pos: "bottom-[10%] right-[8%] rotate-3", delay: 0.44 },
  ],
  [
    { name: "Sara N.", role: "Manual will drafted", pos: "top-[7%] left-[4%] -rotate-6", delay: 0 },
    { name: "Tom W.", role: "Assets verified", pos: "top-[16%] right-[2%] rotate-6", delay: 0.15 },
    { name: "Ivy C.", role: "Legacy snapshot", pos: "bottom-[30%] left-[8%] rotate-2", delay: 0.3 },
    { name: "Ray D.", role: "Compliance OK", pos: "bottom-[7%] right-[5%] -rotate-3", delay: 0.45 },
  ],
];

export const FloatingLegacyCards = ({ className, variantIndex = 0 }: { className?: string; variantIndex?: number }) => {
  const set = FLOATING_CARD_SETS[((variantIndex % FLOATING_CARD_SETS.length) + FLOATING_CARD_SETS.length) % FLOATING_CARD_SETS.length];
  return (
  <div className={cn("pointer-events-none absolute inset-0 overflow-hidden md:pointer-events-auto", className)} aria-hidden>
    {set.map((c) => (
      <motion.div
        key={c.name}
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: c.delay, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className={cn(
          "absolute w-[min(200px,42vw)] rounded-2xl border border-border/50 bg-card/95 p-3 shadow-[0_20px_50px_-20px_rgba(15,23,42,0.35)] backdrop-blur-md dark:bg-card/90",
          c.pos,
        )}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary/25 to-accent/30 text-sm font-bold text-primary">
            {c.name.charAt(0)}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">{c.name}</p>
            <p className="truncate text-xs text-muted-foreground">{c.role}</p>
          </div>
        </div>
      </motion.div>
    ))}
  </div>
  );
};

/** Decorative partner-style marks (generic — not third-party logos). */
export const TrustPartnerStrip = ({ title, className }: { title: string; className?: string }) => {
  const marks = ["Estate Law", "Secure Cloud", "Family Trust", "Banking", "Insurance", "Compliance"];
  return (
    <div className={cn("w-full border-t border-border/50 bg-muted/20 py-10 backdrop-blur-sm", className)}>
      <div className="container mx-auto px-4">
        <p className="mb-6 text-center text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">{title}</p>
        <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-6 opacity-80 grayscale contrast-125">
          {marks.map((m) => (
            <span
              key={m}
              className="font-sans text-lg font-bold tracking-tight text-foreground/70 transition-opacity hover:opacity-100 sm:text-xl"
            >
              {m}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export const BrandLogoStrip = ({ className }: { className?: string }) => (
  <div className={cn("flex flex-wrap items-center justify-center gap-2", className)}>
    {["Secure Vault", "Legacy Cloud", "Family Access", "Trust Shield"].map((logo) => (
      <span key={logo} className="rounded-full border border-border/70 bg-card/70 px-3 py-1 text-xs font-medium text-muted-foreground shadow-sm">
        {logo}
      </span>
    ))}
  </div>
);

/** Stacked 3D-style hero scene for marketing home — depth layers + gentle motion. */
export const HomeHero3DScene = ({ className }: { className?: string }) => (
  <div className={cn("relative mx-auto w-full max-w-xl", className)}>
    <div className="pointer-events-none absolute -inset-6 -z-10 rounded-[40%] bg-gradient-to-br from-primary/25 via-accent/15 to-transparent blur-3xl" aria-hidden />
    <div className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[120%] w-[120%] -translate-x-1/2 -translate-y-1/2 bg-[radial-gradient(circle_at_50%_40%,hsl(var(--primary)/0.18),transparent_62%)]" aria-hidden />
    <motion.div
      className="relative mx-auto [perspective:1200px]"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
    >
      <motion.div
        className="relative mx-auto max-w-lg [transform-style:preserve-3d]"
        animate={{ rotateY: [-2.5, 2.5, -2.5] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
      >
        <div
          className="absolute inset-0 -z-10 translate-x-3 translate-y-3 scale-[0.98] rounded-3xl bg-gradient-to-br from-primary/40 to-accent/35 opacity-80 blur-2xl"
          aria-hidden
        />
        <div
          className="absolute inset-0 -z-[5] translate-x-2 translate-y-2 rounded-3xl border border-white/25 bg-card/50 shadow-2xl backdrop-blur-md dark:bg-card/40"
          style={{ transform: "rotateY(-6deg) translateZ(-24px)" }}
          aria-hidden
        />
        <HeroLegacyVisual className="relative z-[1] shadow-[0_40px_80px_-28px_rgba(15,23,42,0.45)] ring-1 ring-white/30" />
      </motion.div>
    </motion.div>
    <motion.div
      className="pointer-events-none absolute -right-2 -top-4 z-[2] sm:-right-4 sm:-top-6"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.35, duration: 0.5 }}
    >
      <ThreeDLogo className="scale-110 sm:scale-125" glowClassName="from-accent/45 to-primary/45 blur-2xl" />
    </motion.div>
  </div>
);

/** Compact 3D accent for dashboard welcome — no duplicate heavy animation. */
export const DashboardHero3DAccent = ({ className }: { className?: string }) => (
  <div className={cn("relative flex items-center justify-center", className)}>
    <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_50%,hsl(var(--primary)/0.2),transparent_65%)] blur-2xl" aria-hidden />
    <motion.div
      className="relative [perspective:900px]"
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6 }}
    >
      <motion.div
        className="relative [transform-style:preserve-3d]"
        animate={{ rotateY: [0, 4, 0, -4, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="absolute inset-2 -z-10 rounded-2xl bg-gradient-to-br from-primary/30 to-accent/25 blur-xl" aria-hidden />
        <div className="relative rounded-2xl border border-border/50 bg-card/80 p-3 shadow-premium backdrop-blur">
          <HeroLegacyVisual className="border-0 p-2 shadow-none" />
        </div>
      </motion.div>
    </motion.div>
    <div className="absolute -bottom-2 -right-2 z-[2]">
      <ThreeDLogo className="scale-90" iconClassName="h-4 w-4" />
    </div>
  </div>
);
