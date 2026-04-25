import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailPayload {
  to: string;
  subject: string;
  html: string;
}

async function sendEmail(payload: EmailPayload): Promise<boolean> {
  // Using Resend API for email sending
  // You can replace this with any email service (SendGrid, Mailgun, etc.)
  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
  
  if (!RESEND_API_KEY) {
    console.error("RESEND_API_KEY is not configured");
    // Fallback: Use Supabase's built-in email if Resend is not configured
    // For production, you should configure Resend or another email service
    return false;
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "LegacyWallet <noreply@legacywallet.com>", // Update with your verified domain
        to: payload.to,
        subject: payload.subject,
        html: payload.html,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = errorText;
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.message || errorText;
      } catch {
        // If not JSON, use the text as-is
      }
      console.error("Resend API error:", response.status, errorMessage);
      return false;
    }

    const result = await response.json();
    console.log("Email sent successfully to:", payload.to);
    return true;
  } catch (error) {
    console.error("Error sending email:", error);
    return false;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { willId, userId } = await req.json();

    if (!willId || !userId) {
      return new Response(
        JSON.stringify({ error: "willId and userId are required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Initialize Supabase client
    // Supabase URL and service key are automatically available in Edge Functions
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Missing Supabase configuration:", {
        hasUrl: !!supabaseUrl,
        hasKey: !!supabaseServiceKey,
      });
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch will details
    const { data: will, error: willError } = await supabase
      .from("wills")
      .select("id, title, type, user_id")
      .eq("id", willId)
      .eq("user_id", userId)
      .single();

    if (willError || !will) {
      return new Response(
        JSON.stringify({ error: "Will not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Fetch user profile for the will creator (maybeSingle: no error when no row)
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("user_id", userId)
      .maybeSingle();

    const creatorName = profile?.full_name || "the will creator";

    // Fetch recipients with email addresses
    const { data: recipients, error: recipientsError } = await supabase
      .from("recipients")
      .select("id, full_name, email, relationship")
      .eq("user_id", userId)
      .not("email", "is", null);

    if (recipientsError) {
      console.error("Error fetching recipients:", recipientsError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch recipients" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!recipients || recipients.length === 0) {
      return new Response(
        JSON.stringify({ message: "No recipients with email addresses found", sent: 0 }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Send emails to all recipients
    const emailResults = await Promise.allSettled(
      recipients.map(async (recipient) => {
        if (!recipient.email) return { success: false, email: recipient.email };

        const emailHtml = `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Will Finalized Notification</title>
            </head>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #d4af37 0%, #f4e4bc 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
                <h1 style="color: #1a1a2e; margin: 0; font-size: 28px;">Your Will Has Been Finalized</h1>
              </div>
              
              <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
                <p style="font-size: 16px; margin-bottom: 20px;">
                  Dear ${recipient.full_name},
                </p>
                
                <p style="font-size: 16px; margin-bottom: 20px;">
                  This is to inform you that ${creatorName} has finalized their digital will. 
                  ${recipient.relationship ? `As their ${recipient.relationship},` : "As a named beneficiary,"} 
                  you have been designated as a recipient in this will.
                </p>
                
                <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #d4af37;">
                  <p style="margin: 0; font-size: 14px; color: #666;">
                    <strong>Will Title:</strong> ${will.title}<br>
                    <strong>Will Type:</strong> ${will.type.charAt(0).toUpperCase() + will.type.slice(1)} Will<br>
                    <strong>Finalized:</strong> ${new Date().toLocaleDateString("en-US", { 
                      year: "numeric", 
                      month: "long", 
                      day: "numeric" 
                    })}
                  </p>
                </div>
                
                <p style="font-size: 16px; margin-bottom: 20px;">
                  Your will is now securely stored and encrypted. You will be notified when access conditions are met 
                  and you can view the will details.
                </p>
                
                <p style="font-size: 16px; margin-bottom: 20px;">
                  If you have any questions or need to verify your identity, please contact us through the LegacyWallet platform.
                </p>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${Deno.env.get("APP_URL") || "https://legacywallet.com"}/dashboard" 
                     style="display: inline-block; background: linear-gradient(135deg, #d4af37 0%, #f4e4bc 100%); 
                            color: #1a1a2e; padding: 12px 30px; text-decoration: none; 
                            border-radius: 6px; font-weight: bold; font-size: 16px;">
                    View Dashboard
                  </a>
                </div>
                
                <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
                
                <p style="font-size: 12px; color: #999; text-align: center; margin: 0;">
                  This is an automated notification from LegacyWallet.<br>
                  Please do not reply to this email. If you have concerns, contact us through the platform.
                </p>
              </div>
            </body>
          </html>
        `;

        const success = await sendEmail({
          to: recipient.email,
          subject: `Will Finalized: ${will.title}`,
          html: emailHtml,
        });

        return { success, email: recipient.email, name: recipient.full_name };
      })
    );

    const successful = emailResults.filter(
      (result) => result.status === "fulfilled" && result.value.success
    ).length;

    const failed = emailResults.filter(
      (result) => result.status === "rejected" || (result.status === "fulfilled" && !result.value.success)
    ).length;

    return new Response(
      JSON.stringify({
        message: `Email notifications sent to ${successful} recipient(s)`,
        sent: successful,
        failed: failed,
        total: recipients.length,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in notify-recipients function:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error occurred",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
