import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
  CheckCircle,
  Shield,
  Download,
  Share2,
  Bell,
  ArrowRight,
  Mail,
  Calendar,
} from "lucide-react";

const Confirmation = () => {
  const nextSteps = [
    {
      icon: Mail,
      title: "Notify Recipients",
      description: "Send invitations to your recipients so they can verify their identity.",
      action: "Send Invites",
      link: "/recipients",
    },
    {
      icon: Calendar,
      title: "Set Reminders",
      description: "Schedule periodic reminders to review and update your will.",
      action: "Set Up",
      link: "/reminders",
    },
    {
      icon: Shield,
      title: "Review security settings",
      description: "Keep your password strong and review your account details periodically.",
      action: "Open Account",
      link: "/account",
    },
  ];

  return (
    <div className="min-h-screen page-ambient bg-background">
      <main className="p-6 pb-12">
        <div className="app-shell max-w-3xl">
          {/* Success Animation */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", duration: 0.6 }}
            className="text-center mb-8"
          >
            <div className="relative inline-block mb-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
                className="w-24 h-24 rounded-full bg-gradient-to-br from-gold to-gold-light flex items-center justify-center shadow-gold"
              >
                <CheckCircle className="w-12 h-12 text-primary" />
              </motion.div>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.2, 1] }}
                transition={{ delay: 0.4, duration: 0.4 }}
                className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-primary flex items-center justify-center"
              >
                <Shield className="w-5 h-5 text-primary-foreground" />
              </motion.div>
            </div>

            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="heading-section text-foreground mb-2"
            >
              Your Will is Secured!
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-muted-foreground"
            >
              Your digital will has been encrypted and stored securely.
            </motion.p>
          </motion.div>

          {/* Summary Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="card-elevated text-center mb-8"
          >
            <div className="grid grid-cols-3 gap-4 mb-6">
              {[
                { label: "Will ID", value: "#LV-2024-0847" },
                { label: "Created", value: "Today" },
                { label: "Status", value: "Active" },
              ].map((item) => (
                <div key={item.label}>
                  <p className="text-sm text-muted-foreground">{item.label}</p>
                  <p className="font-semibold text-foreground">{item.value}</p>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button variant="outline" className="gap-2">
                <Download className="w-4 h-4" />
                Download Summary
              </Button>
              <Button variant="outline" className="gap-2">
                <Share2 className="w-4 h-4" />
                Share Securely
              </Button>
            </div>
          </motion.div>

          {/* Next Steps */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mb-8"
          >
            <h2 className="font-serif text-xl font-semibold text-foreground mb-4 text-center">
              Recommended Next Steps
            </h2>
            <div className="grid gap-4">
              {nextSteps.map((step, index) => (
                <motion.div
                  key={step.title}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 + index * 0.1 }}
                  className="card-interactive flex items-center gap-4"
                >
                  <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center">
                    <step.icon className="w-6 h-6 text-foreground" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">{step.title}</h3>
                    <p className="text-sm text-muted-foreground">{step.description}</p>
                  </div>
                  <Link to={step.link || "/dashboard"}>
                    <Button variant="ghost" size="sm" className="gap-1">
                      {step.action}
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Notification Banner */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className="card-elevated bg-sage/30 border-sage mb-8"
          >
            <div className="flex items-center gap-4">
              <Bell className="w-6 h-6 text-foreground" />
              <div className="flex-1">
                <p className="font-medium text-foreground">Stay Updated</p>
                <p className="text-sm text-muted-foreground">
                  We'll notify you when recipients verify their accounts and remind you to review your will periodically.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Dashboard Link */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="text-center"
          >
            <Link to="/dashboard">
              <Button variant="gold" size="xl" className="gap-2">
                Go to Dashboard
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default Confirmation;
