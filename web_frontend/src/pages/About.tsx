import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { motion } from "framer-motion";
import { Shield, Heart, Users, Target, Award, Mail, MapPin, Phone, Building2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import ThreeDLogo from "@/components/branding/ThreeDLogo";

const About = () => {
  const values = [
    {
      icon: Shield,
      title: "Security First",
      description: "We prioritize the security and privacy of your sensitive information above all else.",
    },
    {
      icon: Heart,
      title: "Compassionate Service",
      description: "We understand the emotional importance of will planning and treat every user with care.",
    },
    {
      icon: Users,
      title: "User-Centric",
      description: "Every feature is designed with our users' needs and peace of mind in mind.",
    },
    {
      icon: Target,
      title: "Innovation",
      description: "We continuously improve our platform to provide the best digital will management experience.",
    },
  ];

  const stats = [
    { label: "Trusted Users", value: "50,000+", icon: Users },
    { label: "Wills Created", value: "100,000+", icon: Shield },
    { label: "Countries Served", value: "50+", icon: MapPin },
    { label: "Years of Service", value: "5+", icon: Award },
  ];

  return (
    <div className="min-h-screen page-ambient bg-background">
      <Header />
      <main className="pb-16 pt-24">
        <section className="relative overflow-hidden py-12 md:py-16">
          <div className="absolute inset-0 bg-gradient-to-b from-muted/35 via-background to-background" />
          <div className="container relative z-10 mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="mx-auto max-w-5xl rounded-[2rem] border border-border/60 bg-card/80 p-8 shadow-premium backdrop-blur-xl md:p-12"
            >
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                <Building2 className="h-4 w-4" />
                About Digital Will
              </div>
              <div className="grid items-start gap-8 lg:grid-cols-[1.15fr_0.85fr]">
                <div>
                  <h1 className="font-sans text-4xl font-extrabold tracking-tight text-foreground md:text-5xl">
                    Securing Wills, One Will at a Time
                  </h1>
                  <p className="mt-5 text-base leading-relaxed text-muted-foreground md:text-lg">
                    Digital Will was founded with a simple mission: to make estate planning accessible, secure, and meaningful for everyone. We believe that everyone deserves peace of mind when it comes to protecting their will and ensuring their wishes are honored.
                  </p>
                </div>
                <div className="rounded-3xl border border-border/60 bg-background/70 p-6">
                  <div className="mb-4 flex items-center gap-3">
                    <ThreeDLogo className="scale-90" iconClassName="h-4 w-4" />
                    <p className="text-sm font-semibold uppercase tracking-[0.14em] text-muted-foreground">Legacy Snapshot</p>
                  </div>
                  <div className="space-y-3">
                    {stats.map((stat) => (
                      <div key={stat.label} className="flex items-center justify-between rounded-xl border border-border/50 bg-card/70 px-4 py-3">
                        <span className="text-sm text-muted-foreground">{stat.label}</span>
                        <span className="font-semibold text-foreground">{stat.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        <section className="py-14">
          <div className="container mx-auto px-4">
            <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-2">
              <motion.article
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="rounded-3xl border border-border/60 bg-card/85 p-7 shadow-soft"
              >
                <h2 className="mb-4 font-sans text-3xl font-bold tracking-tight text-foreground">Our Story</h2>
                <div className="space-y-4 text-muted-foreground leading-relaxed">
                  <p>
                    Digital Will was born from a personal experience. Our founders recognized that traditional estate planning was often complicated, expensive, and emotionally challenging. They saw families struggling to document their wishes and ensure their loved ones would be taken care of.
                  </p>
                  <p>
                    In response, we set out to create a platform that would democratize estate planning—making it accessible to everyone, regardless of their financial situation or technical expertise. We combined cutting-edge security technology with an intuitive, user-friendly interface to create something truly special.
                  </p>
                  <p>
                    Today, Digital Will serves thousands of families worldwide, helping them secure their wills with confidence. We're proud of what we've built, but we're even more excited about what's to come as we continue to innovate and improve.
                  </p>
                </div>
              </motion.article>

              <motion.article
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.08 }}
                className="rounded-3xl border border-border/60 bg-gradient-to-br from-primary/[0.07] to-accent/[0.08] p-7 shadow-soft"
              >
                <h2 className="mb-4 font-sans text-3xl font-bold tracking-tight text-foreground">Mission & Vision</h2>
                <div className="space-y-6">
                  <div>
                    <h3 className="mb-2 font-serif text-2xl font-semibold text-foreground">Our Mission</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      To empower individuals and families to protect their wills with confidence, ensuring that their wishes are documented, secure, and accessible to those who matter most.
                    </p>
                  </div>
                  <div>
                    <h3 className="mb-2 font-serif text-2xl font-semibold text-foreground">Our Vision</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      A world where every person has the tools and confidence to plan their will, leaving behind not just assets, but peace of mind for their loved ones.
                    </p>
                  </div>
                </div>
              </motion.article>
            </div>
          </div>
        </section>

        <section className="border-y border-border/40 bg-muted/20 py-14">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mx-auto mb-9 max-w-2xl text-center"
            >
              <h2 className="font-sans text-3xl font-bold tracking-tight text-foreground md:text-4xl">Our Values</h2>
              <p className="mt-3 text-muted-foreground">These core principles guide everything we do at Digital Will.</p>
            </motion.div>

            <div className="mx-auto grid max-w-6xl grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
              {values.map((value, index) => (
                <motion.div
                  key={value.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.08 }}
                >
                  <Card className="h-full rounded-3xl border-border/60">
                    <CardContent className="p-6">
                      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-md">
                        <value.icon className="h-6 w-6" />
                      </div>
                      <h3 className="mb-2 font-serif text-xl font-semibold text-foreground">{value.title}</h3>
                      <p className="text-sm leading-relaxed text-muted-foreground">{value.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-14">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mx-auto max-w-4xl rounded-3xl border border-border/60 bg-card/80 p-8 text-center shadow-soft"
            >
              <h2 className="font-sans text-3xl font-bold tracking-tight text-foreground">Our Team</h2>
              <p className="mx-auto mt-3 max-w-3xl text-muted-foreground">
                We're a diverse team of passionate individuals dedicated to making estate planning accessible and secure. Our team combines expertise in technology, security, legal compliance, and user experience.
              </p>
              <p className="mt-2 text-sm italic text-muted-foreground">Team member profiles will be updated here soon.</p>
            </motion.div>
          </div>
        </section>

        <section className="py-14">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mx-auto max-w-5xl"
            >
              <div className="mb-8 text-center">
                <h2 className="font-sans text-3xl font-bold tracking-tight text-foreground md:text-4xl">Get in Touch</h2>
                <p className="mt-3 text-muted-foreground">Have questions? We'd love to hear from you.</p>
              </div>
              <div className="grid gap-5 md:grid-cols-3">
                <Card className="rounded-3xl border-border/60">
                  <CardContent className="p-6 text-center">
                    <Mail className="mx-auto mb-4 h-8 w-8 text-primary" />
                    <h3 className="mb-2 font-serif text-lg font-semibold text-foreground">Email</h3>
                    <p className="text-sm text-muted-foreground">support@digitalwill.com</p>
                    <p className="mt-2 text-xs italic text-muted-foreground">Contact details will be updated</p>
                  </CardContent>
                </Card>
                <Card className="rounded-3xl border-border/60">
                  <CardContent className="p-6 text-center">
                    <Phone className="mx-auto mb-4 h-8 w-8 text-primary" />
                    <h3 className="mb-2 font-serif text-lg font-semibold text-foreground">Phone</h3>
                    <p className="text-sm text-muted-foreground">+1 (555) 123-4567</p>
                    <p className="mt-2 text-xs italic text-muted-foreground">Contact details will be updated</p>
                  </CardContent>
                </Card>
                <Card className="rounded-3xl border-border/60">
                  <CardContent className="p-6 text-center">
                    <MapPin className="mx-auto mb-4 h-8 w-8 text-primary" />
                    <h3 className="mb-2 font-serif text-lg font-semibold text-foreground">Address</h3>
                    <p className="text-sm text-muted-foreground">
                      123 Will Street
                      <br />
                      San Francisco, CA 94105
                    </p>
                    <p className="mt-2 text-xs italic text-muted-foreground">Contact details will be updated</p>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default About;
