import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  try {
    const { campaign_id } = await req.json();

    if (!campaign_id) {
      return new Response(
        JSON.stringify({ success: false, error: "campaign_id is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: deliveries, error: deliveriesError } = await supabase
      .from("communication_deliveries")
      .select("id, user_id")
      .eq("campaign_id", campaign_id)
      .eq("channel", "in_app")
      .eq("status", "pending");

    if (deliveriesError) throw deliveriesError;

    if (!deliveries?.length) {
      return new Response(
        JSON.stringify({
          success: true,
          processed: 0,
          message: "No pending in-app deliveries",
        }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    const ids = deliveries.map((d) => d.id);

    const { error: updateError } = await supabase
      .from("communication_deliveries")
      .update({
        status: "delivered",
        queued_at: new Date().toISOString(),
        sent_at: new Date().toISOString(),
        delivered_at: new Date().toISOString(),
        provider: "internal",
      })
      .in("id", ids);

    if (updateError) throw updateError;

    return new Response(
      JSON.stringify({
        success: true,
        processed: deliveries.length,
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error(error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
});
