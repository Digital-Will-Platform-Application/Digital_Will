import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Plus,
  Users,
  Mail,
  Phone,
  Trash2,
  Edit2,
  Check,
  X,
  UserPlus,
  Shield,
  Loader2,
  Upload,
  Image as ImageIcon,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { validateName, validateEmail, validatePhone, validateRelationship } from "@/lib/validation";
import { validateFileType, validateFileSize, ALLOWED_MIME_TYPES, ALLOWED_EXTENSIONS, MAX_FILE_SIZES } from "@/lib/fileValidation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Recipient {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  relationship: string | null;
  is_verified: boolean;
  image_url?: string | null;
  created_at?: string | null;
}

const Recipients = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const isFlowMode = searchParams.get('flow') === 'true';
  
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingRecipient, setEditingRecipient] = useState<Recipient | null>(null);
  const [newRecipient, setNewRecipient] = useState({
    full_name: "",
    email: "",
    phone: "",
    relationship: "",
  });
  const [customRelationship, setCustomRelationship] = useState("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});

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

  const relationships = [
    t("recipients.spouse"),
    t("recipients.child"),
    t("recipients.sibling"),
    t("recipients.parent"),
    t("recipients.friend"),
    t("recipients.guardian"),
    t("recipients.charity"),
    t("recipients.other"),
  ];
  const otherLabel = t("recipients.other");

  const ordinalRoleLabel = (idx: number) => {
    if (idx === 0) return "Primary";
    if (idx === 1) return "Secondary";
    if (idx === 2) return "Third";
    return `Recipient ${idx + 1}`;
  };

  useEffect(() => {
    if (user) fetchRecipients();
  }, [user]);

  const fetchRecipients = async () => {
    try {
      if (!user?.email && !user?.id) {
        setRecipients([]);
        return;
      }

      const userIdNum = Number(user?.id);
      const useUserId = Number.isFinite(userIdNum) && userIdNum > 0;
      const response = useUserId
        ? await fetch(`${import.meta.env.VITE_BACKEND_URL || "http://localhost:3001"}/api/recipients/user/${userIdNum}`, {
            headers: { ...getAuthHeaders() },
          })
        : await fetch(`${import.meta.env.VITE_BACKEND_URL || "http://localhost:3001"}/api/recipients/user-email/${encodeURIComponent(user!.email)}`, {
            headers: { ...getAuthHeaders() },
          });
      const json = await response.json();

      if (!response.ok || !json?.success) {
        throw new Error(json?.message || "Failed to load recipients");
      }

      const data = Array.isArray(json?.data) ? json.data : [];
      const recipientsWithImage = data.map((r: any) => ({
          id: r.id,
          full_name: r.full_name,
          email: r.email,
          phone: r.phone,
          relationship: r.relationship,
          is_verified: r.is_verified,
          image_url: r.image_url || null,
        created_at: r.created_at || null,
      }));
      setRecipients(recipientsWithImage);

      // Generate signed URLs for all images
      const urlPromises = recipientsWithImage
        .filter(r => r.image_url)
        .map(async (r) => {
          try {
            const url = await getRecipientImageUrl(r.image_url);
            return { id: r.id, url };
          } catch (error) {
            console.error(`Error getting image URL for recipient ${r.id}:`, error);
            return { id: r.id, url: null };
          }
        });

      const urlResults = await Promise.all(urlPromises);
      const urlMap: Record<string, string> = {};
      urlResults.forEach(({ id, url }) => {
        if (url) urlMap[id] = url;
      });
      setImageUrls(urlMap);
    } catch (error: any) {
      console.error("Error fetching recipients:", error);
      toast.error(t("recipients.failedToLoad") || "Failed to load recipients");
      setRecipients([]);
    } finally {
      setLoading(false);
    }
  };

  const sendVerificationEmail = async (recipientId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("Not authenticated");
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-verification-email`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ recipientId }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to send verification email");
      }

      return true;
    } catch (error) {
      console.error("Error sending verification email:", error);
      throw error;
    }
  };

  const handleEditRecipient = (recipient: Recipient) => {
    setEditingRecipient(recipient);
    const rel = recipient.relationship || "";
    const isPreset = !!rel && relationships.includes(rel);
    setCustomRelationship(isPreset ? "" : rel);
    setNewRecipient({
      full_name: recipient.full_name,
      email: recipient.email || "",
      phone: recipient.phone || "",
      relationship: isPreset ? rel : (rel ? otherLabel : ""),
    });
    setSelectedImage(null);
    setImagePreview(recipient.image_url || null);
    setShowAddModal(true);
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate image file
    const typeValidation = validateFileType(
      file,
      ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
      ['.jpg', '.jpeg', '.png', '.webp', '.gif']
    );
    if (!typeValidation.isValid) {
      toast.error(typeValidation.error || "Invalid image file type");
      return;
    }

    // Validate file size (max 5MB for profile images)
    const sizeValidation = validateFileSize(file, 5 * 1024 * 1024);
    if (!sizeValidation.isValid) {
      toast.error(sizeValidation.error || "Image file is too large (max 5MB)");
      return;
    }

    setSelectedImage(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
  };

  const uploadRecipientImage = async (recipientId: string, file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${recipientId}/profile-${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('asset-documents')
        .upload(fileName, file, {
          contentType: file.type,
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Generate signed URL (valid for 1 year) - more reliable than public URL
      const { data: signedData, error: signedError } = await supabase.storage
        .from('asset-documents')
        .createSignedUrl(fileName, 31536000); // 1 year expiry

      if (signedError) {
        console.error("Error generating signed URL:", signedError);
        // Fallback to public URL if signed URL fails
        const { data: publicUrlData } = supabase.storage
          .from('asset-documents')
          .getPublicUrl(fileName);
        return publicUrlData.publicUrl;
      }

      return signedData?.signedUrl || null;
    } catch (error) {
      console.error("Error uploading image:", error);
      throw error;
    }
  };

  // Get image URL - generates signed URL from stored URL or path
  const getRecipientImageUrl = async (imageUrl: string | null | undefined): Promise<string | null> => {
    if (!imageUrl) return null;

    try {
      // Extract file path from URL if it's a full URL
      let filePath = imageUrl;
      
      if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
        // Try to extract path from public URL
        const urlObj = new URL(imageUrl);
        const pathMatch = urlObj.pathname.match(/\/storage\/v1\/object\/(?:public|sign)\/asset-documents\/(.+)/);
        if (pathMatch) {
          filePath = pathMatch[1];
        } else {
          // If it's a signed URL, try to extract from query params or use as-is
          // For signed URLs, we can use them directly
          return imageUrl;
        }
      }

      // Generate signed URL (valid for 1 year)
      const { data: signedData, error: signedError } = await supabase.storage
        .from('asset-documents')
        .createSignedUrl(filePath, 31536000); // 1 year expiry
      
      if (signedError) {
        console.error("Error generating signed URL:", signedError);
        // If signed URL fails and we have a public URL, return it
        if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
          return imageUrl;
        }
        return null;
      }

      return signedData?.signedUrl || null;
    } catch (error) {
      console.error("Error getting image URL:", error);
      // Return original URL as fallback
      return imageUrl.startsWith('http://') || imageUrl.startsWith('https://') ? imageUrl : null;
    }
  };

  const deleteRecipientImage = async (imageUrl: string) => {
    try {
      // Extract file path from URL
      const urlParts = imageUrl.split('/');
      const filePath = urlParts.slice(urlParts.indexOf('asset-documents') + 1).join('/');
      
      const { error } = await supabase.storage
        .from('asset-documents')
        .remove([filePath]);

      if (error) throw error;
    } catch (error) {
      console.error("Error deleting image:", error);
      // Don't throw - image deletion failure shouldn't block the update
    }
  };

  const uploadRecipientImageToBackend = async (file: File): Promise<string | null> => {
    if (!user?.email) {
      throw new Error("User email is required for image upload");
    }
    const formData = new FormData();
    formData.append("image", file);
    formData.append("user_email", user.email);
    formData.append("staging", "true");

    const base = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";
    const response = await fetch(`${base}/api/recipients/upload-image`, {
      method: "POST",
      headers: { ...getAuthHeaders() },
      body: formData,
    });
    const result = await response.json();
    if (!response.ok || !result?.success) {
      throw new Error(result?.message || "Failed to upload recipient image");
    }
    return result?.data?.image_url || null;
  };

  const handleSaveRecipient = async () => {
    if (!user) {
      toast.error("Please log in to save recipients");
      return;
    }

    // Validate full name
    const nameValidation = validateName(newRecipient.full_name);
    if (!nameValidation.isValid) {
      toast.error(nameValidation.error || t("recipients.pleaseEnterName"));
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
      const rawRelationship =
        newRecipient.relationship === otherLabel
          ? customRelationship
          : newRecipient.relationship;

      if (newRecipient.relationship === otherLabel && !customRelationship.trim()) {
        toast.error(t("recipients.customRelationshipRequired") || "Please enter relationship");
        return;
      }

      const relationshipValidation = validateRelationship(rawRelationship);
      if (!relationshipValidation.isValid) {
        toast.error(relationshipValidation.error || "Invalid relationship");
        return;
      }
      relationshipValue = relationshipValidation.sanitized;
    }

    setSaving(true);
    setUploadingImage(true);
    try {
      let imageUrl: string | null = null;

      if (editingRecipient) {
        // Handle image upload/update for existing recipient
        if (selectedImage) {
          try {
            imageUrl = await uploadRecipientImage(editingRecipient.id, selectedImage);
            
            // If had an old image, delete it
            if (editingRecipient.image_url && editingRecipient.image_url !== imageUrl) {
              await deleteRecipientImage(editingRecipient.image_url);
            }
          } catch (error) {
            console.error("Error uploading image:", error);
            toast.error("Failed to upload image. Please try again.");
            setUploadingImage(false);
            setSaving(false);
            return;
          }
        } else if (!imagePreview && editingRecipient.image_url) {
          // If image was removed, delete the old one
          await deleteRecipientImage(editingRecipient.image_url);
          imageUrl = null;
        } else if (imagePreview === editingRecipient.image_url) {
          // Keep existing image
          imageUrl = editingRecipient.image_url;
        }

        // Update existing recipient
        // Update existing recipient
        const updateData: any = {
          full_name: nameValidation.sanitized,
          email: emailValue,
          phone: phoneValue,
          relationship: relationshipValue,
        };

        if (imageUrl !== undefined) {
          updateData.image_url = imageUrl;
        }

        const base = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";
        const updateResponse = await fetch(`${base}/api/recipients/${encodeURIComponent(editingRecipient.id)}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(),
          },
          body: JSON.stringify(updateData),
        });
        const updateJson = await updateResponse.json().catch(() => ({}));
        if (!updateResponse.ok || !updateJson?.success || !updateJson?.data) {
          throw new Error(updateJson?.message || "Failed to update recipient");
        }
        const data = updateJson.data;
        
        const updatedRecipient: Recipient = {
          id: data.id,
          full_name: data.full_name,
          email: data.email,
          phone: data.phone,
          relationship: data.relationship,
          is_verified: data.is_verified,
          image_url: (data as any).image_url || null,
        };
        
        setRecipients(recipients.map(r => r.id === editingRecipient.id ? updatedRecipient : r));
        
        // Update image URL cache if new image was uploaded
        if (imageUrl) {
          setImageUrls(prev => ({ ...prev, [editingRecipient.id]: imageUrl }));
        } else if (!imagePreview && editingRecipient.image_url) {
          // Remove from cache if image was deleted
          setImageUrls(prev => {
            const newUrls = { ...prev };
            delete newUrls[editingRecipient.id];
            return newUrls;
          });
        }
        toast.success(t("recipients.recipientUpdated") || "Recipient updated successfully");

        // Send verification email if email changed and wasn't verified
        if (emailValue && emailValue !== editingRecipient.email && !editingRecipient.is_verified && data.id) {
          try {
            await sendVerificationEmail(data.id);
            toast.success(t("recipients.verificationEmailSent"));
          } catch (error) {
            console.error("Error sending verification email:", error);
            toast.error(t("recipients.failedToSendVerificationEmail"));
          }
        }
      } else {
        // Add new recipient via backend (NeonDB), with optional R2 image upload
        let finalImageUrl: string | null = null;
        if (selectedImage) {
          try {
            finalImageUrl = await uploadRecipientImageToBackend(selectedImage);
          } catch (uploadError) {
            console.error("Error uploading image:", uploadError);
            toast.warning("Image upload failed. Recipient will be added without photo.");
          }
        }

        const base = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";
        const addResponse = await fetch(`${base}/api/recipients/add`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(),
          },
          body: JSON.stringify({
            full_name: nameValidation.sanitized,
            email: emailValue,
            phone: phoneValue,
            relationship: relationshipValue,
            image_url: finalImageUrl,
          }),
        });
        const addJson = await addResponse.json();
        if (!addResponse.ok || !addJson?.success) {
          throw new Error(addJson?.message || "Failed to add recipient");
        }
        const data = addJson.data;

        const recipientData: Recipient = {
          id: String(data.id),
          full_name: data.full_name,
          email: data.email,
          phone: data.phone,
          relationship: data.relationship,
          is_verified: data.is_verified,
          image_url: data.image_url || null,
        };
        setRecipients([recipientData, ...recipients]);
        
        toast.success(t("recipients.recipientAdded"));

        // Send verification email if email is provided
        if (emailValue && data?.id) {
          try {
            await sendVerificationEmail(String(data.id));
            toast.success(t("recipients.verificationEmailSent"));
          } catch (error) {
            console.error("Error sending verification email:", error);
            toast.error(t("recipients.failedToSendVerificationEmail"));
          }
        }
      }

      setNewRecipient({ full_name: "", email: "", phone: "", relationship: "" });
      setSelectedImage(null);
      setImagePreview(null);
      setEditingRecipient(null);
      setShowAddModal(false);
    } catch (error) {
      console.error("Error saving recipient:", error);
      toast.error(editingRecipient ? (t("recipients.failedToUpdate") || "Failed to update recipient") : t("recipients.failedToAdd"));
    } finally {
      setSaving(false);
      setUploadingImage(false);
    }
  };

  const handleSendVerificationEmail = async (recipientId: string) => {
    try {
      await sendVerificationEmail(recipientId);
      toast.success(t("recipients.verificationEmailSent"));
    } catch (error) {
      console.error("Error sending verification email:", error);
      toast.error(t("recipients.failedToSendVerificationEmail"));
    }
  };

  const handleDeleteRecipient = async (id: string) => {
    try {
      // Find recipient to get image URL
      const recipient = recipients.find(r => r.id === id);
      
      // Delete image if exists
      if (recipient?.image_url) {
        await deleteRecipientImage(recipient.image_url);
      }

      const base = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";
      const deleteResponse = await fetch(`${base}/api/recipients/${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
      });
      const deleteJson = await deleteResponse.json().catch(() => ({}));
      if (!deleteResponse.ok || !deleteJson?.success) {
        throw new Error(deleteJson?.message || "Failed to remove recipient");
      }
      
      setRecipients(recipients.filter((r) => r.id !== id));
      toast.success(t("recipients.recipientRemoved"));
    } catch (error) {
      console.error("Error deleting recipient:", error);
      toast.error(t("recipients.failedToRemove"));
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
          <Link to={isFlowMode ? "/assets?flow=true" : "/dashboard"} className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6">
            <ArrowLeft className="w-4 h-4" />
            {isFlowMode ? t("recipients.backToAssets") || "Back to Assets" : "Back to Dashboard"}
          </Link>

          {/* Progress Indicator - Only show in flow mode */}
          {isFlowMode && (
            <div className="flex items-center gap-2 mb-8">
              {[1, 2, 3, 4].map((step) => (
                <div key={step} className="flex items-center gap-2">
                  <div className={`progress-step ${step === 4 ? "progress-step-active" : "progress-step-completed"}`}>
                    {step < 4 ? <Check className="w-4 h-4" /> : step}
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
              <h1 className="heading-section text-foreground mb-2">{t("recipients.addRecipients")}</h1>
              <p className="text-muted-foreground">{t("recipients.specifyWhoReceives")}</p>
            </div>
            <Button variant="gold" className="gap-2" onClick={() => setShowAddModal(true)}>
              <UserPlus className="w-4 h-4" />
              {t("recipients.addRecipient")}
            </Button>
          </motion.div>

          {/* Recipients List */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-4 mb-8"
          >
            {recipients.map((recipient) => {
              const imageUrl = imageUrls[recipient.id] || recipient.image_url;
              return (
                <div key={recipient.id} className="card-elevated hover:shadow-lg transition-shadow duration-200">
                  <div className="flex items-start gap-4">
                    {imageUrl ? (
                      <div className="w-14 h-14 rounded-full overflow-hidden flex-shrink-0 border-2 border-border shadow-sm ring-1 ring-border/30">
                        <img 
                          src={imageUrl} 
                          alt={recipient.full_name}
                          className="w-full h-full object-cover"
                          onError={async (e) => {
                            // Try to get signed URL if public URL fails
                            if (recipient.image_url && !imageUrls[recipient.id]) {
                              try {
                                const signedUrl = await getRecipientImageUrl(recipient.image_url);
                                if (signedUrl) {
                                  setImageUrls(prev => ({ ...prev, [recipient.id]: signedUrl }));
                                  const target = e.target as HTMLImageElement;
                                  target.src = signedUrl;
                                  return;
                                }
                              } catch (error) {
                                console.error("Error getting signed URL:", error);
                              }
                            }
                            // Fallback to initial if image fails to load
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            if (target.parentElement) {
                              target.parentElement.innerHTML = `<div class="w-14 h-14 rounded-full bg-gradient-to-br from-navy to-navy-light flex items-center justify-center text-primary-foreground font-semibold text-lg flex-shrink-0">${recipient.full_name.charAt(0).toUpperCase()}</div>`;
                            }
                          }}
                        />
                      </div>
                    ) : (
                      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-navy to-navy-light flex items-center justify-center text-primary-foreground font-semibold text-lg flex-shrink-0 shadow-sm">
                        {recipient.full_name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-foreground">{recipient.full_name}</h3>
                      <span className="px-2 py-0.5 rounded-full bg-muted text-xs font-semibold text-foreground/80">
                        {(() => {
                          const sorted = [...recipients].sort((a, b) => {
                            const at = a.created_at ? new Date(a.created_at).getTime() : 0;
                            const bt = b.created_at ? new Date(b.created_at).getTime() : 0;
                            return at - bt; // oldest first
                          });
                          const idx = sorted.findIndex((x) => x.id === recipient.id);
                          return ordinalRoleLabel(Math.max(0, idx));
                        })()}
                      </span>
                      {recipient.relationship && (
                        <span className="px-2 py-0.5 rounded-full bg-secondary text-xs font-medium text-secondary-foreground">
                          {recipient.relationship}
                        </span>
                      )}
                      {recipient.is_verified && (
                        <span className="px-2 py-0.5 rounded-full bg-sage text-xs font-medium text-foreground flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          {t("recipients.verified")}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      {recipient.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="w-4 h-4" />
                          {recipient.email}
                        </span>
                      )}
                      {recipient.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-4 h-4" />
                          {recipient.phone}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!recipient.is_verified && recipient.email && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleSendVerificationEmail(recipient.id)}
                      >
                        <Mail className="w-4 h-4 mr-1" />
                        {t("recipients.sendVerification")}
                      </Button>
                    )}
                    <button
                      type="button"
                      aria-label={t("common.edit") || "Edit"}
                      title={t("common.edit") || "Edit"}
                      className="p-2 hover:bg-secondary rounded-lg transition-colors"
                      onClick={() => handleEditRecipient(recipient)}
                    >
                      <Edit2 className="w-4 h-4 text-muted-foreground" />
                    </button>
                    <button
                      type="button"
                      aria-label={t("common.delete") || "Delete"}
                      title={t("common.delete") || "Delete"}
                      className="p-2 hover:bg-destructive/10 rounded-lg transition-colors"
                      onClick={() => handleDeleteRecipient(recipient.id)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </button>
                  </div>
                </div>
              </div>
            );
            })}

            {recipients.length === 0 && (
              <div className="card-elevated text-center py-12">
                <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-serif text-xl font-semibold text-foreground mb-2">{t("recipients.noRecipientsYet")}</h3>
                <p className="text-muted-foreground mb-4">{t("recipients.addPeopleWhoReceive")}</p>
                <Button variant="gold" onClick={() => setShowAddModal(true)} className="gap-2">
                  <UserPlus className="w-4 h-4" />
                  {t("recipients.addYourFirstRecipient")}
                </Button>
              </div>
            )}
          </motion.div>

          {/* Navigation - Only show in flow mode */}
          {isFlowMode && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="flex items-center justify-between mt-8"
            >
              <Link to="/assets?flow=true">
                <Button variant="ghost" className="gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  {t("common.back") || "Back"}
                </Button>
              </Link>
              <div className="flex items-center gap-4">
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  {t("common.secure") || "Secure & Encrypted"}
                </p>
                <Link to="/review">
                  <Button variant="gold" className="gap-2">
                    {t("wills.reviewWill") || "Review Will"}
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </motion.div>
          )}
        </div>
      </main>

      {/* Add Recipient Modal */}
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
                <h2 className="font-serif text-xl font-semibold text-foreground">
                  {editingRecipient ? (t("recipients.editRecipient") || "Edit Recipient") : t("recipients.addRecipient")}
                </h2>
                <button
                  type="button"
                  aria-label={t("common.close") || "Close"}
                  title={t("common.close") || "Close"}
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingRecipient(null);
                    setNewRecipient({ full_name: "", email: "", phone: "", relationship: "" });
                    setCustomRelationship("");
                    setSelectedImage(null);
                    setImagePreview(null);
                  }} 
                  className="p-2 hover:bg-secondary rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Profile Photo Section */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-3">
                    Profile Photo
                    <span className="text-muted-foreground font-normal ml-1.5">(Optional)</span>
                  </label>
                  <div className="flex items-start gap-4">
                    <div className="relative">
                      {imagePreview ? (
                        <>
                          <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-border shadow-md ring-1 ring-border/20">
                            <img 
                              src={imagePreview} 
                              alt="Profile preview"
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={handleRemoveImage}
                            className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-destructive text-white flex items-center justify-center hover:bg-destructive/90 transition-all duration-200 shadow-lg hover:scale-110 z-10 border-2 border-background"
                            title="Remove photo"
                            aria-label="Remove photo"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </>
                      ) : (
                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-secondary/80 to-secondary/40 flex items-center justify-center border-2 border-dashed border-border/50 hover:border-border/70 transition-all duration-200">
                          <div className="text-center">
                            <ImageIcon className="w-7 h-7 text-muted-foreground mx-auto mb-1" />
                            <span className="text-xs text-muted-foreground">No photo</span>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 pt-1">
                      <label className="cursor-pointer inline-block">
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/gif"
                          onChange={handleImageSelect}
                          className="hidden"
                          disabled={uploadingImage || saving}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="gap-2"
                          disabled={uploadingImage || saving}
                          asChild
                        >
                          <span>
                            {uploadingImage ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Uploading...
                              </>
                            ) : (
                              <>
                                <Upload className="w-4 h-4" />
                                {imagePreview ? "Change Photo" : "Upload Photo"}
                              </>
                            )}
                          </span>
                        </Button>
                      </label>
                      <div className="mt-2.5 space-y-1">
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          Recommended: Square image, at least 200×200px
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Max size: 5MB • Formats: JPG, PNG, WebP, GIF
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">{t("recipients.fullName")}</label>
                  <input
                    type="text"
                    value={newRecipient.full_name}
                    onChange={(e) => setNewRecipient({ ...newRecipient, full_name: e.target.value })}
                    placeholder="e.g., John Smith"
                    className="input-elevated"
                    maxLength={100}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">{t("recipients.email")} ({t("common.optional") || "Optional"})</label>
                  <input
                    type="email"
                    value={newRecipient.email}
                    onChange={(e) => setNewRecipient({ ...newRecipient, email: e.target.value })}
                    placeholder="e.g., john@email.com"
                    className="input-elevated"
                    maxLength={255}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">{t("recipients.phone")} ({t("common.optional") || "Optional"})</label>
                  <input
                    type="tel"
                    value={newRecipient.phone}
                    onChange={(e) => setNewRecipient({ ...newRecipient, phone: e.target.value })}
                    placeholder="e.g., +1 555-0123"
                    className="input-elevated"
                    maxLength={20}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">{t("recipients.relationship")}</label>
                  <Select
                    value={newRecipient.relationship || ""}
                    onValueChange={(val) => {
                      setNewRecipient({ ...newRecipient, relationship: val });
                      if (val !== otherLabel) setCustomRelationship("");
                    }}
                  >
                    <SelectTrigger className="input-elevated flex items-center justify-between">
                      <SelectValue
                        placeholder={t("recipients.selectRelationship", { defaultValue: "Select Relationship" })}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {relationships.map((rel) => (
                        <SelectItem key={rel} value={rel}>
                          {rel}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {newRecipient.relationship === otherLabel && (
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      {t("recipients.customRelationshipLabel", { defaultValue: "Relationship (Custom)" })}
                    </label>
                    <input
                      type="text"
                      value={customRelationship}
                      onChange={(e) => setCustomRelationship(e.target.value)}
                      placeholder={t("recipients.customRelationshipPlaceholder", { defaultValue: "e.g., Cousin, Uncle, Guardian" })}
                      className="input-elevated"
                      maxLength={50}
                    />
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-6">
                <Button 
                  variant="ghost" 
                  className="flex-1" 
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingRecipient(null);
                    setNewRecipient({ full_name: "", email: "", phone: "", relationship: "" });
                    setCustomRelationship("");
                    setSelectedImage(null);
                    setImagePreview(null);
                  }}
                  disabled={saving || uploadingImage}
                >
                  {t("common.cancel")}
                </Button>
                <Button variant="gold" className="flex-1" onClick={handleSaveRecipient} disabled={saving || uploadingImage}>
                  {saving || uploadingImage ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    editingRecipient ? (t("recipients.updateRecipient") || "Update Recipient") : t("recipients.addRecipient")
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

export default Recipients;
