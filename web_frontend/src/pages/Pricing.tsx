import { Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { motion } from "framer-motion";
import { Check, ArrowLeft, Shield, Crown, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";

const Pricing = () => {
  const { t } = useTranslation();

  const plans = [
    {
      name: "Basic",
      price: "Free",
      period: "Forever",
      description: "Perfect for getting started with your digital will",
      icon: Shield,
      color: "from-navy to-navy-light",
      features: [
        "1 Digital Will",
        "Up to 5 Recipients",
        "Up to 10 Assets",
        "Basic Security",
        "Email Support",
        "Audio & Text Wills",
      ],
      cta: "Get Started Free",
      popular: false,
    },
    {
      name: "Professional",
      price: "$9.99",
      period: "per month",
      description: "Ideal for comprehensive estate planning",
      icon: Crown,
      color: "from-gold to-gold-light",
      features: [
        "Unlimited Digital Wills",
        "Unlimited Recipients",
        "Unlimited Assets",
        "256-bit Encryption",
        "Priority Support",
        "All Will Types (Audio, Video, Manual Form, Text)",
        "Document Storage",
        "Recipient Verification",
        "Asset Allocation Tools",
        "Will Updates & Revisions",
      ],
      cta: "Start Free Trial",
      popular: true,
    },
    {
      name: "Legacy",
      price: "$199",
      period: "one-time",
      description: "Complete peace of mind with lifetime access",
      icon: Sparkles,
      color: "from-sage-dark to-sage",
      features: [
        "Everything in Professional",
        "Lifetime Access",
        "No Monthly Fees",
        "Premium Support",
        "Legal Document Templates",
        "Estate Planning Guide",
        "Family Account Access",
        "Legacy Video Messages",
        "Priority Updates",
        "Dedicated Account Manager",
      ],
      cta: "Choose Legacy",
      popular: false,
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
              Pricing
            </span>
            <h1 className="heading-section text-foreground mb-6">
              Simple, Transparent Pricing
            </h1>
            <p className="body-large text-muted-foreground">
              Choose the plan that fits your needs. All plans include secure storage, 
              recipient management, and the ability to update your will anytime.
            </p>
          </motion.div>

          {/* Pricing Cards */}
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-16">
            {plans.map((plan, index) => {
              const Icon = plan.icon;
              return (
                <motion.div
                  key={plan.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`relative card-elevated ${plan.popular ? "ring-2 ring-gold scale-105" : ""}`}
                >
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gold text-primary rounded-full text-sm font-semibold">
                      Most Popular
                    </div>
                  )}
                  
                  <div className="p-8">
                    {/* Plan Header */}
                    <div className="text-center mb-8">
                      <div className={`w-16 h-16 mx-auto rounded-xl bg-gradient-to-br ${plan.color} flex items-center justify-center mb-4`}>
                        <Icon className="w-8 h-8 text-primary-foreground" />
                      </div>
                      <h3 className="font-serif text-2xl font-semibold text-foreground mb-2">
                        {plan.name}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        {plan.description}
                      </p>
                      <div className="mb-2">
                        <span className="text-4xl font-bold text-foreground">
                          {plan.price}
                        </span>
                        {plan.period !== "Forever" && (
                          <span className="text-muted-foreground ml-2">
                            /{plan.period}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Features */}
                    <ul className="space-y-4 mb-8">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-3">
                          <Check className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                          <span className="text-sm text-muted-foreground">
                            {feature}
                          </span>
                        </li>
                      ))}
                    </ul>

                    {/* CTA Button */}
                    <Link to={`/payment?plan=${plan.name.toLowerCase()}`}>
                      <Button
                        variant={plan.popular ? "gold" : "outline"}
                        className="w-full"
                        size="lg"
                      >
                        {plan.cta}
                      </Button>
                    </Link>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* CTA Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-center mt-16"
          >
            <div className="card-elevated p-8 max-w-2xl mx-auto">
              <h2 className="font-serif text-2xl font-semibold text-foreground mb-4">
                Ready to Secure Your Will?
              </h2>
              <p className="text-muted-foreground mb-6">
                Start with our free plan and upgrade when you're ready. No credit card required.
              </p>
              <Link to="/payment?plan=basic">
                <Button variant="gold" size="lg" className="gap-2">
                  Get Started Free
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Pricing;
