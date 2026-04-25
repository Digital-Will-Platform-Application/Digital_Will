import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";
import { useTranslation } from "react-i18next";

const TestimonialsSection = () => {
  const { t } = useTranslation();
  const testimonials = [
    {
      name: t("testimonials.testimonial1Name"),
      role: t("testimonials.testimonial1Role"),
      content: t("testimonials.testimonial1Content"),
      rating: 5,
    },
    {
      name: t("testimonials.testimonial2Name"),
      role: t("testimonials.testimonial2Role"),
      content: t("testimonials.testimonial2Content"),
      rating: 5,
    },
    {
      name: t("testimonials.testimonial3Name"),
      role: t("testimonials.testimonial3Role"),
      content: t("testimonials.testimonial3Content"),
      rating: 5,
    },
  ];

  return (
    <section className="border-t border-slate-200/80 bg-[#fafafa] py-16 dark:border-slate-800 dark:bg-slate-950 md:py-24">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mx-auto mb-12 max-w-2xl text-center md:mb-14"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[hsl(var(--navy))]">{t("testimonials.title")}</p>
          <h2 className="mt-3 font-serif text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-50 md:text-4xl">
            {t("testimonials.subtitle")}
          </h2>
          <p className="mt-4 text-base text-slate-600 dark:text-slate-400 md:text-lg">{t("testimonials.description")}</p>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-3 md:gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.name}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.08 }}
              className="relative rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
            >
              <Quote className="absolute right-4 top-4 h-7 w-7 text-slate-200 dark:text-slate-700" />

              <div className="mb-4 flex gap-1">
                {Array.from({ length: testimonial.rating }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-[hsl(var(--navy))] text-[hsl(var(--navy))]" />
                ))}
              </div>

              <p className="mb-6 text-sm leading-relaxed text-slate-700 dark:text-slate-300 md:text-[0.9375rem]">
                &ldquo;{testimonial.content}&rdquo;
              </p>

              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[hsl(var(--navy))]/10 text-sm font-semibold text-[hsl(var(--navy))]">
                  {testimonial.name.charAt(0)}
                </div>
                <div>
                  <p className="font-medium text-slate-900 dark:text-slate-100">{testimonial.name}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{testimonial.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
