export function buildQuickStats(context) {

    const {

        seasonStats: season,

        isPitcher

    } = context;

if (isPitcher) {

    const outs = Number(season["Avg Pitcher Outs"] ?? 0);

    const inningsPitched = (outs / 3).toFixed(1);

    return [

        {
            label: "Games",
            value: season["Games Played"] ?? "-"
        },

        {
            label: "IP",
            value: inningsPitched
        },

        {
            label: "Strikeouts",
            value: Number(
                season["Avg Pitcher Strikeouts"] ?? 0
            ).toFixed(1)
        },

        {
            label: "Earned Runs",
            value: Number(
                season["Avg Pitcher Earned Runs"] ?? 0
            ).toFixed(1)
        },

        {
            label: "Hits Allowed",
            value: Number(
                season["Avg Pitcher Hits Allowed"] ?? 0
            ).toFixed(1)
        },

        {
            label: "Walks",
            value: Number(
                season["Avg Pitcher Walks"] ?? 0
            ).toFixed(1)
        }

    ];

}

    return [

        {

            label: "Games",

            value: season["Games Played"] ?? "-"

        },

        {

            label: "Hits",

            value: Number(

                season["Avg Hits"] ?? 0

            ).toFixed(2)

        },

        {

            label: "Runs",

            value: Number(

                season["Avg Runs"] ?? 0

            ).toFixed(2)

        },

        {

            label: "RBIs",

            value: Number(

                season["Avg RBIs"] ?? 0

            ).toFixed(2)

        },

        {

            label: "Home Runs",

            value: Number(

                season["Avg Home Runs"] ?? 0

            ).toFixed(2)

        },

        {

            label: "Strikeouts",

            value: Number(

                season["Avg Strikeouts"] ?? 0

            ).toFixed(2)

        }

    ];

}