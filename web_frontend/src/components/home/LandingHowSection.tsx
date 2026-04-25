import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";

const LandingHowSection = () => {
  const { t } = useTranslation();
  const steps = [
    { title: t("howItWorks.step1Title"), body: t("howItWorks.step1Description") },
    { title: t("howItWorks.step2Title"), body: t("howItWorks.step2Description") },
    { title: t("howItWorks.step3Title"), body: t("howItWorks.step3Description") },
    { title: t("howItWorks.step4Title"), body: t("howItWorks.step4Description") },
  ];

  return (
    <section className="relative bg-[#fafafa] py-16 dark:bg-slate-950 md:py-24">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mx-auto mb-12 max-w-3xl text-center md:mb-16"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[hsl(var(--navy))]">{t("howItWorks.title")}</p>
          <h2 className="mt-3 font-serif text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-50 md:text-4xl lg:text-[2.75rem]">
            {t("howItWorks.subtitle")}
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          {steps.map((step, i) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
              className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
            >
              <span className="font-serif text-4xl font-semibold tabular-nums text-slate-200 dark:text-slate-700">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-4 font-serif text-lg font-semibold text-slate-900 dark:text-slate-100">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{step.body}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default LandingHowSection;
