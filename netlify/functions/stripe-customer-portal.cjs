const Stripe = require("stripe");
const { createClient } = require("@supabase/supabase-js");

const RETURN_URL = "https://sportacularanalytics.com/auth.html";

function jsonResponse(statusCode, body) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store"
    },
    body: JSON.stringify(body)
  };
}

exports.handler = async function (event) {
  if (event.httpMethod !== "POST") {
    return jsonResponse(405, {
      error: "Method not allowed"
    });
  }

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!stripeSecretKey) {
    return jsonResponse(500, {
      error: "Missing Stripe server environment variable"
    });
  }

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    return jsonResponse(500, {
      error: "Missing Supabase server environment variables"
    });
  }

  const authHeader =
    event.headers?.authorization ||
    event.headers?.Authorization ||
    "";

  if (!authHeader.startsWith("Bearer ")) {
    return jsonResponse(401, {
      error: "Missing or invalid Authorization header"
    });
  }

  const accessToken = authHeader
    .replace("Bearer ", "")
    .trim();

  if (!accessToken) {
    return jsonResponse(401, {
      error: "Missing access token"
    });
  }

  try {
    const supabase = createClient(
      supabaseUrl,
      supabaseServiceRoleKey
    );

    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser(accessToken);

    if (userError || !user) {
      return jsonResponse(401, {
        error: "Unauthorized user"
      });
    }

    const { data: profile, error: profileError } =
      await supabase
        .from("profiles")
        .select("id, email, tier")
        .eq("id", user.id)
        .single();

    if (profileError || !profile) {
      return jsonResponse(403, {
        error: "Profile not found"
      });
    }

    const email = String(
      user.email || profile.email || ""
    )
      .trim()
      .toLowerCase();

    if (!email) {
      return jsonResponse(400, {
        error: "Authenticated account has no email address"
      });
    }

    const stripe = new Stripe(stripeSecretKey);

    const customers = await stripe.customers.list({
      email,
      limit: 100
    });

    const matches = customers.data.filter(
      customer =>
        !customer.deleted &&
        String(customer.email || "")
          .trim()
          .toLowerCase() === email
    );

    if (matches.length === 0) {
      return jsonResponse(404, {
        error: "No billing account found"
      });
    }

    if (matches.length !== 1) {
      return jsonResponse(409, {
        error: "Multiple billing accounts found"
      });
    }

    const customer = matches[0];

    const subscriptions =
      await stripe.subscriptions.list({
        customer: customer.id,
        status: "all",
        limit: 100
      });

    const manageableSubscriptions =
      subscriptions.data.filter(subscription =>
        ["active", "trialing", "past_due", "unpaid"].includes(
          subscription.status
        )
      );

    if (manageableSubscriptions.length === 0) {
      return jsonResponse(404, {
        error: "No active subscription found"
      });
    }

    const portalSession =
      await stripe.billingPortal.sessions.create({
        customer: customer.id,
        return_url: RETURN_URL
      });

    if (!portalSession?.url) {
      return jsonResponse(500, {
        error: "Unable to create billing portal session"
      });
    }

    return jsonResponse(200, {
      url: portalSession.url
    });
  } catch (error) {
    console.error(
      "Stripe customer portal error:",
      error?.message || error
    );

    return jsonResponse(500, {
      error: "Unable to open billing portal"
    });
  }
};
