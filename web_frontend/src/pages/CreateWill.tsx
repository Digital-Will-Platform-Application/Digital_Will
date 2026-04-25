import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mic,
  Video,
  FilePenLine,
  NotebookPen,
  ArrowLeft,
  ArrowRight,
  Check,
  Shield,
  Clock,
  Sparkles,
} from "lucide-react";
import { useTranslation } from "react-i18next";

type Method = "audio" | "video" | "manual" | "note" | null;

const CreateWill = () => {
  const { t } = useTranslation();
  const [selectedMethod, setSelectedMethod] = useState<Method>(null);
  const navigate = useNavigate();

  const methods = [
    {
      id: "audio" as Method,
      icon: Mic,
      title: t("dashboard.recordAudio"),
      description: "Speak your wishes naturally. We'll transcribe and organize everything for you.",
      features: ["Natural conversation", "AI transcription", "Edit anytime"],
      time: "5-10 min",
      color: "from-gold to-gold-light",
    },
    {
      id: "video" as Method,
      icon: Video,
      title: t("dashboard.recordVideo"),
      description: "Record personal video messages for your loved ones to treasure.",
      features: ["Personal touch", "Visual memories", "Secure storage"],
      time: "5-15 min",
      color: "from-navy to-navy-light",
    },
    {
      id: "manual" as Method,
      icon: FilePenLine,
      title: t("dashboard.fillForm"),
      description: t("features.manualDescription"),
      features: ["Direct writing", "Structured fields", "Edit anytime"],
      time: "8-20 min",
      color: "from-blue-600 to-indigo-600",
    },
    {
      id: "note" as Method,
      icon: NotebookPen,
      title: t("dashboard.writeNote"),
      description: "Choose your language and write your will as a personal note in your own words.",
      features: ["Pick preferred language", "Notepad-style writing", "Assign recipient before final save"],
      time: "4-12 min",
      color: "from-sage-dark to-sage",
    },
  ];

  const handleContinue = () => {
    if (selectedMethod) {
      navigate(`/create/${selectedMethod}`);
    }
  };

  return (
    <div className="min-h-screen page-ambient bg-background">
      <main className="p-6 pb-12">
        <div className="app-shell max-w-4xl">
          {/* Back Button */}
          <Link to="/dashboard" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6">
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-sage/50 text-sm font-medium text-foreground mb-4">
              <Sparkles className="w-4 h-4 text-gold" />
              Step 1 of 4
            </div>
            <h1 className="heading-section text-foreground mb-4">
              How Would You Like to Create Your Will?
            </h1>
            <p className="body-large max-w-xl mx-auto">
              Choose the method that feels most natural to you. You can always switch or use multiple methods.
            </p>
          </motion.div>

          {/* Method Selection */}
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4 mb-8">
            {methods.map((method, index) => (
              <motion.button
                key={method.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => setSelectedMethod(method.id)}
                className={`relative min-h-[320px] text-left p-7 md:p-8 rounded-2xl border-2 transition-all duration-300 ${
                  selectedMethod === method.id
                    ? "border-gold bg-gold/5 shadow-gold"
                    : "border-border bg-card hover:border-gold/50"
                }`}
              >
                {/* Selected Indicator */}
                <AnimatePresence>
                  {selectedMethod === method.id && (
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

                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${method.color} flex items-center justify-center mb-5`}>
                  <method.icon className="w-8 h-8 text-primary-foreground" />
                </div>

                <h3 className="font-serif text-xl font-semibold text-foreground mb-2">
                  {method.title}
                </h3>
                <p className="text-muted-foreground text-sm mb-5 leading-relaxed">
                  {method.description}
                </p>

                {/* Features */}
                <ul className="space-y-2 mb-5">
                  {method.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Check className="w-3 h-3 text-gold" />
                      {feature}
                    </li>
                  ))}
                </ul>

                {/* Time Estimate */}
                <div className="mt-auto flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  ~{method.time}
                </div>
              </motion.button>
            ))}
          </div>

          {/* Continue Button */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="flex flex-col items-center gap-4"
          >
            <Button
              variant="hero"
              size="xl"
              onClick={handleContinue}
              disabled={!selectedMethod}
              className="gap-2"
            >
              Continue
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

export default CreateWill;
