// ======================================================
// PLAYER PROFILE BOOTSTRAP
// ======================================================

async function bootstrapPlayerProfile(
    league,
    playerName
) {

    let profile;

    switch (league.toLowerCase()) {

        case "mlb":

            profile =
                await buildMLBPlayerProfile(playerName);

            break;

        case "nba":

            profile =
                await buildNBAPlayerProfile(playerName);

            break;

        case "nhl":

            profile =
                await buildNHLPlayerProfile(playerName);

            break;

        case "nfl":

            profile =
                await buildNFLPlayerProfile(playerName);

            break;

        default:

            throw new Error(
                "Unknown league: " + league
            );

    }

    window.PlayerRenderers.renderHero(profile);

    window.PlayerRenderers.renderQuickStats(profile);

    window.PlayerRenderers.renderSeasonSnapshot(profile);

    window.PlayerRenderers.renderTrendCards(profile);

    window.PlayerRenderers.renderTrendDetails(profile);

    window.PlayerRenderers.renderGameLogs(profile);

    window.PlayerRenderers.renderSummary(profile);

}

// ======================================================
// TEMPORARY VALIDATION
// ======================================================

async function validateMLBProfile(playerName) {

    const profile =
        await buildMLBPlayerProfile(playerName);

    console.log(
        "NEW MLB PROFILE OBJECT"
    );

    console.log(profile);

    return profile;

}

window.validateMLBProfile =
    validateMLBProfile;

window.bootstrapPlayerProfile =
    bootstrapPlayerProfile;