import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
  Calendar,
  Bell,
  Plus,
  Edit,
  Trash2,
  CheckCircle2,
  Clock,
  Mail,
  AlertCircle,
  ArrowLeft,
  Repeat,
  FileText,
  Users,
  DollarSign,
  Shield,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

interface Reminder {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  reminder_type: string;
  frequency: string;
  next_reminder_date: string;
  is_active: boolean;
  email_notification: boolean;
  created_at: string;
  updated_at: string;
}

const reminderTypes = [
  { value: "review_will", label: "Review Will", icon: FileText, description: "Review and update your will content" },
  { value: "update_assets", label: "Update Assets", icon: DollarSign, description: "Review and update your asset information" },
  { value: "check_recipients", label: "Check Recipients", icon: Users, description: "Verify recipient information is current" },
  { value: "security_check", label: "Security Review", icon: Shield, description: "Review account security settings" },
  { value: "general", label: "General Reminder", icon: Bell, description: "Custom reminder for any purpose" },
];

const frequencies = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly (Every 3 months)" },
  { value: "yearly", label: "Yearly" },
];

const Reminders = () => {
  const { user } = useAuth();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    reminder_type: "general",
    frequency: "monthly",
    email_notification: true,
  });

  const fetchReminders = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("reminders")
        .select("*")
        .eq("user_id", user.id)
        .order("next_reminder_date", { ascending: true });

      if (error) {
        const errorMessage = error.message || String(error);
        if (
          errorMessage.includes("relation") ||
          errorMessage.includes("does not exist") ||
          errorMessage.includes("reminders")
        ) {
          console.log("Reminders table not found - migrations may need to be run");
          setReminders([]);
          return;
        }
        throw error;
      }
      setReminders((data as Reminder[]) || []);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      if (
        !errorMessage.includes("relation") &&
        !errorMessage.includes("does not exist") &&
        !errorMessage.includes("reminders")
      ) {
        console.error("Error fetching reminders:", err);
        toast.error("Failed to load reminders");
      } else {
        setReminders([]);
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchReminders();
    }
  }, [user, fetchReminders]);

  const calculateNextDate = (frequency: string): string => {
    const today = new Date();
    const nextDate = new Date(today);

    switch (frequency) {
      case "daily":
        nextDate.setDate(today.getDate() + 1);
        break;
      case "weekly":
        nextDate.setDate(today.getDate() + 7);
        break;
      case "monthly":
        nextDate.setMonth(today.getMonth() + 1);
        break;
      case "quarterly":
        nextDate.setMonth(today.getMonth() + 3);
        break;
      case "yearly":
        nextDate.setFullYear(today.getFullYear() + 1);
        break;
    }

    return nextDate.toISOString().split("T")[0];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!formData.title.trim()) {
      toast.error("Please enter a reminder title");
      return;
    }

    try {
      const nextDate = calculateNextDate(formData.frequency);

      if (editingReminder) {
        // Update existing reminder
        const { error } = await supabase
          .from("reminders")
          .update({
            title: formData.title,
            description: formData.description || null,
            reminder_type: formData.reminder_type,
            frequency: formData.frequency,
            email_notification: formData.email_notification,
            next_reminder_date: nextDate,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingReminder.id);

        if (error) throw error;
        toast.success("Reminder updated successfully");
      } else {
        // Create new reminder
        const { error } = await supabase
          .from("reminders")
          .insert({
            user_id: user.id,
            title: formData.title,
            description: formData.description || null,
            reminder_type: formData.reminder_type,
            frequency: formData.frequency,
            next_reminder_date: nextDate,
            is_active: true,
            email_notification: formData.email_notification,
          });

        if (error) throw error;
        toast.success("Reminder created successfully");
      }

      setIsDialogOpen(false);
      setEditingReminder(null);
      setFormData({
        title: "",
        description: "",
        reminder_type: "general",
        frequency: "monthly",
        email_notification: true,
      });
      fetchReminders();
    } catch (err: unknown) {
      console.error("Error saving reminder:", err);
      toast.error(err instanceof Error ? err.message : "Failed to save reminder");
    }
  };

  const handleEdit = (reminder: Reminder) => {
    setEditingReminder(reminder);
    setFormData({
      title: reminder.title,
      description: reminder.description || "",
      reminder_type: reminder.reminder_type,
      frequency: reminder.frequency,
      email_notification: reminder.email_notification,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this reminder?")) return;

    try {
      const { error } = await supabase
        .from("reminders")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Reminder deleted successfully");
      fetchReminders();
    } catch (err: unknown) {
      console.error("Error deleting reminder:", err);
      toast.error(err instanceof Error ? err.message : "Failed to delete reminder");
    }
  };

  const toggleReminder = async (reminder: Reminder) => {
    try {
      const { error } = await supabase
        .from("reminders")
        .update({
          is_active: !reminder.is_active,
          updated_at: new Date().toISOString(),
        })
        .eq("id", reminder.id);

      if (error) throw error;
      toast.success(`Reminder ${!reminder.is_active ? "activated" : "deactivated"}`);
      fetchReminders();
    } catch (err: unknown) {
      console.error("Error toggling reminder:", err);
      toast.error(err instanceof Error ? err.message : "Failed to update reminder");
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getReminderTypeInfo = (type: string) => {
    return reminderTypes.find((t) => t.value === type) || reminderTypes[4];
  };

  const getFrequencyLabel = (frequency: string) => {
    return frequencies.find((f) => f.value === frequency)?.label || frequency;
  };

  return (
    <div className="min-h-screen page-ambient bg-background">
      <main className="p-6 pb-12">
        <div className="app-shell max-w-6xl">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <Link to="/dashboard">
                  <Button variant="ghost" size="sm" className="gap-2">
                    <ArrowLeft className="w-4 h-4" />
                    Back
                  </Button>
                </Link>
                <div>
                  <h1 className="heading-section text-foreground mb-2">
                    Reminders
                  </h1>
                  <p className="text-muted-foreground">
                    Schedule periodic reminders to review and update your will
                  </p>
                </div>
              </div>
              <Button
                variant="gold"
                className="gap-2"
                onClick={() => {
                  setEditingReminder(null);
                  setFormData({
                    title: "",
                    description: "",
                    reminder_type: "general",
                    frequency: "monthly",
                    email_notification: true,
                  });
                  setIsDialogOpen(true);
                }}
              >
                <Plus className="w-5 h-5" />
                Create Reminder
              </Button>
            </div>
          </motion.div>

          {/* Info Banner */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card-elevated bg-sage/20 border-sage mb-8"
          >
            <div className="flex items-start gap-4">
              <AlertCircle className="w-5 h-5 text-foreground mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-foreground mb-1">
                  Why Set Reminders?
                </p>
                <p className="text-sm text-muted-foreground">
                  Regularly reviewing your will ensures it stays current with life changes, 
                  new assets, and updated beneficiary information. Set reminders to stay on top 
                  of your legacy planning.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Reminders List */}
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gold"></div>
            </div>
          ) : reminders.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="card-elevated text-center py-12"
            >
              <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-serif text-xl font-semibold text-foreground mb-2">
                No Reminders Yet
              </h3>
              <p className="text-muted-foreground mb-6">
                Create your first reminder to stay on top of your will updates
              </p>
              <Button
                variant="gold"
                className="gap-2"
                onClick={() => setIsDialogOpen(true)}
              >
                <Plus className="w-5 h-5" />
                Create Your First Reminder
              </Button>
            </motion.div>
          ) : (
            <div className="grid gap-4">
              {reminders.map((reminder, index) => {
                const typeInfo = getReminderTypeInfo(reminder.reminder_type);
                const TypeIcon = typeInfo.icon;
                const isOverdue = new Date(reminder.next_reminder_date) < new Date();

                return (
                  <motion.div
                    key={reminder.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + index * 0.05 }}
                    className={`card-elevated ${!reminder.is_active ? "opacity-60" : ""}`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0 ${!reminder.is_active ? "opacity-50" : ""}`}>
                        <TypeIcon className="w-6 h-6 text-foreground" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-foreground">
                                {reminder.title}
                              </h3>
                              {!reminder.is_active && (
                                <span className="px-2 py-0.5 rounded-full bg-secondary text-xs font-medium text-muted-foreground">
                                  Inactive
                                </span>
                              )}
                              {isOverdue && reminder.is_active && (
                                <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-600 text-xs font-medium">
                                  Overdue
                                </span>
                              )}
                            </div>
                            {reminder.description && (
                              <p className="text-sm text-muted-foreground mb-2">
                                {reminder.description}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-4 h-4" />
                            <span>Next: {formatDate(reminder.next_reminder_date)}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Repeat className="w-4 h-4" />
                            <span>{getFrequencyLabel(reminder.frequency)}</span>
                          </div>
                          {reminder.email_notification && (
                            <div className="flex items-center gap-1.5">
                              <Mail className="w-4 h-4" />
                              <span>Email enabled</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleReminder(reminder)}
                          title={reminder.is_active ? "Deactivate" : "Activate"}
                        >
                          {reminder.is_active ? (
                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                          ) : (
                            <Clock className="w-4 h-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(reminder)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(reminder.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingReminder ? "Edit Reminder" : "Create New Reminder"}
            </DialogTitle>
            <DialogDescription>
              {editingReminder
                ? "Update your reminder settings"
                : "Set up a new reminder to help you stay on top of your will updates"}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="title">Reminder Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="e.g., Review Will Documents"
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Add any additional notes about this reminder..."
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="reminder_type">Reminder Type</Label>
              <Select
                value={formData.reminder_type}
                onValueChange={(value) =>
                  setFormData({ ...formData, reminder_type: value })
                }
              >
                <SelectTrigger id="reminder_type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {reminderTypes.map((type) => {
                    const Icon = type.icon;
                    return (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          <Icon className="w-4 h-4" />
                          <span>{type.label}</span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                {getReminderTypeInfo(formData.reminder_type).description}
              </p>
            </div>

            <div>
              <Label htmlFor="frequency">Frequency</Label>
              <Select
                value={formData.frequency}
                onValueChange={(value) =>
                  setFormData({ ...formData, frequency: value })
                }
              >
                <SelectTrigger id="frequency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {frequencies.map((freq) => (
                    <SelectItem key={freq.value} value={freq.value}>
                      {freq.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg">
              <div className="flex-1">
                <Label htmlFor="email_notification" className="cursor-pointer">
                  Email Notifications
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Receive email reminders when it's time to review
                </p>
              </div>
              <Switch
                id="email_notification"
                checked={formData.email_notification}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, email_notification: checked })
                }
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsDialogOpen(false);
                  setEditingReminder(null);
                }}
              >
                Cancel
              </Button>
              <Button type="submit" variant="gold">
                {editingReminder ? "Update Reminder" : "Create Reminder"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Reminders;
