import fs from "fs";

const source = fs.readFileSync("script.js", "utf8");

const names = [
  "NBA_TEAM_SEASON_STATS_CSV_URL",
  "NBA_TEAM_TRENDS_CSV_URL",
  "NBA_TEAM_GAME_LOGS_CSV_URL",
  "NBA_SCHEDULE_CSV_URL"
];

for (const name of names) {
  const line = source
    .split(/\r?\n/)
    .find(line => line.includes(`const ${name}`));

  console.log("\n==================================================");
  console.log(name);
  console.log("==================================================");

  if (!line) {
    console.log("CONSTANT NOT FOUND");
    continue;
  }

  const urlMatch = line.match(/https?:\/\/[^"'`]+/);

  if (!urlMatch) {
    console.log("URL NOT FOUND");
    console.log("Source line:", line);
    continue;
  }

  const url = urlMatch[0];

  console.log("URL:", url);

  try {
    const response = await fetch(url);
    const text = await response.text();

    console.log("HTTP:", response.status);
    console.log(
      "Content-Type:",
      response.headers.get("content-type")
    );
    console.log("Bytes:", text.length);

    const lines = text
      .split(/\r?\n/)
      .filter(line => line.trim());

    console.log("Non-empty lines:", lines.length);

    console.log("\nFirst 500 characters:");
    console.log(JSON.stringify(text.slice(0, 500)));

    console.log("\nFirst 5 non-empty lines:");
    lines.slice(0, 5).forEach((line, index) => {
      console.log(`${index + 1}: ${line}`);
    });
  } catch (error) {
    console.log(
      "FETCH ERROR:",
      error?.message || String(error)
    );
  }
}

console.log("\n==================================================");
console.log("NBA SOURCE DIAGNOSIS COMPLETE");
console.log("==================================================");
