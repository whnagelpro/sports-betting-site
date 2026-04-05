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

function toNumber(value) {
  if (value === null || value === undefined || value === "") return NaN;
  const cleaned = String(value).replace(/[^0-9.-]/g, "");
  return Number(cleaned);
}

function safeText(value, fallback = "") {
  return value && String(value).trim() !== "" ? String(value).trim() : fallback;
}

function buildPropsFromRows(rows) {
  return rows
    .map((row) => {
      const gameDate = normalizeDate(row["Game Date"]);
      const playerName = safeText(row["Player Name"], "");
      const playerFirstName = safeText(row["Player First Name"], "");
      const playerLastName = safeText(row["Player Last Name"], "");
      const vendor = safeText(row["Vendor"], "");
      const propType = safeText(row["Prop Type"], "");
      const lineValue = safeText(row["Line Value"], "");
      const betType = safeText(row["Type"], "");
      const overOdds = safeText(row["Over Odds"], "");
      const underOdds = safeText(row["Under Odds"], "");
      const genericOdds = safeText(row["Odds"], "");
      const poissonProbOver = toNumber(row["Poisson Prob Over"]);
      const ev = toNumber(row["EV (Over/Milestone Side)"]);
      const awayTeam = safeText(row["Away Team"], "");
      const homeTeam = safeText(row["Home Team"], "");

      const gameLabel = awayTeam && homeTeam ? `${awayTeam} at ${homeTeam}` : "";

      return {
        gameDate,
        playerName,
        playerFirstName,
        playerLastName,
        vendor,
        propType,
        lineValue,
        betType,
        overOdds,
        underOdds,
        genericOdds,
        poissonProbOver,
        ev,
        awayTeam,
        homeTeam,
        gameLabel
      };
    })
    .filter((prop) =>
      prop.gameDate &&
      (prop.playerName || prop.playerFirstName || prop.playerLastName) &&
      prop.vendor &&
      prop.propType &&
      prop.lineValue &&
      !Number.isNaN(prop.ev)
    );
}

function getTodayDateString() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

exports.handler = async function () {
  const sourceUrl = process.env.MLB_PROPS_TEASER_SOURCE_URL;

  if (!sourceUrl) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        error: "Missing MLB_PROPS_TEASER_SOURCE_URL environment variable"
      })
    };
  }

  try {
    const response = await fetch(sourceUrl);

    if (!response.ok) {
      return {
        statusCode: response.status,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          error: `Failed to fetch MLB teaser props CSV: ${response.status}`
        })
      };
    }

    const text = await response.text();
    const rows = parseCSV(text);
    const props = buildPropsFromRows(rows);
    const today = getTodayDateString();

    const teaserProps = props
      .filter((prop) => prop.gameDate === today)
      .sort((a, b) => b.ev - a.ev)
      .slice(0, 5);

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store"
      },
      body: JSON.stringify({ props: teaserProps })
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        error: "Server error while fetching MLB teaser props",
        details: error.message
      })
    };
  }
};