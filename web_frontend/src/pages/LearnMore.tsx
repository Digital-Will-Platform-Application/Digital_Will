import { Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { motion } from "framer-motion";
import { ArrowLeft, Shield, Lock, FileText, Users, Clock, CheckCircle, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const LearnMore = () => {
  const features = [
    {
      icon: FileText,
      title: "Digital Will Creation",
      description: "Create your will using Record Audio, Record Video, Fill a Form, Write a Note, or text. Our platform guides you through the process step by step, ensuring nothing is missed.",
    },
    {
      icon: Users,
      title: "Recipient Management",
      description: "Easily add and manage beneficiaries. Set up verification for recipients and assign assets to specific people with clear allocation percentages.",
    },
    {
      icon: Shield,
      title: "Bank-Level Security",
      description: "Your sensitive information is protected with 256-bit encryption. We use industry-standard security practices to keep your data safe.",
    },
    {
      icon: Clock,
      title: "Update Anytime",
      description: "Life changes, and so can your will. Update your will, recipients, and asset allocations at any time with just a few clicks.",
    },
  ];

  const benefits = [
    "Peace of mind knowing your wishes are documented",
    "Easy to update as your life circumstances change",
    "Secure digital storage accessible to trusted recipients",
    "Multiple format options (Record Audio, Record Video, Fill a Form, Write a Note, and text)",
    "Comprehensive asset management and allocation",
    "Recipient verification for added security",
    "Professional guidance through the process",
    "24/7 access to your will from anywhere",
  ];

  const faqs = [
    {
      question: "Is my digital will legally binding?",
      answer: "While Digital Will provides a secure platform to create and store your will, we recommend consulting with a legal professional in your jurisdiction to ensure your will meets all local legal requirements. Laws vary by location, and some jurisdictions may require specific formalities like witnesses or notarization.",
    },
    {
      question: "Can I change my plan later?",
      answer: "Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately, and we'll prorate any charges. Your data is always preserved when switching plans.",
    },
    {
      question: "What happens if I cancel my subscription?",
      answer: "Your data remains secure and accessible. You can export your will and recipient information at any time. Basic plan features remain available even after cancellation, ensuring you never lose access to your important documents.",
    },
    {
      question: "How secure is my information?",
      answer: "We use 256-bit SSL encryption to protect all data in transit and at rest. Your passwords are hashed using industry-standard algorithms, and we implement multiple layers of security including rate limiting and leaked password protection. We never share your information with third parties.",
    },
    {
      question: "Can I add multiple wills?",
      answer: "Yes! With Professional and Legacy plans, you can create unlimited wills. This is useful if you want separate wills for different purposes or need to create wills for different time periods.",
    },
    {
      question: "How do recipients access the will?",
      answer: "Recipients receive email notifications with verification links. Once they verify their identity, they can access the information you've shared with them. You control what each recipient can see.",
    },
    {
      question: "What types of assets can I include?",
      answer: "You can include any type of asset: property, investments, bank accounts, vehicles, jewelry, digital assets, insurance policies, business interests, and more. Our platform supports comprehensive asset categorization and allocation.",
    },
    {
      question: "Do you offer refunds?",
      answer: "We offer a 30-day money-back guarantee on all paid plans. If you're not satisfied, contact us within 30 days for a full refund. No questions asked.",
    },
    {
      question: "Can I record video messages for my loved ones?",
      answer: "Yes! Our video will feature allows you to record personal messages for your beneficiaries. These videos are stored securely and can be shared with recipients when appropriate.",
    },
    {
      question: "What if I need legal advice?",
      answer: "While Digital Will provides tools to create and manage your will, we always recommend consulting with a qualified estate planning attorney in your jurisdiction for complex situations or to ensure full legal compliance.",
    },
    {
      question: "How long does it take to create a will?",
      answer: "Most users complete their will in under 10 minutes. The process is designed to be simple and straightforward, with guided steps for creating your will, adding recipients, and allocating assets.",
    },
    {
      question: "Is my data backed up?",
      answer: "Yes, all data is automatically backed up with redundancy across multiple secure servers. Your information is protected against data loss and is accessible 24/7.",
    },
  ];

  return (
    <div className="min-h-screen page-ambient bg-background">
      <Header />
      <main className="pt-24 pb-12">
        <div className="container mx-auto max-w-6xl px-4">
          <Link to="/" className="mb-8 inline-flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-auto mb-12 max-w-4xl rounded-[2rem] border border-border/60 bg-card/80 p-8 text-center shadow-premium backdrop-blur-xl md:p-10"
          >
            <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
              <HelpCircle className="h-4 w-4" />
              Learn More
            </span>
            <h1 className="font-sans text-4xl font-extrabold tracking-tight text-foreground md:text-5xl">
              Everything You Need to Know About Digital Will
            </h1>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground md:text-lg">
              Discover how Digital Will helps you secure your legacy and protect what matters most to you and your loved ones.
            </p>
          </motion.div>

          <div className="grid gap-8 lg:grid-cols-[0.92fr_1.08fr]">
            <div className="space-y-8">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <h2 className="mb-6 font-sans text-3xl font-bold tracking-tight text-foreground">Key Features</h2>
                <div className="space-y-4">
                  {features.map((feature, index) => {
                    const Icon = feature.icon;
                    return (
                      <motion.div
                        key={feature.title}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 + index * 0.1 }}
                        className="rounded-2xl border border-border/60 bg-card/85 p-5 shadow-soft"
                      >
                        <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-sm">
                          <Icon className="h-5 w-5" />
                        </div>
                        <h3 className="mb-1.5 font-serif text-lg font-semibold text-foreground">{feature.title}</h3>
                        <p className="text-sm text-muted-foreground">{feature.description}</p>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="rounded-3xl border border-border/60 bg-gradient-to-br from-secondary/45 to-background p-7 shadow-soft"
              >
                <h2 className="mb-5 font-sans text-2xl font-bold tracking-tight text-foreground">Why Choose Digital Will?</h2>
                <div className="grid gap-3">
                  {benefits.map((benefit, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
                      <span className="text-sm text-muted-foreground">{benefit}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>

            <div className="space-y-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="rounded-3xl border border-border/60 bg-card/80 p-7 shadow-soft"
              >
                <div className="mb-5 flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-navy to-navy-light">
                    <Lock className="h-7 w-7 text-primary-foreground" />
                  </div>
                  <div>
                    <h2 className="font-sans text-2xl font-bold tracking-tight text-foreground">Your Security is Our Priority</h2>
                    <p className="text-sm text-muted-foreground">We take security seriously to protect your sensitive information</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="rounded-xl border border-border/50 bg-background/70 p-4">
                    <h3 className="mb-1 font-semibold text-foreground">256-bit Encryption</h3>
                    <p className="text-sm text-muted-foreground">All data is encrypted using industry-standard AES-256 encryption, the same level used by banks and financial institutions.</p>
                  </div>
                  <div className="rounded-xl border border-border/50 bg-background/70 p-4">
                    <h3 className="mb-1 font-semibold text-foreground">Secure Authentication</h3>
                    <p className="text-sm text-muted-foreground">Multi-factor authentication options and leaked password protection ensure your account stays secure.</p>
                  </div>
                  <div className="rounded-xl border border-border/50 bg-background/70 p-4">
                    <h3 className="mb-1 font-semibold text-foreground">Privacy First</h3>
                    <p className="text-sm text-muted-foreground">We never share your information with third parties. Your data belongs to you, and you control who can access it.</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="rounded-3xl border border-border/60 bg-card/80 p-7 shadow-soft"
              >
                <div className="mb-6 flex items-center gap-2">
                  <HelpCircle className="h-5 w-5 text-primary" />
                  <h2 className="font-sans text-2xl font-bold tracking-tight text-foreground">Frequently Asked Questions</h2>
                </div>
                <Accordion type="single" collapsible className="w-full space-y-3">
                  {faqs.map((faq, index) => (
                    <AccordionItem key={index} value={`item-${index}`} className="rounded-xl border border-border/60 bg-background/75 px-4 py-1">
                      <AccordionTrigger className="font-semibold text-foreground hover:no-underline">
                        {faq.question}
                      </AccordionTrigger>
                      <AccordionContent className="pt-1 text-muted-foreground">{faq.answer}</AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </motion.div>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mt-12 text-center"
          >
            <div className="mx-auto max-w-3xl rounded-3xl border border-border/60 bg-card/85 p-8 shadow-premium">
              <h2 className="mb-4 font-sans text-3xl font-bold tracking-tight text-foreground">Ready to Get Started?</h2>
              <p className="mb-6 text-muted-foreground">
                Create your digital will in minutes and secure your legacy for your loved ones. Start with our free plan today.
              </p>
              <div className="flex flex-col justify-center gap-4 sm:flex-row">
                <Link to="/pricing">
                  <Button variant="gold" size="lg" className="gap-2">View Pricing</Button>
                </Link>
                <Link to="/login">
                  <Button variant="outline" size="lg">Get Started Free</Button>
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

export default LearnMore;
