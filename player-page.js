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

    setText(
        "player-name",
        player.name
    );

    setText(
        "player-team",
        player.team
    );

    setText(
        "player-position",
        player.position
    );

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