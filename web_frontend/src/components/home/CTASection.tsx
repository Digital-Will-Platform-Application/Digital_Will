import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowRight, Shield } from "lucide-react";
import { useTranslation } from "react-i18next";

const CTASection = () => {
  const { t } = useTranslation();
  return (
    <section className="relative overflow-hidden border-t border-slate-200/80 bg-[#fafafa] py-16 dark:border-slate-800 dark:bg-slate-950 md:py-24">
      <div
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#94a3b814_1px,transparent_1px),linear-gradient(to_bottom,#94a3b814_1px,transparent_1px)] bg-[size:56px_56px]"
        aria-hidden
      />

      <div className="container relative z-10 mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mx-auto max-w-3xl rounded-3xl border border-slate-200/90 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900 md:p-12"
        >
          <div className="mx-auto mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-[hsl(var(--navy))]/10 text-[hsl(var(--navy))] dark:bg-[hsl(var(--primary))]/15 dark:text-[hsl(var(--primary))]">
            <Shield className="h-5 w-5" />
          </div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">{t("cta.startFree")}</p>

          <h2 className="mt-3 font-serif text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-50 md:text-4xl lg:text-[2.75rem]">
            {t("cta.readyToSecure")}
          </h2>

          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-slate-600 dark:text-slate-400 md:text-lg">{t("cta.joinThousands")}</p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link to="/signup">
              <Button
                size="lg"
                className="h-12 w-full min-w-[200px] rounded-full bg-[hsl(var(--navy))] px-8 font-semibold text-white shadow-md hover:bg-[hsl(var(--navy))]/92 sm:w-auto"
              >
                {t("cta.createWillNow")}
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
            <Link to="/learn-more">
              <Button
                size="lg"
                variant="outline"
                className="h-12 w-full min-w-[200px] rounded-full border-slate-300 bg-white font-semibold dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100 sm:w-auto"
              >
                {t("cta.learnMore")}
              </Button>
            </Link>
          </div>

          <p className="mt-6 text-sm text-slate-500 dark:text-slate-400">{t("cta.noCreditCard")}</p>
        </motion.div>
      </div>
    </section>
  );
};

export default CTASection;
