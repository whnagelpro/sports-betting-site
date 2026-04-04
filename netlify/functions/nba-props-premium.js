const { createClient } = require("@supabase/supabase-js");

const ALLOWED_TIERS = ["All-Star", "Hall-of-Famer", "Legend"];

exports.handler = async function (event) {
  const sourceUrl = process.env.NBA_PROPS_SOURCE_URL;
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!sourceUrl) {
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        error: "Missing NBA_PROPS_SOURCE_URL environment variable"
      })
    };
  }

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        error: "Missing Supabase server environment variables"
      })
    };
  }

  const authHeader =
    event.headers.authorization || event.headers.Authorization || "";

  if (!authHeader.startsWith("Bearer ")) {
    return {
      statusCode: 401,
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        error: "Missing or invalid Authorization header"
      })
    };
  }

  const accessToken = authHeader.replace("Bearer ", "").trim();

  if (!accessToken) {
    return {
      statusCode: 401,
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        error: "Missing access token"
      })
    };
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser(accessToken);

    if (userError || !user) {
      return {
        statusCode: 401,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          error: "Unauthorized user",
          details: userError?.message || "User not found from token"
        })
      };
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, email, tier")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      return {
        statusCode: 403,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          error: "Profile not found",
          details: profileError?.message || "No matching profile row"
        })
      };
    }

    if (!ALLOWED_TIERS.includes(profile.tier)) {
      return {
        statusCode: 403,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          error: "Upgrade required",
          message: "NBA premium props require All-Star or higher",
          tier: profile.tier
        })
      };
    }

    const response = await fetch(sourceUrl);

    if (!response.ok) {
      return {
        statusCode: response.status,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          error: `Failed to fetch NBA props CSV: ${response.status}`
        })
      };
    }

    const csvText = await response.text();

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store"
      },
      body: csvText
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        error: "Server error while fetching protected NBA props",
        details: error.message
      })
    };
  }
};