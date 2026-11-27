// ======================================================
// Sportacular Analytics
// Player Profile Page
// ======================================================

"use strict";

// ------------------------------------------------------
// Global State
// ------------------------------------------------------

let currentLeague = "";
let currentPlayerId = "";
let player = null;
let trendHitRates = {};
let propHitRates = {};

const PLAYER_TREND_CSV = {
    nba: "https://docs.google.com/spreadsheets/d/e/2PACX-1vSV5XcArDjbKFyuONKov27C10JpN63ZcNiVKMnz5G4OEbM4tGToyslSZw9anHPAQfCE0IQupDMg8Cay/pub?gid=1458653646&single=true&output=csv",
    nhl: "https://docs.google.com/spreadsheets/d/e/2PACX-1vQYTgu9bsGUhI1gicOOfLrgYHmNMfrl3W1OKhAVs9cdrdd2CagJZSVM3F25hQ8vk0aRK7hapVmbNWQP/pub?gid=620239444&single=true&output=csv",
    mlb: "https://docs.google.com/spreadsheets/d/e/2PACX-1vRp1qdWZXtA4IB8NB6xnrtirs_Lv3EWNyyJbfpmR4_BZNujv-u4KgaOcJ6do9OfSWnIXeS56EfYQaZx/pub?gid=1443511953&single=true&output=csv",
    nfl: "https://docs.google.com/spreadsheets/d/e/2PACX-1vS7eg-0liRvxa9q2k6IM2mipst48DHUMa8yXltD8irldOtim2Emic7w0rtl1gfT5xl_AVhR29jBrqY1/pub?gid=1953623841&single=true&output=csv"
};

const PLAYER_SCHEDULE_CSV = {
    nba: "https://docs.google.com/spreadsheets/d/e/2PACX-1vSV5XcArDjbKFyuONKov27C10JpN63ZcNiVKMnz5G4OEbM4tGToyslSZw9anHPAQfCE0IQupDMg8Cay/pub?gid=1724367340&single=true&output=csv",
    nhl: "https://docs.google.com/spreadsheets/d/e/2PACX-1vQYTgu9bsGUhI1gicOOfLrgYHmNMfrl3W1OKhAVs9cdrdd2CagJZSVM3F25hQ8vk0aRK7hapVmbNWQP/pub?gid=2048323486&single=true&output=csv",
    mlb: "https://docs.google.com/spreadsheets/d/e/2PACX-1vRp1qdWZXtA4IB8NB6xnrtirs_Lv3EWNyyJbfpmR4_BZNujv-u4KgaOcJ6do9OfSWnIXeS56EfYQaZx/pub?gid=314629327&single=true&output=csv",
    nfl: "https://docs.google.com/spreadsheets/d/e/2PACX-1vS7eg-0liRvxa9q2k6IM2mipst48DHUMa8yXltD8irldOtim2Emic7w0rtl1gfT5xl_AVhR29jBrqY1/pub?gid=1131205016&single=true&output=csv"
};

let closedPropKeys = new Set();
let playerGameHasStarted = false;

const PLAYER_PROPS_CSV = {
    nba: "https://docs.google.com/spreadsheets/d/e/2PACX-1vSV5XcArDjbKFyuONKov27C10JpN63ZcNiVKMnz5G4OEbM4tGToyslSZw9anHPAQfCE0IQupDMg8Cay/pub?gid=590324617&single=true&output=csv",
    nhl: "https://docs.google.com/spreadsheets/d/e/2PACX-1vQYTgu9bsGUhI1gicOOfLrgYHmNMfrl3W1OKhAVs9cdrdd2CagJZSVM3F25hQ8vk0aRK7hapVmbNWQP/pub?gid=1839953184&single=true&output=csv",
    mlb: "https://docs.google.com/spreadsheets/d/e/2PACX-1vRp1qdWZXtA4IB8NB6xnrtirs_Lv3EWNyyJbfpmR4_BZNujv-u4KgaOcJ6do9OfSWnIXeS56EfYQaZx/pub?gid=1502960090&single=true&output=csv",
    nfl: "https://docs.google.com/spreadsheets/d/e/2PACX-1vS7eg-0liRvxa9q2k6IM2mipst48DHUMa8yXltD8irldOtim2Emic7w0rtl1gfT5xl_AVhR29jBrqY1/pub?gid=2077637558&single=true&output=csv"
};

// ------------------------------------------------------
// Startup
// ------------------------------------------------------

document.addEventListener(
    "DOMContentLoaded",
    initPlayerPage
);

// ------------------------------------------------------
// Initialize
// ------------------------------------------------------

function renderPlayerProfileGuide() {
    const slot = document.getElementById("player-profile-guide");
    if (!slot || slot.dataset.ready === "1" || typeof guideItem !== "function") return;
    slot.dataset.ready = "1";
    slot.innerHTML = `<div class="guide-panel profile-guide">
        <h3 class="guide-panel-title">How to Read This Player Profile</h3>
        <p class="guide-panel-text">Hover over any term below for a quick explanation in plain English.</p>
        <div class="guide-panel-links">
            ${guideItem("Sportacular Score", "The Sportacular Score row. A 0 to 100 grade for the player's best prop. The page can say a number such as 82.40, or -.")}
            ${guideItem("Rating", "The Rating row. Up to five stars. The page can say a mix of ★, ½, and ☆, or ☆☆☆☆☆ when a rating is not available.")}
            ${guideItem("Recommendation", "The Recommendation row. The page can say Over, Under, or -.")}
            ${guideItem("Model Edge", "The Model Edge row. The page can say a percent such as 10.0%, or -.")}
            ${guideItem("Confidence", "The Confidence row on the summary. The page can say Early when fewer than 3 games are available, or Elite, Strong, Solid, or Lean.")}
            ${guideItem("Best Prop", "The Best Prop row. The name of the prop Sportacular ranks first for this player, or -.")}
            ${guideItem("Suggested Play", "The Suggested Play row. The page can say Over or Under plus the line, such as Over 24.5, or -.")}
            ${guideItem("Sportsbook", "The Sportsbook row. The page can say DraftKings, FanDuel, BetMGM, Caesars, BetRivers, or ESPN BET.")}
            ${guideItem("Line", "The Line row on today's prop. The number the sportsbook set, or a blank cell when no prop is posted.")}
            ${guideItem("Odds", "The Odds row. American odds such as -115 or +120.")}
            ${guideItem("EV", "The EV row. The page can say a plus number such as +0.25, a minus number such as -0.10, or -.")}
            ${guideItem("Model Probability", "The Model Probability row. The page can say a percent such as 58.0%, or -.")}
            ${guideItem("Status", "The status above a trend card. The page can say Rising, Falling, or Stable. Fewer than 3 games stays Stable.")}
            ${guideItem("Trend Score", "The Trend Score row. The page can say a plus number such as +12.4, a minus number such as -8.1, or -. A small sample can add (Early) on an insight card.")}
            ${guideItem("Trend Strength", "The Trend Strength row. The page can say Early when fewer than 3 games are available, or Elite Trend, Strong Trend, Moderate Trend, Weak Trend, Cold Trend, or Unknown.")}
            ${guideItem("Risk Tier", "The Risk Tier row. The page can say Early when fewer than 3 games are available, or Low, Medium, High, or Very High.")}
            ${guideItem("Momentum Confidence", "The Momentum Confidence row. The page can say High, Moderate, or Low. Fewer than 3 games says Low.")}
            ${guideItem("Sample", "The Sample row. The page can say Based on 5 games, Based on 1 game, or Sample size unavailable.")}
            ${guideItem("Hit Rate Last 5", "The Hit Rate Last 5 row. How often the result showed up in the last five logged games. The page can say a percent such as 70%, or -.")}
            ${guideItem("Season Snapshot", "The season table. Each row is a season stat for this player. A missing number says —.")}
        </div>
    </div>`;
    if (typeof bindProfileGuide === "function") bindProfileGuide(slot);
}

async function initPlayerPage() {

    getUrlParameters();

    const labels = getLeagueLabels(currentLeague);

    applyLeagueLabels(labels);

    setupBackButtons();

    renderPlayerProfileGuide();

    try {

        player = await fetchPlayer();

        console.log("Player Object:");

        console.log(player);

        updatePlayerProfileSEO();

        renderHero();

        renderInsights();

        renderAnalyticsDashboard();

        renderQuickStats();

        renderSeasonPanels();

        trendHitRates = await fetchPlayerTrendHitRates().catch(() => ({}));
        propHitRates = await fetchPlayerPropHitRates().catch(() => ({}));
        await renderPlayerTonight();

        renderProps();

        renderTrendCards();

        renderGameLogs();

    }

    catch (error) {

        console.error(error);

        const playerName =
            document.getElementById("player-name");

        if (playerName) {

            if (error?.status === 404) {

                playerName.textContent =
                    "Player not found.";

            } else {

                playerName.textContent =
                    "Unable to load player right now.";

            }

        }

    }

}

function applyLeagueLabels(labels) {

    const ids = {
        profileTitle: "profileTitle",
        backText: "backLink",
        footerTitle: "footerTitle",
        footerSubtitle: "footerSubtitle",
        footerButton: "footerButton"
    };

    Object.entries(ids).forEach(([key, id]) => {

        const el = document.getElementById(id);

        if (el) {
            el.textContent = labels[key];
        }

    });

}

function formatGameDate(dateString) {

    if (!dateString) return "-";

    const raw = String(dateString).trim();

    // Preserve calendar-only dates without UTC/local-time shifting.
    const dateOnlyMatch =
        raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);

    if (dateOnlyMatch) {

        const month =
            Number(dateOnlyMatch[2]);

        const day =
            Number(dateOnlyMatch[3]);

        const monthNames = [
            "Jan", "Feb", "Mar", "Apr",
            "May", "Jun", "Jul", "Aug",
            "Sep", "Oct", "Nov", "Dec"
        ];

        return `${monthNames[month - 1]} ${day}`;
    }

    const date = new Date(raw);

    if (Number.isNaN(date.getTime())) {
        return raw;
    }

    return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric"
    });
}

function getLeagueLabels(league) {

    switch ((league || "").toLowerCase()) {

        case "nfl":
            return {
                profileTitle: "NFL PLAYER PROFILE",
                backText: "← Back to NFL Player Props",
                footerTitle: "Continue Exploring NFL Player Props",
                footerSubtitle:
                    "View every available NFL player prop, sportsbook, expected value, and trend from today's slate.",
                footerButton:
                    "← Back to NFL Player Props"
            };

        case "nba":
            return {
                profileTitle: "NBA PLAYER PROFILE",
                backText: "← Back to NBA Player Props",
                footerTitle: "Continue Exploring NBA Player Props",
                footerSubtitle:
                    "View every available NBA player prop, sportsbook, expected value, and trend from today's slate.",
                footerButton:
                    "← Back to NBA Player Props"
            };

        case "nhl":
            return {
                profileTitle: "NHL PLAYER PROFILE",
                backText: "← Back to NHL Player Props",
                footerTitle: "Continue Exploring NHL Player Props",
                footerSubtitle:
                    "View every available NHL player prop, sportsbook, expected value, and trend from today's slate.",
                footerButton:
                    "← Back to NHL Player Props"
            };

        default:
            return {
                profileTitle: "MLB PLAYER PROFILE",
                backText: "← Back to MLB Player Props",
                footerTitle: "Continue Exploring MLB Player Props",
                footerSubtitle:
                    "View every available MLB player prop, sportsbook, expected value, and trend from today's slate.",
                footerButton:
                    "← Back to MLB Player Props"
            };

    }

}

// ------------------------------------------------------
// URL Parameters
// ------------------------------------------------------

function getUrlParameters() {

    const params = new URLSearchParams(
        window.location.search
    );

    currentLeague = (
        params.get("league") || "mlb"
    ).toLowerCase();

    currentPlayerId = params.get("id");

}

// ------------------------------------------------------
// API
// ------------------------------------------------------

async function fetchPlayer() {

    const response = await fetch(

        `/.netlify/functions/player?league=${currentLeague}&id=${currentPlayerId}`

    );

    if (response.status === 404) {

        const error =
            new Error("Player not found.");

        error.status = 404;

        throw error;

    }

    if (!response.ok) {

        const error =
            new Error("Unable to load player.");

        error.status = response.status;

        throw error;

    }

    return await response.json();

}

// ------------------------------------------------------
// SEO
// ------------------------------------------------------

function updatePlayerProfileSEO() {

    const playerName = player?.hero?.name;

    if (!playerName || !currentPlayerId) {
        return;
    }

    const league =
        (currentLeague || "").toLowerCase();

    const leagueLabel =
        league.toUpperCase();

    const canonicalUrl =
        new URL(
            "/player.html",
            window.location.origin
        );

    canonicalUrl.searchParams.set(
        "league",
        league
    );

    canonicalUrl.searchParams.set(
        "id",
        currentPlayerId
    );

    document.title =
        `${playerName} ${leagueLabel} Player Profile | Sportacular Analytics`;

    let description =
        document.querySelector(
            'meta[name="description"]'
        );

    if (!description) {

        description =
            document.createElement("meta");

        description.setAttribute(
            "name",
            "description"
        );

        document.head.appendChild(
            description
        );

    }

    description.setAttribute(
        "content",
        `Explore ${playerName}'s ${leagueLabel} player profile with statistics, trends, game logs, props, and Sportacular analytics.`
    );

    let canonical =
        document.querySelector(
            'link[rel="canonical"]'
        );

    if (!canonical) {

        canonical =
            document.createElement("link");

        canonical.setAttribute(
            "rel",
            "canonical"
        );

        document.head.appendChild(
            canonical
        );

    }

    canonical.setAttribute(
        "href",
        canonicalUrl.href
    );

    const pageTitle =
        document.title;

    const pageDescription =
        description.getAttribute("content");

    const socialImage =
        `${window.location.origin}/social-share.png`;

    const setMeta = (
        selector,
        attributeName,
        attributeValue,
        content
    ) => {

        let meta =
            document.querySelector(
                selector
            );

        if (!meta) {

            meta =
                document.createElement("meta");

            meta.setAttribute(
                attributeName,
                attributeValue
            );

            document.head.appendChild(
                meta
            );

        }

        meta.setAttribute(
            "content",
            content
        );

    };

    setMeta(
        'meta[property="og:type"]',
        "property",
        "og:type",
        "website"
    );

    setMeta(
        'meta[property="og:site_name"]',
        "property",
        "og:site_name",
        "Sportacular Analytics"
    );

    setMeta(
        'meta[property="og:title"]',
        "property",
        "og:title",
        pageTitle
    );

    setMeta(
        'meta[property="og:description"]',
        "property",
        "og:description",
        pageDescription
    );

    setMeta(
        'meta[property="og:url"]',
        "property",
        "og:url",
        canonicalUrl.href
    );

    setMeta(
        'meta[property="og:image"]',
        "property",
        "og:image",
        socialImage
    );

    setMeta(
        'meta[property="og:image:width"]',
        "property",
        "og:image:width",
        "1200"
    );

    setMeta(
        'meta[property="og:image:height"]',
        "property",
        "og:image:height",
        "630"
    );

    setMeta(
        'meta[property="og:image:alt"]',
        "property",
        "og:image:alt",
        "Sportacular Analytics sports analytics platform"
    );

    setMeta(
        'meta[name="twitter:card"]',
        "name",
        "twitter:card",
        "summary_large_image"
    );

    setMeta(
        'meta[name="twitter:title"]',
        "name",
        "twitter:title",
        pageTitle
    );

    setMeta(
        'meta[name="twitter:description"]',
        "name",
        "twitter:description",
        pageDescription
    );

    setMeta(
        'meta[name="twitter:image"]',
        "name",
        "twitter:image",
        socialImage
    );

    setMeta(
        'meta[name="twitter:image:alt"]',
        "name",
        "twitter:image:alt",
        "Sportacular Analytics sports analytics platform"
    );

}

// ------------------------------------------------------
// Hero
// ------------------------------------------------------

function renderHero() {

    renderFields({

        "player-name": player.hero.name,

        "player-team": player.hero.team,

        "player-position": player.hero.position,

        "player-bats": player.hero.bats,

        "player-throws": player.hero.throws,

        "analytics-score": player.hero.analyticsScore

    });

}

function profileGameHasStarted(status) {
    const value = String(status || "").trim().toLowerCase();
    if (!value || value === "scheduled" || value === "pregame" || value === "delayed") return false;
    if (/^\d{1,2}:\d{2}/.test(value)) return false;
    return true;
}

async function renderPlayerTonight() {
    const teamName = String(player?.hero?.team || "").trim();
    const teamEl = document.getElementById("player-team");
    const url = PLAYER_SCHEDULE_CSV[currentLeague];
    if (!teamName || !teamEl || !url || document.getElementById("player-tonight")) return;

    try {
        const response = await fetch(url);
        if (!response.ok) return;
        const rows = parseProfileCSV(await response.text());
        const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Phoenix" }).format(new Date());
        const name = teamName.toLowerCase();
        const tonight = rows.find((row) => {
            const away = String(row["Away Team"] || "").trim().toLowerCase();
            const home = String(row["Home Team"] || "").trim().toLowerCase();
            return profileSheetDate(row["Game Date"]) === today && (away === name || home === name);
        });
        if (!tonight) return;

        const away = String(tonight["Away Team"] || "").trim();
        const home = String(tonight["Home Team"] || "").trim();
        const isAway = away.toLowerCase() === name;
        const note = document.createElement("p");
        note.id = "player-tonight";
        playerGameHasStarted = profileGameHasStarted(tonight.Status);
        note.textContent = `Tonight: ${isAway ? "at" : "vs"} ${isAway ? home : away} · ${tonight.Status || (playerGameHasStarted ? "Started" : "Scheduled")}`;
        teamEl.insertAdjacentElement("afterend", note);
    } catch (error) {
        console.error("Player schedule lookup failed:", error);
    }
}

function renderQuickStats() {

    const seasonDataAvailable =
        player?.dataAvailability?.seasonStats !== false;

    const grid = document.getElementById(

        "quick-stats-grid"

    );

    if (!grid) return;

    grid.innerHTML = "";

    const cards =
        player.quickStats?.cards ??
        player.quickStats ??
        [];

    const rows = cards.map((stat) => [
        stat.label,
        seasonDataAvailable ? formatStatValue(stat.value, stat.label) : "—"
    ]);

    grid.innerHTML = rows.length ? profileSummaryTable(rows) : "";

}

function renderSeasonPanels() {

    const section = document.getElementById(
    "season-stats-section"
);

if (!section) return;

if (!player.seasonPanels?.length) {

    section.hidden = true;

    return;

}

section.hidden = false;

console.log("Season Panels:");
console.log(player.seasonPanels);

    const dashboard = document.getElementById(

        "season-dashboard"

    );

    if (!dashboard) return;

    dashboard.innerHTML = "";

    (player.seasonPanels || []).forEach(panel => {

        console.log("Appending panel:", panel.title);

        const section = createSeasonPanel(panel);

        dashboard.appendChild(section);

    });

}

function getGameLogHeaders(league) {

    switch ((league || "").toLowerCase()) {

        case "nfl": {

            const position =
                String(player?.hero?.position || "")
                    .trim()
                    .toUpperCase();

            const isQB =
                position === "QB" ||
                position === "QUARTERBACK";

            const isRB =
                position === "RB" ||
                position === "RUNNING BACK";

            const isWR =
                position === "WR" ||
                position === "WIDE RECEIVER";

            const isTE =
                position === "TE" ||
                position === "TIGHT END";

            if (isQB) {
                return [
                    "Date",
                    "Opponent",
                    "Passing Yards",
                    "Passing TDs",
                    "Interceptions",
                    "Completions",
                    "Pass Attempts",
                    "Rushing Yards",
                    "Rushing Attempts",
                    "Rushing TDs"
                ];
            }

            if (isRB) {
                return [
                    "Date",
                    "Opponent",
                    "Rushing Yards",
                    "Rushing Attempts",
                    "Rushing TDs",
                    "Receptions",
                    "Receiving Yards",
                    "Receiving TDs"
                ];
            }

            if (isWR || isTE) {
                return [
                    "Date",
                    "Opponent",
                    "Receptions",
                    "Receiving Yards",
                    "Receiving TDs"
                ];
            }

            return [
                "Date",
                "Opponent"
            ];
        }

        case "nba": {

            return [
                "Date",
                "Opponent",
                "MIN",
                "PTS",
                "REB",
                "AST",
                "3PM",
                "STL",
                "BLK",
                "TO"
            ];

        }

        case "nhl": {

            return [
                "Date",
                "Opponent",
                "G",
                "A",
                "PTS",
                "SOG",
                "PPP",
                "HIT",
                "BLK"
            ];

        }

        case "mlb": {

            const isPitcher =
                player.positionGroup === "PITCHER";

            if (isPitcher) {

                return [

                    "Date",
                    "Opponent",
                    "IP",
                    "SO",
                    "ER",
                    "H",
                    "BB"

                ];

            }

            return [

                "Date",
                "Opponent",
                "H",
                "R",
                "RBI",
                "HR",
                "TB",
                "BB",
                "SO"

            ];

        }

        default:

            return [

                "Date",
                "Opponent"

            ];
    }

}

function getGameLogRenderer(league) {

    switch ((league || "").toLowerCase()) {

        case "nfl":
            return createNFLGameLogRow;

        case "nba":
            return createNBAGameLogRow;

        case "nhl":
            return createNHLGameLogRow;

        case "mlb":
        default:
            return createMLBGameLogRow;

    }

}

function renderGameLogs() {

    const currentLeague =
        new URLSearchParams(window.location.search)
            .get("league") || "mlb";

    console.log("Game Log League:", currentLeague);

    console.log(
        "Headers:",
        getGameLogHeaders(currentLeague)
    );

    const section = document.getElementById(
    "game-log-section"
);

if (!section) return;

section.hidden = false;

    const body = document.getElementById("game-log-body");

    const header = document.getElementById("game-log-header");

    const headers = getGameLogHeaders(currentLeague);

    const createRow = getGameLogRenderer(currentLeague);

    if (header) {

        header.innerHTML = headers
            .map(text => `<th>${text}</th>`)
            .join("");

    }

    if (!body) return;

    body.innerHTML = "";

    if (!player.gameLogs?.length) {

        body.innerHTML = `

            <tr>

                <td colspan="${headers.length}">

                    No recent games available.

                </td>

            </tr>

        `;

        return;

    }

    console.log("Rendered Game Logs");

    console.table(player.gameLogs);

    console.log("First NFL Game Log:", player.gameLogs[0]);

    const recentGames =
        (player.gameLogs || [])
            .slice(0, 10);

    recentGames.forEach(game => {

        body.appendChild(

            createRow(game, player)

        );

    });

}

function createMLBGameLogRow(game) {

    const tr = document.createElement("tr");

    const isPitcher =
        player?.positionGroup === "PITCHER";

    if (isPitcher) {

        tr.innerHTML = `
            <td>${formatGameDate(game.gameDate)}</td>
            <td>${game.opponent ?? "-"}</td>
            <td>${game.inningsPitched ?? 0}</td>
            <td>${game.strikeouts ?? 0}</td>
            <td>${game.earnedRuns ?? 0}</td>
            <td>${game.hitsAllowed ?? 0}</td>
            <td>${game.walks ?? 0}</td>
        `;

        return tr;
    }

    tr.innerHTML = `
        <td>${formatGameDate(game.gameDate)}</td>
        <td>${game.opponent ?? "-"}</td>
        <td>${game.hits ?? 0}</td>
        <td>${game.runs ?? 0}</td>
        <td>${game.rbis ?? 0}</td>
        <td>${game.homeRuns ?? 0}</td>
        <td>${game.totalBases ?? 0}</td>
        <td>${game.walks ?? 0}</td>
        <td>${game.strikeouts ?? 0}</td>
    `;

    return tr;
}

function createNFLGameLogRow(game) {

    const tr = document.createElement("tr");

    const position =
        String(player?.hero?.position || "")
            .trim()
            .toUpperCase();

    const isQB =
        position === "QB" ||
        position === "QUARTERBACK";

    const isRB =
        position === "RB" ||
        position === "RUNNING BACK";

    const isWR =
        position === "WR" ||
        position === "WIDE RECEIVER";

    const isTE =
        position === "TE" ||
        position === "TIGHT END";

    if (isQB) {

        tr.innerHTML = `

            <td>${formatGameDate(game.gameDate)}</td>
            <td>${game.opponent ?? "-"}</td>

            <td>${game.passingYards ?? 0}</td>
            <td>${game.passingTDs ?? 0}</td>
            <td>${game.interceptions ?? 0}</td>

            <td>${game.completions ?? 0}</td>
            <td>${game.passAttempts ?? 0}</td>

            <td>${game.rushingYards ?? 0}</td>
            <td>${game.rushingAttempts ?? 0}</td>
            <td>${game.rushingTDs ?? 0}</td>

        `;

        return tr;

    }

    if (isRB) {

        tr.innerHTML = `

            <td>${formatGameDate(game.gameDate)}</td>
            <td>${game.opponent ?? "-"}</td>

            <td>${game.rushingYards ?? 0}</td>
            <td>${game.rushingAttempts ?? 0}</td>
            <td>${game.rushingTDs ?? 0}</td>

            <td>${game.receptions ?? 0}</td>
            <td>${game.receivingYards ?? 0}</td>
            <td>${game.receivingTDs ?? 0}</td>

        `;

        return tr;

    }

    if (isWR || isTE) {

        tr.innerHTML = `

            <td>${formatGameDate(game.gameDate)}</td>
            <td>${game.opponent ?? "-"}</td>

            <td>${game.receptions ?? 0}</td>
            <td>${game.receivingYards ?? 0}</td>
            <td>${game.receivingTDs ?? 0}</td>

        `;

        return tr;
    }

    tr.innerHTML = `
        <td>${formatGameDate(game.gameDate)}</td>
        <td>${game.opponent ?? "-"}</td>
    `;

    return tr;

}

function createNBAGameLogRow(game) {

    const tr = document.createElement("tr");

    tr.innerHTML = `
        <td>${formatGameDate(game.gameDate)}</td>
        <td>${game.opponent ?? "-"}</td>
        <td>${game.minutes ?? "-"}</td>
        <td>${game.points ?? "-"}</td>
        <td>${game.rebounds ?? "-"}</td>
        <td>${game.assists ?? "-"}</td>
        <td>${game.threes ?? "-"}</td>
        <td>${game.steals ?? "-"}</td>
        <td>${game.blocks ?? "-"}</td>
        <td>${game.turnovers ?? "-"}</td>
    `;

    return tr;
}

function createNHLGameLogRow(game) {

    const tr = document.createElement("tr");

    tr.innerHTML = `
        <td>${formatGameDate(game.gameDate)}</td>
        <td>${game.opponent ?? "-"}</td>
        <td>${game.goals ?? 0}</td>
        <td>${game.assists ?? 0}</td>
        <td>${game.points ?? 0}</td>
        <td>${game.shotsOnGoal ?? 0}</td>
        <td>${game.powerPlayPoints ?? 0}</td>
        <td>${game.hits ?? 0}</td>
        <td>${game.blockedShots ?? 0}</td>
    `;

    return tr;
}

function getSportacularStarRating(score) {

    const number = Number(score);

    if (!Number.isFinite(number)) {
        return "☆☆☆☆☆";
    }

    let stars = 1;

    if (number >= 90) {
        stars = 5;
    } else if (number >= 80) {
        stars = 4;
    } else if (number >= 70) {
        stars = 3;
    } else if (number >= 60) {
        stars = 2;
    }

    return "★".repeat(stars) +
        "☆".repeat(5 - stars);
}

function renderAnalyticsDashboard() {

    const section = document.getElementById(
        "analytics-dashboard-section"
    );

    const dashboard =
        document.getElementById(
            "analytics-dashboard"
        );

    if (!dashboard || !section) return;

    if (

    !player.analytics ||

    !player.analytics.bestProp

) {

    section.hidden = true;

    return;

}

    section.hidden = false;

    const analytics = player.analytics;

    /*
        D10Y — Backend-authoritative Top Prop consumer

        player.analytics.bestProp is the authoritative selection.

        Match that selection back to player.props by ID so the dashboard
        can use the complete prop record without independently choosing
        another prop.

        Score matching remains a compatibility fallback only for older
        responses that do not provide a bestProp ID.
    */
    const authoritativeBestProp =
        analytics?.bestProp ??
        null;

    const matchedBestProp =
        authoritativeBestProp?.id != null
            ? (
                player.props?.find(
                    prop =>
                        prop?.id != null &&
                        String(prop.id) ===
                        String(authoritativeBestProp.id)
                ) ??
                null
            )
            : null;

    const legacyScoreMatchedProp =
        !matchedBestProp &&
        authoritativeBestProp?.id == null &&
        authoritativeBestProp?.score != null
            ? (
                player.props?.find(
                    prop =>
                        prop?.sportacularScore != null &&
                        Number(prop.sportacularScore) ===
                        Number(authoritativeBestProp.score)
                ) ??
                null
            )
            : null;

    const dashboardProp =
        matchedBestProp ??
        legacyScoreMatchedProp ??
        authoritativeBestProp;

    const dashboardAnalytics =
        dashboardProp?.analytics ??
        null;

    /*
        D10Y — Normalized dashboard analytics contract

        The selected prop remains authoritative for prop-specific analytics.
        Top-level player.analytics remains the authoritative aggregate
        source and compatibility fallback.
    */
    const dashboardContract = {

        score:
            dashboardProp?.sportacularScore ??
            authoritativeBestProp?.score ??
            analytics?.sportacularScore ??
            analytics?.score ??
            null,

        edge:
            dashboardProp?.sportacularEdge ??
            dashboardAnalytics?.sportacularEdge ??
            dashboardAnalytics?.modelEdge ??
            authoritativeBestProp?.sportacularEdge ??
            analytics?.modelEdge ??
            null,

        recommendation:
            dashboardProp?.recommendation ??
            dashboardAnalytics?.recommendation ??
            authoritativeBestProp?.recommendation ??
            analytics?.recommendation ??
            "-",

        confidence:
            dashboardProp?.confidenceTier ??
            dashboardAnalytics?.confidence ??
            dashboardProp?.confidence ??
            authoritativeBestProp?.confidence ??
            analytics?.confidence ??
            "-",

        sportsbook:
            dashboardProp?.sportsbook ??
            authoritativeBestProp?.sportsbook ??
            null,

        line:
            dashboardProp?.line ??
            authoritativeBestProp?.line ??
            null,

        propName:
            dashboardProp?.displayName ??
            dashboardProp?.market ??
            authoritativeBestProp?.displayName ??
            authoritativeBestProp?.market ??
            null
    };

    const modelEdgeValue =
        dashboardContract.edge;

    const dashboardScore =
        dashboardContract.score;

    /*
        D10U — Backend-authoritative Sportacular star rating

        playerAnalytics.js owns the Sportacular Score -> stars
        conversion. The player profile should consume that value
        rather than independently applying another star scale.
    */
    const dashboardStars =
        analytics?.stars ??
        player.analytics?.stars ??
        null;

    const formatDashboardStars = value => {

        const numericStars =
            Number(value);

        if (!Number.isFinite(numericStars)) {
            return "☆☆☆☆☆";
        }

        const boundedStars =
            Math.max(
                0,
                Math.min(5, numericStars)
            );

        const fullStars =
            Math.floor(boundedStars);

        const hasHalfStar =
            boundedStars - fullStars >= 0.5;

        return (
            "★".repeat(fullStars) +
            (hasHalfStar ? "½" : "") +
            "☆".repeat(
                Math.max(
                    0,
                    5 - fullStars - (hasHalfStar ? 1 : 0)
                )
            )
        );
    };

    const formatDashboardLabel = value => {

        if (
            value === null ||
            value === undefined ||
            value === ""
        ) {
            return "-";
        }

        return String(value)
            .replace(/_/g, " ")
            .replace(/\b\w/g, char => char.toUpperCase());
    };

    const formatSportsbookName = value => {

        const raw = String(value || "")
            .trim()
            .toLowerCase();

        const sportsbookNames = {
            draftkings: "DraftKings",
            fanduel: "FanDuel",
            betrivers: "BetRivers",
            betmgm: "BetMGM",
            caesars: "Caesars",
            espnbet: "ESPN BET"
        };

        return sportsbookNames[raw] ??
            formatDashboardLabel(value);
    };

    const dashboardRecommendation =
        dashboardContract.recommendation;

    const dashboardPropName =
        formatDashboardLabel(
            dashboardContract.propName
        );

    const dashboardSuggestedPlay =
        dashboardRecommendation !== "-" &&
        dashboardContract.line !== null &&
        dashboardContract.line !== undefined &&
        dashboardContract.line !== ""
            ? `${formatDashboardLabel(
                dashboardRecommendation
            )} ${dashboardContract.line}`
            : "-";

    const dashboardSportsbook =
        formatSportsbookName(
            dashboardContract.sportsbook
        );

    /*
        D10V — Sample-size-aware dashboard confidence

        Keep the backend confidence untouched.

        When fewer than 3 games are available, the player profile
        should not present the top dashboard confidence as fully
        established while the rest of the profile correctly identifies
        the statistical sample as Early.
    */
    const dashboardSampleSize =
        getTrendSampleSize(
            player?.trends?.[0] ?? null
        );

    const rawDashboardConfidence =
        dashboardContract.confidence;

    const dashboardConfidence =
        dashboardSampleSize !== null &&
        dashboardSampleSize < 3
            ? "Early"
            : rawDashboardConfidence;

    console.log("Analytics Dashboard Object");
    console.log(analytics);
    console.log("Model Edge:", analytics.modelEdge);
    console.log("Best Prop:", analytics.bestProp);

    dashboard.innerHTML = profileSummaryTable([
        ["Sportacular Score", (
            dashboardScore !== null &&
            dashboardScore !== undefined &&
            dashboardScore !== "" &&
            Number.isFinite(Number(dashboardScore))
                ? Number(dashboardScore).toFixed(2)
                : "-"
        )],
        ["Rating", formatDashboardStars(dashboardStars)],
        ["Recommendation", formatDashboardLabel(dashboardRecommendation)],
        ["Model Edge", formatEdgePercent(modelEdgeValue)],
        ["Confidence", dashboardConfidence],
        ["Best Prop", dashboardPropName],
        ["Suggested Play", dashboardSuggestedPlay],
        ["Sportsbook", dashboardSportsbook]
    ]);

}

function renderProps() {

    const section = document.getElementById(
        "player-props-section"
    );

    if (!section) return;

    section.hidden = false;

    if (!document.getElementById("player-board-link") && player?.hero?.name) {
        const header = section.querySelector(".section-header");
        if (header) {
            const link = document.createElement("a");
            link.id = "player-board-link";
            link.className = "card-link";
            link.href = `${currentLeague}-props.html?player=${encodeURIComponent(player.hero.name)}`;
            link.textContent = "All props on the board";
            header.appendChild(link);
        }
    }

    if (!player.props?.length) {

        section.hidden = false;

        const featuredProp =
            section.querySelector(
                ".featured-prop-card"
            );

        if (featuredProp) {
            featuredProp.hidden = true;
            featuredProp.style.display = "none";
        }

        const grid =
            document.getElementById(
                "props-grid"
            );

        if (grid) {

            grid.innerHTML = `
                <article class="trend-card empty-state">
                    <h3>No Player Props Available</h3>
                    <p>
                        Check back once props are available for this player.
                    </p>
                </article>
            `;

        }

        return;

    }

    section.hidden = false;

    const featuredProp =
        section.querySelector(
            ".featured-prop-card"
        );

    if (featuredProp) {
        featuredProp.hidden = false;
        featuredProp.style.display = "";
    }

    const isActionableProp = prop => {

        const recommendation =
            String(
                prop?.analytics?.recommendation ??
                prop?.recommendation ??
                ""
            )
                .trim()
                .toLowerCase();

        return (
            recommendation === "over" ||
            recommendation === "under"
        );

    };

    const actionableProps =
        (player.props || []).filter(isActionableProp);

    /*
        D10Z — Backend-authoritative MLB Top Prop consumer

        player.analytics.bestProp is the authoritative Top Prop.

        Match that selection back to player.props by ID so the Top Prop
        section can use the complete prop record without independently
        selecting another candidate.

        Score matching remains a compatibility fallback only for older
        responses that do not provide a bestProp ID.

        Do NOT fall back to actionableProps[0]. If the backend does not
        provide a qualifying Top Prop, the frontend should display
        "No Recommended Play" rather than inventing its own selection.
    */

    const authoritativeBestProp =
        player.analytics?.bestProp ??
        null;

    const matchedBestProp =
        authoritativeBestProp?.id != null
            ? (
                actionableProps.find(
                    prop =>
                        prop?.id != null &&
                        String(prop.id) ===
                        String(authoritativeBestProp.id)
                ) ??
                null
            )
            : null;

    const legacyScoreMatchedProp =
        !matchedBestProp &&
        authoritativeBestProp?.id == null &&
        authoritativeBestProp?.score != null
            ? (
                actionableProps.find(
                    prop =>
                        prop?.sportacularScore != null &&
                        Number(prop.sportacularScore) ===
                        Number(authoritativeBestProp.score)
                ) ??
                null
            )
            : null;

    const topProp =
        matchedBestProp ??
        legacyScoreMatchedProp ??
        null;

    if (!topProp) {

        const topPropBadge =
            document.getElementById("top-prop-badge");

        if (topPropBadge) {
            topPropBadge.hidden = true;
            topPropBadge.style.display = "none";
        }

        const topPropEV =
            document.getElementById("top-prop-ev");

        const topPropTrendButton =
            document.getElementById("view-top-prop");

        if (topPropEV) {

            const evCircle =
                topPropEV.closest(".ev-circle");

            if (evCircle) {
                evCircle.style.display = "none";
            }

        }

        if (topPropTrendButton) {
            topPropTrendButton.style.display = "none";
        }

        renderFields({

            "top-prop-name":
                "No Recommended Play",

            "top-prop-line":
                "-",

            "top-prop-odds":
                "-",

            "top-prop-book":
                "-",

            "top-prop-ev":
                "-",

            "top-prop-probability":
                "-",

            "top-prop-confidence":
                "-",

            "top-prop-recommendation":
                "No Play"

        });

    } else {

    const topPropEV =
        document.getElementById("top-prop-ev");

    const topPropTrendButton =
        document.getElementById("view-top-prop");

    if (topPropEV) {

        const evCircle =
            topPropEV.closest(".ev-circle");

        if (evCircle) {
            evCircle.style.display = "";
        }

    }

    if (topPropTrendButton) {
        topPropTrendButton.style.display = "";
        topPropTrendButton.onclick = () => {
            document.getElementById("trend-grid")?.scrollIntoView({ behavior: "smooth", block: "start" });
        };
    }

    const topPropBadge =
        document.getElementById("top-prop-badge");

    const topPropRecommendation =
        String(
            topProp?.analytics?.recommendation ??
            topProp?.recommendation ??
            ""
        )
            .trim()
            .toLowerCase();

    const topPropIsActionable =
        topPropRecommendation === "over" ||
        topPropRecommendation === "under";

    if (topPropBadge) {

        topPropBadge.hidden =
            !topPropIsActionable;

        topPropBadge.style.display =
            topPropIsActionable
                ? ""
                : "none";

    }

    const analytics = topProp?.analytics ?? null;

    /*
        D10AA — Normalized MLB Top Prop metrics

        Keep the backend-authoritative Top Prop selection untouched.

        Once the authoritative prop has been matched back to player.props,
        consume the same normalized probability and edge fields used by
        the All Available Props cards.
    */

    const topPropProbability =
        topProp.bestModelProbability ??
        analytics?.probability ??
        topProp.probability ??
        null;

    const topPropModelEdge =
        topProp.sportacularEdge ??
        analytics?.modelEdge ??
        topProp.modelEdge ??
        null;

    const numericTopPropModelEdge =
        topPropModelEdge !== null &&
        topPropModelEdge !== undefined &&
        topPropModelEdge !== "" &&
        Number.isFinite(Number(topPropModelEdge))
            ? Number(topPropModelEdge)
            : null;

    console.log("Dashboard Best Prop:", player.analytics.bestProp);
    console.log("Displayed Top Prop:", topProp);

    console.log("Top Prop");
    console.log(topProp);

    renderFields({

    "top-prop-name":

        topProp.displayName,

    "top-prop-line":

        topProp.line,

    "top-prop-odds":

        topProp.odds,

    "top-prop-book":

        topProp.sportsbook,

    "top-prop-ev":
        formatEdgePercent(topPropModelEdge),

    "top-prop-probability":
        formatProbability(topPropProbability),

    "top-prop-confidence":
        analytics?.confidence ??
        topProp.confidence ??
        "-",

    "top-prop-recommendation":
        analytics?.recommendation ??
        topProp.recommendation ??
        "-"

    });

    }

    const grid =
        document.getElementById(
            "props-grid"
        );

    if (!grid) return;

    grid.innerHTML = "";

    const visibleProps = player.props
        .filter((prop) => {
            const side = String(prop.recommendation ?? prop.bestSide ?? "").trim().toLowerCase();
            const propKey = `${String(prop.propType || prop.displayName || "").trim().toLowerCase()}|${Number(prop.line)}`;
            return (side === "over" || side === "under") && !closedPropKeys.has(propKey);
        })
        .sort((a, b) => (Number(b.sportacularScore) || -1) - (Number(a.sportacularScore) || -1));

    if (!visibleProps.length) {
        grid.innerHTML = `
            <article class="trend-card empty-state">
                <h3>No Open Props</h3>
                <p>This player's props are for a game that is already final, postponed, or cancelled.</p>
            </article>
        `;
        return;
    }

    visibleProps.forEach(prop => {

        const analytics =
            prop.analytics ?? {};

        const recommendation =
            String(
                analytics.recommendation ??
                prop.recommendation ??
                prop.bestSide ??
                "No Play"
            )
                .trim();

        const normalizedRecommendation =
            recommendation.toLowerCase();

        const isActionable =
            normalizedRecommendation === "over" ||
            normalizedRecommendation === "under";

        const hasValue = value =>
            value !== null &&
            value !== undefined &&
            value !== "";

        const toFiniteNumber = value => {

            if (!hasValue(value)) {
                return null;
            }

            const number = Number(value);

            return Number.isFinite(number)
                ? number
                : null;
        };

        const displayOdds =
            isActionable && hasValue(prop.odds)
                ? prop.odds
                : "-";

        const probabilityValue =
            prop.bestModelProbability ??
            analytics.probability ??
            prop.probability ??
            null;

        const displayProbability =
            isActionable
                ? formatProbability(probabilityValue)
                : "-";

        const modelEdgeValue =
            prop.sportacularEdge ??
            analytics.modelEdge ??
            prop.modelEdge ??
            null;

        const numericModelEdge =
            toFiniteNumber(modelEdgeValue);

        const displayModelEdge =
            isActionable
                ? formatEdgePercent(modelEdgeValue)
                : "-";

        const displayConfidence =
            isActionable
                ? (
                    prop.confidenceTier ??
                    analytics.confidence ??
                    prop.confidence ??
                    "-"
                )
                : "-";

        const scoreValue =
            prop.sportacularScore ??
            analytics.sportacularScore ??
            analytics.score ??
            prop.score ??
            null;

        const numericScore =
            toFiniteNumber(scoreValue);

        const displayScore =
            isActionable &&
            numericScore !== null
                ? numericScore.toFixed(2)
                : "-";

        const card =
            document.createElement("article");

        card.className =
            "prop-card";

        card.innerHTML = `

        <div class="prop-card-header">

            <div>

                <h3>${prop.displayName}</h3>

                <div class="prop-subtitle">

                    ${prop.sportsbook ?? "-"}

                </div>

            </div>

            <div class="prop-score">

                ${displayScore}

            </div>

        </div>

        <div class="prop-grid">

            <div>

                <span>Line</span>

                <strong>
                    ${
                        prop.line !== null &&
                        prop.line !== undefined &&
                        prop.line !== ""
                            ? prop.line
                            : "-"
                    }
                </strong>

            </div>

            <div>

                <span>Odds</span>

                <strong>${displayOdds}</strong>

            </div>

            <div>

                <span>Model Edge</span>

                <strong>${displayModelEdge}</strong>

            </div>

            <div>

                <span>Confidence</span>

                <strong>${displayConfidence}</strong>

            </div>

            <div>

                <span>Recommendation</span>

                <strong>${recommendation}</strong>

            </div>

            <div>

                <span>Hit Rate</span>

                <strong>${propHitRateFor(prop)}</strong>

            </div>

            <div>

                <span>Probability</span>

                <strong>${displayProbability}</strong>

            </div>

        </div>

        ${playerGameHasStarted ? "" : `<a class="card-link" href="parlay.html?league=${encodeURIComponent(currentLeague)}&board=props&q=${encodeURIComponent(`${player.hero?.name || ""} ${prop.propType || prop.displayName || ""} ${prop.line ?? ""} ${recommendation}`.trim())}">Add to parlay</a>`}

        `;

        grid.appendChild(card);

    });

}

function getTrendVisualState(trend) {

    const score = Number(
        trend?.trendScore ??
        trend?.score
    );

    const strength = String(
        trend?.trendStrength ??
        trend?.strength ??
        ""
    )
        .trim()
        .toLowerCase();

    const risk = String(
        trend?.riskTier ??
        trend?.risk ??
        ""
    )
        .trim()
        .toLowerCase();

    let direction = "neutral";
    let icon = "➡️";
    let label = "Stable";

    /*
        D10O — Sample-size-aware momentum direction

        Do not characterize a player's momentum as Rising
        or Falling until at least 3 games are available.

        The underlying Trend Score remains untouched.
    */
    const directionSampleSize =
        getTrendSampleSize(trend);

    const hasEstablishedDirectionSample =
        directionSampleSize === null ||
        directionSampleSize >= 3;

    if (
        Number.isFinite(score) &&
        hasEstablishedDirectionSample
    ) {

        if (score >= 10) {
            direction = "positive";
            icon = "↗";
            label = "Rising";
        }

        else if (score <= -10) {
            direction = "negative";
            icon = "↘";
            label = "Falling";
        }
    }

    let strengthClass = "moderate";

    if (strength === "strong") {
        strengthClass = "strong";
    }

    else if (strength === "weak") {
        strengthClass = "weak";
    }

    let riskClass = "moderate";

    if (risk === "low") {
        riskClass = "low";
    }

    else if (risk === "high") {
        riskClass = "high";
    }

    return {
        direction,
        icon,
        label,
        strengthClass,
        riskClass
    };
}

async function fetchPlayerTrendHitRates() {
    const url = PLAYER_TREND_CSV[currentLeague];
    if (!url || !currentPlayerId) return {};

    const response = await fetch(url);
    if (!response.ok) return {};

    const rows = parseProfileCSV(await response.text());
    const rates = {};

    rows.forEach((row) => {
        if (String(row["Player ID"] || "").trim() !== String(currentPlayerId)) return;
        const stat = String(row["Stat Type"] || "").trim();
        const hitRate = String(row["Hit Rate Last 5"] || "").trim();
        if (stat && hitRate) rates[stat] = hitRate;
    });

    return rates;
}

async function profileFinalGameIds(league) {
    const url = PLAYER_SCHEDULE_CSV[league];
    if (!url) return new Set();
    const response = await fetch(url);
    if (!response.ok) return new Set();
    const rows = parseProfileCSV(await response.text());
    return new Set(
        rows
            .filter((row) => ["final", "complete", "completed", "postponed", "cancelled", "canceled"].includes(String(row.Status || "").trim().toLowerCase()))
            .map((row) => String(row["Game Id"] || "").trim())
            .filter(Boolean)
    );
}

function profileSheetDate(value) {
    const raw = String(value || "").trim();
    if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0, 10);
    const match = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (!match) return "";
    return `${match[3]}-${match[1].padStart(2, "0")}-${match[2].padStart(2, "0")}`;
}

async function fetchPlayerPropHitRates() {
    const url = PLAYER_PROPS_CSV[currentLeague];
    closedPropKeys = new Set();
    if (!url || !currentPlayerId) return {};

    const response = await fetch(url);
    if (!response.ok) return {};

    const rows = parseProfileCSV(await response.text());
    const finals = await profileFinalGameIds(currentLeague).catch(() => new Set());
    const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Phoenix" }).format(new Date());
    const rates = {};

    rows.forEach((row) => {
        const playerId = String(row["Player Id"] || row["Player ID"] || "").trim();
        if (playerId !== String(currentPlayerId)) return;

        const propType = String(row["Prop Type"] || "").trim().toLowerCase();
        const line = Number(row["Line Value"]);
        const side = String(row["Best Side"] || "").trim().toLowerCase();
        const hitRate = String(row["Line Hit Rate"] || "").trim();
        const gameId = String(row["Game Id"] || "").trim();
        if (!propType || !Number.isFinite(line)) return;

        if (hitRate) rates[`${propType}|${line}|${side}`] = hitRate;
        if (profileSheetDate(row["Game Date"]) === today && gameId && finals.has(gameId)) {
            closedPropKeys.add(`${propType}|${line}`);
        }
    });

    return rates;
}

function propHitRateFor(prop) {
    const propType = String(prop.propType || prop.displayName || "").trim().toLowerCase();
    const line = Number(prop.line);
    const side = String(prop.recommendation || "").trim().toLowerCase();
    return propHitRates[`${propType}|${line}|${side}`] || "-";
}

function parseProfileCSV(text) {
    const lines = text.split(/\r?\n/).filter((line) => line.trim());
    if (lines.length < 2) return [];

    const parseLine = (line) => {
        const values = [];
        let current = "";
        let quoted = false;
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"' && line[i + 1] === '"') {
                current += '"';
                i++;
            } else if (char === '"') {
                quoted = !quoted;
            } else if (char === "," && !quoted) {
                values.push(current.trim());
                current = "";
            } else {
                current += char;
            }
        }
        values.push(current.trim());
        return values;
    };

    const headers = parseLine(lines[0]);
    return lines.slice(1).map((line) => {
        const values = parseLine(line);
        const row = {};
        headers.forEach((header, index) => {
            row[header] = values[index] || "";
        });
        return row;
    });
}

function renderTrendCards() {
    
    console.log(
        "renderTrendCards player.trends[0]",
        player.trends?.[0]
    );

    const section = document.getElementById(
        "player-trends-section"
    );

    const grid = document.getElementById(
        "trend-grid"
    );

    if (!grid || !section) return;

    if (!player.trends?.length) {

        section.hidden = false;

        grid.innerHTML = `

            <article class="trend-card empty-state">

                <div class="trend-icon">

                    📊

                </div>

                <h3>

                    No Trends Available

                </h3>

                <p>

                    Sportacular has not generated any qualifying trends
                    for this player yet. Check back after additional games
                    have been played.

                </p>

            </article>

        `;

        return;

    }

    section.hidden = false;

    grid.innerHTML = "";

    (player.trends || []).forEach(trend => {

        const formatTrendNumber = (
            value,
            decimals = 1
        ) => {

            if (
                value === null ||
                value === undefined ||
                value === ""
            ) {
                return "-";
            }

            const number = Number(value);

            if (!Number.isFinite(number)) {
                return "-";
            }

            return number.toFixed(decimals);

        };

        const rawTrendScore =
            trend.trendScore ??
            trend.score;

        const numericTrendScore =
            rawTrendScore !== null &&
            rawTrendScore !== undefined &&
            rawTrendScore !== "" &&
            Number.isFinite(Number(rawTrendScore))
                ? Number(rawTrendScore)
                : null;

        const displayTrendScore =
            numericTrendScore === null
                ? "-"
                : numericTrendScore > 0
                    ? `+${numericTrendScore.toFixed(1)}`
                    : numericTrendScore.toFixed(1);

        /*
            D10P — Sample-size-aware Trend Score intensity

            Preserve the actual Trend Score, but do not give a
            tiny-sample score strong or moderate visual emphasis.

            Fewer than 3 games always uses the subtle treatment.
        */
        const trendScoreSampleSize =
            getTrendSampleSize(trend);

        const trendScoreIntensity =
            numericTrendScore === null
                ? "none"
                : (
                    trendScoreSampleSize !== null &&
                    trendScoreSampleSize < 3
                )
                    ? "subtle"
                    : Math.abs(numericTrendScore) >= 25
                        ? "strong"
                        : Math.abs(numericTrendScore) >= 10
                            ? "moderate"
                            : "subtle";

        const displayTrendStrength =
            trend.trendStrength ??
            trend.strength ??
            "-";

        /*
            D10R — Sample-size-aware displayed Risk Tier

            Preserve the backend Risk Tier for analytics and confidence
            calculations. When fewer than 3 games are available, avoid
            presenting the risk classification as fully established.
        */
        const rawDisplayRisk =
            trend.riskTier ??
            trend.risk ??
            "-";

        const riskSampleSize =
            getTrendSampleSize(trend);

        const displayRisk =
            riskSampleSize !== null &&
            riskSampleSize < 3
                ? "Early"
                : rawDisplayRisk;

        const visualState =
            getTrendVisualState(trend);

        const getMomentumConfidence = () => {

            const strength =
                String(
                    trend.trendStrength ??
                    trend.strength ??
                    ""
                )
                    .trim()
                    .toLowerCase();

            const risk =
                String(
                    trend.riskTier ??
                    trend.risk ??
                    ""
                )
                    .trim()
                    .toLowerCase();

            if (numericTrendScore === null) {
                return {
                    label: "Unavailable",
                    className: "unavailable"
                };
            }

            const magnitude =
                Math.abs(numericTrendScore);

            /*
                D10H — Sample-size guard

                Prefer a trend-specific sample size when the
                backend provides one. Otherwise fall back to
                the number of player game logs currently
                available to the profile.
            */

            const sampleSize =
                getTrendSampleSize(trend);

            /*
                Fewer than 3 games:
                confidence must remain Low regardless of
                score magnitude, strength, or risk tier.
            */

            if (
                sampleSize !== null &&
                sampleSize < 3
            ) {
                return {
                    label: "Low",
                    className: "low"
                };
            }

            /*
                High confidence requires:
                - at least 5 games
                - strong score magnitude
                - Strong trend strength
                - Low risk
            */

            if (
                sampleSize !== null &&
                sampleSize >= 5 &&
                magnitude >= 25 &&
                strength === "strong" &&
                risk === "low"
            ) {
                return {
                    label: "High",
                    className: "high"
                };
            }

            /*
                Moderate confidence requires:
                - at least 3 games
                - meaningful score magnitude
                - non-Weak strength
                - non-High risk
            */

            if (
                sampleSize !== null &&
                sampleSize >= 3 &&
                magnitude >= 10 &&
                strength !== "weak" &&
                risk !== "high"
            ) {
                return {
                    label: "Moderate",
                    className: "moderate"
                };
            }

            return {
                label: "Low",
                className: "low"
            };
        };

        const momentumConfidence =
            getMomentumConfidence();

        /*
            D10I — Momentum sample-size display

            Keep the displayed sample consistent with the
            sample used by Momentum Confidence.
        */

        const momentumSampleSize =
            getTrendSampleSize(trend);

        const momentumSampleLabel =
            momentumSampleSize === null
                ? "Sample size unavailable"
                : `Based on ${momentumSampleSize} ${
                    momentumSampleSize === 1
                        ? "game"
                        : "games"
                }`;

        /*
            D10J — Sample-size-aware displayed trend strength

            Preserve the backend trend-strength value for analytics
            and confidence calculations. Only adjust the user-facing
            label when the available sample is still too small to
            characterize the trend as established.
        */

        const displayedTrendStrength =
            momentumSampleSize !== null &&
            momentumSampleSize < 3
                ? "Early"
                : displayTrendStrength;

        const displayedTrendStrengthClass =
            momentumSampleSize !== null &&
            momentumSampleSize < 3
                ? "early"
                : visualState.strengthClass;

        const card = document.createElement("article");

        card.className =
            `trend-card trend-${visualState.direction}`;

        card.innerHTML = `

    <div
        class="trend-icon trend-icon-${visualState.direction}"
        title="${visualState.label} trend"
    >
        ${visualState.icon}
    </div>

    <div
        class="trend-status trend-status-${visualState.direction}"
    >
        ${visualState.label}
    </div>

    <h3>

        ${trend.title}

    </h3>

    <p>

        ${trend.description}

    </p>

    <div class="odds-table-wrap">
        <table class="odds-table odds-summary-table">
            <tbody>
                <tr>
                    <th scope="row">Trend Score</th>
                    <td class="trend-score-value trend-score-${visualState.direction} trend-score-intensity-${trendScoreIntensity}">${displayTrendScore}</td>
                </tr>
                <tr>
                    <th scope="row">Hit Rate Last 5</th>
                    <td>${trendHitRates[trend.title] || "-"}</td>
                </tr>
                <tr>
                    <th scope="row">Trend Strength</th>
                    <td><strong class="trend-badge trend-strength-badge trend-strength-${displayedTrendStrengthClass}">${displayedTrendStrength}</strong></td>
                </tr>
                <tr>
                    <th scope="row">Risk Tier</th>
                    <td><strong class="trend-badge trend-risk-badge ${
                        riskSampleSize !== null && riskSampleSize < 3
                            ? "trend-risk-early"
                            : `trend-risk-${visualState.riskClass}`
                    }">${displayRisk}</strong></td>
                </tr>
                <tr>
                    <th scope="row">Momentum Confidence</th>
                    <td><strong class="trend-badge momentum-confidence-badge momentum-confidence-${momentumConfidence.className}">${momentumConfidence.label}</strong></td>
                </tr>
                <tr>
                    <th scope="row">Sample</th>
                    <td>${momentumSampleLabel}</td>
                </tr>
            </tbody>
        </table>
    </div>

`;

        grid.appendChild(card);

    });

}

// ------------------------------------------------------
// Utilities
// ------------------------------------------------------

function formatEdgePercent(value) {

    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {
        return "-";
    }

    const number = Number(value);

    if (!Number.isFinite(number)) {
        return "-";
    }

    // Sportacular Edge is stored as a probability-point decimal.
    // Example:
    // 0.0997 -> 10.0%
    //
    // Preserve compatibility with older values that may already
    // be stored on a percentage scale.
    if (Math.abs(number) <= 1) {
        return `${(number * 100).toFixed(1)}%`;
    }

    if (Math.abs(number) <= 100) {
        return `${number.toFixed(1)}%`;
    }

    return "-";
}

function formatProbability(value) {

    // Preserve unavailable P15/P16 values.
    // Number(null) and Number("") both become 0,
    // which would incorrectly display missing data as 0.0%.
    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {
        return "-";
    }

    const number = Number(value);

    if (!Number.isFinite(number)) {
        return "-";
    }

    // Probability stored as decimal:
    // 0.0851 -> 8.5%
    if (number >= 0 && number <= 1) {
        return `${(number * 100).toFixed(1)}%`;
    }

    // Probability already stored as percentage:
    // 8.51 -> 8.5%
    if (number > 1 && number <= 100) {
        return `${number.toFixed(1)}%`;
    }

    return "-";

}

function setText(id, value) {

    const element =
        document.getElementById(id);

    if (!element) return;

    element.textContent = value;

}

function renderFields(fields) {

    Object.entries(fields).forEach(

        ([id, value]) => {

            setText(id, value);

        }

    );

}

function formatStatValue(value, label = "") {

    /*
      Preserve genuinely unavailable values.

      Important:
      Number(null) === 0
      Number("") === 0

      Those conversions would make missing data
      look like a legitimate statistical zero.
    */
    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {
        return "—";
    }

    const number = Number(value);

    if (!Number.isFinite(number)) {
        return value ?? "—";
    }

    const lower = String(label).toLowerCase();

    // Games should always be whole numbers
    if (
        lower === "games" ||
        lower === "games played"
    ) {
        return Math.round(number);
    }

    if (
        lower.includes("/ game") ||
        lower.includes("per game")
    ) {
        return number.toFixed(1);
    }

    // Integer stats
    if (
        Number.isInteger(number) ||
        Math.abs(number - Math.round(number)) < 0.001
    ) {
        return Math.round(number);
    }

    // Everything else gets one decimal
    return number.toFixed(1);

}

function createStatCard(label, value) {

    const card = document.createElement("article");

    card.className = "stat-card";

    card.innerHTML = `

        <span class="stat-label">

            ${label}

        </span>

        <span class="stat-value">

            ${formatStatValue(value, label)}

        </span>

    `;

    return card;

}

function getTrendSampleSize(trend = null) {

    const rawSampleSize =
        trend?.sampleSize ??
        trend?.games ??
        trend?.gamesPlayed ??
        player?.gameLogs?.length ??
        null;

    if (
        rawSampleSize === null ||
        rawSampleSize === undefined ||
        rawSampleSize === "" ||
        !Number.isFinite(Number(rawSampleSize))
    ) {
        return null;
    }

    return Math.max(
        0,
        Math.round(Number(rawSampleSize))
    );
}

function createSeasonPanel(panel) {

    const section = document.createElement("section");

    section.className = "stats-panel";

    const seasonDataAvailable =
        player?.dataAvailability?.seasonStats !== false;

    const rows = panel.stats.map(stat => {

        let value =
            seasonDataAvailable
                ? stat.value
                : null;

        /*
            D10K — Season Overview trend-strength consistency

            Keep the backend Trend Strength untouched.

            When the profile has fewer than 3 available games,
            display "Early" in the Season Overview Trend Metrics
            panel so it agrees with the Player Momentum cards.
        */

        const isTrendMetricsPanel =
            String(panel?.title || "")
                .trim()
                .toLowerCase() === "trend metrics";

        const isTrendStrengthRow =
            String(stat?.label || "")
                .trim()
                .toLowerCase() === "trend strength";

        const seasonTrendSampleSize =
            getTrendSampleSize(
                player?.trends?.[0] ?? null
            );

        if (
            isTrendMetricsPanel &&
            isTrendStrengthRow &&
            seasonTrendSampleSize !== null &&
            seasonTrendSampleSize < 3
        ) {
            value = "Early";
        }

        /*
            D10S — Season Overview Risk Tier consistency

            Preserve the backend Risk Tier, but when fewer than
            3 games are available display "Early" in the Season
            Overview Trend Metrics panel so it agrees with the
            Player Momentum cards.
        */

        const isRiskTierRow =
            String(stat?.label || "")
                .trim()
                .toLowerCase() === "risk tier";

        if (
            isTrendMetricsPanel &&
            isRiskTierRow &&
            seasonTrendSampleSize !== null &&
            seasonTrendSampleSize < 3
        ) {
            value = "Early";
        }

        const normalizedPanelTitle =
            String(panel?.title || "")
                .trim()
                .toLowerCase();

        const normalizedStatLabel =
            String(stat?.label || "")
                .trim()
                .toLowerCase();

        const formattedValue =
            formatStatValue(
                value,
                stat.label
            );

        let valueClass = "";

        if (normalizedPanelTitle === "trend metrics") {

            if (normalizedStatLabel === "trend strength") {

                const strengthClass =
                    String(formattedValue || "")
                        .trim()
                        .toLowerCase();

                if (
                    strengthClass === "strong" ||
                    strengthClass === "moderate" ||
                    strengthClass === "weak" ||
                    strengthClass === "early"
                ) {
                    valueClass =
                        `trend-badge trend-strength-${strengthClass}`;
                }
            }

            if (normalizedStatLabel === "risk tier") {

                const riskClass =
                    String(formattedValue || "")
                        .trim()
                        .toLowerCase();

                if (
                    riskClass === "low" ||
                    riskClass === "moderate" ||
                    riskClass === "high" ||
                    riskClass === "early"
                ) {
                    valueClass =
                        `trend-badge trend-risk-${riskClass}`;
                }
            }
        }

        return `

        <tr>

            <th scope="row">${stat.label}</th>

            <td class="${valueClass}">

                ${formattedValue}

            </td>

        </tr>
    `;

    }).join("");

    section.innerHTML = `

        <h3>

            ${panel.title}

        </h3>

        <div class="odds-table-wrap">

            <table class="odds-table odds-summary-table">

                <tbody>

                    ${rows}

                </tbody>

            </table>

        </div>

    `;

    return section;

}

function createInsightCard(insight) {

    const card = document.createElement("article");

    card.className = "trend-card";

    const formatInsightNumber = (
        value,
        decimals = 1
    ) => {

        if (
            value === null ||
            value === undefined ||
            value === ""
        ) {
            return "-";
        }

        const number = Number(value);

        if (!Number.isFinite(number)) {
            return "-";
        }

        return number.toFixed(decimals);
    };

    /*
        D10Q — Sample-size-aware Analytics Insight Trend Score

        Preserve the underlying Trend Score, but clearly mark
        scores based on fewer than 3 games as early-sample
        observations in the Analytics Insights presentation.
    */
    const rawInsightTrendScore =
        formatInsightNumber(
            insight.trendScore ??
            insight.score
        );

    const insightSampleSize =
        getTrendSampleSize(insight);

    const displayTrendScore =
        rawInsightTrendScore === "-"
            ? "-"
            : (
                insightSampleSize !== null &&
                insightSampleSize < 3
            )
                ? `${rawInsightTrendScore} (Early)`
                : rawInsightTrendScore;

    const rawDisplayTrendStrength =
        insight.trendStrength ??
        insight.strength ??
        "-";

    const displayTrendStrength =
        insightSampleSize !== null &&
        insightSampleSize < 3
            ? "Early"
            : rawDisplayTrendStrength;

    /*
        D10T — Sample-size-aware Analytics Insight Risk Tier

        Preserve the backend Risk Tier, but when fewer than
        3 games are available display "Early" so Analytics
        Insights remain consistent with Player Momentum and
        Season Overview.
    */

    const rawDisplayRisk =
        insight.riskTier ??
        insight.risk ??
        "-";

    const displayRisk =
        insightSampleSize !== null &&
        insightSampleSize < 3
            ? "Early"
            : rawDisplayRisk;

    card.innerHTML = `

        <div class="trend-icon">

            ${insight.icon ?? "📈"}

        </div>

        <h3>

            ${insight.title ?? "-"}

        </h3>

        <p>

            ${insight.text ?? ""}

        </p>

        <div class="odds-table-wrap">
            <table class="odds-table odds-summary-table">
                <tbody>
                    <tr><th scope="row">Trend Score</th><td>${displayTrendScore}</td></tr>
                    <tr><th scope="row">Trend Strength</th><td>${displayTrendStrength}</td></tr>
                    <tr><th scope="row">Risk Tier</th><td>${displayRisk}</td></tr>
                </tbody>
            </table>
        </div>

    `;

    return card;

}

function renderInsights() {

    const section = document.getElementById(
        "analytics-insights-section"
    );

    const grid = document.getElementById(
        "analytics-insights-grid"
    );

    if (!grid || !section) return;

    if (!player.insights?.length) {

        section.hidden = true;

        return;

    }

    section.hidden = false;

    grid.innerHTML = "";

    player.insights.forEach(insight => {

        grid.appendChild(

            createInsightCard(
                insight
            )

        );

    });

}

function setupBackButtons() {

    const page =
        `${currentLeague}-props.html`;

    const top =
        document.getElementById("backLink");

    const bottom =
        document.getElementById("footerButton");

    if (top) {

        top.href = page;

    }

    if (bottom) {

        bottom.onclick = () => {

            window.location.href = page;

        };

    }

}