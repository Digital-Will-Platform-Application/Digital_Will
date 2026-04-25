import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";

/** Stat band — highlights “under 10 minutes” from how-it-works + trusted-by line from hero. */
const LandingStatsSection = () => {
  const { t } = useTranslation();

  return (
    <section className="relative border-y border-slate-200/80 bg-white py-16 dark:border-slate-800 dark:bg-slate-950 md:py-20">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#94a3b80d_1px,transparent_1px),linear-gradient(to_bottom,#94a3b80d_1px,transparent_1px)] bg-[size:48px_48px] dark:opacity-50" aria-hidden />
      <div className="container relative mx-auto px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45 }}
        >
          <p className="font-serif text-6xl font-semibold tabular-nums leading-none tracking-tight text-[hsl(var(--navy))] md:text-7xl lg:text-8xl">
            10
          </p>
          <p className="mt-2 text-xs font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">
            {t("landing.minutesLabel", { defaultValue: "minutes" })}
          </p>
          <p className="mx-auto mt-6 max-w-2xl text-base text-slate-600 dark:text-slate-300 md:text-lg">
            {t("howItWorks.description")}
          </p>
          <p className="mx-auto mt-8 max-w-xl text-sm font-medium text-slate-500 dark:text-slate-400">{t("hero.trustedBy")}</p>
        </motion.div>
      </div>
    </section>
  );
};

export default LandingStatsSection;
