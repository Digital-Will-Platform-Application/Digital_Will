import { useState, useEffect } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Plus,
  Home,
  Car,
  Wallet,
  Smartphone,
  Package,
  Trash2,
  Check,
  Users,
  X,
  Loader2,
  Building,
  Gem,
  Briefcase,
  FileText,
  UserPlus,
  Upload,
  Download,
  File,
  Mail,
  Phone,
  Edit2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { backendApi } from "@/lib/backendApi";
import { toast } from "sonner";
import { validateAssetName, validateDescription, validateNumericValue, validateName, validateEmail, validatePhone, validateRelationship } from "@/lib/validation";
import { validateDocumentFile } from "@/lib/fileValidation";
import { useTranslation } from "react-i18next";

type AssetCategory = "property" | "investment" | "bank_account" | "vehicle" | "jewelry" | "digital_asset" | "insurance" | "business" | "other";

interface Recipient {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  relationship: string | null;
  is_verified: boolean;
}

interface Allocation {
  id: string;
  asset_id: string;
  recipient_id: string;
  allocation_percentage: number;
  recipient?: Recipient;
}

interface Asset {
  id: string;
  name: string;
  category: AssetCategory;
  estimated_value: number | null;
  description: string | null;
  location: string | null;
  documents_url: string | null;
  allocations?: Allocation[];
}

const AssetManagement = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const isFlowMode = searchParams.get('flow') === 'true';
  
  const [assets, setAssets] = useState<Asset[]>([]);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAllocationModal, setShowAllocationModal] = useState(false);
  const [showRecipientsModal, setShowRecipientsModal] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [allocations, setAllocations] = useState<{ recipientId: string }[]>([]);
  const [uploadingAssetId, setUploadingAssetId] = useState<string | null>(null);
  const [editingRecipient, setEditingRecipient] = useState<Recipient | null>(null);
  const [newRecipient, setNewRecipient] = useState({
    full_name: "",
    email: "",
    phone: "",
    relationship: "",
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
  const [newAsset, setNewAsset] = useState({
    name: "",
    category: "property" as AssetCategory,
    estimated_value: "",
    description: "",
  });

  const categories = [
    { id: "property", icon: Home, label: "Property" },
    { id: "vehicle", icon: Car, label: "Vehicle" },
    { id: "bank_account", icon: Wallet, label: "Bank" },
    { id: "investment", icon: Building, label: "Investment" },
    { id: "jewelry", icon: Gem, label: "Jewelry" },
    { id: "digital_asset", icon: Smartphone, label: "Digital" },
    { id: "insurance", icon: FileText, label: "Insurance" },
    { id: "business", icon: Briefcase, label: "Business" },
    { id: "other", icon: Package, label: "Other" },
  ];

  useEffect(() => {
    if (!user?.email) {
      setLoading(false);
      return;
    }
    setLoading(true);
    void fetchData();
  }, [user?.id, user?.email]);

  const fetchData = async () => {
    if (!user?.email) {
      setLoading(false);
      return;
    }
    try {
      const base = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";
      const userIdNum = Number(user.id);
      const useUserId = Number.isFinite(userIdNum) && userIdNum > 0;

      const assetsUrl = useUserId
        ? `${base}/api/assets/user/${userIdNum}`
        : `${base}/api/assets/user-email/${encodeURIComponent(user.email)}`;
      const recipientsUrl = useUserId
        ? `${base}/api/recipients/user/${userIdNum}`
        : `${base}/api/recipients/user-email/${encodeURIComponent(user.email)}`;

      const [assetsRes, recipientsRes] = await Promise.all([
        fetch(assetsUrl, { headers: { ...getAuthHeaders() } }),
        fetch(recipientsUrl, { headers: { ...getAuthHeaders() } }),
      ]);

      const assetsJson = await assetsRes.json();
      const recipientsJson = await recipientsRes.json();

      const assetsOk = assetsRes.ok && assetsJson?.success;
      const recipientsOk = recipientsRes.ok && recipientsJson?.success;

      if (!assetsOk) {
        console.error("Failed to load assets:", assetsJson?.message || assetsRes.status);
      }
      if (!recipientsOk) {
        console.error("Failed to load recipients:", recipientsJson?.message || recipientsRes.status);
      }

      const rawRecipients = recipientsOk && Array.isArray(recipientsJson.data) ? recipientsJson.data : [];
      const recipientRows: Recipient[] = rawRecipients.map((r: Record<string, unknown>) => ({
        id: String(r.id),
        full_name: String(r.full_name ?? ""),
        email: (r.email as string) ?? null,
        phone: (r.phone as string) ?? null,
        relationship: (r.relationship as string) ?? null,
        is_verified: Boolean(r.is_verified),
      }));

      if (!assetsOk) {
        setAssets([]);
      } else {
        const rawAssets = Array.isArray(assetsJson.data) ? assetsJson.data : [];
        const assetsWithAllocations: Asset[] = rawAssets.map((asset: Record<string, unknown>) => {
          const idStr = String(asset.id);
          const rawAllocations = Array.isArray((asset as any).allocations) ? ((asset as any).allocations as any[]) : [];
          return {
            id: idStr,
            name: String(asset.name ?? ""),
            category: (asset.category as AssetCategory) || "other",
            estimated_value:
              asset.estimated_value != null && asset.estimated_value !== ""
                ? Number(asset.estimated_value)
                : null,
            description: (asset.description as string) ?? null,
            location: (asset.location as string) ?? null,
            documents_url: (asset.documents_url as string) ?? null,
            allocations: rawAllocations.map((a) => ({
              id: `${idStr}:${String(a.recipient_id)}`,
              asset_id: idStr,
              recipient_id: String(a.recipient_id),
              allocation_percentage: Number(a.allocation_percentage ?? 0),
              recipient: recipientRows.find((r) => r.id === String(a.recipient_id)),
            })),
          };
        });
        setAssets(assetsWithAllocations);
      }

      setRecipients(recipientsOk ? recipientRows : []);
    } catch (error: unknown) {
      console.error("Error fetching asset management data:", error);
      setAssets([]);
      setRecipients([]);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryIcon = (category: AssetCategory) => {
    const cat = categories.find((c) => c.id === category);
    return cat?.icon || Package;
  };

  const handleAddAsset = async () => {
    if (!user) {
      toast.error("Please log in to add assets");
      return;
    }

    // Validate asset name
    const nameValidation = validateAssetName(newAsset.name);
    if (!nameValidation.isValid) {
      toast.error(nameValidation.error || "Please enter a valid asset name");
      return;
    }

    // Validate description if provided
    let descriptionValue = null;
    if (newAsset.description && newAsset.description.trim()) {
      const descValidation = validateDescription(newAsset.description);
      if (!descValidation.isValid) {
        toast.error(descValidation.error || "Invalid description");
        return;
      }
      descriptionValue = descValidation.sanitized;
    }

    // Validate estimated value if provided
    let estimatedValue = null;
    if (newAsset.estimated_value && newAsset.estimated_value.trim()) {
      const valueValidation = validateNumericValue(newAsset.estimated_value);
      if (!valueValidation.isValid) {
        toast.error(valueValidation.error || "Invalid estimated value");
        return;
      }
      estimatedValue = valueValidation.sanitized;
    }

    setSaving(true);
    try {
      const result = await backendApi.addAsset({
        user_email: user.email,
        name: nameValidation.sanitized,
        category: newAsset.category,
        estimated_value: estimatedValue ?? undefined,
        description: descriptionValue ?? undefined,
        currency: "INR",
      });

      if (result.success && result.data) {
        setAssets([{ ...result.data, allocations: [] }, ...assets]);
        setNewAsset({ name: "", category: "property", estimated_value: "", description: "" });
        setShowAddModal(false);
        toast.success("Asset added successfully");
      }
    } catch (error: any) {
      console.error("Error adding asset:", error);
      toast.error(error.message || "Failed to add asset");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAsset = async (id: string) => {
    try {
      const base = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";
      const response = await fetch(`${base}/api/assets/${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
      });
      const json = await response.json().catch(() => ({}));
      if (!response.ok || !json?.success) {
        throw new Error(json?.message || "Failed to delete asset");
      }
      setAssets(assets.filter((a) => a.id !== id));
      toast.success("Asset deleted");
    } catch (error) {
      console.error("Error deleting asset:", error);
      toast.error("Failed to delete asset");
    }
  };

  const openAllocationModal = (asset: Asset) => {
    setSelectedAsset(asset);
    setAllocations(
      asset.allocations?.map((a) => ({
        recipientId: a.recipient_id,
      })) || []
    );
    setShowAllocationModal(true);
  };

  const addAllocationRow = () => {
    const availableRecipients = recipients.filter(
      (r) => !allocations.some((a) => a.recipientId === r.id)
    );
    if (availableRecipients.length === 0) {
      toast.error("All recipients have been assigned");
      return;
    }
    setAllocations([...allocations, { recipientId: availableRecipients[0].id }]);
  };

  const removeAllocationRow = (index: number) => {
    setAllocations(allocations.filter((_, i) => i !== index));
  };

  const updateAllocation = (index: number, recipientId: string) => {
    const updated = [...allocations];
    updated[index] = { recipientId };
    setAllocations(updated);
  };

  const saveAllocations = async () => {
    if (!selectedAsset) return;

    // Validate that all recipients are selected
    for (const a of allocations) {
      if (!a.recipientId) {
        toast.error("Please select a recipient for all allocations");
        return;
      }
    }

    setSaving(true);
    try {
      const base = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";
      const percentagePerRecipient = allocations.length > 0 ? 100 / allocations.length : 0;

      const response = await fetch(`${base}/api/assets/${encodeURIComponent(selectedAsset.id)}/allocations`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({
          allocations: allocations.map((a) => ({
            recipient_id: Number(a.recipientId),
            allocation_percentage: percentagePerRecipient,
          })),
        }),
      });
      const json = await response.json().catch(() => ({}));
      if (!response.ok || !json?.success) {
        throw new Error(json?.message || "Failed to save allocations");
      }

      // Refresh data
      await fetchData();
      setShowAllocationModal(false);
      toast.success("Allocations saved");
    } catch (error) {
      console.error("Error saving allocations:", error);
      toast.error("Failed to save allocations");
    } finally {
      setSaving(false);
    }
  };

  // Display exactly what user entered (no conversion)
  const formatCurrency = (value: number | null) => {
    if (!value) return "—";
    return `₹${value.toLocaleString("en-IN", { maximumFractionDigits: 0, minimumFractionDigits: 0 })}`;
  };

  const handleFileUpload = async (assetId: string, file: File) => {
    if (!user) return;

    // Validate file before upload
    const validation = await validateDocumentFile(file);
    if (!validation.isValid) {
      toast.error(validation.error || "Invalid file");
      return;
    }

    setUploadingAssetId(assetId);
    try {
      const result = await backendApi.uploadAssetDocument({
        user_email: user.email,
        asset_id: Number(assetId),
        file,
      });

      if (!result.success || !result.data?.documents_url) {
        throw new Error(result.message || "Failed to upload document");
      }

      setAssets(assets.map((a) => (a.id === assetId ? { ...a, documents_url: result.data!.documents_url } : a)));
      toast.success("Document uploaded successfully");
    } catch (error) {
      console.error("Error uploading document:", error);
      toast.error("Failed to upload document");
    } finally {
      setUploadingAssetId(null);
    }
  };

  const handleDownloadDocument = async (asset: Asset) => {
    if (!asset.documents_url) return;

    try {
      const url = asset.documents_url;
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (error) {
      console.error("Error downloading document:", error);
      toast.error("Failed to download document");
    }
  };

  const handleDeleteDocument = async (assetId: string, documentPath: string) => {
    try {
      const base = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";
      const response = await fetch(`${base}/api/assets/${encodeURIComponent(assetId)}/document`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
      });
      const json = await response.json().catch(() => ({}));
      if (!response.ok || !json?.success) {
        throw new Error(json?.message || "Failed to delete document");
      }
      setAssets(assets.map((a) => (a.id === assetId ? { ...a, documents_url: null } : a)));
      toast.success("Document deleted");
    } catch (error) {
      console.error("Error deleting document:", error);
      toast.error("Failed to delete document");
    }
  };

  // Recipient management functions
  const sendVerificationEmail = async (recipientId: string) => {
    try {
      const response = await backendApi.sendVerificationEmail({ user_email: user?.email || "", user_id: Number(user?.id) || undefined });
      return Boolean(response?.success);
    } catch (error) {
      console.error("Error sending verification email:", error);
      throw error;
    }
  };

  const handleEditRecipient = (recipient: Recipient) => {
    setEditingRecipient(recipient);
    setNewRecipient({
      full_name: recipient.full_name,
      email: recipient.email || "",
      phone: recipient.phone || "",
      relationship: recipient.relationship || "",
    });
  };

  const handleSaveRecipient = async () => {
    if (!user) {
      toast.error("Please log in to save recipients");
      return;
    }

    // Validate full name
    const nameValidation = validateName(newRecipient.full_name);
    if (!nameValidation.isValid) {
      toast.error(nameValidation.error || "Please enter a name");
      return;
    }

    // Validate email if provided
    let emailValue = null;
    if (newRecipient.email && newRecipient.email.trim()) {
      const emailValidation = validateEmail(newRecipient.email);
      if (!emailValidation.isValid) {
        toast.error(emailValidation.error || "Please enter a valid email address");
        return;
      }
      emailValue = emailValidation.sanitized;
    }

    // Validate phone if provided
    let phoneValue = null;
    if (newRecipient.phone && newRecipient.phone.trim()) {
      const phoneValidation = validatePhone(newRecipient.phone);
      if (!phoneValidation.isValid) {
        toast.error(phoneValidation.error || "Please enter a valid phone number");
        return;
      }
      phoneValue = phoneValidation.sanitized;
    }

    // Validate relationship if provided
    let relationshipValue = null;
    if (newRecipient.relationship && newRecipient.relationship.trim()) {
      const relationshipValidation = validateRelationship(newRecipient.relationship);
      if (!relationshipValidation.isValid) {
        toast.error(relationshipValidation.error || "Invalid relationship");
        return;
      }
      relationshipValue = relationshipValidation.sanitized;
    }

    setSaving(true);
    try {
      if (editingRecipient) {
        const base = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";
        const response = await fetch(`${base}/api/recipients/${encodeURIComponent(editingRecipient.id)}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", ...getAuthHeaders() },
          body: JSON.stringify({
            full_name: nameValidation.sanitized,
            email: emailValue,
            phone: phoneValue,
            relationship: relationshipValue,
          }),
        });
        const result = await response.json().catch(() => ({}));
        if (!response.ok || !result?.success || !result?.data) {
          throw new Error(result?.message || "Failed to update recipient");
        }

        setRecipients(recipients.map((r) => (r.id === editingRecipient.id ? result.data : r)));
        toast.success("Recipient updated successfully");

        // Send verification email if email changed and wasn't verified
        if (emailValue && emailValue !== editingRecipient.email && !editingRecipient.is_verified && result.data.id) {
          try {
            await sendVerificationEmail(result.data.id);
            toast.success("Verification email sent");
          } catch (error) {
            console.error("Error sending verification email:", error);
            toast.error("Failed to send verification email");
          }
        }
      } else {
        const result = await backendApi.addRecipient({
          user_email: user.email,
          full_name: nameValidation.sanitized,
          email: emailValue,
          phone: phoneValue,
          relationship: relationshipValue,
        });
        if (!result.success || !result.data?.id) {
          throw new Error(result.message || "Failed to add recipient");
        }

        // Re-fetch to ensure we have full recipient record
        await fetchData();
        toast.success("Recipient added successfully");

        // Send verification email if email is provided
        if (emailValue && result.data.id) {
          try {
            await sendVerificationEmail(String(result.data.id));
            toast.success("Verification email sent");
          } catch (error) {
            console.error("Error sending verification email:", error);
            toast.error("Failed to send verification email");
          }
        }
      }

      setNewRecipient({ full_name: "", email: "", phone: "", relationship: "" });
      setEditingRecipient(null);
    } catch (error) {
      console.error("Error saving recipient:", error);
      toast.error(editingRecipient ? "Failed to update recipient" : "Failed to add recipient");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRecipient = async (id: string) => {
    try {
      const base = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";
      const response = await fetch(`${base}/api/recipients/${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
      });
      const json = await response.json().catch(() => ({}));
      if (!response.ok || !json?.success) {
        throw new Error(json?.message || "Failed to remove recipient");
      }
      setRecipients(recipients.filter((r) => r.id !== id));
      toast.success("Recipient removed");
    } catch (error) {
      console.error("Error deleting recipient:", error);
      toast.error("Failed to remove recipient");
    }
  };

  const handleSendVerificationEmail = async (recipientId: string) => {
    try {
      await sendVerificationEmail(recipientId);
      toast.success("Verification email sent");
    } catch (error) {
      console.error("Error sending verification email:", error);
      toast.error("Failed to send verification email");
    }
  };

  const relationships = [
    "Spouse",
    "Child",
    "Sibling",
    "Parent",
    "Friend",
    "Charity",
    "Other",
  ];

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
          <Link to={isFlowMode ? "/create" : "/dashboard"} className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6">
            <ArrowLeft className="w-4 h-4" />
            {isFlowMode ? "Back to Method Selection" : "Back to Dashboard"}
          </Link>

          {/* Progress Indicator - Only show in flow mode */}
          {isFlowMode && (
            <div className="flex items-center gap-2 mb-8">
              {[1, 2, 3, 4].map((step) => (
                <div key={step} className="flex items-center gap-2">
                  <div className={`progress-step ${step === 3 ? "progress-step-active" : step < 3 ? "progress-step-completed" : "progress-step-pending"}`}>
                    {step < 3 ? <Check className="w-4 h-4" /> : step}
                  </div>
                  {step < 4 && <div className="w-8 h-0.5 bg-border" />}
                </div>
              ))}
            </div>
          )}

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between mb-8"
          >
            <div>
              <h1 className="heading-section text-foreground mb-2">Manage Your Assets</h1>
              <p className="text-muted-foreground">Add assets and assign them to recipients.</p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" className="gap-2" onClick={() => setShowRecipientsModal(true)}>
                <Users className="w-4 h-4" />
                Manage Recipients
              </Button>
              <Button variant="gold" className="gap-2" onClick={() => setShowAddModal(true)}>
                <Plus className="w-4 h-4" />
                Add Asset
              </Button>
            </div>
          </motion.div>

          {/* Category Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex flex-wrap gap-2 mb-6"
          >
            <button className="px-4 py-2 rounded-full bg-gold text-primary text-sm font-medium">
              All Assets ({assets.length})
            </button>
          </motion.div>

          {/* Assets List */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-4 mb-8"
          >
            {assets.map((asset) => {
              const Icon = getCategoryIcon(asset.category);
              return (
                <div key={asset.id} className="card-elevated">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gold to-gold-light flex items-center justify-center">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold text-foreground">{asset.name}</h3>
                        <span className="font-serif text-lg font-semibold text-gold">
                          {formatCurrency(asset.estimated_value)}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2 capitalize">
                        {asset.category.replace("_", " ")}
                      </p>
                      {asset.description && (
                        <p className="text-sm text-muted-foreground mb-3">{asset.description}</p>
                      )}

                      {/* Documents */}
                      <div className="flex items-center gap-2 mb-3">
                        {asset.documents_url ? (
                          <div className="flex items-center gap-2">
                            <File className="w-4 h-4 text-gold" />
                            <span className="text-sm text-muted-foreground">
                              {asset.documents_url.split('/').pop()}
                            </span>
                            <button
                              onClick={() => handleDownloadDocument(asset)}
                              className="p-1 hover:bg-secondary rounded transition-colors"
                              title="Download document"
                            >
                              <Download className="w-4 h-4 text-gold" />
                            </button>
                            <button
                              onClick={() => handleDeleteDocument(asset.id, asset.documents_url!)}
                              className="p-1 hover:bg-destructive/10 rounded transition-colors"
                              title="Delete document"
                            >
                              <Trash2 className="w-3 h-3 text-destructive" />
                            </button>
                          </div>
                        ) : (
                          <label className="inline-flex items-center gap-1 text-sm text-gold hover:underline cursor-pointer">
                            {uploadingAssetId === asset.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Upload className="w-4 h-4" />
                            )}
                            Upload document
                            <Input
                              type="file"
                              className="hidden"
                              accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.jpg,.jpeg,.png,.gif,.webp"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleFileUpload(asset.id, file);
                              }}
                              disabled={uploadingAssetId === asset.id}
                            />
                          </label>
                        )}
                      </div>

                      {/* Allocations */}
                      {asset.allocations && asset.allocations.length > 0 ? (
                        <div className="flex items-center gap-2 flex-wrap">
                          <Users className="w-4 h-4 text-muted-foreground" />
                          {asset.allocations.map((a) => (
                            <span key={a.id} className="px-2 py-1 rounded-full bg-secondary text-xs font-medium">
                              {a.recipient?.full_name}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <button
                          onClick={() => openAllocationModal(asset)}
                          className="inline-flex items-center gap-1 text-sm text-gold hover:underline"
                        >
                          <UserPlus className="w-4 h-4" />
                          Assign recipients
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {(!asset.allocations || asset.allocations.length === 0) && (
                        <button
                          className="px-3 py-2 hover:bg-secondary rounded-lg transition-colors flex items-center gap-2 text-sm"
                          onClick={() => openAllocationModal(asset)}
                          title="Assign Recipients"
                        >
                          <Users className="w-4 h-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Assign Recipients</span>
                        </button>
                      )}
                      <button
                        className="p-2 hover:bg-destructive/10 rounded-lg transition-colors"
                        onClick={() => handleDeleteAsset(asset.id)}
                        title="Delete asset"
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {assets.length === 0 && (
              <div className="card-elevated text-center py-12">
                <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-serif text-xl font-semibold text-foreground mb-2">No assets yet</h3>
                <p className="text-muted-foreground mb-4">Start by adding your first asset.</p>
                <Button variant="gold" onClick={() => setShowAddModal(true)} className="gap-2">
                  <Plus className="w-4 h-4" />
                  Add Your First Asset
                </Button>
              </div>
            )}
          </motion.div>

          {/* Navigation - Only show in flow mode */}
          {isFlowMode && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="flex items-center justify-between mt-8"
            >
              <Link to="/create">
                <Button variant="ghost" className="gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </Button>
              </Link>
              <Link to="/recipients?flow=true">
                <Button variant="gold" className="gap-2">
                  Continue to Recipients
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </motion.div>
          )}
        </div>
      </main>

      {/* Add Asset Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/20 backdrop-blur-sm"
            onClick={() => setShowAddModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="card-elevated w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-serif text-xl font-semibold text-foreground">Add New Asset</h2>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-2 hover:bg-secondary rounded-lg"
                  title="Close"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Asset Name</label>
                  <input
                    type="text"
                    value={newAsset.name}
                    onChange={(e) => setNewAsset({ ...newAsset, name: e.target.value })}
                    placeholder="e.g., Family Home"
                    className="input-elevated"
                    maxLength={200}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Category</label>
                  <div className="grid grid-cols-3 gap-2">
                    {categories.slice(0, 6).map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => setNewAsset({ ...newAsset, category: cat.id as AssetCategory })}
                        className={`p-3 rounded-lg flex flex-col items-center gap-1 transition-colors ${
                          newAsset.category === cat.id
                            ? "bg-gold text-primary"
                            : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                        }`}
                      >
                        <cat.icon className="w-5 h-5" />
                        <span className="text-xs">{cat.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Estimated Value</label>
                  <input
                    type="text"
                    value={newAsset.estimated_value}
                    onChange={(e) => setNewAsset({ ...newAsset, estimated_value: e.target.value })}
                    placeholder="e.g., ₹83,00,000 or 100000"
                    className="input-elevated"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Description (Optional)</label>
                  <textarea
                    value={newAsset.description}
                    onChange={(e) => setNewAsset({ ...newAsset, description: e.target.value })}
                    placeholder="Additional details about this asset..."
                    rows={3}
                    maxLength={2000}
                    className="input-elevated resize-none"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <Button variant="ghost" className="flex-1" onClick={() => setShowAddModal(false)}>
                  Cancel
                </Button>
                <Button variant="gold" className="flex-1" onClick={handleAddAsset} disabled={saving}>
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add Asset"}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Allocation Modal */}
      <AnimatePresence>
        {showAllocationModal && selectedAsset && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/20 backdrop-blur-sm"
            onClick={() => setShowAllocationModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="card-elevated w-full max-w-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="font-serif text-xl font-semibold text-foreground">Assign Recipients</h2>
                  <p className="text-sm text-muted-foreground">{selectedAsset.name}</p>
                </div>
                <button
                  onClick={() => setShowAllocationModal(false)}
                  className="p-2 hover:bg-secondary rounded-lg"
                  title="Close"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {recipients.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">No recipients added yet.</p>
                  <Link to="/recipients">
                    <Button variant="gold" className="gap-2">
                      <UserPlus className="w-4 h-4" />
                      Add Recipients First
                    </Button>
                  </Link>
                </div>
              ) : (
                <>
                  <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                    {allocations.map((allocation, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <select
                          value={allocation.recipientId}
                          onChange={(e) => updateAllocation(index, e.target.value)}
                          className="input-elevated flex-1"
                          title="Select recipient"
                          aria-label="Select recipient"
                        >
                          <option value="">Select recipient...</option>
                          {recipients.map((r) => (
                            <option key={r.id} value={r.id} disabled={allocations.some((a, i) => i !== index && a.recipientId === r.id)}>
                              {r.full_name}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={() => removeAllocationRow(index)}
                          className="p-2 hover:bg-destructive/10 rounded-lg transition-colors"
                          title="Remove recipient"
                          aria-label="Remove recipient"
                        >
                          <X className="w-4 h-4 text-destructive" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {allocations.length < recipients.length && (
                    <Button variant="outline" size="sm" onClick={addAllocationRow} className="gap-2 mb-4">
                      <Plus className="w-4 h-4" />
                      Add Recipient
                    </Button>
                  )}

                  {allocations.length > 0 && (
                    <div className="p-3 rounded-lg mb-4 bg-sage/20">
                      <span className="text-sm text-muted-foreground">
                        {allocations.length} recipient{allocations.length !== 1 ? "s" : ""} will receive equal shares of this asset
                      </span>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <Button variant="ghost" className="flex-1" onClick={() => setShowAllocationModal(false)}>
                      Cancel
                    </Button>
                    <Button
                      variant="gold"
                      className="flex-1"
                      onClick={saveAllocations}
                      disabled={saving || allocations.some(a => !a.recipientId)}
                    >
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Allocations"}
                    </Button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Recipients Management Modal */}
      <AnimatePresence>
        {showRecipientsModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/20 backdrop-blur-sm"
            onClick={() => {
              setShowRecipientsModal(false);
              setEditingRecipient(null);
              setNewRecipient({ full_name: "", email: "", phone: "", relationship: "" });
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="card-elevated w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-border">
                <div>
                  <h2 className="font-serif text-xl font-semibold text-foreground">Manage Recipients</h2>
                  <p className="text-sm text-muted-foreground">Add, edit, or remove recipients for your assets</p>
                </div>
                <button
                  onClick={() => {
                    setShowRecipientsModal(false);
                    setEditingRecipient(null);
                    setNewRecipient({ full_name: "", email: "", phone: "", relationship: "" });
                  }}
                  className="p-2 hover:bg-secondary rounded-lg"
                  title="Close"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto pr-2">
                {/* Recipients List */}
                <div className="space-y-3 mb-6">
                  {recipients.length === 0 ? (
                    <div className="text-center py-8">
                      <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No recipients added yet.</p>
                    </div>
                  ) : (
                    recipients.map((recipient) => (
                      <div key={recipient.id} className="card-elevated p-4">
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-navy to-navy-light flex items-center justify-center text-primary-foreground font-semibold">
                            {recipient.full_name.charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-foreground">{recipient.full_name}</h3>
                              {recipient.relationship && (
                                <span className="px-2 py-0.5 rounded-full bg-secondary text-xs font-medium text-secondary-foreground">
                                  {recipient.relationship}
                                </span>
                              )}
                              {recipient.is_verified && (
                                <span className="px-2 py-0.5 rounded-full bg-sage text-xs font-medium text-foreground flex items-center gap-1">
                                  <Check className="w-3 h-3" />
                                  Verified
                                </span>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-3 text-sm text-muted-foreground mb-2">
                              {recipient.email && (
                                <span className="flex items-center gap-1">
                                  <Mail className="w-3 h-3" />
                                  {recipient.email}
                                </span>
                              )}
                              {recipient.phone && (
                                <span className="flex items-center gap-1">
                                  <Phone className="w-3 h-3" />
                                  {recipient.phone}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {recipient.email && !recipient.is_verified && (
                              <button
                                onClick={() => handleSendVerificationEmail(recipient.id)}
                                className="p-2 hover:bg-secondary rounded-lg transition-colors"
                                title="Send verification email"
                              >
                                <Mail className="w-4 h-4 text-gold" />
                              </button>
                            )}
                            <button
                              onClick={() => handleEditRecipient(recipient)}
                              className="p-2 hover:bg-secondary rounded-lg transition-colors"
                              title="Edit recipient"
                            >
                              <Edit2 className="w-4 h-4 text-muted-foreground" />
                            </button>
                            <button
                              onClick={() => handleDeleteRecipient(recipient.id)}
                              className="p-2 hover:bg-destructive/10 rounded-lg transition-colors"
                              title="Delete recipient"
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Add/Edit Recipient Form */}
                <div className="border-t border-border pt-4">
                  <h3 className="font-semibold text-foreground mb-4">
                    {editingRecipient ? "Edit Recipient" : "Add New Recipient"}
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Full Name *</label>
                      <Input
                        type="text"
                        value={newRecipient.full_name}
                        onChange={(e) => setNewRecipient({ ...newRecipient, full_name: e.target.value })}
                        placeholder="John Smith"
                        className="input-elevated"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Email</label>
                      <Input
                        type="email"
                        value={newRecipient.email}
                        onChange={(e) => setNewRecipient({ ...newRecipient, email: e.target.value })}
                        placeholder="john@example.com"
                        className="input-elevated"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Phone</label>
                      <Input
                        type="tel"
                        value={newRecipient.phone}
                        onChange={(e) => setNewRecipient({ ...newRecipient, phone: e.target.value })}
                        placeholder="+1 (555) 123-4567"
                        className="input-elevated"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Relationship</label>
                      <select
                        value={newRecipient.relationship}
                        onChange={(e) => setNewRecipient({ ...newRecipient, relationship: e.target.value })}
                        className="input-elevated"
                        title="Select relationship"
                        aria-label="Select relationship"
                      >
                        <option value="">Select relationship...</option>
                        {relationships.map((rel) => (
                          <option key={rel} value={rel}>
                            {rel}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6 pt-4 border-t border-border">
                <Button
                  variant="ghost"
                  className="flex-1"
                  onClick={() => {
                    setShowRecipientsModal(false);
                    setEditingRecipient(null);
                    setNewRecipient({ full_name: "", email: "", phone: "", relationship: "" });
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="gold"
                  className="flex-1"
                  onClick={handleSaveRecipient}
                  disabled={saving || !newRecipient.full_name.trim()}
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : editingRecipient ? (
                    "Update Recipient"
                  ) : (
                    "Add Recipient"
                  )}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AssetManagement;
