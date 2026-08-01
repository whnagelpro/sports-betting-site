// ======================================================
// Sportacular Analytics
// Universal Player Schema
// ======================================================

/*

Every player endpoint MUST return this shape.

{

    hero,

    quickStats,

    matchup,

    props,

    trends,

    seasonPanels,

    gameLogs,

    insights,

    analytics

}

----------------------------------------------------------------

hero

{

    name,

    team,

    position

}

----------------------------------------------------------------

quickStats

[

    {

        label,

        value

    }

]

----------------------------------------------------------------

matchup

{

    game,

    gameDate,

    opponent,

    venue,

    opponentStarter,

    opponentStarterHand,

    lineupSpot

}

----------------------------------------------------------------

props

[

    {

        displayName,

        propType,

        line,

        odds,

        sportsbook,

        probability,

        ev

    }

]

----------------------------------------------------------------

trends

[

    {

        title,

        description,

        strength,

        consistency,

        risk

    }

]

----------------------------------------------------------------

seasonPanels

[

    {

        title,

        stats

    }

]

----------------------------------------------------------------

gameLogs

[

    {

        gameDate,

        opponent,

        ...

    }

]

----------------------------------------------------------------

insights

[]

----------------------------------------------------------------

analytics

{}

*/