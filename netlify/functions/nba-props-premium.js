exports.handler = async function () {
  const sourceUrl = process.env.NBA_PROPS_SOURCE_URL;

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

  try {
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
        error: "Server error while fetching NBA props",
        details: error.message
      })
    };
  }
};