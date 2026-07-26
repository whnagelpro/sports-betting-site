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

        "player-name": player.name,

        "player-team": player.team,

        "player-position": player.position,

        "player-bats": player.bats,

        "player-throws": player.throws,

        "analytics-score": player.analyticsScore

    });

}

function renderQuickStats() {

    const grid = document.getElementById(

        "quick-stats-grid"

    );

    if (!grid) return;

    grid.innerHTML = "";

    player.quickStats.forEach(stat => {

        grid.appendChild(

    createStatCard(

        stat.label,

        stat.value

    )

);

    });

}

function renderSeasonPanels() {

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

    const body = document.getElementById(
        "game-log-body"
    );

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

    player.gameLogs.forEach(game => {

        body.appendChild(

            createGameLogRow(game)

        );

    });

}

function createGameLogRow(game) {

    const row = document.createElement("tr");

    const isPitcher =

        player.position === "SP" ||

        player.position === "RP" ||

        player.position === "P";

    if (isPitcher) {

        row.innerHTML = `

            <td>${game.gameDate}</td>

            <td>${game.opponent}</td>

            <td>-</td>

            <td>${game.outs}</td>

            <td>-</td>

            <td>-</td>

            <td>-</td>

            <td>-</td>

            <td>${game.walks}</td>

            <td>${game.strikeouts}</td>

        `;

    }

    else {

        row.innerHTML = `

            <td>${game.gameDate}</td>

            <td>${game.opponent}</td>

            <td>-</td>

            <td>-</td>

            <td>${game.hits}</td>

            <td>${game.runs}</td>

            <td>${game.rbis}</td>

            <td>${game.homeRuns}</td>

            <td>${game.walks}</td>

            <td>${game.strikeouts}</td>

        `;

    }

    return row;

}

function renderAnalyticsDashboard() {

    const dashboard = document.getElementById(
        "analytics-dashboard"
    );

    if (!dashboard) return;

    const analytics = player.analytics;

    dashboard.innerHTML = `

        <div class="analytics-left">

            <span class="analytics-title">

                Analytics Score

            </span>

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

                <strong>Expected Value</strong>

                <span class="positive-ev">

                    ${analytics.bestProp.ev}

                </span>

            </div>

        </div>

    `;

}

function renderMatchup() {

    if (!player.matchup) return;

    renderFields({

        "matchup-game":

            `${player.matchup["Away Team"]} @ ${player.matchup["Home Team"]}`,

        "matchup-time":

            player.matchup["Game Date"],

        "opponent-pitcher":

            player.matchup["Opponent Pitcher"] ?? "-",

        "opponent-handedness":

            player.matchup["Opponent Throws"] ?? "-",

        "lineup-position":

            player.matchup["Projected Lineup Spot"] ?? "-"

    });

}

function renderProps() {

    if (!player.props?.length) return;

    const topProp = player.props[0];

    renderFields({

        "top-prop-name":

            topProp["Prop Type"],

        "top-prop-line":

            topProp["Line Value"],

        "top-prop-odds":

            topProp["Odds"],

        "top-prop-book":

            topProp["Vendor"],

        "top-prop-ev":

            topProp["EV Over/Milestone ($1 Bet)"],

        "top-prop-probability":

            topProp["Poisson Over"]

    });

}

function renderTrendCards() {

    const grid = document.getElementById(

        "trend-grid"

    );

    if (!grid) return;

    grid.innerHTML = "";

    player.trends.forEach(trend => {

        const card = document.createElement("article");

        card.className = "trend-card";

        card.innerHTML = `

            <div class="trend-icon">

                📈

            </div>

            <h3>

                ${trend.statType}

            </h3>

            <p>

                ${trend.trendNote}

            </p>

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

    const grid = document.getElementById(
        "analytics-insights-grid"
    );

    if (!grid) return;

    grid.innerHTML = "";

    player.insights.forEach(insight => {

        grid.appendChild(

            createInsightCard(
                insight
            )

        );

    });

}