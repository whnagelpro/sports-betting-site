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

        renderQuickStats();

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

    if (!player.quickStats) return;

    renderFields({

        "stat-games-played": player.quickStats.gamesPlayed,

        "stat-strikeouts": player.quickStats.strikeouts,

        "stat-walks": player.quickStats.walks,

        "stat-earned-runs": player.quickStats.earnedRuns,

        "stat-hits-allowed": player.quickStats.hitsAllowed

    });

}

function renderQuickStats() {

    if (!player.quickStats) return;

    renderFields({

        "stat-avg": player.quickStats.avg,

        "stat-ops": player.quickStats.ops,

        "stat-hr": player.quickStats.hr,

        "stat-rbi": player.quickStats.rbi,

        "stat-runs": player.quickStats.runs,

        "stat-hits": player.quickStats.hits

    });

}

renderHero();

renderQuickStats();

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