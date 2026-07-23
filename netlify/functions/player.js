/*======================================================
    Sportacular Analytics
    Player Profile Engine
======================================================*/

"use strict";

/*======================================================
    CONFIGURATION
======================================================*/

const PLAYER_ENDPOINTS = {

    mlb: "/.netlify/functions/mlb-player",

    nba: "/.netlify/functions/nba-player",

    nhl: "/.netlify/functions/nhl-player",

    nfl: "/.netlify/functions/nfl-player"

};

/*======================================================
    GLOBAL STATE
======================================================*/

let currentLeague = "";

let currentPlayerId = "";

let player = null;

/*======================================================
    URL PARAMETERS
======================================================*/

function getUrlParameters() {

    const params = new URLSearchParams(window.location.search);

    currentLeague = (
        params.get("league") || "mlb"
    ).toLowerCase();

    currentPlayerId = params.get("id");

}

/*======================================================
    INITIALIZE PAGE
======================================================*/

async function initPlayerPage() {

    try {

        getUrlParameters();

        await loadPlayer();

        renderHero();

    }

    catch (error) {

        console.error(error);

        showError(error);

    }

}

/*======================================================
    LOAD PLAYER
======================================================*/

async function loadPlayer() {

    player = await fetchPlayer();

}

/*======================================================
    FETCH PLAYER
======================================================*/

async function fetchPlayer() {

    const endpoint = PLAYER_ENDPOINTS[currentLeague];

    const response = await fetch(

        `${endpoint}?league=${currentLeague}&id=${currentPlayerId}`

    );

    if (!response.ok) {

        throw new Error(

            "Unable to load player."

        );

    }

    return await response.json();

}

/*======================================================
    HERO
======================================================*/

function renderHero() {

    setText("player-name", player.name);

    setText("player-team", player.team);

    setText("player-position", player.position);

    setText(

        "player-bats",

        `Bats: ${player.bats}`

    );

    setText(

        "player-throws",

        `Throws: ${player.throws}`

    );

    setText(

        "player-age",

        `Age: ${player.age}`

    );

    setText(

        "analytics-score",

        player.analyticsScore

    );

    const img = document.getElementById(

        "player-headshot"

    );

    if (img) {

        img.src = player.headshot;

        img.alt = player.name;

    }

}

async function initPlayerPage() {

    try {

        getUrlParameters();

        await loadPlayer();

        renderHero();

        renderQuickStats();

        renderMatchup();

        renderProps();

        renderTrends();

        renderSeasonStats();

        renderGameLogs();

        renderPerformanceSummary();

        renderRelatedPlayers();

    }

    catch(error){

        console.error(error);

        showError(error);

    }

}

/*======================================================
    QUICK STATS
======================================================*/

function renderQuickStats(){

    if(!player.quickStats) return;

    setText("stat-avg",player.quickStats.avg);

    setText("stat-ops",player.quickStats.ops);

    setText("stat-hr",player.quickStats.hr);

    setText("stat-rbi",player.quickStats.rbi);

    setText("stat-runs",player.quickStats.runs);

    setText("stat-hits",player.quickStats.hits);

}

/*======================================================
    MATCHUP
======================================================*/

function renderMatchup(){

    if(!player.matchup) return;

    setText(

        "matchup-game",

        player.matchup.game

    );

    setText(

        "matchup-time",

        player.matchup.time

    );

    setText(

        "opponent-pitcher",

        player.matchup.pitcher

    );

    setText(

        "opponent-handedness",

        player.matchup.handedness

    );

    setText(

        "lineup-position",

        player.matchup.lineup

    );

}

function renderProps(){

    if(!player.props) return;

    const grid = document.getElementById("props-grid");

    if(!grid) return;

    grid.innerHTML = "";

    player.props.forEach(prop=>{

        grid.innerHTML += `

        <article class="prop-card">

            <div class="prop-card-header">

                <h4>${prop.market}</h4>

                <span>${prop.book}</span>

            </div>

            <div class="prop-line">

                ${prop.line}

            </div>

            <div class="prop-odds">

                ${prop.odds}

            </div>

            <div class="prop-footer">

                <span>${prop.ev}</span>

                <button class="btn btn-secondary">

                    View

                </button>

            </div>

        </article>

        `;

    });

}

function renderTrends(){

    if(!player.trends) return;

    const grid = document.getElementById(

        "trend-grid"

    );

    if(!grid) return;

    grid.innerHTML="";

    player.trends.forEach(trend=>{

        grid.innerHTML+=`

        <article class="trend-card">

            <div class="trend-icon">

                ${trend.icon}

            </div>

            <h3>

                ${trend.title}

            </h3>

            <p>

                ${trend.description}

            </p>

        </article>

        `;

    });

}

function renderSeasonStats(){

    if(!player.season) return;

    setText(

        "season-avg",

        player.season.avg

    );

    setText(

        "season-obp",

        player.season.obp

    );

    setText(

        "season-slg",

        player.season.slg

    );

    setText(

        "season-ops",

        player.season.ops

    );

    setText(

        "season-hr",

        player.season.hr

    );

    setText(

        "season-rbi",

        player.season.rbi

    );

    setText(

        "season-xbh",

        player.season.xbh

    );

    setText(

        "season-tb",

        player.season.tb

    );

    setText(

        "season-bb",

        player.season.bb

    );

    setText(

        "season-so",

        player.season.so

    );

    setText(

        "season-bb-rate",

        player.season.bbRate

    );

    setText(

        "season-k-rate",

        player.season.kRate

    );

}

function renderGameLogs(){

    if(!player.gameLogs) return;

    const body=document.getElementById(

        "game-log-body"

    );

    if(!body) return;

    body.innerHTML="";

    player.gameLogs.forEach(game=>{

        body.innerHTML+=`

        <tr>

            <td>${game.date}</td>

            <td>${game.opponent}</td>

            <td>${game.result}</td>

            <td>${game.ab}</td>

            <td>${game.h}</td>

            <td>${game.r}</td>

            <td>${game.rbi}</td>

            <td>${game.hr}</td>

            <td>${game.bb}</td>

            <td>${game.so}</td>

        </tr>

        `;

    });

}

function renderPerformanceSummary(){

    if(!player.summary) return;

    setText(

        "summary-avg",

        player.summary.avg

    );

    setText(

        "summary-ops",

        player.summary.ops

    );

    setText(

        "summary-hr",

        player.summary.hr

    );

    setText(

        "summary-rbi",

        player.summary.rbi

    );

}

function renderRelatedPlayers(){

    if(!player.relatedPlayers) return;

    const grid=document.getElementById(

        "related-player-grid"

    );

    if(!grid) return;

    grid.innerHTML="";

    player.relatedPlayers.forEach(p=>{

        grid.innerHTML+=`

        <article class="related-player-card">

            <img

                src="${p.headshot}"

                alt="${p.name}"

            >

            <h3>

                ${p.name}

            </h3>

            <p>

                ${p.team}

            </p>

            <a

                href="player.html?league=${currentLeague}&id=${p.id}"

                class="btn btn-secondary">

                View Profile

            </a>

        </article>

        `;

    });

}

/*======================================================
    UTILITIES
======================================================*/

function setText(id, value) {

    const element = document.getElementById(id);

    if (!element) return;

    element.textContent = value;

}

/*======================================================
    ERROR
======================================================*/

function showError(error) {

    console.error(error);

    const hero = document.querySelector(".player-page");

    if (!hero) return;

    hero.innerHTML = `

        <div class="container">

            <h2>

                Unable to load player.

            </h2>

            <p>

                Please try again later.

            </p>

        </div>

    `;

}

/*======================================================
    START
======================================================*/

document.addEventListener(

    "DOMContentLoaded",

    initPlayerPage

);