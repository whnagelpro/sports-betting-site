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
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return NaN;
  }

  const cleaned = String(value)
    .replace(/[^0-9.-]/g, "");

  return Number(cleaned);
}

function safeText(value, fallback = "") {
  return value && String(value).trim() !== ""
    ? String(value).trim()
    : fallback;
}

function normalizeDate(value) {
  if (!value) return "";

  const raw = String(value).trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return raw;
  }

  const mmddyyyyMatch =
    raw.match(
      /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/
    );

  if (mmddyyyyMatch) {
    const month =
      mmddyyyyMatch[1].padStart(2, "0");

    const day =
      mmddyyyyMatch[2].padStart(2, "0");

    const year =
      mmddyyyyMatch[3];

    return `${year}-${month}-${day}`;
  }

  const parsed = new Date(raw);

  if (!Number.isNaN(parsed.getTime())) {
    const year =
      parsed.getFullYear();

    const month =
      String(parsed.getMonth() + 1)
        .padStart(2, "0");

    const day =
      String(parsed.getDate())
        .padStart(2, "0");

    return `${year}-${month}-${day}`;
  }

  return raw;
}

function getTodayDateString() {
  const today = new Date();

  const year =
    today.getFullYear();

  const month =
    String(today.getMonth() + 1)
      .padStart(2, "0");

  const day =
    String(today.getDate())
      .padStart(2, "0");

  return `${year}-${month}-${day}`;
}

/*
 * NFL EV Over and EV Under currently represent decimal return.
 *
 * Example:
 * 1.91 decimal return becomes 0.91 net EV for display/ranking.
 *
 * If a value is already below 1, it is treated as net EV.
 */
function normalizeNFLNetEV(value) {
  const number = toNumber(value);

  if (Number.isNaN(number)) {
    return NaN;
  }

  return number >= 1
    ? number - 1
    : number;
}

exports.handler = async function () {
  const sourceUrl =
    process.env.NFL_PROPS_SOURCE_URL;

  if (!sourceUrl) {
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        error:
          "Missing NFL_PROPS_SOURCE_URL environment variable"
      })
    };
  }

  try {
    const response =
      await fetch(sourceUrl);

    if (!response.ok) {
      return {
        statusCode: response.status,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          error:
            `Failed to fetch NFL props CSV: ${response.status}`
        })
      };
    }

    const csvText =
      await response.text();

    const rows =
      parseCSV(csvText);

    const today =
      getTodayDateString();

    const props = [];

    rows.forEach((row) => {
      const gameDate =
        normalizeDate(row["Game Date"]);

      if (gameDate !== today) {
        return;
      }

      const playerFirstName =
        safeText(row["Player First Name"]);

      const playerLastName =
        safeText(row["Player Last Name"]);

      const combinedName =
        `${playerFirstName} ${playerLastName}`
          .trim();

      const playerName =
        safeText(row["Player Name"]) ||
        combinedName;

      const awayTeam =
        safeText(row["Away Team"]);

      const homeTeam =
        safeText(row["Home Team"]);

      const gameLabel =
        awayTeam && homeTeam
          ? `${awayTeam} at ${homeTeam}`
          : "";

      const vendor =
        safeText(row["Vendor"]);

      const propType =
        safeText(row["Prop Type"]);

      const lineValue =
        safeText(row["Line Value"]);

      const overOdds =
        safeText(row["Over Odds"]);

      const underOdds =
        safeText(row["Under Odds"]);

      const impliedProbOver =
        toNumber(row["Implied Prob Over"]);

      const impliedProbUnder =
        toNumber(row["Implied Prob Under"]);

      const evOver =
        normalizeNFLNetEV(row["EV Over"]);

      const evUnder =
        normalizeNFLNetEV(row["EV Under"]);

      const sharedFields = {
        gameDate,
        playerName,
        playerFirstName,
        playerLastName,
        vendor,
        propType,
        lineValue,
        overOdds,
        underOdds,
        awayTeam,
        homeTeam,
        gameLabel,
        team: safeText(row["Team"])
      };

      if (
        playerName &&
        vendor &&
        propType &&
        lineValue !== "" &&
        overOdds !== "" &&
        !Number.isNaN(evOver)
      ) {
        props.push({
          ...sharedFields,
          betType: "Over",
          genericOdds: overOdds,
          impliedProbability:
            impliedProbOver,
          ev: evOver
        });
      }

      if (
        playerName &&
        vendor &&
        propType &&
        lineValue !== "" &&
        underOdds !== "" &&
        !Number.isNaN(evUnder)
      ) {
        props.push({
          ...sharedFields,
          betType: "Under",
          genericOdds: underOdds,
          impliedProbability:
            impliedProbUnder,
          ev: evUnder
        });
      }
    });

    const topProps = props
      .sort((a, b) => b.ev - a.ev)
      .slice(0, 5);

    return {
      statusCode: 200,
      headers: {
        "Content-Type":
          "application/json; charset=utf-8",
        "Cache-Control": "no-store"
      },
      body: JSON.stringify({
        access: "public_teaser",
        league: "NFL",
        count: topProps.length,
        props: topProps
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        error:
          "Server error while fetching NFL props teaser",
        details: error.message
      })
    };
  }
};