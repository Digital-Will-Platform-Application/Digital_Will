import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { backendApi } from "@/lib/backendApi";
import { validatePhone } from "@/lib/validation";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { Mail, Calendar, Lock, ArrowLeft, Phone, Camera, Loader2, ChevronRight, Upload } from "lucide-react";

interface ProfileData {
  full_name: string | null;
  avatar_url: string | null;
}

const AdminAccount = () => {
  const { user, updatePassword, updateUserMetadata, loading: authLoading } = useAuth();
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [savingPhone, setSavingPhone] = useState(false);
  const [phoneInput, setPhoneInput] = useState("");
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [newPassword, setNewPassword] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [profileAvatarUrl, setProfileAvatarUrl] = useState<string | null>(null);

  const existingPhone =
    (user?.user_metadata?.mobile as string) ||
    (user?.user_metadata?.phone as string) ||
    null;

  const resolveProfileAvatarUrl = useCallback(async (avatarValue: string | null | undefined) => {
    if (!avatarValue) return null;
    return avatarValue;
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    setProfile({
      full_name: (user?.user_metadata?.full_name as string) ?? (user?.user_metadata?.username as string) ?? null,
      avatar_url: (user?.user_metadata?.avatar_url as string) ?? null,
    });
    setName(((user?.user_metadata?.full_name as string) ?? (user?.user_metadata?.username as string) ?? "") as string);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    const loadAvatar = async () => {
      const avatarValue =
        (profile?.avatar_url ?? (user?.user_metadata?.avatar_url as string | null | undefined)) ?? null;
      const url = await resolveProfileAvatarUrl(avatarValue);
      setProfileAvatarUrl(url);
    };
    void loadAvatar();
  }, [profile?.avatar_url, user?.user_metadata?.avatar_url, resolveProfileAvatarUrl]);

  const ensureProfile = async () => {
    if (!user?.id) return;
    try {
      // Admin profile lives in NeonDB `users` table, nothing to ensure
      return;
    } catch (error) {
      console.error("Error ensuring profile:", error);
      // Don't throw - allow photo upload to continue
    }
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowed.includes(file.type)) {
      toast.error(t("account.useImageFormats") || "Use JPG, PNG, WebP, or GIF (max 5MB).");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB.");
      return;
    }
    setUploading(true);
    try {
      await ensureProfile();

      const uploadResult = await backendApi.uploadAvatar({ user_email: user!.email, avatarFile: file });
      const avatarUrl = uploadResult?.data?.user?.avatar_url ?? uploadResult?.data?.upload?.url ?? null;
      if (!avatarUrl) throw new Error("Failed to upload photo");

      setProfile((p) => (p ? { ...p, avatar_url: avatarUrl } : null));
      setProfileAvatarUrl(await resolveProfileAvatarUrl(avatarUrl));
      toast.success("Photo updated successfully.");
    } catch (error: unknown) {
      console.error("Error updating photo:", error);
      toast.error(error instanceof Error ? error.message : "Failed to update photo. Please try again.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSaveName = async () => {
    setSaving(true);
    try {
      await ensureProfile();
      const base = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";
      const res = await fetch(`${base}/api/profiles/update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_email: user!.email, full_name: name.trim() || null }),
      });
      const json = await res.json();
      if (!res.ok || !json?.success) throw new Error(json?.message || "Failed to update name");
      setProfile((p) => (p ? { ...p, full_name: name.trim() || null } : null));
      updateUserMetadata({
        full_name: name.trim() || undefined,
        username: name.trim() || undefined,
      });
      toast.success("Name updated.");
    } catch {
      toast.error("Failed to update name.");
    } finally {
      setSaving(false);
    }
  };

  const normalizePhone = (raw: string) => {
    const digits = raw.replace(/\D/g, "");
    if (digits.length <= 10) return digits.length === 10 ? `+91${digits}` : raw.trim();
    if (digits.startsWith("91") && digits.length === 12) return `+${digits}`;
    return raw.trim().startsWith("+") ? raw.trim() : `+${raw.trim()}`;
  };

  const handleSavePhone = async () => {
    const trimmed = phoneInput.trim();
    if (!trimmed) {
      toast.error("Enter a mobile number.");
      return;
    }
    if (!user?.email) return;
    const phoneValidation = validatePhone(trimmed);
    if (!phoneValidation.isValid) {
      toast.error(phoneValidation.error || "Invalid phone number.");
      return;
    }
    const normalized = normalizePhone(trimmed);
    setSavingPhone(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL || "http://localhost:3001"}/api/profiles/update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_email: user.email, mobile: normalized }),
      });
      const json = await res.json();
      if (!res.ok || !json?.success) throw new Error(json?.message || "Failed to save mobile.");
      updateUserMetadata({ mobile: normalized, phone: normalized });
      setPhoneInput("");
      toast.success("Mobile number saved.");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to save mobile.");
    } finally {
      setSavingPhone(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword.trim()) {
      toast.error("Enter your current password.");
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }
    setChangingPassword(true);
    try {
      const { error } = await updatePassword(currentPassword, newPassword);
      if (error) throw error;
      toast.success("Password updated.");
      setNewPassword("");
      setCurrentPassword("");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to update password.");
    } finally {
      setChangingPassword(false);
    }
  };

  if (authLoading || !user) return null;

  return (
    <div className="mx-auto w-full max-w-[1400px] px-4 sm:px-6 lg:px-8 py-6 md:py-8 min-h-full">
      <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Link to="/admin" className="hover:text-foreground transition-colors">Admin</Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-foreground font-medium">Profile</span>
      </nav>
      <Link to="/admin" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="w-4 h-4" />
        Back to Dashboard
      </Link>

      <h1 className="font-serif text-2xl font-semibold text-foreground mb-6">Admin Profile</h1>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="ui-loader-ring">
            <span className="ui-loader-ring-border" />
            <span className="ui-loader-ring-core" />
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("account.profile") || "Profile"}</CardTitle>
              <CardDescription>{t("account.profileDescription") || "Photo and display name."}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label className="mb-3 block text-sm font-semibold text-foreground">
                  {t("account.profilePhotoLabel") || "Profile Photo"}{" "}
                  <span className="font-normal text-muted-foreground">
                    ({t("account.profilePhotoOptional") || "Optional"})
                  </span>
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  title={t("account.profilePhotoLabel") || "Profile Photo"}
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  onChange={handlePhotoChange}
                />
                <div className="flex flex-col items-stretch gap-4 sm:flex-row sm:items-start">
                  <div className="relative shrink-0">
                    {profileAvatarUrl ? (
                      <div className="relative h-28 w-28 overflow-hidden rounded-full border-2 border-border shadow-md ring-1 ring-border/20">
                        <img
                          src={profileAvatarUrl}
                          alt=""
                          className="h-full w-full object-cover"
                          onError={() => setProfileAvatarUrl(null)}
                        />
                        {uploading && (
                          <span className="absolute inset-0 flex items-center justify-center bg-black/50">
                            <Loader2 className="h-7 w-7 animate-spin text-white" />
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="relative flex h-28 w-28 flex-col items-center justify-center rounded-full border-2 border-dashed border-border/50 bg-gradient-to-br from-secondary/80 to-secondary/40 px-2 text-center">
                        {uploading ? (
                          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        ) : (
                          <>
                            <Camera className="mb-1 h-8 w-8 shrink-0 text-muted-foreground" aria-hidden />
                            <span className="text-xs text-muted-foreground">{t("account.noPhoto") || "No photo"}</span>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1 sm:pt-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      disabled={uploading}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {uploading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          {t("account.uploadingPhoto") || "Uploading..."}
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4" />
                          {profileAvatarUrl
                            ? t("account.changePhoto") || "Change Photo"
                            : t("account.uploadPhoto") || "Upload Photo"}
                        </>
                      )}
                    </Button>
                    <div className="mt-2.5 space-y-1">
                      <p className="text-xs leading-relaxed text-muted-foreground">
                        {t("account.profilePhotoRecommended") ||
                          "Recommended: Square image, at least 200×200px"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {t("account.profilePhotoConstraints") ||
                          "Max size: 5MB • Formats: JPG, PNG, WebP, GIF"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">{t("account.name") || "Name"}</label>
                <div className="flex gap-2">
                  <Input
                    placeholder={t("account.namePlaceholder") || "Your name"}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="flex-1"
                  />
                  <Button size="sm" variant="gold" onClick={handleSaveName} disabled={saving}>
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : t("common.save") || "Save"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Account</CardTitle>
              <CardDescription>Email and mobile number.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Email</label>
                <p className="mt-1 flex items-center gap-2 rounded-md border bg-muted/40 px-3 py-2 text-sm">
                  <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
                  {user?.email}
                </p>
              </div>
              {existingPhone ? (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Mobile number</label>
                  <p className="mt-1 flex items-center gap-2 rounded-md border bg-muted/40 px-3 py-2 text-sm">
                    <Phone className="w-4 h-4 text-muted-foreground shrink-0" />
                    {existingPhone}
                  </p>
                </div>
              ) : (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Add mobile number</label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      type="tel"
                      placeholder="e.g. 9876543210 or +91 9876543210"
                      value={phoneInput}
                      onChange={(e) => setPhoneInput(e.target.value)}
                      className="flex-1"
                    />
                    <Button size="sm" variant="gold" onClick={handleSavePhone} disabled={savingPhone || !phoneInput.trim()}>
                      {savingPhone ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}
                    </Button>
                  </div>
                </div>
              )}
              {/* created_at is not currently exposed in auth session */}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Lock className="w-4 h-4" />
                Change password
              </CardTitle>
              <CardDescription>Set a new password for your admin account.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleChangePassword} className="space-y-3">
                <Input
                  type="password"
                  placeholder="Current password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  autoComplete="current-password"
                />
                <Input
                  type="password"
                  placeholder="New password (min 6 characters)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  minLength={6}
                  autoComplete="new-password"
                />
                <Button
                  type="submit"
                  variant="gold"
                  disabled={changingPassword || !newPassword.trim() || !currentPassword.trim()}
                >
                  {changingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : "Update password"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

export default AdminAccount;
