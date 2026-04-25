import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { User, Mail, Calendar, Lock, LogOut, Camera, Loader2, ArrowLeft, Phone, Send, Trash2, Monitor, Smartphone, Tablet, Upload } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { backendApi, SessionApiError } from "@/lib/backendApi";
import { validatePhone } from "@/lib/validation";
import { getOrCreateDeviceId, getDeviceLabel, isMobileUserAgent } from "@/lib/deviceSession";
import { recordLoginActivity } from "@/lib/loginActivity";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import ThreeDLogo from "@/components/branding/ThreeDLogo";
import { HeroLegacyVisual } from "@/components/branding/BrandIllustrations";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
interface ProfileData {
  full_name: string | null;
  avatar_url: string | null;
}

interface LoginActivity {
  id: string;
  email: string | null;
  logged_at: string;
  device_id: string | null;
  device_label: string | null;
  user_agent: string | null;
}

function groupSessionsByDevice(rows: LoginActivity[]): LoginActivity[] {
  const map = new Map<string, LoginActivity>();
  for (const row of rows) {
    const key = row.device_id?.trim() || row.id;
    const prev = map.get(key);
    if (!prev || new Date(row.logged_at) > new Date(prev.logged_at)) {
      map.set(key, row);
    }
  }
  return Array.from(map.values()).sort(
    (a, b) => new Date(b.logged_at).getTime() - new Date(a.logged_at).getTime()
  );
}

function getBrowserOsLine(ua: string, deviceLabel: string | null): string {
  if (deviceLabel?.trim()) {
    return deviceLabel.replace(/\s+on\s+/i, " - ");
  }
  if (!ua) return "Unknown browser";
  return "Web session";
}

function getDeviceKindLabel(ua: string): "Desktop" | "Mobile" | "Tablet" {
  if (/iPad/i.test(ua)) return "Tablet";
  if (/Android/i.test(ua) && !/Mobile/i.test(ua)) return "Tablet";
  if (isMobileUserAgent(ua)) return "Mobile";
  return "Desktop";
}

function getSessionActiveLabel(loggedAt: string, isThisDevice: boolean): string {
  const d = new Date(loggedAt);
  const diffMs = Date.now() - d.getTime();
  // This device stays "Active now" while you're using the app (refreshed every ~2 min from profile)
  if (isThisDevice && diffMs < 20 * 60 * 1000) return "Active now";
  if (diffMs < 120_000) return "Active now";
  return formatDistanceToNow(d, { addSuffix: true });
}

const Account = () => {
  const { user, signOut, loading: authLoading, updateUserMetadata, updatePassword, isSuperAdmin } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [profileAvatarUrl, setProfileAvatarUrl] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [savingPhone, setSavingPhone] = useState(false);
  const [phoneInput, setPhoneInput] = useState("");
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sendingVerification, setSendingVerification] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteConfirmInput, setDeleteConfirmInput] = useState("");
  const [deleteAccountPassword, setDeleteAccountPassword] = useState("");
  const [loginActivity, setLoginActivity] = useState<LoginActivity[]>([]);
  const [logoutAllLoading, setLogoutAllLoading] = useState(false);
  const [logoutThisLoading, setLogoutThisLoading] = useState(false);
  const [removingDeviceId, setRemovingDeviceId] = useState<string | null>(null);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  const existingPhone =
    (user?.user_metadata?.mobile as string) ||
    (user?.user_metadata?.phone as string) ||
    null;

  const currentDeviceId = useMemo(() => getOrCreateDeviceId(), []);

  const loadLoginActivity = useCallback(async () => {
    if (!user?.id) return;
    // Supabase removed: show only "This device" row.
    setLoginActivity([]);
  }, [user?.id]);

  const sortedSessionsByDevice = useMemo(() => {
    const list = groupSessionsByDevice(loginActivity);
    return [...list].sort((a, b) => {
      const aHere = Boolean(a.device_id) && a.device_id === currentDeviceId;
      const bHere = Boolean(b.device_id) && b.device_id === currentDeviceId;
      if (aHere && !bHere) return -1;
      if (!aHere && bHere) return 1;
      return new Date(b.logged_at).getTime() - new Date(a.logged_at).getTime();
    });
  }, [loginActivity, currentDeviceId]);

  /** Always include this browser as a row (DB + fallback) so "This device" / Active now matches the reference */
  const sessionsForDisplay = useMemo(() => {
    const list = sortedSessionsByDevice;
    const hasCurrent = list.some((s) => s.device_id && s.device_id === currentDeviceId);
    if (hasCurrent) return list;
    const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
    const synthetic: LoginActivity = {
      id: `__local_current__${currentDeviceId}`,
      email: user?.email ?? null,
      logged_at: new Date().toISOString(),
      device_id: currentDeviceId,
      device_label: getDeviceLabel(ua),
      user_agent: ua,
    };
    return [synthetic, ...list];
  }, [sortedSessionsByDevice, currentDeviceId, user?.email]);

  const deleteChallengeText = useMemo(() => {
    const fullName =
      profile?.full_name?.trim() ||
      (user?.user_metadata?.full_name as string | undefined)?.trim() ||
      "";
    if (fullName) return fullName;
    return (user?.email ?? "").trim();
  }, [profile?.full_name, user?.user_metadata?.full_name, user?.email]);

  const deleteChallengeIsName = useMemo(() => {
    const fullName =
      profile?.full_name?.trim() ||
      (user?.user_metadata?.full_name as string | undefined)?.trim() ||
      "";
    return Boolean(fullName);
  }, [profile?.full_name, user?.user_metadata?.full_name]);

  const isDeleteConfirmValid = useMemo(() => {
    const expected = deleteChallengeText;
    if (!expected) return false;
    if (!deleteAccountPassword.trim()) return false;
    const typed = deleteConfirmInput.trim();
    if (deleteChallengeIsName) {
      return typed === expected;
    }
    return typed.toLowerCase() === expected.toLowerCase();
  }, [deleteConfirmInput, deleteChallengeText, deleteChallengeIsName, deleteAccountPassword]);

  useEffect(() => {
    if (!user?.id) return;
    const existingAvatar = (user?.user_metadata?.avatar_url as string | null | undefined) ?? null;
    setProfile({
      full_name: (user?.user_metadata?.full_name as string | undefined) ?? null,
      avatar_url: existingAvatar,
    });
    setName(((user?.user_metadata?.full_name as string | undefined) ?? "") || (user.email?.split("@")[0] ?? ""));
    setProfileAvatarUrl(existingAvatar);
    setLoading(false);
  }, [user]);

  const resolveProfileAvatarUrl = useCallback(async (avatarValue: string | null | undefined) => {
    if (!avatarValue) return null;
    return avatarValue;
  }, []);

  useEffect(() => {
    const loadAvatar = async () => {
      const url = await resolveProfileAvatarUrl(profile?.avatar_url ?? user?.user_metadata?.avatar_url);
      setProfileAvatarUrl(url);
    };
    void loadAvatar();
  }, [profile?.avatar_url, user?.user_metadata?.avatar_url, resolveProfileAvatarUrl]);

  /** Record this device + reload list on Profile open; keep "Active now" fresh while tab is visible */
  useEffect(() => {
    if (!user?.id) return;

    const syncActiveSession = async () => {
      try {
        await recordLoginActivity(user);
        await loadLoginActivity();
      } catch (e) {
        console.warn("Active session sync:", e);
      }
    };

    void syncActiveSession();

    const onVisibility = () => {
      if (document.visibilityState === "visible") void syncActiveSession();
    };
    document.addEventListener("visibilitychange", onVisibility);

    const intervalId = window.setInterval(() => {
      if (document.visibilityState === "visible") void syncActiveSession();
    }, 120_000);

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.clearInterval(intervalId);
    };
  }, [user?.id, loadLoginActivity, user]);

  const ensureProfile = async () => {
    // Supabase profile table removed; backend profile update not implemented yet.
    return;
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.email) return;

    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowed.includes(file.type)) {
      toast.error(t("account.useImageFormats") || "Use JPG, PNG, WebP, or GIF (max 5MB).");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setUploading(true);
    try {
      const result = await backendApi.uploadAvatar({
        user_email: user.email,
        avatarFile: file,
        staging: true,
      });

      const avatarUrl: string | null =
        result?.data?.user?.avatar_url ?? result?.data?.upload?.url ?? null;

      if (!avatarUrl) {
        throw new Error("Upload succeeded but avatar URL was missing.");
      }

      setProfile((p) => (p ? { ...p, avatar_url: avatarUrl } : { full_name: name.trim() || null, avatar_url: avatarUrl }));
      setProfileAvatarUrl(avatarUrl);

      // keep auth context + storage in sync (header avatar updates instantly)
      updateUserMetadata({ avatar_url: avatarUrl });

      toast.success("Photo updated successfully.");
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Failed to update photo.";
      toast.error(msg);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSaveName = async () => {
    setSaving(true);
    try {
      if (!user?.email) throw new Error("Please sign in again.");
      await fetch(`${import.meta.env.VITE_BACKEND_URL || "http://localhost:3001"}/api/profiles/update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_email: user.email, full_name: name.trim() || null }),
      });
      setProfile((p) => (p ? { ...p, full_name: name.trim() || null } : null));
      updateUserMetadata({ full_name: name.trim() || null, username: name.trim() || null });
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
    if (!user?.email) {
      toast.error("Please sign in again.");
      return;
    }
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
      if (!res.ok || !json?.success) {
        throw new Error(json?.message || "Failed to save mobile number.");
      }
      updateUserMetadata({ mobile: normalized, phone: normalized });
      setPhoneInput("");
      toast.success("Mobile number saved.");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to save mobile number.");
    } finally {
      setSavingPhone(false);
    }
  };

  const handleChangePasswordSubmit = async () => {
    if (!currentPassword.trim()) {
      toast.error("Enter your current password.");
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      toast.error("New password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      toast.error("New passwords do not match.");
      return;
    }
    setChangingPassword(true);
    try {
      const { error } = await updatePassword(currentPassword, newPassword);
      if (error) throw error;
      toast.success("Password updated successfully.");
      setPasswordDialogOpen(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to update password.");
    } finally {
      setChangingPassword(false);
    }
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await signOut({ scope: "local" });
      toast.success(t("common.signOutSuccess") || "Signed out.");
      navigate("/");
    } finally {
      setSigningOut(false);
    }
  };

  const handleLogoutThisDeviceOnly = async () => {
    setLogoutThisLoading(true);
    try {
      await signOut({ scope: "local" });
      toast.success("Signed out on this device.");
      navigate("/");
    } finally {
      setLogoutThisLoading(false);
    }
  };

  const handleLogoutAllDevices = async () => {
    setLogoutAllLoading(true);
    try {
      await signOut({ scope: "global" });
      toast.success("Signed out from all devices.");
      navigate("/login");
    } finally {
      setLogoutAllLoading(false);
    }
  };

  const removeSessionFromList = async (activity: LoginActivity) => {
    if (!user?.id) return;
    const key = activity.device_id || activity.id;
    setRemovingDeviceId(key);
    try {
      setLoginActivity((prev) => prev.filter((x) => (x.device_id || x.id) !== key));
      toast.success("Session removed from this list.");
    } catch {
      toast.error("Could not remove this session.");
    } finally {
      setRemovingDeviceId(null);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deleteAccountPassword.trim()) {
      toast.error("Enter your account password to confirm.");
      return;
    }
    setDeleting(true);
    try {
      await backendApi.deleteMyAccount(deleteAccountPassword);
      toast.success("Your account has been deleted.");
      setDeleteDialogOpen(false);
      setDeleteConfirmInput("");
      setDeleteAccountPassword("");
      await signOut();
      navigate("/login", { replace: true });
    } catch (e: unknown) {
      if (e instanceof SessionApiError) {
        toast.error(e.message, { description: e.hint });
      } else {
        toast.error(e instanceof Error ? e.message : "Could not delete account.");
      }
    } finally {
      setDeleting(false);
    }
  };

  if (authLoading || !user) return null;

  return (
    <div className="min-h-screen page-ambient">
      <main className="relative p-6 pb-20 md:p-8">
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
          <div className="absolute -right-24 top-0 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute bottom-0 left-0 h-72 w-72 rounded-full bg-accent/10 blur-3xl" />
        </div>
        <div className="container relative mx-auto max-w-5xl px-4">
          <Link
            to="/dashboard"
            className="group mb-8 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors duration-300 hover:text-foreground"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full border border-border/60 bg-card/85 shadow-sm backdrop-blur-sm transition-all duration-300 group-hover:border-primary/35 group-hover:shadow-md group-hover:-translate-x-0.5">
              <ArrowLeft className="h-4 w-4" />
            </span>
            {t("account.backToDashboard") || "Back to Dashboard"}
          </Link>

          <div className="mb-10 overflow-hidden rounded-[2rem] border border-border/55 bg-gradient-to-br from-card/95 via-card/80 to-muted/25 p-6 shadow-soft backdrop-blur-md md:p-10">
            <div className="flex flex-col items-start gap-8 md:flex-row md:items-center md:justify-between">
              <div className="max-w-xl">
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary/90">Account</p>
                <h1 className="font-serif text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
                  {t("account.title") || "User Profile"}
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">{t("account.profileDescription")}</p>
                <div className="mt-4 h-1 w-16 rounded-full bg-gradient-to-r from-primary to-accent shadow-md shadow-primary/15" aria-hidden />
              </div>
              <div className="relative flex w-full shrink-0 items-center justify-center gap-4 sm:w-auto md:justify-end">
                <ThreeDLogo className="scale-110" glowClassName="from-primary/40 to-accent/35 opacity-90" />
                <div className="hidden w-[min(240px,42vw)] sm:block">
                  <HeroLegacyVisual className="opacity-95 shadow-premium" />
                </div>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <div className="relative flex h-16 w-16 items-center justify-center">
                <span className="absolute inset-0 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
                <Loader2 className="relative h-7 w-7 text-primary" />
              </div>
            </div>
          ) : (
            <div className="premium-stack space-y-6">
              {/* Photo + name */}
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
                                <span className="text-xs text-muted-foreground">
                                  {t("account.noPhoto") || "No photo"}
                                </span>
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
                        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : t("common.save")}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Account info (read-only) */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">{t("account.accountInfo") || "Account"}</CardTitle>
                  <CardDescription>{t("account.accountInfoDescription") || "Email and member info."}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">{t("account.email") || "Email"}</label>
                    <div className="mt-1 flex items-center gap-2">
                      <p className="flex-1 flex items-center gap-2 rounded-md border bg-muted/40 px-3 py-2 text-sm">
                        <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
                        {user?.email}
                      </p>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="shrink-0"
                        onClick={async () => {
                          if (!user?.email) {
                            toast.error("Email not found");
                            return;
                          }
                          setSendingVerification(true);
                          try {
                            console.log("📧 Account: Sending verification email to:", user.email);
                            const result = await backendApi.sendVerificationEmail({
                              user_email: user.email
                            });
                            console.log("📧 Account: Result:", result);
                            
                            if (result && result.success) {
                              console.log("✅ Account: Verification email sent successfully");
                              toast.success("Verification email sent! Please check your inbox.");
                            } else {
                              const errorMsg = result?.message || result?.error || "Failed to send verification email";
                              console.error("❌ Account: Failed to send:", errorMsg);
                              toast.error(errorMsg);
                            }
                          } catch (error: any) {
                            console.error("❌ Account: Exception sending verification email:", error);
                            const errorMsg = error?.message || error?.toString() || "Failed to send verification email. Please try again.";
                            console.error("❌ Account: Error message:", errorMsg);
                            toast.error(errorMsg);
                          } finally {
                            setSendingVerification(false);
                          }
                        }}
                        disabled={sendingVerification || !user?.email}
                      >
                        {sendingVerification ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Sending...
                          </>
                        ) : (
                          <>
                            <Send className="h-4 w-4 mr-2" />
                            Send Verification
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                  {existingPhone ? (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">{t("account.mobileNumber") || "Mobile number"}</label>
                      <p className="mt-1 flex items-center gap-2 rounded-md border bg-muted/40 px-3 py-2 text-sm">
                        <Phone className="w-4 h-4 text-muted-foreground shrink-0" />
                        {existingPhone}
                      </p>
                    </div>
                  ) : (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">{t("account.addMobileNumber") || "Add mobile number"}</label>
                      <p className="text-xs text-muted-foreground mt-0.5 mb-1.5">{t("account.addMobileNumberHint") || "Add your number once. You didn't provide it at sign up."}</p>
                      <div className="flex gap-2">
                        <Input
                          type="tel"
                          placeholder={t("account.phonePlaceholder") || "e.g. 9876543210 or +91 9876543210"}
                          value={phoneInput}
                          onChange={(e) => setPhoneInput(e.target.value)}
                          className="flex-1"
                        />
                        <Button size="sm" variant="gold" onClick={handleSavePhone} disabled={savingPhone || !phoneInput.trim()}>
                          {savingPhone ? <Loader2 className="w-4 h-4 animate-spin" /> : t("common.save")}
                        </Button>
                      </div>
                    </div>
                  )}
                  {user?.created_at && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">{t("account.memberSince") || "Member since"}</label>
                      <p className="mt-1 flex items-center gap-2 rounded-md border bg-muted/40 px-3 py-2 text-sm">
                        <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
                        {new Date(user.created_at).toLocaleDateString(undefined, { dateStyle: "long" })}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Active Sessions — matches reference layout */}
              <Card className="overflow-hidden border-border/60 bg-gradient-to-b from-card to-card/95 shadow-premium ring-1 ring-border/30">
                <CardHeader className="pb-3 bg-gradient-to-r from-muted/30 via-transparent to-transparent border-b border-border/40">
                  <CardTitle className="text-lg font-bold tracking-tight text-foreground">Active Sessions</CardTitle>
                  <CardDescription className="text-sm text-muted-foreground">
                    Devices where your account is signed in.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 pt-0">
                  {sessionsForDisplay.length === 0 ? (
                    <p className="rounded-xl border border-dashed border-border/70 bg-muted/15 px-4 py-10 text-center text-sm text-muted-foreground backdrop-blur-[2px]">
                      No sessions recorded yet. After you sign in, this device will appear here.
                    </p>
                  ) : (
                    <div className="space-y-0 divide-y divide-border/60">
                      {sessionsForDisplay.map((activity) => {
                        const isThisDevice =
                          Boolean(activity.device_id) && activity.device_id === currentDeviceId;
                        const ua = activity.user_agent || "";
                        const kind = getDeviceKindLabel(ua);
                        const DeviceIcon =
                          kind === "Mobile" ? Smartphone : kind === "Tablet" ? Tablet : Monitor;
                        const browserOs = getBrowserOsLine(ua, activity.device_label);
                        const activeLabel = getSessionActiveLabel(activity.logged_at, isThisDevice);
                        const rowKey = activity.device_id || activity.id;

                        return (
                          <div
                            key={rowKey}
                            className="group/row flex flex-col gap-4 py-5 first:pt-2 last:pb-2 sm:flex-row sm:items-center sm:justify-between transition-colors duration-300 hover:bg-muted/20 -mx-2 px-2 rounded-2xl"
                          >
                            <div className="flex min-w-0 flex-1 gap-4">
                              <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-border/60 bg-gradient-to-br from-background to-muted/40 text-muted-foreground shadow-inner ring-1 ring-white/20 dark:ring-white/5 transition-transform duration-300 group-hover/row:scale-[1.02]">
                                <span className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-primary/8 to-transparent opacity-0 transition-opacity group-hover/row:opacity-100" />
                                <DeviceIcon className="relative h-6 w-6 stroke-[1.5]" />
                              </div>
                              <div className="min-w-0 flex-1 space-y-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="text-base font-semibold text-foreground">{kind}</span>
                                  {isThisDevice && (
                                    <span className="rounded-full bg-gradient-to-r from-primary/14 to-accent/10 px-3 py-0.5 text-xs font-semibold text-primary ring-1 ring-primary/20 dark:from-primary/25 dark:to-accent/12 dark:text-primary dark:ring-primary/25">
                                      This device
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground">{browserOs}</p>
                                <p className="text-sm text-muted-foreground">Location unavailable</p>
                                <p className="text-sm text-muted-foreground">{activeLabel}</p>
                              </div>
                            </div>
                            {!isThisDevice && (
                              <div className="flex shrink-0 justify-end sm:pl-4">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="gap-2 font-medium text-destructive hover:bg-destructive/10 hover:text-destructive"
                                  onClick={() => void removeSessionFromList(activity)}
                                  disabled={removingDeviceId === rowKey}
                                >
                                  {removingDeviceId === rowKey ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <LogOut className="h-4 w-4" />
                                  )}
                                  Log out
                                </Button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <div className="flex flex-col gap-3 border-t border-border/60 bg-muted/5 pt-5 sm:flex-row sm:items-stretch sm:justify-center sm:gap-4">
                    <Button
                      type="button"
                      variant="outline"
                      className="h-11 flex-1 gap-2 rounded-xl border-border/80 bg-background/90 font-medium shadow-sm backdrop-blur-sm hover:bg-muted/50"
                      onClick={handleLogoutThisDeviceOnly}
                      disabled={logoutThisLoading}
                    >
                      {logoutThisLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <LogOut className="h-4 w-4" />
                      )}
                      Log out from this device
                    </Button>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          type="button"
                          className="h-11 flex-1 gap-2 rounded-xl bg-gradient-to-r from-red-600 to-red-700 font-semibold text-white shadow-lg shadow-red-950/25 hover:from-red-500 hover:to-red-600"
                          disabled={logoutAllLoading}
                        >
                          {logoutAllLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <LogOut className="h-4 w-4" />
                          )}
                          Log out from all devices
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Log out from all devices?</AlertDialogTitle>
                          <AlertDialogDescription>
                            You will be signed out everywhere this account is used. You will need to sign in again on each device.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-red-600 text-white hover:bg-red-700"
                            onClick={handleLogoutAllDevices}
                          >
                            Yes, log out everywhere
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>

                  <p className="text-center text-xs text-muted-foreground">
                    <strong>Log out</strong> on another device removes it from this list. To revoke access everywhere, use{" "}
                    <strong>Log out from all devices</strong>.
                  </p>
                </CardContent>
              </Card>

              {/* Manage account */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">{t("account.manage") || "Manage account"}</CardTitle>
                  <CardDescription>{t("account.manageDescription") || "Password and sign out."}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full justify-start gap-2"
                    onClick={() => {
                      setCurrentPassword("");
                      setNewPassword("");
                      setConfirmNewPassword("");
                      setPasswordDialogOpen(true);
                    }}
                  >
                    <Lock className="w-4 h-4" />
                    {t("account.changePassword") || "Change password"}
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" className="w-full justify-start gap-2">
                        <LogOut className="w-4 h-4" />
                        {t("header.signOut")}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Confirm Logout</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to logout? You will need to login again to access your account.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleSignOut} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                          {signingOut ? "Logging out..." : "Yes, Logout"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </CardContent>
              </Card>

              {/* Delete account — separate card */}
              <Card className="border-destructive/30">
                <CardHeader>
                  <CardTitle className="text-base text-destructive">Delete account</CardTitle>
                  <CardDescription>
                    {isSuperAdmin
                      ? "Primary administrator accounts cannot be deleted from the app."
                      : "Permanently remove your data from this app. You will be asked to type your name (or email) and your password to confirm."}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    variant="destructive"
                    className="w-full justify-start gap-2"
                    disabled={isSuperAdmin}
                    onClick={() => {
                      setDeleteConfirmInput("");
                      setDeleteAccountPassword("");
                      setDeleteDialogOpen(true);
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete Account
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>

      <Dialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          setDeleteDialogOpen(open);
          if (!open) {
            setDeleteConfirmInput("");
            setDeleteAccountPassword("");
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete account</DialogTitle>
            <DialogDescription asChild>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>
                  This will remove your app data (wills, assets, recipients, reminders, and profile). This cannot be undone.
                </p>
                <p>
                  To confirm, type your {deleteChallengeIsName ? "full name" : "email"} exactly as shown below, then enter
                  your account password.
                </p>
                <p className="rounded-md border bg-muted/50 px-3 py-2 font-mono text-sm font-medium text-foreground">
                  {deleteChallengeText || "—"}
                </p>
              </div>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground" htmlFor="delete-confirm">
              Confirmation
            </label>
            <Input
              id="delete-confirm"
              value={deleteConfirmInput}
              onChange={(e) => setDeleteConfirmInput(e.target.value)}
              placeholder={deleteChallengeIsName ? "Type your full name" : "Type your email"}
              autoComplete="off"
              disabled={!deleteChallengeText}
            />
            <label className="text-sm font-medium text-foreground" htmlFor="delete-pwd">
              Account password
            </label>
            <Input
              id="delete-pwd"
              type="password"
              value={deleteAccountPassword}
              onChange={(e) => setDeleteAccountPassword(e.target.value)}
              placeholder="Current password"
              autoComplete="current-password"
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={!isDeleteConfirmValid || deleting || !deleteChallengeText}
              onClick={() => void handleDeleteAccount()}
            >
              {deleting ? "Deleting..." : "Delete my account"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={passwordDialogOpen}
        onOpenChange={(open) => {
          setPasswordDialogOpen(open);
          if (!open) {
            setCurrentPassword("");
            setNewPassword("");
            setConfirmNewPassword("");
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("account.changePassword") || "Change password"}</DialogTitle>
            <DialogDescription>
              Enter your current password and a new password. Your new password is stored securely in our database.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground" htmlFor="acct-curr-pwd">
                Current password
              </label>
              <Input
                id="acct-curr-pwd"
                type="password"
                autoComplete="current-password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Current password"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground" htmlFor="acct-new-pwd">
                New password
              </label>
              <Input
                id="acct-new-pwd"
                type="password"
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 6 characters"
                minLength={6}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground" htmlFor="acct-confirm-pwd">
                Confirm new password
              </label>
              <Input
                id="acct-confirm-pwd"
                type="password"
                autoComplete="new-password"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                placeholder="Repeat new password"
                minLength={6}
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => setPasswordDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="button" variant="gold" disabled={changingPassword} onClick={() => void handleChangePasswordSubmit()}>
              {changingPassword ? <Loader2 className="h-4 w-4 animate-spin" /> : "Update password"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Account;
