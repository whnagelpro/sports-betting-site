const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const { createClient } = require("@supabase/supabase-js");

const PRICE_TO_TIER = {
  // Veteran
  price_1TS6EsAxfar5vTD8qRQJ5UDz: "Veteran",
  price_1TS6EwAxfar5vTD8V0ty68wr: "Veteran",

  // All-Star
  price_1TS6EsAxfar5vTD8qRKCkKvX: "All-Star",
  price_1TS6EwAxfar5vTD86m3aO4zA: "All-Star",

  // Hall-of-Famer
  price_1TS6EtAxfar5vTD8b98Ya2kI: "Hall-of-Famer",
  price_1TS6EwAxfar5vTD8NfwI73rb: "Hall-of-Famer",

  // Legend
  price_1TS6EuAxfar5vTD8toK8i49L: "Legend",
  price_1TS6EwAxfar5vTD8bhHNulkj: "Legend"
};

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

exports.handler = async function (event) {
  const signature = event.headers["stripe-signature"];

  let stripeEvent;

  try {
    stripeEvent = stripe.webhooks.constructEvent(
      event.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);

    return {
      statusCode: 400,
      body: `Webhook Error: ${err.message}`
    };
  }

  try {
    if (stripeEvent.type === "checkout.session.completed") {
      const session = stripeEvent.data.object;

      const fullSession = await stripe.checkout.sessions.retrieve(session.id, {
        expand: ["line_items", "customer"]
      });

      const email =
        fullSession.customer_details?.email ||
        fullSession.customer_email ||
        fullSession.customer?.email;

      const priceId = fullSession.line_items?.data?.[0]?.price?.id;
      const tier = PRICE_TO_TIER[priceId];

      if (!email || !tier) {
        console.log("Missing email or tier mapping:", { email, priceId, tier });

        return {
          statusCode: 200,
          body: JSON.stringify({ received: true, skipped: true })
        };
      }

      const { data, error } = await supabase
        .from("profiles")
        .update({ tier })
        .ilike("email", email)
        .select("id, email, tier");

      if (error) {
        throw error;
      }

      console.log("Updated user tier after checkout:", {
        email,
        priceId,
        tier,
        updatedRows: data
      });
    }

    if (stripeEvent.type === "customer.subscription.deleted") {
      const subscription = stripeEvent.data.object;

      const customer = await stripe.customers.retrieve(subscription.customer);
      const email = customer.email;

      if (email) {
        const { data, error } = await supabase
          .from("profiles")
          .update({ tier: "Rookie" })
          .ilike("email", email)
          .select("id, email, tier");

        if (error) {
          throw error;
        }

        console.log("Downgraded canceled subscription to Rookie:", {
          email,
          updatedRows: data
        });
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ received: true })
    };
  } catch (err) {
    console.error("Stripe webhook handler failed:", err);

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Webhook handler failed",
        details: err.message
      })
    };
  }
};