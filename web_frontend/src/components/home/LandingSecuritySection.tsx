import { motion } from "framer-motion";
import { Lock, Shield, Users, Bell } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const LandingSecuritySection = () => {
  const { t } = useTranslation();
  const items = [
    { icon: Shield, title: t("hero.bankLevelSecurity"), body: t("howItWorks.step4Description") },
    { icon: Lock, title: t("hero.endToEndEncrypted"), body: t("features.manualDescription") },
    { icon: Users, title: t("features.recipientPortal"), body: t("features.recipientDescription") },
    { icon: Bell, title: t("features.smartNotifications"), body: t("features.notificationsDescription") },
  ];

  return (
    <section className="relative overflow-hidden bg-[#0c0f14] py-20 text-white md:py-28">
      <div className="pointer-events-none absolute inset-0 opacity-[0.35] bg-[radial-gradient(circle_at_50%_20%,hsl(var(--primary)/0.25),transparent_55%)]" aria-hidden />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:40px_40px]" aria-hidden />

      <div className="container relative z-10 mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mx-auto mb-14 max-w-2xl text-center md:mb-16"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/50">{t("footer.security")}</p>
          <h2 className="mt-3 font-serif text-3xl font-semibold tracking-tight md:text-4xl lg:text-[2.75rem]">
            {t("features.subtitle")}
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-white/65 md:text-base">{t("features.description")}</p>
        </motion.div>

        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-10 md:grid-cols-2 md:gap-x-12 md:gap-y-12 lg:gap-x-16">
          {items.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="flex gap-4"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/15">
                <item.icon className="h-5 w-5 text-[hsl(var(--accent))]" />
              </div>
              <div>
                <h3 className="font-serif text-lg font-semibold text-white">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/65">{item.body}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-14 flex justify-center"
        >
          <Link to="/learn-more">
            <Button
              variant="outline"
              size="lg"
              className="rounded-full border-white/30 bg-white/5 px-8 text-white backdrop-blur-sm hover:bg-white/15"
            >
              {t("cta.learnMore")}
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

export default LandingSecuritySection;
