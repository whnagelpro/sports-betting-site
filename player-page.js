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

    try {

        getUrlParameters();

        player = await fetchPlayer();

        console.log("Player Object:");

        console.log(player);

        renderHero();

        renderInsights();

        renderAnalyticsDashboard();

        renderQuickStats();

        renderSeasonPanels();

        renderMatchup();

        renderProps();

        renderTrendCards();

        renderGameLogs();

    }

    catch (error) {

        console.error(error);

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
        player.quickStats?.cards ?? [];

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

    const dashboard = document.getElementById(

        "season-dashboard"

    );

    if (!dashboard) return;

    dashboard.innerHTML = "";

    player.seasonPanels.forEach(panel => {

        const section = createSeasonPanel(panel);

        dashboard.appendChild(section);

    });

}

function renderGameLogs() {

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

if (header) {

    if (player.isPitcher) {

        header.innerHTML = `

            <th>Date</th>
            <th>Opponent</th>
            <th>IP</th>
            <th>SO</th>
            <th>ER</th>
            <th>H</th>
            <th>BB</th>

        `;

    }

    else {

        header.innerHTML = `

            <th>Date</th>
            <th>Opponent</th>
            <th>H</th>
            <th>R</th>
            <th>RBI</th>
            <th>HR</th>
            <th>TB</th>
            <th>BB</th>
            <th>SO</th>

        `;

    }

}

    if (!body) return;

    body.innerHTML = "";

    if (!player.gameLogs?.length) {

        body.innerHTML = `

            <tr>

                <td colspan="10">

                    No recent games available.

                </td>

            </tr>

        `;

        return;

    }

    console.log("Rendered Game Logs");

    console.table(player.gameLogs);

    player.gameLogs.forEach(game => {

        body.appendChild(

            createGameLogRow(game)

        );

    });

}

function createGameLogRow(game) {

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

            ${analytics.score}

        </div>

        <div class="analytics-rating">

            ★★★★★

        </div>

        <div class="analytics-recommendation">

            ${analytics.recommendation}

        </div>

    </div>

    <div class="analytics-right">

        <div class="analytics-item">

            <strong>Model Edge</strong>

            <span class="positive-ev">

                ${
                    analytics.modelEdge?.edgePercent != null
                        ? `${analytics.modelEdge.edgePercent.toFixed(1)}%`
                        : "-"

                }

            </span>

        </div>

        <div class="analytics-item">

            <strong>Confidence</strong>

            <span>

                ${analytics.confidence}

            </span>

        </div>

        <div class="analytics-item">

            <strong>Best Prop</strong>

            <span>

                ${analytics.bestProp.market}

            </span>

        </div>

        <div class="analytics-item">

            <strong>Suggested Line</strong>

            <span>

                ${analytics.bestProp.line}

            </span>

        </div>

        <div class="analytics-item">

            <strong>Sportsbook</strong>

            <span>

                ${analytics.bestProp.sportsbook}

            </span>

        </div>

    </div>

    `;

}

function renderMatchup() {

    const section = document.getElementById(
        "matchup-section"
    );

    if (!section) return;

    if (!player.matchup) {

        section.hidden = true;

        return;

    }

    section.hidden = false;

    renderFields({

        "matchup-game":
            player.matchup.title,

        "matchup-time":
            player.matchup.subtitle

    });

    const details = player.matchup.details ?? [];

    renderFields({

        "opponent-pitcher":
            details[0]?.value ?? "-",

        "opponent-handedness":
            details[1]?.value ?? "-",

        "lineup-position":
            details[2]?.value ?? "-"

    });

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

    const topProp = player.props[0];

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

        topProp.ev,

    "top-prop-probability":

        topProp.probability

});

}

function renderTrendCards() {

    const section = document.getElementById(
        "player-trends-section"
    );

    const grid = document.getElementById(
        "trend-grid"
    );

    if (!grid || !section) return;

    if (!player.trends?.length) {

        section.hidden = true;

        return;

    }

    section.hidden = false;

    grid.innerHTML = "";

    player.trends.forEach(trend => {

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

            Strength:
            ${trend.strength}

        </span>

        <span>

            Risk:
            ${trend.risk}

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