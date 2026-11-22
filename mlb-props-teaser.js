function parseCSVLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"' && inQuotes && nextChar === '"') {
      current += '"';
      i++;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}

function parseCSV(text) {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length < 2) return [];

  const headers = parseCSVLine(lines[0]);

  return lines.slice(1).map((line) => {
    const values = parseCSVLine(line);
    const row = {};

    headers.forEach((header, index) => {
      row[header] = values[index] || "";
    });

    return row;
  });
}

function toNumber(value) {
  if (value === null || value === undefined || value === "") return NaN;
  const cleaned = String(value).replace(/[^0-9.-]/g, "");
  return Number(cleaned);
}

function safeText(value, fallback = "") {
  return value && String(value).trim() !== "" ? String(value).trim() : fallback;
}

function normalizeDate(value) {
  if (!value) return "";

  const raw = String(value).trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;

  const mmddyyyyMatch = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (mmddyyyyMatch) {
    const month = mmddyyyyMatch[1].padStart(2, "0");
    const day = mmddyyyyMatch[2].padStart(2, "0");
    const year = mmddyyyyMatch[3];
    return `${year}-${month}-${day}`;
  }

  const parsed = new Date(raw);
  if (!Number.isNaN(parsed.getTime())) {
    const year = parsed.getFullYear();
    const month = String(parsed.getMonth() + 1).padStart(2, "0");
    const day = String(parsed.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  return raw;
}

function getTodayDateString() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Phoenix" }).format(new Date());
}

exports.handler = async function () {
  const sourceUrl = process.env.MLB_PROPS_SOURCE_URL;

  if (!sourceUrl) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Missing MLB_PROPS_SOURCE_URL environment variable" })
    };
  }

  try {
      const controller = new AbortController();

      const timeoutId = setTimeout(
        () => controller.abort(),
        10000
      );

      let response;

      try {
        response = await fetch(sourceUrl, {
          signal: controller.signal
        });
      } finally {
        clearTimeout(timeoutId);
      }

    if (!response.ok) {
      return {
        statusCode: response.status,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: `Failed to fetch MLB props CSV: ${response.status}` })
      };
    }

    const csvText = await response.text();
    const rows = parseCSV(csvText);
    const today = getTodayDateString();

    const todaysRows = rows
      .map((row) => {
        const gameDate = normalizeDate(row["Game Date"]);
        const playerFirstName = safeText(row["Player First Name"]);
        const playerLastName = safeText(row["Player Last Name"]);
        const playerName = safeText(row["Player Name"]) || `${playerFirstName} ${playerLastName}`.trim();
        const bestSide = safeText(row["Best Side"]);
        const sportacularScore = toNumber(row["Sportacular Score"]);
        const ev = toNumber(row["Best EV"] || row["EV Over"] || row["EV Over/Milestone ($1 Bet)"]);

        const awayTeam = safeText(row["Away Team"]);
        const homeTeam = safeText(row["Home Team"]);
        const gameLabel = awayTeam && homeTeam ? `${awayTeam} at ${homeTeam}` : "";

        return {
          gameDate,
          playerName,
          playerFirstName,
          playerLastName,
          vendor: safeText(row["Vendor"]),
          propType: safeText(row["Prop Type"]),
          lineValue: safeText(row["Line Value"]),
          betType: bestSide || safeText(row["Type"]),
          overOdds: safeText(row["Over Odds"]),
          underOdds: safeText(row["Under Odds"]),
          genericOdds: safeText(row["Odds"]),
          ev,
          sportacularScore: Number.isFinite(sportacularScore) ? sportacularScore : null,
          confidenceTier: safeText(row["Confidence Tier"]),
          riskTier: safeText(row["Risk Tier"]),
          lineHitRate: safeText(row["Line Hit Rate"]),
          awayTeam,
          homeTeam,
          gameLabel
        };
      })
      .filter((row) =>
        row.gameDate === today &&
        row.playerName &&
        row.vendor &&
        row.propType &&
        row.lineValue &&
        (row.betType === "Over" || row.betType === "Under") &&
        (Number.isFinite(row.sportacularScore) || !Number.isNaN(row.ev))
      )
      .sort((a, b) => (b.sportacularScore ?? -1) - (a.sportacularScore ?? -1) || (b.ev || 0) - (a.ev || 0))
      .slice(0, 5);

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-cache",
        "Netlify-CDN-Cache-Control":
          "public, durable, max-age=60, stale-while-revalidate=120"
      },
      body: JSON.stringify({
        access: "public_teaser",
        league: "MLB",
        count: todaysRows.length,
        props: todaysRows
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        error: "Server error while fetching MLB props teaser",
        details: error.message
      })
    };
  }
};