/**
 * Utility functions to view all database data
 * Use these functions to see what's saved in your database
 */

import { supabase } from "@/integrations/supabase/client";

export interface DatabaseView {
  authUser: any;
  profile: any;
  wills: any[];
  recipients: any[];
  assets: any[];
  allocations: any[];
  reminders: any[];
}

/**
 * View all database data for the current logged-in user
 * This will log everything to the console
 */
export const viewAllDatabaseData = async (): Promise<DatabaseView | null> => {
  try {
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.log("❌ No user logged in");
      return null;
    }

    console.log("=".repeat(60));
    console.log("📊 DATABASE DATA FOR USER:", user.id);
    console.log("=".repeat(60));

    // 1. Get Auth User Info
    console.log("\n🔐 AUTH USER:");
    console.log({
      id: user.id,
      email: user.email,
      created_at: user.created_at,
      last_sign_in_at: user.last_sign_in_at,
      email_confirmed_at: user.email_confirmed_at
    });

    // 2. Get Profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .single();
    
    console.log("\n📋 PROFILE:");
    if (profileError) {
      console.error("Error:", profileError);
    } else {
      console.log(profile);
    }

    // 3. Get All Wills
    const { data: wills, error: willsError } = await supabase
      .from("wills")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    
    console.log("\n📜 WILLS (Total:", wills?.length || 0, "):");
    if (willsError) {
      console.error("Error:", willsError);
    } else {
      console.table(wills || []);
    }

    // 4. Get All Recipients
    const { data: recipients, error: recipientsError } = await supabase
      .from("recipients")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    
    console.log("\n👥 RECIPIENTS (Total:", recipients?.length || 0, "):");
    if (recipientsError) {
      console.error("Error:", recipientsError);
    } else {
      console.table(recipients || []);
    }

    // 5. Get All Assets
    const { data: assets, error: assetsError } = await supabase
      .from("assets")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    
    console.log("\n💰 ASSETS (Total:", assets?.length || 0, "):");
    if (assetsError) {
      console.error("Error:", assetsError);
    } else {
      console.table(assets || []);
    }

    // 6. Get All Asset Allocations (with related data)
    const { data: allocations, error: allocationsError } = await supabase
      .from("asset_allocations")
      .select(`
        *,
        assets:asset_id (id, name, category),
        recipients:recipient_id (id, full_name, email)
      `)
      .order("created_at", { ascending: false });
    
    console.log("\n📊 ASSET ALLOCATIONS (Total:", allocations?.length || 0, "):");
    if (allocationsError) {
      console.error("Error:", allocationsError);
    } else {
      console.table(allocations || []);
    }

    // 7. Get All Reminders
    const { data: reminders, error: remindersError } = await supabase
      .from("reminders")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    
    console.log("\n🔔 REMINDERS (Total:", reminders?.length || 0, "):");
    if (remindersError) {
      console.error("Error:", remindersError);
    } else {
      console.table(reminders || []);
    }

    // Summary
    console.log("\n" + "=".repeat(60));
    console.log("📈 SUMMARY:");
    console.log("=".repeat(60));
    console.log("Profile:", profile ? "✅ Exists" : "❌ Not found");
    console.log("Wills:", wills?.length || 0);
    console.log("Recipients:", recipients?.length || 0);
    console.log("Assets:", assets?.length || 0);
    console.log("Allocations:", allocations?.length || 0);
    console.log("Reminders:", reminders?.length || 0);
    console.log("=".repeat(60));

    return {
      authUser: user,
      profile: profile || null,
      wills: wills || [],
      recipients: recipients || [],
      assets: assets || [],
      allocations: allocations || [],
      reminders: reminders || []
    };
  } catch (error) {
    console.error("❌ Error viewing database:", error);
    return null;
  }
};

/**
 * Get summary counts for all tables
 */
export const getDatabaseSummary = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const [wills, recipients, assets, allocations, reminders] = await Promise.all([
      supabase.from("wills").select("id", { count: "exact", head: true }).eq("user_id", user.id),
      supabase.from("recipients").select("id", { count: "exact", head: true }).eq("user_id", user.id),
      supabase.from("assets").select("id", { count: "exact", head: true }).eq("user_id", user.id),
      supabase.from("asset_allocations").select("id", { count: "exact", head: true }),
      supabase.from("reminders").select("id", { count: "exact", head: true }).eq("user_id", user.id)
    ]);

    return {
      wills: wills.count || 0,
      recipients: recipients.count || 0,
      assets: assets.count || 0,
      allocations: allocations.count || 0,
      reminders: reminders.count || 0
    };
  } catch (error) {
    console.error("Error getting summary:", error);
    return null;
  }
};
