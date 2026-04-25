import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, Globe2, Loader2, NotebookPen, Save, Shield, UserPlus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { sanitizeInput } from "@/lib/validation";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { getCountryOptions } from "@/lib/countries";

type Step = 1 | 2 | 3;
type AssignMode = "existing" | "new";

type ExistingRecipient = {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  relationship: string | null;
};

const LANGUAGE_OPTIONS = [
  "English",
  "Hindi",
  "Telugu",
  "Tamil",
  "Kannada",
  "Malayalam",
  "Marathi",
  "Gujarati",
  "Bengali",
  "Punjabi",
  "Urdu",
  "Other",
];

const LANGUAGE_TO_LOCALE: Record<
  string,
  { lang: string; dir: "ltr" | "rtl" }
> = {
  English: { lang: "en", dir: "ltr" },
  Hindi: { lang: "hi", dir: "ltr" },
  Telugu: { lang: "te", dir: "ltr" },
  Tamil: { lang: "ta", dir: "ltr" },
  Kannada: { lang: "kn", dir: "ltr" },
  Malayalam: { lang: "ml", dir: "ltr" },
  Marathi: { lang: "mr", dir: "ltr" },
  Gujarati: { lang: "gu", dir: "ltr" },
  Bengali: { lang: "bn", dir: "ltr" },
  Punjabi: { lang: "pa", dir: "ltr" },
  Urdu: { lang: "ur", dir: "rtl" },
  Other: { lang: "und", dir: "ltr" },
};

const CreateNoteWill = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation();
  const countryOptions = useMemo(() => getCountryOptions(), []);

  const [step, setStep] = useState<Step>(1);
  const [isSaving, setIsSaving] = useState(false);
  const [existingRecipients, setExistingRecipients] = useState<ExistingRecipient[]>([]);
  const [loadingRecipients, setLoadingRecipients] = useState(true);

  const [language, setLanguage] = useState("English");
  const [noteText, setNoteText] = useState("");
  const noteTextRef = useRef(noteText);
  const noteSourceLangRef = useRef("en");
  const [noteSourceLang, setNoteSourceLang] = useState("en");
  const [isTranslating, setIsTranslating] = useState(false);
  const translateDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [assignMode, setAssignMode] = useState<AssignMode>("existing");
  const [existingRecipientId, setExistingRecipientId] = useState("");

  const [newRecipientName, setNewRecipientName] = useState("");
  const [newRecipientEmail, setNewRecipientEmail] = useState("");
  const [newRecipientCountry, setNewRecipientCountry] = useState("IN");
  const [newRecipientPhone, setNewRecipientPhone] = useState("");
  const [newRecipientRelationship, setNewRecipientRelationship] = useState("beneficiary");

  const languageAttrs = useMemo(() => {
    return LANGUAGE_TO_LOCALE[language] ?? LANGUAGE_TO_LOCALE.Other;
  }, [language]);

  useEffect(() => {
    noteTextRef.current = noteText;
  }, [noteText]);

  useEffect(() => {
    if (noteText.trim().length === 0) {
      noteSourceLangRef.current = "en";
      setNoteSourceLang("en");
    }
  }, [noteText]);

  const targetCodeForLabel = useCallback((label: string): string | null => {
    if (label === "Other") return null;
    if (label === "English") return "en";
    const c = LANGUAGE_TO_LOCALE[label]?.lang;
    return c && c !== "und" ? c : null;
  }, []);

  const runTranslate = useCallback(async (targetLabel: string) => {
    const target = targetCodeForLabel(targetLabel);
    if (!target) return;
    const raw = noteTextRef.current.trim();
    if (raw.length < 12) {
      toast.error("Write at least 12 characters before translating.");
      return;
    }
    const src = noteSourceLangRef.current;
    if (src === target) {
      toast.info("Your note is already in this language.");
      return;
    }
    setIsTranslating(true);
    try {
      const { backendApi } = await import("@/lib/backendApi");
      const out = await backendApi.translateNote(raw, target, src);
      setNoteText(out);
      noteSourceLangRef.current = target;
      setNoteSourceLang(target);
      toast.success(
        target === "en" ? "Note converted to English." : `Note converted to ${targetLabel}.`,
      );
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Translation failed.");
    } finally {
      setIsTranslating(false);
    }
  }, [targetCodeForLabel]);

  const onLanguageSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const v = e.target.value;
    setLanguage(v);
    if (translateDebounceRef.current) clearTimeout(translateDebounceRef.current);
    if (v === "Other") return;
    translateDebounceRef.current = setTimeout(() => {
      if (noteTextRef.current.trim().length < 12) return;
      void runTranslate(v);
    }, 500);
  };

  const targetCode = targetCodeForLabel(language);
  const translateButtonDisabled =
    isTranslating ||
    noteText.trim().length < 12 ||
    language === "Other" ||
    !targetCode ||
    noteSourceLang === targetCode;

  const getErrorMessage = (error: unknown) => {
    if (error instanceof Error) return error.message;
    if (typeof error === "string") return error;
    return "Unknown error";
  };

  useEffect(() => {
    return () => {
      if (translateDebounceRef.current) clearTimeout(translateDebounceRef.current);
    };
  }, []);

  useEffect(() => {
    const fetchRecipients = async () => {
      if (!user?.id || !user?.email) {
        setLoadingRecipients(false);
        return;
      }
      try {
        const { backendApi } = await import("@/lib/backendApi");
        const uid = parseInt(user.id, 10);
        const res = Number.isFinite(uid)
          ? await backendApi.listRecipients({ user_id: uid })
          : await backendApi.listRecipients({ user_email: user.email });
        const rows = res.data ?? [];
        setExistingRecipients(
          rows.map((r) => ({
            id: String(r.id),
            full_name: r.full_name,
            email: r.email,
            phone: r.phone,
            relationship: r.relationship,
          })),
        );
      } catch {
        setExistingRecipients([]);
      } finally {
        setLoadingRecipients(false);
      }
    };
    void fetchRecipients();
  }, [user?.id, user?.email]);

  const validateStep = (target: Step) => {
    if (target === 2) {
      if (!language.trim()) {
        toast.error("Please select a language.");
        return false;
      }
      if (noteText.trim().length < 30) {
        toast.error("Please write at least 30 characters in your note.");
        return false;
      }
    }
    if (target === 3) {
      if (assignMode === "existing") {
        if (!existingRecipientId) {
          toast.error("Please choose an existing recipient.");
          return false;
        }
      } else {
        if (!newRecipientName.trim()) {
          toast.error("Please enter recipient name.");
          return false;
        }
        if (!newRecipientPhone.trim()) {
          toast.error("Please enter recipient mobile number.");
          return false;
        }
      }
    }
    return true;
  };

  const saveDraftForStep = async (currentStep: Step) => {
    if (!user?.email) {
      toast.error("Please sign in to continue.");
      return false;
    }

    const cleanNote = sanitizeInput(noteText).trim();
    const draftTranscript = cleanNote.length > 0 ? cleanNote : "Note will draft";
    const metadata = [
      `Type: Note-based will draft`,
      `Language: ${sanitizeInput(language)}`,
      `Autosave step: ${currentStep}`,
      `Assign mode: ${assignMode}`,
      assignMode === "existing" && existingRecipientId ? `Existing recipient ID: ${existingRecipientId}` : null,
      assignMode === "new" && newRecipientName.trim()
        ? `New recipient: ${sanitizeInput(newRecipientName).trim()}`
        : null,
    ]
      .filter(Boolean)
      .join(" | ");

    const { backendApi } = await import("@/lib/backendApi");
    const result = await backendApi.saveWill({
      user_email: user.email,
      title: `${t("dashboard.writeNote")} - ${language}`,
      transcript: draftTranscript,
      content: draftTranscript,
      notes: metadata,
      type: "note",
    });

    if (!result.success) {
      throw new Error(result.message || "Failed to autosave note step");
    }

    return true;
  };

  const handleNext = async () => {
    const next = Math.min(3, step + 1) as Step;
    if (!validateStep(next)) return;
    setIsSaving(true);
    try {
      await saveDraftForStep(step);
      setStep(next);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error) || "Could not save this step. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleBack = () => setStep((s) => Math.max(1, s - 1) as Step);

  const selectedExistingRecipient = existingRecipients.find((r) => r.id === existingRecipientId) ?? null;

  const getFinalRecipientPreview = () => {
    if (assignMode === "existing" && selectedExistingRecipient) {
      return {
        name: selectedExistingRecipient.full_name,
        email: selectedExistingRecipient.email || "N/A",
        phone: selectedExistingRecipient.phone || "N/A",
        relationship: selectedExistingRecipient.relationship || "beneficiary",
        source: "existing",
      } as const;
    }
    const dialCode = countryOptions.find((c) => c.code === newRecipientCountry)?.dialCode ?? "";
    return {
      name: newRecipientName || "N/A",
      email: newRecipientEmail || "N/A",
      phone: `${dialCode}${newRecipientPhone}`.trim() || "N/A",
      relationship: newRecipientRelationship || "beneficiary",
      source: "new",
    } as const;
  };

  const finalRecipient = getFinalRecipientPreview();

  const handleFinalSave = async () => {
    if (!user?.email || !user?.id) {
      toast.error("Please sign in to continue.");
      return;
    }
    if (!validateStep(3)) return;

    setIsSaving(true);
    try {
      let recipientId: string | null = null;

      if (assignMode === "existing") {
        recipientId = existingRecipientId;
      } else {
        const dial = countryOptions.find((c) => c.code === newRecipientCountry)?.dialCode ?? "";
        const phone = `${dial}${newRecipientPhone}`.replace(/\s+/g, "");
        const { backendApi } = await import("@/lib/backendApi");
        const inserted = await backendApi.addRecipient({
          user_email: user.email,
          full_name: sanitizeInput(newRecipientName).trim(),
          email: sanitizeInput(newRecipientEmail).trim() || null,
          phone: phone || null,
          relationship: sanitizeInput(newRecipientRelationship).trim() || "beneficiary",
        });
        const rawId = inserted.data?.id;
        recipientId = rawId != null ? String(rawId) : null;
      }

      const now = new Date();
      const title = `${t("dashboard.writeNote")} - ${language} - ${now.toLocaleDateString()}`;
      const cleanNote = sanitizeInput(noteText).trim();
      const metadataLines = [
        `Type: Note-based will`,
        `Language: ${sanitizeInput(language)}`,
        `Recipient: ${sanitizeInput(finalRecipient.name)}`,
        `Recipient source: ${finalRecipient.source}`,
        recipientId ? `Recipient ID: ${recipientId}` : null,
      ].filter(Boolean);

      const { backendApi } = await import("@/lib/backendApi");
      const result = await backendApi.saveWill({
        user_email: user.email,
        title,
        transcript: cleanNote,
        content: cleanNote,
        notes: metadataLines.join(" | "),
        type: "note",
      });

      if (!result.success) {
        throw new Error(result.message || "Failed to save note will");
      }

      toast.success("Note will saved successfully.");
      navigate("/dashboard");
    } catch (error: unknown) {
      toast.error(getErrorMessage(error) || "Failed to save note will");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen page-ambient bg-background">
      <main className="p-6 pb-12">
        <div className="app-shell max-w-4xl">
          <Link to="/create" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6">
            <ArrowLeft className="w-4 h-4" />
            Back to Method Selection
          </Link>

          <div className="flex items-center gap-2 mb-8">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`progress-step ${s === step ? "progress-step-active" : s < step ? "progress-step-completed" : "progress-step-pending"}`}>
                  {s < step ? <Check className="w-4 h-4" /> : s}
                </div>
                {s < 3 && <div className="w-8 h-0.5 bg-border" />}
              </div>
            ))}
          </div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
            <h1 className="heading-section text-foreground mb-3">{t("dashboard.writeNote")}</h1>
            <p className="text-muted-foreground">
              {step === 1 && "Select language and write your will as a note."}
              {step === 2 && "Assign this note will to a recipient (existing or new)."}
              {step === 3 && "Review details and save your will."}
            </p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="card-elevated space-y-6">
            {step === 1 && (
              <>
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Language</label>
                  <div className="relative">
                    <Globe2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <select
                      value={language}
                      onChange={onLanguageSelectChange}
                      title="Language"
                      disabled={isTranslating}
                      className="w-full rounded-xl border border-border bg-background text-foreground px-10 py-3 outline-none focus:ring-2 focus:ring-gold/40 disabled:opacity-60"
                    >
                      {LANGUAGE_OPTIONS.map((lang) => (
                        <option key={lang} value={lang}>
                          {lang}
                        </option>
                      ))}
                    </select>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    After you write your note, choose the will language — the text is converted automatically (or use the
                    button below). Switching language again re-translates from the current note.
                  </p>
                </div>
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <label className="text-sm font-medium text-foreground block">Write your note</label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="shrink-0 gap-2"
                      disabled={translateButtonDisabled}
                      onClick={() => void runTranslate(language)}
                    >
                      {isTranslating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Globe2 className="w-4 h-4" />}
                      {language === "English" ? "Convert to English" : `Convert to ${language}`}
                    </Button>
                  </div>
                  <textarea
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    dir={languageAttrs.dir}
                    placeholder={`Write your will note (start in any language; use Convert to match ${language})...`}
                    rows={14}
                    disabled={isTranslating}
                    className="w-full rounded-xl border border-border bg-background text-foreground px-4 py-3 outline-none focus:ring-2 focus:ring-gold/40 resize-y disabled:opacity-60"
                  />
                  <p className="text-xs text-muted-foreground mt-2">{noteText.trim().length} characters</p>
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => setAssignMode("existing")}
                    className={`rounded-xl border p-4 text-left transition ${assignMode === "existing" ? "border-gold bg-gold/5" : "border-border bg-background"}`}
                  >
                    <Users className="w-5 h-5 mb-2 text-gold" />
                    <p className="font-medium text-foreground">Assign to Existing Recipient</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAssignMode("new")}
                    className={`rounded-xl border p-4 text-left transition ${assignMode === "new" ? "border-gold bg-gold/5" : "border-border bg-background"}`}
                  >
                    <UserPlus className="w-5 h-5 mb-2 text-gold" />
                    <p className="font-medium text-foreground">Create New Recipient</p>
                  </button>
                </div>

                {assignMode === "existing" ? (
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">Existing Recipient</label>
                    {loadingRecipients ? (
                      <div className="text-sm text-muted-foreground">Loading recipients...</div>
                    ) : existingRecipients.length === 0 ? (
                      <div className="text-sm text-muted-foreground">No recipients found. Choose "Create New Recipient".</div>
                    ) : (
                      <select
                        value={existingRecipientId}
                        onChange={(e) => setExistingRecipientId(e.target.value)}
                        title="Existing Recipient"
                        className="w-full rounded-xl border border-border bg-background text-foreground px-4 py-3 outline-none focus:ring-2 focus:ring-gold/40"
                      >
                        <option value="">Select recipient</option>
                        {existingRecipients.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.full_name} {r.email ? `- ${r.email}` : ""}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <label className="text-sm font-medium text-foreground mb-2 block">Recipient Name</label>
                      <input
                        value={newRecipientName}
                        onChange={(e) => setNewRecipientName(e.target.value)}
                        className="w-full rounded-xl border border-border bg-background text-foreground px-4 py-3 outline-none focus:ring-2 focus:ring-gold/40"
                        placeholder="Full name"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">Email (optional)</label>
                      <input
                        value={newRecipientEmail}
                        onChange={(e) => setNewRecipientEmail(e.target.value)}
                        className="w-full rounded-xl border border-border bg-background text-foreground px-4 py-3 outline-none focus:ring-2 focus:ring-gold/40"
                        placeholder="email@example.com"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">Relationship</label>
                      <input
                        value={newRecipientRelationship}
                        onChange={(e) => setNewRecipientRelationship(e.target.value)}
                        className="w-full rounded-xl border border-border bg-background text-foreground px-4 py-3 outline-none focus:ring-2 focus:ring-gold/40"
                        placeholder="beneficiary"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">Country</label>
                      <select
                        value={newRecipientCountry}
                        onChange={(e) => setNewRecipientCountry(e.target.value)}
                        title="Country"
                        className="w-full rounded-xl border border-border bg-background text-foreground px-4 py-3 outline-none focus:ring-2 focus:ring-gold/40"
                      >
                        {countryOptions.map((c) => (
                          <option key={c.code} value={c.code}>
                            {c.name} ({c.dialCode})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">Mobile</label>
                      <input
                        value={newRecipientPhone}
                        onChange={(e) => setNewRecipientPhone(e.target.value)}
                        className="w-full rounded-xl border border-border bg-background text-foreground px-4 py-3 outline-none focus:ring-2 focus:ring-gold/40"
                        placeholder="9876543210"
                      />
                    </div>
                  </div>
                )}
              </>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <div className="rounded-xl border border-border bg-background p-4">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Language</p>
                  <p className="text-foreground font-medium">{language}</p>
                </div>
                <div className="rounded-xl border border-border bg-background p-4">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Recipient</p>
                  <p className="text-foreground font-medium">{finalRecipient.name}</p>
                  <p className="text-sm text-muted-foreground">{finalRecipient.email}</p>
                  <p className="text-sm text-muted-foreground">{finalRecipient.phone}</p>
                </div>
                <div className="rounded-xl border border-border bg-background p-4">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Note Preview</p>
                  <pre className="whitespace-pre-wrap text-sm text-foreground">{noteText}</pre>
                </div>
              </div>
            )}

            <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
              <Button variant="outline" onClick={step === 1 ? () => navigate("/create") : handleBack} disabled={isSaving}>
                {step === 1 ? "Cancel" : "Back"}
              </Button>
              {step < 3 ? (
                <Button variant="gold" onClick={handleNext} className="gap-2" disabled={isSaving}>
                  Continue
                  <ArrowRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button variant="hero" onClick={handleFinalSave} disabled={isSaving} className="gap-2">
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Will
                </Button>
              )}
            </div>
          </motion.div>

          <p className="text-sm text-muted-foreground flex items-center gap-2 justify-center mt-5">
            <Shield className="w-4 h-4" />
            Your data is encrypted and secure
          </p>
        </div>
      </main>
    </div>
  );
};

export default CreateNoteWill;
