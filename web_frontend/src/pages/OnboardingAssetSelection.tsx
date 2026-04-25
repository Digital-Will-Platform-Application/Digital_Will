import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import {
  Share2,
  FileText,
  ArrowRight,
  Check,
  Shield,
  Clock,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

type Choice = "share_message" | "write_will" | null;

const OnboardingAssetSelection = () => {
  const { user, updateUserMetadata } = useAuth();
  const navigate = useNavigate();
  const [selected, setSelected] = useState<Choice>(null);
  const [loading, setLoading] = useState(false);

  const options: { id: Choice; icon: typeof Share2; title: string; description: string; features: string[]; time: string; color: string }[] = [
    {
      id: "share_message",
      icon: Share2,
      title: "Share Message (Quick)",
      description: "Share a single message or asset quickly with your chosen contact. Best for one-off updates or a quick note.",
      features: ["Single asset or message", "Fast setup", "Choose contact method"],
      time: "2–5 min",
      color: "from-sage-dark to-sage",
    },
    {
      id: "write_will",
      icon: FileText,
      title: "Write Will",
      description: "Create your complete digital will with multiple assets, beneficiaries, and your full wishes. We'll guide you step by step.",
      features: ["Multiple assets", "Recipients & allocation", "Record Audio, Record Video, Fill a Form, or Write a Note"],
      time: "10–20 min",
      color: "from-gold to-gold-light",
    },
  ];

  const handleContinue = async () => {
    if (!selected || !user) return;
    setLoading(true);
    try {
      // Supabase is disabled in NeonDB mode; store the flag locally so the UI can proceed.
      updateUserMetadata({ onboarding_completed: true });
      if (selected === "write_will") {
        navigate("/create");
      } else {
        // Share Message (Quick) – for now go to create flow; can add a dedicated quick-share page later
        navigate("/create", { state: { mode: "quick" } });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen page-ambient bg-background">
      <main className="p-6 pb-12">
        <div className="app-shell max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-sage/50 text-sm font-medium text-foreground mb-4">
              <Sparkles className="w-4 h-4 text-gold" />
              Choose your path
            </div>
            <h1 className="heading-section text-foreground mb-4">
              How would you like to get started?
            </h1>
            <p className="body-large max-w-xl mx-auto text-muted-foreground">
              Select one option below. You can create a quick message or your full will—we’ll take you to the right place.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {options.map((option, index) => (
              <motion.button
                key={option.id}
                type="button"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => setSelected(option.id)}
                className={`relative text-left p-6 rounded-xl border-2 transition-all duration-300 ${
                  selected === option.id
                    ? "border-gold bg-gold/5 shadow-gold"
                    : "border-border bg-card hover:border-gold/50"
                }`}
              >
                <AnimatePresence>
                  {selected === option.id && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="absolute top-4 right-4 w-6 h-6 rounded-full bg-gold flex items-center justify-center"
                    >
                      <Check className="w-4 h-4 text-primary" />
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${option.color} flex items-center justify-center mb-4`}>
                  <option.icon className="w-7 h-7 text-primary-foreground" />
                </div>

                <h3 className="font-serif text-xl font-semibold text-foreground mb-2">
                  {option.title}
                </h3>
                <p className="text-muted-foreground text-sm mb-4">
                  {option.description}
                </p>

                <ul className="space-y-1 mb-4">
                  {option.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Check className="w-3 h-3 text-gold flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  ~{option.time}
                </div>
              </motion.button>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="flex flex-col items-center gap-4"
          >
            <Button
              variant="gold"
              size="xl"
              onClick={handleContinue}
              disabled={!selected || loading}
              className="gap-2"
            >
              {loading ? "Taking you there…" : "Continue"}
              <ArrowRight className="w-5 h-5" />
            </Button>
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Your data is encrypted and secure
            </p>
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default OnboardingAssetSelection;
