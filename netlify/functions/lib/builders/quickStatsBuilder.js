export function buildQuickStats(season) {

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