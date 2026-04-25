import { Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { motion } from "framer-motion";
import { UserPlus, FileEdit, Share2, Shield, ArrowLeft } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";

const HowItWorks = () => {
  const { t } = useTranslation();
  const steps = [
    {
      number: "01",
      icon: UserPlus,
      title: t("howItWorks.step1Title"),
      description: t("howItWorks.step1Description"),
    },
    {
      number: "02",
      icon: FileEdit,
      title: t("howItWorks.step2Title"),
      description: t("howItWorks.step2Description"),
    },
    {
      number: "03",
      icon: Share2,
      title: t("howItWorks.step3Title"),
      description: t("howItWorks.step3Description"),
    },
    {
      number: "04",
      icon: Shield,
      title: t("howItWorks.step4Title"),
      description: t("howItWorks.step4Description"),
    },
  ];

  return (
    <div className="min-h-screen page-ambient bg-background">
      <Header />
      <main className="pt-24 pb-12">
        <div className="container mx-auto px-4">
          {/* Back Button */}
          <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-3xl mx-auto mb-16"
          >
            <span className="text-gold font-medium text-sm uppercase tracking-wider mb-4 block">
              {t("howItWorks.title")}
            </span>
            <h1 className="heading-section text-foreground mb-6">
              {t("howItWorks.subtitle")}
            </h1>
            <p className="body-large text-muted-foreground">
              {t("howItWorks.description")}
            </p>
          </motion.div>

          {/* Steps */}
          <div className="relative max-w-6xl mx-auto">
            {/* Connection Line */}
            <div className="hidden lg:block absolute top-24 left-1/2 -translate-x-1/2 w-3/4 h-0.5 bg-gradient-to-r from-transparent via-border to-transparent" />

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12 mb-16">
              {steps.map((step, index) => (
                <motion.div
                  key={step.number}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.15 }}
                  className="relative text-center"
                >
                  {/* Step Number */}
                  <div className="relative z-10 mb-6">
                    <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-gold to-gold-light flex items-center justify-center shadow-gold">
                      <step.icon className="w-8 h-8 text-primary" />
                    </div>
                    <span className="absolute -top-2 -right-2 w-10 h-10 rounded-full bg-primary text-primary-foreground text-base font-bold flex items-center justify-center">
                      {step.number}
                    </span>
                  </div>

                  <h3 className="font-serif text-xl font-semibold text-foreground mb-4">
                    {step.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* CTA Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="text-center max-w-2xl mx-auto"
          >
            <div className="card-elevated p-8">
              <h2 className="font-serif text-2xl font-semibold text-foreground mb-4">
                Ready to Get Started?
              </h2>
              <p className="text-muted-foreground mb-6">
                Create your digital will in minutes and secure your legacy for your loved ones.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/login">
                  <Button variant="gold" size="lg" className="gap-2">
                    Get Started
                  </Button>
                </Link>
                <Link to="/learn-more">
                  <Button variant="outline" size="lg">
                    Learn More
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default HowItWorks;
