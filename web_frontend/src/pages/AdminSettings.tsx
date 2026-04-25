import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { backendApi } from "@/lib/backendApi";
import { handleAdminApiSessionError } from "@/lib/adminSession";
import { toast } from "sonner";
import { Loader2, ChevronRight, Users, UserPlus, Trash2, Lock, Mail, User } from "lucide-react";
import { MIN_LENGTHS } from "@/lib/validation";
import { validateName, validateEmail } from "@/lib/validation";
import { validatePasswordSecurity } from "@/lib/passwordSecurity";

interface AdminRow {
  id: number;
  email: string;
  username: string;
  created_at: string;
}

const primaryAdminEmailFromEnv = () =>
  (import.meta.env.VITE_ADMIN_EMAIL as string | undefined)?.trim().toLowerCase() ?? "";

const AdminSettings = () => {
  const { user, isSuperAdmin, signOut } = useAuth();
  const [admins, setAdmins] = useState<AdminRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newAdminName, setNewAdminName] = useState("");
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [newAdminPassword, setNewAdminPassword] = useState("");
  const [adding, setAdding] = useState(false);
  const [removing, setRemoving] = useState<number | null>(null);

  const loadAdmins = useCallback(async () => {
    if (!user || !isSuperAdmin) return;
    setLoading(true);
    setError(null);
    try {
      const json = await backendApi.listSubAdmins();
      setAdmins(json.data?.admins ?? []);
    } catch (e) {
      if (await handleAdminApiSessionError(e, signOut)) return;
      setError(e instanceof Error ? e.message : "Failed to load admins.");
      toast.error("Could not load admin list.");
      setAdmins([]);
    } finally {
      setLoading(false);
    }
  }, [user, isSuperAdmin, signOut]);

  useEffect(() => {
    loadAdmins();
  }, [loadAdmins]);

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSuperAdmin) return;

    const name = newAdminName.trim();
    const email = newAdminEmail.trim().toLowerCase();
    const password = newAdminPassword;

    const nameCheck = validateName(name);
    if (!nameCheck.isValid) {
      toast.error(nameCheck.error ?? "Invalid name");
      return;
    }
    const emailCheck = validateEmail(email, true);
    if (!emailCheck.isValid) {
      toast.error(emailCheck.error ?? "Invalid email");
      return;
    }
    const envAdmin = primaryAdminEmailFromEnv();
    if (envAdmin && email === envAdmin) {
      toast.error("This email is the primary admin account. Create a different email for additional admins.");
      return;
    }

    const passwordValidation = await validatePasswordSecurity(password, {
      checkLeaked: true,
      minLength: MIN_LENGTHS.PASSWORD,
      requireUppercase: true,
      requireLowercase: true,
      requireNumber: true,
      requireSpecial: true,
    });
    if (!passwordValidation.isValid) {
      const msg = passwordValidation.errors?.[0] ?? "Password does not meet requirements.";
      toast.error(msg);
      return;
    }

    setAdding(true);
    try {
      await backendApi.createSubAdmin({ full_name: name, email, password });
      toast.success(
        "Admin created in Neon. They can sign in on the login page and will use the admin panel without Admin Settings."
      );
      setNewAdminName("");
      setNewAdminEmail("");
      setNewAdminPassword("");
      await loadAdmins();
    } catch (err) {
      if (await handleAdminApiSessionError(err, signOut)) return;
      toast.error(err instanceof Error ? err.message : "Could not create admin.");
    } finally {
      setAdding(false);
    }
  };

  const handleRemoveAdmin = async (id: number) => {
    if (!isSuperAdmin) return;
    setRemoving(id);
    try {
      await backendApi.deleteSubAdmin(id);
      toast.success("Admin removed.");
      await loadAdmins();
    } catch (e) {
      if (await handleAdminApiSessionError(e, signOut)) return;
      toast.error("Could not remove admin.");
    } finally {
      setRemoving(null);
    }
  };

  if (!isSuperAdmin) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[40vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="app-shell max-w-[1000px] py-6 md:py-8 min-h-full">
      <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
        <Link to="/admin" className="hover:text-foreground transition-colors">Super Admin</Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-foreground font-medium">Admin Settings</span>
      </nav>
      <div className="mb-6">
        <h1 className="font-serif text-2xl md:text-3xl font-semibold text-primary border-b-2 border-primary pb-1 inline-block mb-2">
          Admin Settings
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Create admins here. New admins are stored in Neon and sign in with email and password. They see the same admin area
          without this Settings page.
        </p>
      </div>

      <Card className="mb-6 border-primary/20 shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <UserPlus className="w-4 h-4" />
            Create admin
          </CardTitle>
          <CardDescription>
            Enter name, email, and password. The account is created with admin access (not the primary admin).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddAdmin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Full name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Jane Doe"
                  value={newAdminName}
                  onChange={(e) => setNewAdminName(e.target.value)}
                  className="pl-9 max-w-sm"
                  disabled={adding}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="admin@example.com"
                  value={newAdminEmail}
                  onChange={(e) => setNewAdminEmail(e.target.value)}
                  className="pl-9 max-w-sm"
                  disabled={adding}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="password"
                  placeholder="Min 8 chars, upper, lower, number, special"
                  value={newAdminPassword}
                  onChange={(e) => setNewAdminPassword(e.target.value)}
                  className="pl-9 max-w-sm"
                  disabled={adding}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">Same rules as user signup (strong password, not leaked).</p>
            </div>
            <Button type="submit" disabled={adding || !newAdminName.trim() || !newAdminEmail.trim() || !newAdminPassword}>
              {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Save — Create admin
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border-border/80 shadow-md overflow-hidden">
        <CardHeader className="bg-muted/30 border-b border-border/50">
          <CardTitle className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Secondary admins ({admins.length})
          </CardTitle>
          <CardDescription>Created admins (primary admin is not listed here).</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <p className="text-sm text-destructive py-8 px-4 text-center">{error}</p>
          ) : admins.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No secondary admins yet.</p>
          ) : (
            <div className="table-responsive overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableHead className="font-semibold">Email</TableHead>
                    <TableHead className="font-semibold">Name</TableHead>
                    <TableHead className="font-semibold">Added</TableHead>
                    <TableHead className="font-semibold w-[100px]">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {admins.map((row) => (
                    <TableRow key={row.id} className="bg-background">
                      <TableCell className="font-medium">{row.email}</TableCell>
                      <TableCell className="text-muted-foreground">{row.username}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {new Date(row.created_at).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleRemoveAdmin(row.id)}
                          disabled={removing === row.id}
                        >
                          {removing === row.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                          Remove
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminSettings;
