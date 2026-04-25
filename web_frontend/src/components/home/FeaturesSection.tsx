import { Mic, Video, FolderOpen, Users, Bell, FilePenLine, NotebookPen } from "lucide-react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";

const FeaturesSection = () => {
  const { t } = useTranslation();
  const features = [
    { icon: Mic, title: t("features.audioRecording"), description: t("features.audioDescription") },
    { icon: Video, title: t("features.videoMessages"), description: t("features.videoDescription") },
    { icon: FilePenLine, title: t("features.manualFormWriting"), description: t("features.manualDescription") },
    { icon: NotebookPen, title: t("features.noteWriting"), description: t("features.noteDescription") },
    { icon: FolderOpen, title: t("features.assetManagement"), description: t("features.assetDescription") },
    { icon: Users, title: t("features.recipientPortal"), description: t("features.recipientDescription") },
    { icon: Bell, title: t("features.smartNotifications"), description: t("features.notificationsDescription") },
  ];

  return (
    <section className="relative border-t border-slate-200/80 bg-white py-16 dark:border-slate-800 dark:bg-slate-950 md:py-24">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#94a3b808_1px,transparent_1px),linear-gradient(to_bottom,#94a3b808_1px,transparent_1px)] bg-[size:48px_48px]" aria-hidden />

      <div className="container relative mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mx-auto mb-12 max-w-2xl text-center md:mb-16"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[hsl(var(--navy))]">{t("features.title")}</p>
          <h2 className="mt-3 font-serif text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-50 md:text-4xl lg:text-[2.75rem]">
            {t("features.subtitle")}
          </h2>
          <p className="mt-4 text-base leading-relaxed text-slate-600 dark:text-slate-400 md:text-lg">{t("features.description")}</p>
        </motion.div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.04 }}
              className="rounded-2xl border border-slate-200/90 bg-[#fafafa] p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:p-7"
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-[hsl(var(--navy))]/10 text-[hsl(var(--navy))] dark:bg-[hsl(var(--primary))]/15 dark:text-[hsl(var(--primary))]">
                <feature.icon className="h-5 w-5" strokeWidth={1.75} />
              </div>
              <h3 className="font-serif text-lg font-semibold text-slate-900 dark:text-slate-100">{feature.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400 md:text-[0.9375rem]">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
