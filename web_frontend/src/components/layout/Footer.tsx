import { Link } from "react-router-dom";
import { Shield } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

const FOOTER_TWITTER =
  (import.meta.env.VITE_FOOTER_TWITTER_URL as string | undefined)?.trim() || "https://x.com";
const FOOTER_LINKEDIN =
  (import.meta.env.VITE_FOOTER_LINKEDIN_URL as string | undefined)?.trim() ||
  "https://www.linkedin.com";

const Footer = () => {
  const { t } = useTranslation();
  const year = new Date().getFullYear();

  const linkClass =
    "inline-block text-[0.9375rem] leading-snug text-primary-foreground/80 transition-colors hover:text-accent dark:text-slate-300 dark:hover:text-[hsl(var(--primary))]";

  const headingClass =
    "mb-5 font-serif text-[0.9375rem] font-semibold tracking-wide text-primary-foreground dark:text-slate-100";

  return (
    <footer
      data-site-footer
      className={cn(
        "relative isolate overflow-hidden text-primary-foreground",
        /* Light: brand gradient */
        "bg-gradient-to-b from-primary via-primary to-navy",
        /* Dark: deep slate / charcoal — strong contrast, readable links */
        "dark:bg-gradient-to-b dark:from-slate-950 dark:via-slate-900 dark:to-[hsl(222_47%_6%)] dark:text-slate-100",
      )}
    >
      <div
        className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(rgba(255,255,255,0.1)_1px,transparent_1px)] opacity-40 [background-size:11px_11px] dark:opacity-25 dark:bg-[radial-gradient(rgba(255,255,255,0.06)_1px,transparent_1px)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-x-0 top-0 z-[1] h-px bg-gradient-to-r from-transparent via-primary-foreground/25 to-transparent dark:via-white/15"
        aria-hidden
      />

      <div className="container relative z-[2] mx-auto max-w-[1400px] px-4 pb-40 pt-12 sm:px-6 sm:pb-44 md:pb-48 md:pt-14 lg:pb-52 lg:pt-16">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 sm:gap-x-8 lg:grid-cols-4 lg:items-start lg:gap-x-10 xl:gap-x-14">
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <Link to="/" className="group mb-6 inline-flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-gold to-gold-light shadow-md ring-1 ring-primary-foreground/20 transition-transform duration-300 group-hover:scale-[1.02] dark:ring-white/10">
                <Shield className="h-5 w-5 text-primary dark:text-slate-900" />
              </div>
              <span className="font-serif text-xl font-semibold tracking-tight text-primary-foreground dark:text-slate-50">
                Digital Will
              </span>
            </Link>
            <p className="max-w-sm text-sm leading-relaxed text-primary-foreground/85 dark:text-slate-400">
              {t("footer.description")}
            </p>
            <div className="mt-8 border-t border-primary-foreground/15 pt-6 dark:border-white/10">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-primary-foreground/90 dark:text-slate-400">
                {t("footer.social")}
              </p>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
                <a href={FOOTER_TWITTER} target="_blank" rel="noopener noreferrer" className={linkClass}>
                  {t("footer.twitter")}
                </a>
                <span className="text-primary-foreground/30 dark:text-slate-600" aria-hidden>
                  ·
                </span>
                <a href={FOOTER_LINKEDIN} target="_blank" rel="noopener noreferrer" className={linkClass}>
                  {t("footer.linkedin")}
                </a>
              </div>
            </div>
          </div>

          {/* Product */}
          <div className="flex flex-col">
            <h4 className={headingClass}>{t("footer.product")}</h4>
            <ul className="flex flex-col gap-2.5">
              <li>
                <Link to="/how-it-works" className={linkClass}>
                  {t("footer.howItWorks")}
                </Link>
              </li>
              <li>
                <Link to="/pricing" className={linkClass}>
                  {t("footer.pricing")}
                </Link>
              </li>
              <li>
                <Link to="/features" className={linkClass}>
                  {t("footer.features")}
                </Link>
              </li>
              <li>
                <Link to="/security" className={linkClass}>
                  {t("footer.security")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div className="flex flex-col">
            <h4 className={headingClass}>{t("footer.company")}</h4>
            <ul className="flex flex-col gap-2.5">
              <li>
                <Link to="/about" className={linkClass}>
                  {t("footer.aboutUs")}
                </Link>
              </li>
              <li>
                <Link to="/blog" className={linkClass}>
                  {t("footer.blog")}
                </Link>
              </li>
              <li>
                <Link to="/careers" className={linkClass}>
                  {t("footer.careers")}
                </Link>
              </li>
              <li>
                <Link to="/contact" className={linkClass}>
                  {t("footer.contact")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div className="flex flex-col">
            <h4 className={headingClass}>{t("footer.legal")}</h4>
            <ul className="flex flex-col gap-2.5">
              <li>
                <Link to="/privacy" className={linkClass}>
                  {t("footer.privacyPolicy")}
                </Link>
              </li>
              <li>
                <Link to="/terms" className={linkClass}>
                  {t("footer.termsOfService")}
                </Link>
              </li>
              <li>
                <Link to="/gdpr" className={linkClass}>
                  {t("footer.gdprCompliance")}
                </Link>
              </li>
              <li>
                <Link to="/accessibility" className={linkClass}>
                  {t("footer.accessibility")}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-primary-foreground/20 pt-8 dark:border-white/10 sm:mt-14">
          <p className="max-w-xl font-sans text-xs leading-relaxed text-primary-foreground/65 dark:text-slate-500">
            {t("footer.allRightsReserved", { year })}
          </p>
        </div>
      </div>

      {/* Watermark — wider letter-spacing, sits higher so glyphs are not clipped */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-[min(46vh,320px)] select-none overflow-hidden"
        aria-hidden
      >
        <div
          className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.14)_1px,transparent_1.5px)] opacity-[0.4] mix-blend-soft-light [background-size:5px_5px] dark:opacity-[0.2]"
          aria-hidden
        />
        <p
          className="absolute bottom-0 left-1/2 w-[min(125%,100vw)] max-w-[1400px] -translate-x-1/2 -translate-y-6 text-center font-sans text-[clamp(2.75rem,14vw,10rem)] font-bold leading-none tracking-[0.12em] text-white/80 [font-stretch:110%] [text-wrap:balance] sm:tracking-[0.18em] md:-translate-y-10 md:tracking-[0.22em] lg:w-[130%] dark:text-white/85"
        >
          Digital Will
        </p>
      </div>
    </footer>
  );
};

export default Footer;
