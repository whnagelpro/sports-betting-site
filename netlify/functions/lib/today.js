import { loadCSV } from "./csv.js";

export async function loadTodayGameOdds(url) {

    return loadCSV(url);

}

export async function loadTodayPlayerProps(url) {

    return loadCSV(url);

}

export function findPlayerToday({

    player,

    gameOdds,

    playerProps

}) {

    const props = playerProps.filter(prop =>

        String(prop["Player ID"]) ===

        String(player.Id)

    );

    const matchup = gameOdds.find(game =>

        game["Home Team"] === player["Team Name"] ||

        game["Away Team"] === player["Team Name"]

    ) || {};

    return {

        matchup,

        props

    };

}