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

    const grid = document.getElementById(

        "quick-stats-grid"

    );

    if (!grid) return;

    grid.innerHTML = "";

    player.quickStats.forEach(stat => {

        const card = document.createElement("article");

        card.className = "stat-card";

        card.innerHTML = `

            <span class="stat-label">

                ${stat.label}

            </span>

            <span class="stat-value">

                ${stat.value}

            </span>

        `;

        grid.appendChild(card);

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