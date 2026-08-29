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

async function initPlayerPage() {

    getUrlParameters();

    const labels = getLeagueLabels(currentLeague);

    applyLeagueLabels(labels);

    setupBackButtons();

    try {

        player = await fetchPlayer();

        console.log("Player Object:");

        console.log(player);

        renderHero();

        renderInsights();

        renderAnalyticsDashboard();

        renderQuickStats();

        renderSeasonPanels();

        if (currentLeague !== "mlb") {

            const propsSection =
                document.getElementById("player-props-section");

            if (propsSection) {
                propsSection.hidden = true;
            }

        }

        if (currentLeague === "mlb") {
            renderProps();
        }

        renderTrendCards();

        renderGameLogs();

    }

    catch (error) {

        console.error(error);

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

    const date = new Date(dateString);

    if (isNaN(date)) return dateString;

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

    if (!response.ok) {

        throw new Error(

            "Unable to load player."

        );

    }

    return await response.json();

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

function renderQuickStats() {

    const grid = document.getElementById(

        "quick-stats-grid"

    );

    if (!grid) return;

    grid.innerHTML = "";

    const cards =
        player.quickStats?.cards ??
        player.quickStats ??
        [];

    cards.forEach(stat => {

        grid.appendChild(

            createStatCard(

                stat.label,

                stat.value

            )

        );

    });

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

        case "nfl":
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
                "Rushing TDs",
                "Receptions",
                "Receiving Yards",
                "Receiving TDs"
            ];

        case "mlb":
        default:
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

if (!player.gameLogs?.length) {

    section.hidden = true;

    return;

}

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

    player.gameLogs.forEach(game => {

        body.appendChild(

            createRow(game, player)

        );

    });

}

function createMLBGameLogRow(game) {

    const row = document.createElement("tr");

    const isPitcher = player.isPitcher;

    if (isPitcher) {

        row.innerHTML = `

            <td>${game.gameDate}</td>

            <td>${game.opponent}</td>

            <td>${game.inningsPitched}</td>

            <td>${game.strikeouts}</td>

            <td>${game.earnedRuns}</td>

            <td>${game.hitsAllowed}</td>

            <td>${game.walks}</td>

        `;

    }

    else {

        row.innerHTML = `

            <td>${game.gameDate}</td>

            <td>${game.opponent}</td>

            <td>${game.hits}</td>

            <td>${game.runs}</td>

            <td>${game.rbis}</td>

            <td>${game.homeRuns}</td>

            <td>${game.totalBases}</td>

            <td>${game.walks}</td>

            <td>${game.strikeouts}</td>

        `;

    }

    return row;

}

function createNFLGameLogRow(game) {

    const tr = document.createElement("tr");

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

        <td>${game.receptions ?? 0}</td>
        <td>${game.receivingYards ?? 0}</td>
        <td>${game.receivingTDs ?? 0}</td>
    `;

    return tr;

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

    const dashboardProp =
        player.props.find(
            prop =>
                prop.id != null &&
                String(prop.id) ===
                String(analytics.bestProp?.id)
        ) ||
        player.props.find(
            prop =>
                prop.sportacularScore ===
                analytics.bestProp?.score
        ) ||
        analytics.bestProp;

    const dashboardAnalytics =
        dashboardProp?.analytics ??
        null;

    const modelEdgeValue =
        dashboardAnalytics?.modelEdge ??
        dashboardProp?.modelEdge ??
        player.analytics?.modelEdge?.edgePercent ??
        null;

    console.log("Analytics Dashboard Object");
    console.log(analytics);
    console.log("Model Edge:", analytics.modelEdge);
    console.log("Best Prop:", analytics.bestProp);

    dashboard.innerHTML = `

    <div class="analytics-left">

        <div class="analytics-title">

            SPORTACULAR SCORE

        </div>

        <div class="analytics-score-large">

            ${analytics?.sportacularScore ??
                dashboardProp?.sportacularScore ??
                dashboardAnalytics?.score ??
                player.analytics?.sportacularScore ??
                player.analytics?.score ??
                "-"}

        </div>

        <div class="analytics-rating">

            ★★★★★

        </div>

        <div class="analytics-recommendation">

            ${analytics?.recommendation ??
                dashboardProp.recommendation ??
                player.analytics.recommendation}

        </div>

    </div>

    <div class="analytics-right">

        <div class="analytics-item">

            <strong>Model Edge</strong>

            <span class="positive-ev">

                ${
                    Number.isFinite(Number(modelEdgeValue))
                        ? `${Number(modelEdgeValue).toFixed(1)}%`
                        : "-"
                }

            </span>

        </div>

        <div class="analytics-item">

            <strong>Confidence</strong>

            <span>

                ${analytics?.confidence ??
                    dashboardProp.confidence ??
                    player.analytics.confidence}

            </span>

        </div>

        <div class="analytics-item">

            <strong>Best Prop</strong>

            <span>

                ${dashboardProp.displayName}

            </span>

        </div>

        <div class="analytics-item">

            <strong>Suggested Line</strong>

            <span>

                ${dashboardProp.line}

            </span>

        </div>

        <div class="analytics-item">

            <strong>Sportsbook</strong>

            <span>

                ${dashboardProp.sportsbook}

            </span>

        </div>

    </div>

    `;

}

function renderProps() {

    const section = document.getElementById(
        "player-props-section"
    );

    if (!section) return;

    if (!player.props?.length) {

        section.hidden = true;

        return;

    }

    section.hidden = false;

    const topProp =
        player.props.find(
            prop =>
                prop.id != null &&
                String(prop.id) ===
                String(player.analytics.bestProp?.id)
        ) ||
        player.props.find(
            prop =>
                prop.sportacularScore ===
                player.analytics.bestProp?.score
        ) ||
        player.props[0];

    const analytics = topProp?.analytics ?? null;

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
        Number.isFinite(Number(analytics?.modelEdge))
            ? `${Number(analytics.modelEdge).toFixed(1)}%`
            : Number.isFinite(Number(topProp.modelEdge))
                ? `${Number(topProp.modelEdge).toFixed(1)}%`
                : topProp.ev,

    "top-prop-probability":
        analytics?.probability ??
        topProp.probability,

    "top-prop-confidence":
        analytics?.confidence ??
        topProp.confidence ??
        "-",

    "top-prop-recommendation":
        analytics?.recommendation ??
        topProp.recommendation ??
        "-"

});

    const grid =
        document.getElementById(
            "props-grid"
        );

    if (!grid) return;

    grid.innerHTML = "";

    player.props.forEach(prop => {

        const analytics =
            prop.analytics ?? {};

        const card =
            document.createElement("article");

        card.className =
            "prop-card";

        card.innerHTML = `

        <div class="prop-card-header">

            <div>

                <h3>${prop.displayName}</h3>

                <div class="prop-subtitle">

                    ${prop.sportsbook}

                </div>

            </div>

            <div class="prop-score">

                ${analytics.sportacularScore ??
                    prop.sportacularScore ??
                    analytics.score ??
                    prop.score ??
                    "-"}

            </div>

        </div>

        <div class="prop-grid">

            <div>

                <span>Line</span>

                <strong>${prop.line}</strong>

            </div>

            <div>

                <span>Odds</span>

                <strong>${prop.odds}</strong>

            </div>

            <div>

                <span>Model Edge</span>

                <strong>

                    ${
                        Number.isFinite(Number(analytics.modelEdge))
                            ? `${Number(analytics.modelEdge).toFixed(1)}%`
                            : Number.isFinite(Number(prop.modelEdge))
                                ? `${Number(prop.modelEdge).toFixed(1)}%`
                                : "-"
                    }

                </strong>

            </div>

            <div>

                <span>Confidence</span>

                <strong>

                    ${analytics.confidence ??
                        prop.confidence ??
                        "-"}

                </strong>

            </div>

            <div>

                <span>Recommendation</span>

                <strong>

                    ${analytics.recommendation ??
                        prop.recommendation ??
                        "-"}

                </strong>

            </div>

            <div>

                <span>Probability</span>

                <strong>

                    ${analytics.probability ??
                        prop.probability ??
                        "-"}

                </strong>

            </div>

        </div>

        `;

        grid.appendChild(card);

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

        const analytics =
            trend.analytics ?? {

                score:
                    trend.score,

                modelEdge:
                    trend.modelEdge,

                confidence:
                    trend.confidence,

                recommendation:
                    trend.recommendation

            };

        const card = document.createElement("article");

        card.className = "trend-card";

        card.innerHTML = `

    <div class="trend-icon">

        📈

    </div>

    <h3>

        ${trend.title}

    </h3>

    <p>

        ${trend.description}

    </p>

    <div class="trend-footer">

        <span>

            ⭐
            ${
                analytics.score ??
                trend.score ??
                "-"

            }

        </span>

        <span>

            📈
            ${
                Number.isFinite(Number(
                    analytics.modelEdge ??
                    trend.modelEdge
                ))
                    ? `${Number(
                        analytics.modelEdge ??
                        trend.modelEdge
                    ).toFixed(1)}%`
                    : "-"

            }

        </span>

    </div>

    <div class="trend-footer">

        <span>

            🟢
            ${
                analytics.confidence ??
                trend.confidence ??
                trend.strength ??
                "-"

            }

        </span>

        <span>

            🏆
            ${
                analytics.recommendation ??
                trend.recommendation ??
                trend.risk ??
                "-"

            }

        </span>

    </div>

    <div class="trend-footer">

        <span>

            Trend:
            ${trend.strength ?? "-"}

        </span>

        <span>

            Risk:
            ${trend.risk ?? "-"}

        </span>

    </div>

`;

        grid.appendChild(card);

    });

}

// ------------------------------------------------------
// Utilities
// ------------------------------------------------------

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

function createStatCard(label, value) {

    const card = document.createElement("article");

    card.className = "stat-card";

    card.innerHTML = `

        <span class="stat-label">

            ${label}

        </span>

        <span class="stat-value">

            ${value}

        </span>

    `;

    return card;

}

function createSeasonPanel(panel) {

    const section = document.createElement("section");

    section.className = "stats-panel";

    const rows = panel.stats.map(stat => `

        <div class="stat-row">

            <span>${stat.label}</span>

            <strong>${stat.value}</strong>

        </div>

    `).join("");

    section.innerHTML = `

        <h3>

            ${panel.title}

        </h3>

        <div class="stats-list">

            ${rows}

        </div>

    `;

    return section;

}

function createInsightCard(insight) {

    const card = document.createElement("article");

    card.className = "trend-card";

    card.innerHTML = `

        <div class="trend-icon">

            ${insight.icon}

        </div>

        <h3>

            ${insight.title}

        </h3>

        <p>

            ${insight.text}

        </p>

        <div class="trend-footer">

            <span>

                ⭐ ${insight.trendScore ?? "-"}

            </span>

            <span>

                ${insight.trendStrength ?? "-"}

            </span>

        </div>

        <div class="trend-footer">

            <span>

                ${insight.riskTier ?? "-"}

            </span>

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