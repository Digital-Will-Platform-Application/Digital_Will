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
  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
  
  if (!RESEND_API_KEY) {
    console.error("RESEND_API_KEY is not configured");
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
        from: "Digital Will <noreply@digitalwill.com>", // Update with your verified domain
        to: payload.to,
        subject: payload.subject,
        html: payload.html,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Resend API error:", response.status, errorText);
      return false;
    }

    console.log("Verification email sent successfully to:", payload.to);
    return true;
  } catch (error) {
    console.error("Error sending verification email:", error);
    return false;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate the request
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
    
    if (!supabaseUrl || !supabaseAnonKey) {
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    });

    // Verify the user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { recipientId } = await req.json();

    if (!recipientId) {
      return new Response(
        JSON.stringify({ error: "recipientId is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Fetch recipient details
    const { data: recipient, error: recipientError } = await supabase
      .from("recipients")
      .select("id, full_name, email, verification_code_hash, verification_code_expires_at, user_id")
      .eq("id", recipientId)
      .eq("user_id", user.id)
      .single();

    if (recipientError || !recipient) {
      return new Response(
        JSON.stringify({ error: "Recipient not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!recipient.email) {
      return new Response(
        JSON.stringify({ error: "Recipient does not have an email address" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Generate a new verification code (always generate new for security)
    // Generate a secure random token (64 characters)
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    const verificationCode = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    
    // Hash the verification code using SHA-256
    const codeBuffer = new TextEncoder().encode(verificationCode);
    const hashBuffer = await crypto.subtle.digest('SHA-256', codeBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const verificationCodeHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    // Set expiration to 7 days from now
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + 7);
    const expiresAt = expirationDate.toISOString();

    // Update recipient with hashed verification code, expiration, and reset attempts
    const { error: updateError } = await supabase
      .from("recipients")
      .update({ 
        verification_code_hash: verificationCodeHash,
        verification_code_expires_at: expiresAt,
        verification_attempts: 0,
        last_verification_attempt_at: null
      })
      .eq("id", recipientId);

    if (updateError) {
      console.error("Error updating verification code:", updateError);
      return new Response(
        JSON.stringify({ error: "Failed to generate verification code" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get the base URL for the verification link
    // Try to get from environment variable, or construct from request origin
    const siteUrl = Deno.env.get("SITE_URL") || 
                    Deno.env.get("SUPABASE_URL")?.replace(/\/\/.*@/, "//")?.replace(/\.supabase\.co.*/, "") ||
                    "https://digitalwill.com"; // Update with your production URL
    const verificationUrl = `${siteUrl}/verify-recipient?token=${verificationCode}&id=${recipient.id}`;

    // Fetch user profile for personalization
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("user_id", user.id)
      .single();

    const creatorName = profile?.full_name || "the will creator";

    // Create email content
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verify Your Identity - Digital Will</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #1a3a52 0%, #2d5a7a 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: #fff; margin: 0; font-size: 28px;">Digital Will</h1>
          </div>
          <div style="background: #fff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
            <h2 style="color: #1a3a52; margin-top: 0;">Verify Your Identity</h2>
            <p>Hello ${recipient.full_name},</p>
            <p>You have been named as a recipient in ${creatorName}'s will on Digital Will. To verify your identity and confirm your contact information, please click the button below:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" style="display: inline-block; background: linear-gradient(135deg, #d4af37 0%, #f4d03f 100%); color: #1a3a52; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">Verify Identity</a>
            </div>
            <p style="color: #666; font-size: 14px;">Or copy and paste this link into your browser:</p>
            <p style="color: #666; font-size: 12px; word-break: break-all;">${verificationUrl}</p>
            <p style="color: #666; font-size: 14px; margin-top: 30px;">This verification link will expire in 7 days for security reasons.</p>
            <p style="color: #666; font-size: 14px;">If you did not expect this email, please ignore it.</p>
            <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
            <p style="color: #999; font-size: 12px; text-align: center;">This is an automated message from Digital Will. Please do not reply to this email.</p>
          </div>
        </body>
      </html>
    `;

    // Send verification email
    const emailSent = await sendEmail({
      to: recipient.email,
      subject: "Verify Your Identity - Digital Will",
      html: emailHtml,
    });

    if (!emailSent) {
      return new Response(
        JSON.stringify({ error: "Failed to send verification email" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: "Verification email sent successfully" }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in send-verification-email:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
