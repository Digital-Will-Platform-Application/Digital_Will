import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Lock, Shield, CheckCircle, Play, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { TrustPartnerStrip } from "@/components/branding/BrandIllustrations";
import { useEffect, useRef } from "react";

const BRIDGING_VIDEO_SRC = "/Bridging_Audiences.mp4";

const HeroSection = () => {
  const { t } = useTranslation();
  const bridgingVideoRef = useRef<HTMLVideoElement | null>(null);

  const trustBadges = [
    { icon: Lock, text: t("hero.endToEndEncrypted") },
    { icon: Shield, text: t("hero.gdprCompliant") },
    { icon: CheckCircle, text: t("hero.bankLevelSecurity") },
  ];

  const audiences = [t("hero.audience1"), t("hero.audience2"), t("hero.audience3"), t("hero.audience4")];

  const scrollToHeroVideo = () => {
    document.getElementById("hero-will-video")?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  useEffect(() => {
    const el = bridgingVideoRef.current;
    const container = document.getElementById("hero-will-video");
    if (!el || !container) return;

    const tryPlay = () => {
      // Autoplay can be blocked unless muted and in-view. Ignore promise rejections.
      void el.play().catch(() => undefined);
    };

    // Try once immediately (helps when already in viewport).
    tryPlay();

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;
        if (entry.isIntersecting) {
          tryPlay();
        } else {
          el.pause();
        }
      },
      { threshold: 0.35 },
    );

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <section className="relative overflow-hidden bg-[#fafafa] pb-14 pt-28 dark:bg-slate-950 md:pb-20 md:pt-32">
        <div
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#94a3b814_1px,transparent_1px),linear-gradient(to_bottom,#94a3b814_1px,transparent_1px)] bg-[size:56px_56px] dark:opacity-40"
          aria-hidden
        />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-slate-200/80 dark:bg-slate-800" aria-hidden />

        <div className="container relative z-10 mx-auto max-w-5xl px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="inline-flex items-center rounded-full border border-slate-200/90 bg-white/80 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500 shadow-sm backdrop-blur-sm dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-400"
          >
            {t("hero.badgeLine")}
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.06, duration: 0.45 }}
            className="mt-8 font-serif text-[2.65rem] font-semibold leading-[1.08] tracking-tight text-slate-900 dark:text-slate-50 sm:text-5xl md:text-6xl lg:text-7xl"
          >
            <span className="block">{t("hero.yourLegacy")}</span>
            <span className="mt-2 block text-[hsl(var(--navy))] dark:text-[hsl(var(--primary))]">
              {t("hero.securedForever")}
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-slate-600 dark:text-slate-400 md:text-lg"
          >
            {t("hero.createManageShare")}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.22 }}
            className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row sm:flex-wrap"
          >
            <Link to="/signup">
              <Button
                size="lg"
                className="h-12 min-w-[200px] rounded-full bg-[hsl(var(--navy))] px-8 font-semibold text-white shadow-lg shadow-slate-900/15 transition-transform hover:-translate-y-0.5 hover:bg-[hsl(var(--navy))]/92 dark:bg-[hsl(var(--primary))] dark:text-slate-950 dark:hover:bg-[hsl(var(--primary))]/90"
              >
                {t("hero.startYourWill")}
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
            <Link to="/contact">
              <Button
                size="lg"
                variant="outline"
                className="h-12 min-w-[200px] rounded-full border-slate-300 bg-white font-semibold text-slate-800 shadow-sm hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
              >
                {t("header.contactUs")}
              </Button>
            </Link>
          </motion.div>

          <motion.button
            type="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            onClick={scrollToHeroVideo}
            className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[hsl(var(--navy))] underline-offset-4 transition-colors hover:underline dark:text-[hsl(var(--primary))]"
          >
            <Play className="h-4 w-4 fill-current" />
            {t("hero.watchDemo")}
          </motion.button>

          {/* Wide in-page video — above “Bridging families…” */}
          <motion.div
            id="hero-will-video"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.32, duration: 0.5 }}
            className="mx-auto mt-12 w-full max-w-[min(1152px,96vw)] scroll-mt-28"
          >
            <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-slate-950 shadow-[0_32px_64px_-24px_rgba(15,23,42,0.45)] ring-1 ring-slate-900/5 dark:border-slate-700 dark:ring-slate-700/80">
              <video
                ref={bridgingVideoRef}
                className="aspect-video w-full object-cover"
                autoPlay
                muted
                loop
                playsInline
                preload="auto"
                aria-label={t("hero.watchDemo")}
              >
                <source src={BRIDGING_VIDEO_SRC} type="video/mp4" />
              </video>
            </div>
            <p className="mt-3 text-center text-xs text-slate-500 dark:text-slate-500">{t("hero.demoDescription")}</p>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.45 }}
            className="mx-auto mt-12 max-w-xl text-sm text-slate-500 dark:text-slate-400"
          >
            <span className="font-medium text-slate-700 dark:text-slate-200">{t("hero.bridgeLine")}</span>
            <span className="mt-2 flex flex-wrap justify-center gap-x-3 gap-y-1 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-500 md:text-sm">
              {audiences.map((a) => (
                <span key={a} className="inline-flex items-center gap-1.5">
                  <span className="text-[hsl(var(--navy))] dark:text-[hsl(var(--primary))]">•</span> {a}
                </span>
              ))}
            </span>
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-8 flex flex-wrap justify-center gap-3"
          >
            {trustBadges.map((badge) => (
              <div
                key={badge.text}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200/90 bg-white px-4 py-2 text-xs font-medium text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
              >
                <badge.icon className="h-4 w-4 shrink-0 text-[hsl(var(--navy))] dark:text-[hsl(var(--primary))]" />
                {badge.text}
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      <TrustPartnerStrip
        title={t("hero.partnerStripTitle")}
        className="border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-950"
      />
    </>
  );
};

export default HeroSection;
