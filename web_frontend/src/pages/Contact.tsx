import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { motion } from "framer-motion";
import { Mail, MapPin, Phone, Send, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import { toast } from "sonner";

const Contact = () => {
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const contactInfo = [
    {
      icon: Mail,
      label: "Email",
      value: "support@digitalwill.com",
      href: "mailto:support@digitalwill.com",
    },
    {
      icon: Phone,
      label: "Phone",
      value: "+1 (555) 123-4567",
      href: "tel:+15551234567",
    },
    {
      icon: MapPin,
      label: "Address",
      value: "123 Legacy Way, San Francisco, CA 94102",
      href: null,
    },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) {
      toast.error("Please fill in all required fields.");
      return;
    }
    toast.success("Thank you! We'll get back to you soon.");
    setName("");
    setEmail("");
    setSubject("");
    setMessage("");
  };

  return (
    <div className="min-h-screen page-ambient bg-background">
      <Header />

      <main className="pt-24 pb-16">
        <section className="relative overflow-hidden py-12 md:py-16">
          <div className="container mx-auto px-4">
            <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="rounded-[2rem] border border-primary/20 bg-gradient-to-br from-navy to-navy-light p-8 text-primary-foreground shadow-premium md:p-10"
              >
                <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em]">
                  <MessageCircle className="h-4 w-4" />
                  {t("header.contactUs")}
                </div>
                <h1 className="font-sans text-4xl font-extrabold tracking-tight md:text-5xl">Get in Touch</h1>
                <p className="mt-4 max-w-md text-base text-primary-foreground/80 md:text-lg">
                  Have questions about Digital Will or need support? We're here to help. Reach out and we'll respond as soon as we can.
                </p>

                <div className="mt-8 space-y-4">
                  {contactInfo.map((item) => (
                    <div key={item.label} className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
                      <div className="mb-2 flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15">
                          <item.icon className="h-4 w-4" />
                        </div>
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary-foreground/70">{item.label}</p>
                      </div>
                      {item.href ? (
                        <a href={item.href} className="text-sm font-medium hover:underline">{item.value}</a>
                      ) : (
                        <p className="text-sm font-medium">{item.value}</p>
                      )}
                    </div>
                  ))}
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card className="rounded-[2rem] border-border/60 bg-card/85 shadow-premium">
                  <CardContent className="p-7 md:p-8">
                    <h2 className="mb-6 font-sans text-3xl font-bold tracking-tight text-foreground">Send us a Message</h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div>
                        <label htmlFor="name" className="mb-2 block text-sm font-medium text-foreground">Name *</label>
                        <Input
                          id="name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Your name"
                          className="bg-background"
                        />
                      </div>
                      <div>
                        <label htmlFor="email" className="mb-2 block text-sm font-medium text-foreground">Email *</label>
                        <Input
                          id="email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="you@example.com"
                          className="bg-background"
                        />
                      </div>
                      <div>
                        <label htmlFor="subject" className="mb-2 block text-sm font-medium text-foreground">Subject</label>
                        <Input
                          id="subject"
                          value={subject}
                          onChange={(e) => setSubject(e.target.value)}
                          placeholder="How can we help?"
                          className="bg-background"
                        />
                      </div>
                      <div>
                        <label htmlFor="message" className="mb-2 block text-sm font-medium text-foreground">Message *</label>
                        <Textarea
                          id="message"
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          placeholder="Your message..."
                          rows={5}
                          className="resize-none bg-background"
                        />
                      </div>
                      <Button type="submit" variant="gold" className="w-full gap-2 rounded-xl">
                        <Send className="h-4 w-4" />
                        {t("common.submit")}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Contact;
