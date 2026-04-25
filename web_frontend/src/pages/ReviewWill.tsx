import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Check,
  Shield,
  FileText,
  FolderOpen,
  Users,
  Mic,
  Lock,
  CheckCircle,
  AlertCircle,
  Loader2,
  ChevronDown,
  ChevronUp,
  Video,
  FilePenLine,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Will {
  id: string;
  title: string;
  type: "audio" | "video" | "text" | "chat" | "manual";
  status: string;
  content: string | null;
  audio_url: string | null;
  video_url: string | null;
  transcript: string | null;
  created_at: string;
  updated_at: string;
}

interface Asset {
  id: string;
  name: string;
  category: string;
  estimated_value: number | null;
  description: string | null;
  documents_url: string | null;
}

interface Recipient {
  id: string;
  full_name: string;
  email: string | null;
  relationship: string | null;
  is_verified: boolean;
}

interface Allocation {
  id: string;
  asset_id: string;
  recipient_id: string;
  allocation_percentage: number;
}

const ReviewWill = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [agreed, setAgreed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const [will, setWill] = useState<Will | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [allocations, setAllocations] = useState<Allocation[]>([]);

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    will: true,
    assets: true,
    recipients: true,
  });

  const getAuthHeaders = () => {
    try {
      const raw = localStorage.getItem("legacywallet_auth");
      const parsed = raw ? JSON.parse(raw) : null;
      const token = parsed?.session?.access_token;
      if (token) {
        return { Authorization: `Bearer ${token}` };
      }
    } catch {
      // no-op
    }
    return {};
  };

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      if (!user) return;
      const base = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";
      const userIdNum = Number(user.id);
      const useUserId = Number.isFinite(userIdNum) && userIdNum > 0;

      const willUrl = useUserId
        ? `${base}/api/wills/user/${userIdNum}`
        : `${base}/api/wills/user-email/${encodeURIComponent(user.email)}`;
      const assetsUrl = useUserId
        ? `${base}/api/assets/user/${userIdNum}`
        : `${base}/api/assets/user-email/${encodeURIComponent(user.email)}`;
      const recipientsUrl = useUserId
        ? `${base}/api/recipients/user/${userIdNum}`
        : `${base}/api/recipients/user-email/${encodeURIComponent(user.email)}`;

      const [willRes, assetsRes, recipientsRes] = await Promise.all([
        fetch(willUrl, { headers: { ...getAuthHeaders() } }),
        fetch(assetsUrl, { headers: { ...getAuthHeaders() } }),
        fetch(recipientsUrl, { headers: { ...getAuthHeaders() } }),
      ]);

      const willJson = await willRes.json();
      const assetsJson = await assetsRes.json();
      const recipientsJson = await recipientsRes.json();

      if (!willRes.ok || !willJson?.success) {
        throw new Error(willJson?.message || "Failed to load will");
      }
      if (!assetsRes.ok || !assetsJson?.success) {
        throw new Error(assetsJson?.message || "Failed to load assets");
      }
      if (!recipientsRes.ok || !recipientsJson?.success) {
        throw new Error(recipientsJson?.message || "Failed to load recipients");
      }

      setWill((willJson?.data ?? null) as Will | null);
      setAssets((assetsJson?.data ?? []) as Asset[]);
      setRecipients((recipientsJson?.data ?? []) as Recipient[]);
      // Asset allocation API is not yet migrated to backend for web review.
      setAllocations([]);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load will data");
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const getWillIcon = () => {
    if (!will) return Mic;
    switch (will.type) {
      case "video":
        return Video;
      case "manual":
      case "text":
      case "chat":
        return FilePenLine;
      default:
        return Mic;
    }
  };

  const getWillTypeLabel = () => {
    if (!will) return "Not created";
    switch (will.type) {
      case "video":
        return "Video Recording";
      case "chat":
        return t("dashboard.textWill") || "Text Will";
      case "text":
      case "manual":
        return t("dashboard.manualWill") || "Manual Form Will";
      default:
        return "Audio Recording";
    }
  };

  // Display exactly what user entered (no conversion)
  const formatCurrency = (value: number | null) => {
    if (!value) return "—";
    return `₹${value.toLocaleString("en-IN", { maximumFractionDigits: 0, minimumFractionDigits: 0 })}`;
  };

  const getTotalValue = () => {
    return assets.reduce((sum, a) => sum + (a.estimated_value || 0), 0);
  };

  const getRecipientName = (recipientId: string) => {
    return recipients.find((r) => r.id === recipientId)?.full_name || "Unknown";
  };

  const getAssetAllocations = (assetId: string) => {
    return allocations.filter((a) => a.asset_id === assetId);
  };

  const sections = [
    {
      key: "will",
      icon: getWillIcon(),
      title: getWillTypeLabel(),
      status: will ? "complete" : "pending",
      details: will ? `Last updated ${new Date(will.updated_at).toLocaleDateString()}` : "No will created yet",
    },
    {
      key: "assets",
      icon: FolderOpen,
      title: "Assets",
      status: assets.length > 0 ? "complete" : "pending",
      details: `${assets.length} asset${assets.length !== 1 ? "s" : ""} • ${formatCurrency(getTotalValue())} total`,
    },
    {
      key: "recipients",
      icon: Users,
      title: "Recipients",
      status: recipients.length > 0 ? "complete" : "pending",
      details: `${recipients.length} recipient${recipients.length !== 1 ? "s" : ""} • ${recipients.filter((r) => r.is_verified).length} verified`,
    },
  ];

  const handleSubmit = async () => {
    if (!will || !user) {
      toast.error("Please create a will before finalizing");
      return;
    }

    setIsSubmitting(true);
    try {
      // Use backend API to finalize will
      const { backendApi } = await import("@/lib/backendApi");
      
      // Finalize will - backend will find the most recent will for this user
      // We don't need to pass will_id since backend will get the latest one
      // But if we have will.id, we can try to pass it (backend will handle UUID to integer conversion)
      const finalizeResult = await backendApi.finalizeWill({
        user_email: user.email, // Backend will auto-create user if needed
        will_id: will?.id ? parseInt(will.id) || undefined : undefined, // Try to convert UUID to int, or let backend find it
        recipients: recipients.map(r => ({
          email: r.email || '',
          name: r.full_name,
          full_name: r.full_name
        })).filter(r => r.email)
      });

      if (!finalizeResult.success) {
        throw new Error(finalizeResult.message || "Failed to finalize will");
      }

      // Send email notifications to recipients
      try {
        // Use the will ID from the finalize result (backend integer ID)
        const willIdForNotification = finalizeResult.data?.id;
        
        if (willIdForNotification && recipients.length > 0) {
          const notifyResult = await backendApi.sendWillNotifications({
            user_email: user.email,
            will_id: willIdForNotification,
            recipients: recipients.map(r => ({
              email: r.email || '',
              name: r.full_name,
              full_name: r.full_name
            })).filter(r => r.email)
          });

          if (notifyResult.success && notifyResult.data) {
            if (notifyResult.data.sent > 0) {
              toast.success(`Will finalized! Notifications sent to ${notifyResult.data.sent} recipient(s)`);
            } else if (notifyResult.data.total === 0) {
              toast.success("Will finalized! No recipients with email addresses found");
            } else {
              toast.warning("Will finalized, but email notifications failed to send");
            }
          }
        } else if (recipients.length === 0) {
          toast.success("Will finalized successfully!");
        }
      } catch (notifyErr: any) {
        console.error("Error sending notifications:", notifyErr);
        // Don't block navigation if email sending fails
        toast.warning("Will finalized, but email notifications could not be sent");
      }

      navigate("/confirmation");
    } catch (error: any) {
      console.error("Error finalizing will:", error);
      toast.error(error.message || "Failed to finalize will");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="ui-full-page-loader">
        <div className="ui-loader-ring">
          <span className="ui-loader-ring-border" />
          <span className="ui-loader-ring-core" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen page-ambient bg-background">
      <main className="p-6 pb-12">
        <div className="app-shell max-w-4xl">
          {/* Back Button */}
          <Link to="/recipients" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6">
            <ArrowLeft className="w-4 h-4" />
            Back to Recipients
          </Link>

          {/* Progress Indicator */}
          <div className="flex items-center gap-2 mb-8">
            {[1, 2, 3, 4].map((step) => (
              <div key={step} className="flex items-center gap-2">
                <div className="progress-step progress-step-completed">
                  <Check className="w-4 h-4" />
                </div>
                {step < 4 && <div className="w-8 h-0.5 bg-gold" />}
              </div>
            ))}
          </div>

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gold to-gold-light flex items-center justify-center mx-auto mb-4 shadow-gold">
              <FileText className="w-8 h-8 text-primary" />
            </div>
            <h1 className="heading-section text-foreground mb-2">Review Your Will</h1>
            <p className="text-muted-foreground">Please review all sections before finalizing your digital will.</p>
          </motion.div>

          {/* Summary Cards with Expandable Details */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-4 mb-8"
          >
            {sections.map((section) => (
              <div key={section.key} className="card-elevated overflow-hidden">
                <button
                  onClick={() => toggleSection(section.key)}
                  className="w-full flex items-center gap-4 text-left"
                >
                  <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center">
                    <section.icon className="w-6 h-6 text-foreground" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">{section.title}</h3>
                    <p className="text-sm text-muted-foreground">{section.details}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {section.status === "complete" ? (
                      <span className="flex items-center gap-1 text-sm text-sage-dark font-medium">
                        <CheckCircle className="w-4 h-4" />
                        Complete
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-sm text-gold font-medium">
                        <AlertCircle className="w-4 h-4" />
                        Pending
                      </span>
                    )}
                    {expandedSections[section.key] ? (
                      <ChevronUp className="w-5 h-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                </button>

                {/* Expanded Content */}
                {expandedSections[section.key] && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    className="mt-4 pt-4 border-t border-border"
                  >
                    {section.key === "will" && will && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Title:</span>
                          <span className="text-foreground font-medium">{will.title}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Type:</span>
                          <span className="text-foreground capitalize">{will.type}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Status:</span>
                          <span className="text-foreground capitalize">{will.status}</span>
                        </div>
                        {will.transcript && (
                          <div className="mt-3">
                            <p className="text-sm text-muted-foreground mb-1">Transcript preview:</p>
                            <p className="text-sm text-foreground bg-secondary/50 p-3 rounded-lg line-clamp-3">
                              {will.transcript}
                            </p>
                          </div>
                        )}
                        {will.content && (
                          <div className="mt-3">
                            <p className="text-sm text-muted-foreground mb-1">Content preview:</p>
                            <p className="text-sm text-foreground bg-secondary/50 p-3 rounded-lg line-clamp-3">
                              {will.content}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                    {section.key === "will" && !will && (
                      <div className="text-center py-4">
                        <p className="text-muted-foreground mb-3">No will has been created yet.</p>
                        <Link to="/create">
                          <Button variant="outline" size="sm">
                            Create Your Will
                          </Button>
                        </Link>
                      </div>
                    )}

                    {section.key === "assets" && assets.length > 0 && (
                      <div className="table-responsive overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Asset</TableHead>
                              <TableHead>Category</TableHead>
                              <TableHead className="text-right">Value</TableHead>
                              <TableHead>Recipients</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {assets.map((asset) => {
                              const assetAllocations = getAssetAllocations(asset.id);
                              return (
                                <TableRow key={asset.id}>
                                  <TableCell className="font-medium">{asset.name}</TableCell>
                                  <TableCell className="capitalize">{asset.category.replace("_", " ")}</TableCell>
                                  <TableCell className="text-right">{formatCurrency(asset.estimated_value)}</TableCell>
                                  <TableCell>
                                    {assetAllocations.length > 0 ? (
                                      <div className="flex flex-wrap gap-1">
                                        {assetAllocations.map((a) => (
                                          <span key={a.id} className="px-2 py-0.5 rounded-full bg-secondary text-xs">
                                            {getRecipientName(a.recipient_id)}
                                          </span>
                                        ))}
                                      </div>
                                    ) : (
                                      <span className="text-muted-foreground text-sm">Not assigned</span>
                                    )}
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                    {section.key === "assets" && assets.length === 0 && (
                      <div className="text-center py-4">
                        <p className="text-muted-foreground mb-3">No assets have been added yet.</p>
                        <Link to="/assets">
                          <Button variant="outline" size="sm">
                            Add Assets
                          </Button>
                        </Link>
                      </div>
                    )}

                    {section.key === "recipients" && recipients.length > 0 && (
                      <div className="table-responsive overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Name</TableHead>
                              <TableHead>Relationship</TableHead>
                              <TableHead>Email</TableHead>
                              <TableHead>Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {recipients.map((recipient) => (
                              <TableRow key={recipient.id}>
                                <TableCell className="font-medium">{recipient.full_name}</TableCell>
                                <TableCell className="capitalize">{recipient.relationship || "—"}</TableCell>
                                <TableCell>{recipient.email || "—"}</TableCell>
                                <TableCell>
                                  {recipient.is_verified ? (
                                    <span className="inline-flex items-center gap-1 text-sage-dark text-sm">
                                      <CheckCircle className="w-3 h-3" />
                                      Verified
                                    </span>
                                  ) : (
                                    <span className="text-muted-foreground text-sm">Pending</span>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                    {section.key === "recipients" && recipients.length === 0 && (
                      <div className="text-center py-4">
                        <p className="text-muted-foreground mb-3">No recipients have been added yet.</p>
                        <Link to="/recipients">
                          <Button variant="outline" size="sm">
                            Add Recipients
                          </Button>
                        </Link>
                      </div>
                    )}
                  </motion.div>
                )}
              </div>
            ))}
          </motion.div>

          {/* Security Notice */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="card-elevated bg-sage/30 border-sage mb-8"
          >
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
                <Lock className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">Your Data is Secure</h3>
                <p className="text-sm text-muted-foreground">
                  All your recordings, documents, and personal information are encrypted with bank-level 256-bit encryption.
                  Recipients will receive a verification/access email after you finalize and secure this will.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Agreement */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-8"
          >
            <label className="flex items-start gap-3 cursor-pointer">
              <div className="relative mt-1">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="sr-only"
                />
                <div className={`w-5 h-5 rounded border-2 transition-all ${
                  agreed
                    ? "bg-gold border-gold"
                    : "border-border"
                }`}>
                  {agreed && <Check className="w-4 h-4 text-primary absolute top-0.5 left-0.5" />}
                </div>
              </div>
              <span className="text-sm text-muted-foreground">
                I confirm that all the information provided is accurate and represents my true wishes.
                I understand that this digital will can be updated at any time and that recipients will
                only receive access under the conditions I have specified.
              </span>
            </label>
          </motion.div>

          {/* Actions */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="flex flex-col items-center gap-4"
          >
            <Button
              variant="hero"
              size="xl"
              onClick={handleSubmit}
              disabled={!agreed || isSubmitting || !will}
              className="gap-2 w-full sm:w-auto"
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  Securing Your Will...
                </>
              ) : (
                <>
                  <Shield className="w-5 h-5" />
                  Finalize & Secure Will
                </>
              )}
            </Button>
            <p className="text-sm text-muted-foreground text-center">
              You can make changes to your will at any time after submission
            </p>
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default ReviewWill;
