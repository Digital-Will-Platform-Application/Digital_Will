import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, Loader2, Plus, Save, Shield, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { sanitizeInput } from "@/lib/validation";
import { useTranslation } from "react-i18next";
import { getCountryOptions } from "@/lib/countries";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Step = 1 | 2 | 3 | 4;

type AssetRow = {
  id: string;
  category: string;
  details: string;
  estimatedValue: string;
  allocationPercent: string;
  assignedRecipientRef: string;
};

type RecipientRow = {
  id: string;
  name: string;
  email: string;
  countryCode: string;
  mobile: string;
  address: string;
};

type ExistingRecipient = {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
};

type AssetCategory = "jewelry" | "property" | "investment" | "vehicle" | "other";

const makeId = () => {
  if (typeof globalThis !== "undefined" && globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "Unknown error";
}

const CreateManualWill = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation();
  const [step, setStep] = useState<Step>(1);
  const [isSaving, setIsSaving] = useState(false);
  const countryOptions = useMemo(() => getCountryOptions(), []);
  const [existingRecipients, setExistingRecipients] = useState<ExistingRecipient[]>([]);

  // Step 1: Personal details
  const [fullName, setFullName] = useState("");
  const [gender, setGender] = useState("");
  const [age, setAge] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [maritalStatus, setMaritalStatus] = useState("");
  const [workStatus, setWorkStatus] = useState("");

  // Step 2: Assets + allocation
  const [assets, setAssets] = useState<AssetRow[]>([
    { id: makeId(), category: "", details: "", estimatedValue: "", allocationPercent: "", assignedRecipientRef: "" },
  ]);

  // Step 3: Recipients
  const [recipients, setRecipients] = useState<RecipientRow[]>([]);

  // Step 4 helper
  const title = t("dashboard.manualWill") || "Manual Will";

  useEffect(() => {
    const loadExistingRecipients = async () => {
      if (!user?.id || !user?.email) return;
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
          })),
        );
      } catch {
        setExistingRecipients([]);
      }
    };
    void loadExistingRecipients();
  }, [user?.id, user?.email]);

  const buildManualWillContent = () => {
    const lines: string[] = [];
    lines.push(`Manual Will - ${title}`);
    lines.push("");
    lines.push("Step 1 - Personal Details");
    lines.push(`${t("manualWillForm.transcriptFullNameKey") || "Full name (as on Aadhaar card)"}: ${sanitizeInput(fullName)}`);
    lines.push(`Gender: ${sanitizeInput(gender)}`);
    lines.push(`Age: ${sanitizeInput(age)}`);
    lines.push(`Date of Birth: ${sanitizeInput(dateOfBirth)}`);
    lines.push(`Marital Status: ${sanitizeInput(maritalStatus)}`);
    lines.push(`Current Status: ${sanitizeInput(workStatus)}`);
    lines.push("");
    lines.push("Step 2 - Assets and Allocation");
    assets.forEach((asset, index) => {
      const existing = existingRecipients.find((r) => `existing:${r.id}` === asset.assignedRecipientRef);
      const created = recipients.find((r) => `new:${r.id}` === asset.assignedRecipientRef);
      const assignedName = existing?.full_name || created?.name || "Unassigned";
      lines.push(
        `${index + 1}. ${sanitizeInput(asset.category)} | ${sanitizeInput(asset.details)} | Value: ${sanitizeInput(
          asset.estimatedValue,
        )} | Allocation: ${sanitizeInput(asset.allocationPercent)}% | Assigned to: ${sanitizeInput(assignedName)}`,
      );
    });
    lines.push("");
    lines.push("Step 3 - Recipients");
    recipients.forEach((recipient, index) => {
      const code = countryOptions.find((c) => c.code === recipient.countryCode)?.dialCode ?? "";
      lines.push(
        `${index + 1}. ${sanitizeInput(recipient.name)} | ${sanitizeInput(recipient.email)} | ${code} ${sanitizeInput(
          recipient.mobile,
        )} | Address: ${sanitizeInput(recipient.address) || "N/A"}`,
      );
    });
    return lines.join("\n");
  };

  const validateStep = (targetStep: Step) => {
    if (targetStep === 2) {
      if (!fullName.trim() || !gender || !age.trim() || !dateOfBirth || !maritalStatus || !workStatus) {
        toast.error("Please fill all Step 1 personal details.");
        return false;
      }
      return true;
    }
    if (targetStep === 3) {
      const hasInvalidAsset = assets.some(
        (a) => !a.category || !a.details.trim() || !a.estimatedValue.trim() || !a.allocationPercent.trim(),
      );
      if (hasInvalidAsset) {
        toast.error("Please complete all asset fields in Step 2.");
        return false;
      }
      return true;
    }
    if (targetStep === 4) {
      const hasInvalidRecipient = recipients.some(
        (r) => !r.name.trim() || !r.email.trim() || !r.mobile.trim() || !r.countryCode,
      );
      if (hasInvalidRecipient) {
        toast.error("Please complete recipient fields (name, email, country code, mobile) in Step 3.");
        return false;
      }
      const hasAssignment = assets.every((a) => Boolean(a.assignedRecipientRef));
      if (!hasAssignment) {
        toast.error("Please assign every asset to a recipient in Step 3.");
        return false;
      }
      return true;
    }
    return true;
  };

  const saveDraftForStep = async (currentStep: Step) => {
    if (!user?.email) {
      toast.error("Please sign in to continue.");
      return false;
    }

    const content = buildManualWillContent().trim();
    const safeContent = content.length > 0 ? content : "Manual form draft";

    const { backendApi } = await import("@/lib/backendApi");
    const result = await backendApi.saveWill({
      user_email: user.email,
      title: sanitizeInput(title),
      transcript: safeContent,
      content: safeContent,
      notes: `Manual form draft autosave - step ${currentStep}`,
      type: "manual",
    });

    if (!result.success) {
      throw new Error(result.message || "Failed to autosave manual will step");
    }

    return true;
  };

  const handleNext = async () => {
    const nextStep = Math.min(4, step + 1) as Step;
    if (!validateStep(nextStep)) return;
    setIsSaving(true);
    try {
      await saveDraftForStep(step);
      setStep(nextStep);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error) || "Could not save this step. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleBack = () => {
    const prev = Math.max(1, step - 1) as Step;
    setStep(prev);
  };

  const getRecipientForAssignment = (ref: string): { name: string; email: string | null; source: "existing" | "new" } | null => {
    if (!ref) return null;
    if (ref.startsWith("existing:")) {
      const id = ref.slice("existing:".length);
      const r = existingRecipients.find((x) => x.id === id);
      return r ? { name: r.full_name, email: r.email, source: "existing" } : null;
    }
    if (ref.startsWith("new:")) {
      const id = ref.slice("new:".length);
      const r = recipients.find((x) => x.id === id);
      return r ? { name: r.name, email: r.email || null, source: "new" } : null;
    }
    return null;
  };

  const handleFinalSave = async () => {
    if (!user?.email) {
      toast.error("Please sign in to continue.");
      return;
    }

    const cleanedContent = buildManualWillContent().trim();
    if (cleanedContent.length < 30) {
      toast.error("Please add more details in the form (at least 30 characters).");
      return;
    }

    setIsSaving(true);
    try {
      // 1) Save the will content (same as other flows)
      const { backendApi } = await import("@/lib/backendApi");
      const result = await backendApi.saveWill({
        user_email: user.email,
        title: sanitizeInput(title),
        transcript: cleanedContent,
        content: cleanedContent,
        notes: "Manual 4-step form submission",
        type: "manual",
      });

      if (!result.success) {
        throw new Error(result.message || "Failed to save manual will");
      }

      // 2) Create newly added recipients in app DB
      const newRecipientMap = new Map<string, string>();
      if (recipients.length > 0) {
        for (const r of recipients) {
          const dial = countryOptions.find((c) => c.code === r.countryCode)?.dialCode ?? "";
          const phone = `${dial}${r.mobile}`.replace(/\s+/g, "");
          const created = await backendApi.addRecipient({
            user_email: user.email,
            full_name: sanitizeInput(r.name).trim(),
            email: sanitizeInput(r.email).trim() || null,
            phone: phone || null,
            relationship: "beneficiary",
          });
          const createdId = (created as any)?.data?.id ?? (created as any)?.data?.data?.id ?? (created as any)?.data?.recipient?.id;
          if (createdId != null) newRecipientMap.set(r.id, String(createdId));
        }
      }

      // 3) Save assets (allocations are embedded in the will text; Neon schema doesn't have asset_allocations)
      for (const asset of assets) {
        const categoryMap: Record<string, AssetCategory> = {
          Gold: "jewelry",
          Property: "property",
          Shares: "investment",
          Building: "property",
          Land: "property",
          Car: "vehicle",
          Other: "other",
        };
        const category: AssetCategory = categoryMap[asset.category] ?? "other";
        const assigned = getRecipientForAssignment(asset.assignedRecipientRef);
        const allocPct = Number(asset.allocationPercent) || 100;
        const assignedLine = assigned ? `Assigned to: ${assigned.name} (${assigned.source}) | Allocation: ${allocPct}%` : "Unassigned";

        let recipientId: string | null = null;
        if (asset.assignedRecipientRef.startsWith("existing:")) {
          recipientId = asset.assignedRecipientRef.replace("existing:", "");
        } else if (asset.assignedRecipientRef.startsWith("new:")) {
          recipientId = newRecipientMap.get(asset.assignedRecipientRef.replace("new:", "")) ?? null;
        }
        // recipientId is stored in description for traceability; DB doesn't enforce relation.
        const desc = [sanitizeInput(asset.details).trim() || null, assignedLine, recipientId ? `Recipient ID: ${recipientId}` : null]
          .filter(Boolean)
          .join(" | ");
        await backendApi.addAsset({
          user_email: user.email,
          name: `${asset.category} - ${sanitizeInput(asset.details).trim().slice(0, 80)}`,
          category,
          estimated_value: Number(asset.estimatedValue) || null,
          description: desc || undefined,
        });
      }

      toast.success("Manual will saved successfully");
      navigate("/confirmation");
    } catch (error: unknown) {
      console.error("Error saving manual will:", error);
      toast.error(getErrorMessage(error) || "Failed to save manual will");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen page-ambient bg-background">
      <main className="p-6 pb-12">
        <div className="app-shell max-w-4xl">
          <Link to="/create" className="mb-6 inline-flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Back to Method Selection
          </Link>

          <div className="mb-8 flex items-center gap-2">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`progress-step ${s === step ? "progress-step-active" : s < step ? "progress-step-completed" : "progress-step-pending"}`}>
                  {s < step ? <Check className="h-4 w-4" /> : s}
                </div>
                {step < 4 && <div className="h-0.5 w-8 bg-border" />}
              </div>
            ))}
          </div>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-6 text-center">
            <h1 className="heading-section mb-2 text-foreground">{t("dashboard.fillForm")}</h1>
            <p className="text-muted-foreground">
              {step === 1 && "Step 1: Personal details"}
              {step === 2 && "Step 2: Assets and allocation"}
              {step === 3 && "Step 3: Recipients details"}
              {step === 4 && "Step 4: Review summary and save"}
            </p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="card-elevated mb-8 space-y-5">
            {step === 1 && (
              <>
                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground">
                    {t("manualWillForm.fullNameLabel") || "Full name"}
                  </label>
                  <p className="mb-2 text-xs text-muted-foreground">
                    {t("manualWillForm.fullNameHint") || "Enter your name exactly as it appears on your Aadhaar card."}
                  </p>
                  <input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder={t("manualWillForm.fullNamePlaceholder") || "Enter your name as per Aadhaar card"}
                    className="input-elevated w-full"
                  />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-foreground">Gender</label>
                    <Select value={gender} onValueChange={setGender}>
                      <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-foreground">Age</label>
                    <input
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      type="number"
                      min={1}
                      max={120}
                      placeholder="e.g. 35"
                      title="Age"
                      className="input-elevated w-full"
                    />
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-foreground">Date of Birth</label>
                    <input
                      value={dateOfBirth}
                      onChange={(e) => setDateOfBirth(e.target.value)}
                      type="date"
                      title="Date of Birth"
                      className="input-elevated w-full"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-foreground">Marriage Status</label>
                    <Select value={maritalStatus} onValueChange={setMaritalStatus}>
                      <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Single">Single</SelectItem>
                        <SelectItem value="Married">Married</SelectItem>
                        <SelectItem value="Divorced">Divorced</SelectItem>
                        <SelectItem value="Widowed">Widowed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground">Current Status</label>
                  <Select value={workStatus} onValueChange={setWorkStatus}>
                    <SelectTrigger><SelectValue placeholder="Retired or Working" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Working">Working</SelectItem>
                      <SelectItem value="Retired">Retired</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {step === 2 && (
              <>
                {assets.map((asset, idx) => (
                  <div key={asset.id} className="rounded-xl border border-border/60 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-foreground">Asset {idx + 1}</p>
                      {assets.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setAssets((prev) => prev.filter((a) => a.id !== asset.id))}
                          aria-label={`Remove asset ${idx + 1}`}
                          title={`Remove asset ${idx + 1}`}
                          className="rounded-md p-1 text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">{`Remove asset ${idx + 1}`}</span>
                        </button>
                      )}
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-foreground">Asset Type</label>
                      <Select
                        value={asset.category}
                        onValueChange={(value) =>
                          setAssets((prev) => prev.map((a) => (a.id === asset.id ? { ...a, category: value } : a)))
                        }
                      >
                        <SelectTrigger><SelectValue placeholder="Select asset type" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Gold">Gold</SelectItem>
                          <SelectItem value="Property">Property</SelectItem>
                          <SelectItem value="Shares">Shares</SelectItem>
                          <SelectItem value="Building">Building</SelectItem>
                          <SelectItem value="Land">Land</SelectItem>
                          <SelectItem value="Car">Car</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-foreground">Asset Details</label>
                      <input
                        value={asset.details}
                        onChange={(e) =>
                          setAssets((prev) => prev.map((a) => (a.id === asset.id ? { ...a, details: e.target.value } : a)))
                        }
                        placeholder="Describe this asset"
                        className="input-elevated w-full"
                      />
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-sm font-medium text-foreground">Estimated Value</label>
                        <input
                          value={asset.estimatedValue}
                          onChange={(e) =>
                            setAssets((prev) =>
                              prev.map((a) => (a.id === asset.id ? { ...a, estimatedValue: e.target.value } : a)),
                            )
                          }
                          placeholder="e.g. 1500000"
                          className="input-elevated w-full"
                        />
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-medium text-foreground">Allocation (%)</label>
                        <input
                          value={asset.allocationPercent}
                          onChange={(e) =>
                            setAssets((prev) =>
                              prev.map((a) => (a.id === asset.id ? { ...a, allocationPercent: e.target.value } : a)),
                            )
                          }
                          placeholder="e.g. 40"
                          className="input-elevated w-full"
                        />
                      </div>
                    </div>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  className="gap-2"
                  onClick={() =>
                    setAssets((prev) => [
                      ...prev,
                      { id: makeId(), category: "", details: "", estimatedValue: "", allocationPercent: "", assignedRecipientRef: "" },
                    ])
                  }
                >
                  <Plus className="h-4 w-4" />
                  Add Asset
                </Button>
              </>
            )}

            {step === 3 && (
              <>
                {existingRecipients.length > 0 && (
                  <div className="rounded-xl border border-border/60 p-4">
                    <h3 className="font-semibold text-foreground mb-2">Existing Recipients</h3>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      {existingRecipients.map((r) => (
                        <p key={r.id}>{r.full_name} {r.email ? `(${r.email})` : ""}</p>
                      ))}
                    </div>
                  </div>
                )}

                {recipients.map((recipient, idx) => (
                  <div key={recipient.id} className="rounded-xl border border-border/60 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-foreground">Recipient {idx + 1}</p>
                      {recipients.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setRecipients((prev) => prev.filter((r) => r.id !== recipient.id))}
                          aria-label={`Remove recipient ${idx + 1}`}
                          title={`Remove recipient ${idx + 1}`}
                          className="rounded-md p-1 text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">{`Remove recipient ${idx + 1}`}</span>
                        </button>
                      )}
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-foreground">
                        {t("manualWillForm.recipientFullNameLabel") || "Full name of recipient"}
                      </label>
                      <p className="mb-2 text-xs text-muted-foreground">
                        {t("manualWillForm.recipientFullNameHint") ||
                          "Enter the full name as on their Aadhaar or official ID, if applicable."}
                      </p>
                      <input
                        value={recipient.name}
                        onChange={(e) =>
                          setRecipients((prev) => prev.map((r) => (r.id === recipient.id ? { ...r, name: e.target.value } : r)))
                        }
                        placeholder={
                          t("manualWillForm.recipientFullNamePlaceholder") || "Enter full name as per Aadhaar / official ID"
                        }
                        className="input-elevated w-full"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-foreground">Email of Recipient</label>
                      <input
                        value={recipient.email}
                        onChange={(e) =>
                          setRecipients((prev) => prev.map((r) => (r.id === recipient.id ? { ...r, email: e.target.value } : r)))
                        }
                        type="email"
                        placeholder="name@example.com"
                        title="Recipient email"
                        className="input-elevated w-full"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-foreground">Mobile Number</label>
                      <div className="grid gap-3 md:grid-cols-[180px_1fr]">
                        <Select
                          value={recipient.countryCode}
                          onValueChange={(value) =>
                            setRecipients((prev) =>
                              prev.map((r) => (r.id === recipient.id ? { ...r, countryCode: value } : r)),
                            )
                          }
                        >
                          <SelectTrigger><SelectValue placeholder="Country code" /></SelectTrigger>
                          <SelectContent className="max-h-64">
                            {countryOptions.map((country) => (
                              <SelectItem key={country.code} value={country.code}>
                                {country.flag} {country.dialCode} ({country.code})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <input
                          value={recipient.mobile}
                          onChange={(e) =>
                            setRecipients((prev) =>
                              prev.map((r) => (r.id === recipient.id ? { ...r, mobile: e.target.value } : r)),
                            )
                          }
                          placeholder="Mobile number"
                          title="Recipient mobile number"
                          className="input-elevated w-full"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-foreground">Address (Optional)</label>
                      <textarea
                        value={recipient.address}
                        onChange={(e) =>
                          setRecipients((prev) => prev.map((r) => (r.id === recipient.id ? { ...r, address: e.target.value } : r)))
                        }
                        rows={3}
                        placeholder="Street, city, state (optional)"
                        title="Recipient address (optional)"
                        className="input-elevated w-full resize-y"
                      />
                    </div>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  className="gap-2"
                  onClick={() =>
                    setRecipients((prev) => [
                      ...prev,
                      { id: makeId(), name: "", email: "", countryCode: "IN", mobile: "", address: "" },
                    ])
                  }
                >
                  <Plus className="h-4 w-4" />
                  Add Recipient
                </Button>

                <div className="rounded-xl border border-border/60 p-4 space-y-3">
                  <h3 className="font-semibold text-foreground">Assign Assets to Recipients</h3>
                  {assets.map((asset) => (
                    <div key={`assign-${asset.id}`} className="grid gap-2 md:grid-cols-[1.2fr_1fr] md:items-center">
                      <p className="text-sm text-muted-foreground">{asset.category || "Asset"} - {asset.details || "Details"}</p>
                      <Select
                        value={asset.assignedRecipientRef}
                        onValueChange={(value) =>
                          setAssets((prev) =>
                            prev.map((a) => (a.id === asset.id ? { ...a, assignedRecipientRef: value } : a)),
                          )
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Assign recipient" />
                        </SelectTrigger>
                        <SelectContent>
                          {existingRecipients.map((r) => (
                            <SelectItem key={`existing-${r.id}`} value={`existing:${r.id}`}>
                              {r.full_name} (Existing)
                            </SelectItem>
                          ))}
                          {recipients.map((r) => (
                            <SelectItem key={`new-${r.id}`} value={`new:${r.id}`}>
                              {r.name || "New Recipient"} (New)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
              </>
            )}

            {step === 4 && (
              <div className="space-y-5">
                <div className="rounded-xl border border-border/60 p-4">
                  <h3 className="font-semibold text-foreground mb-2">Step 1: Personal Details</h3>
                  <p className="text-sm text-muted-foreground">
                    {t("manualWillForm.summaryFullNameLabel") || "Full name (as on Aadhaar card)"}: {fullName}
                  </p>
                  <p className="text-sm text-muted-foreground">Gender: {gender}</p>
                  <p className="text-sm text-muted-foreground">Age: {age}</p>
                  <p className="text-sm text-muted-foreground">DOB: {dateOfBirth}</p>
                  <p className="text-sm text-muted-foreground">Marriage Status: {maritalStatus}</p>
                  <p className="text-sm text-muted-foreground">Status: {workStatus}</p>
                </div>
                <div className="rounded-xl border border-border/60 p-4">
                  <h3 className="font-semibold text-foreground mb-2">Step 2: Assets, allocation & assignments</h3>
                  <p className="mb-3 text-xs text-muted-foreground">
                    Each row shows which recipient receives that asset (same as Step 3).
                  </p>
                  <div className="space-y-3">
                    {assets.map((asset, idx) => {
                      const assigned = getRecipientForAssignment(asset.assignedRecipientRef);
                      return (
                        <div key={asset.id} className="rounded-lg border border-border/50 bg-muted/25 p-3">
                          <p className="text-sm font-medium text-foreground">
                            Asset {idx + 1}: {asset.category || "—"}
                          </p>
                          <p className="mt-1 text-sm text-muted-foreground">{asset.details || "—"}</p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            Estimated value: {asset.estimatedValue || "—"} · Allocation: {asset.allocationPercent || "—"}%
                          </p>
                          <div className="mt-3 rounded-md border border-primary/25 bg-primary/5 px-3 py-2">
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                              Assigned recipient
                            </p>
                            {assigned ? (
                              <>
                                <p className="text-sm font-semibold text-foreground">
                                  {assigned.name}
                                  <span className="ml-2 text-xs font-normal text-muted-foreground">
                                    ({assigned.source === "existing" ? "Existing recipient" : "New recipient (this form)"})
                                  </span>
                                </p>
                                {assigned.email ? <p className="text-xs text-muted-foreground">{assigned.email}</p> : null}
                              </>
                            ) : (
                              <p className="text-sm text-amber-600 dark:text-amber-500">Not assigned — go back to Step 3.</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="rounded-xl border border-border/60 p-4">
                  <h3 className="font-semibold text-foreground mb-2">Step 3: Recipients</h3>
                  {recipients.map((recipient, idx) => (
                    <p key={recipient.id} className="text-sm text-muted-foreground">
                      {idx + 1}. {recipient.name} | {recipient.email} |{" "}
                      {(countryOptions.find((c) => c.code === recipient.countryCode)?.dialCode ?? "") + " " + recipient.mobile}
                      {recipient.address ? ` | ${recipient.address}` : ""}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </motion.div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }} className="flex items-center justify-between">
            {step === 1 ? (
              <Link to="/create">
                <Button variant="ghost" className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
              </Link>
            ) : (
              <Button variant="ghost" className="gap-2" onClick={handleBack}>
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            )}
            <div className="flex items-center gap-4">
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <Shield className="h-4 w-4" />
                Encrypted
              </p>
              {step < 4 ? (
                <Button variant="gold" className="gap-2" onClick={handleNext} disabled={isSaving}>
                  Save & Next
                  <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button variant="gold" className="gap-2" onClick={handleFinalSave} disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Save Manual Will
                    </>
                  )}
                </Button>
              )}
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default CreateManualWill;
