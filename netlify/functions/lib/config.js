// ======================================================
// Sportacular Analytics
// Data Sources
// ======================================================

const DATA_SOURCES = {

    mlb: {

        roster:
        "https://docs.google.com/spreadsheets/d/e/2PACX-1vRp1qdWZXtA4IB8NB6xnrtirs_Lv3EWNyyJbfpmR4_BZNujv-u4KgaOcJ6do9OfSWnIXeS56EfYQaZx/pub?gid=71053884&single=true&output=csv",

        seasonStats:
        "https://docs.google.com/spreadsheets/d/e/2PACX-1vRp1qdWZXtA4IB8NB6xnrtirs_Lv3EWNyyJbfpmR4_BZNujv-u4KgaOcJ6do9OfSWnIXeS56EfYQaZx/pub?gid=277775608&single=true&output=csv",

        gameLogs:
        "https://docs.google.com/spreadsheets/d/e/2PACX-1vRp1qdWZXtA4IB8NB6xnrtirs_Lv3EWNyyJbfpmR4_BZNujv-u4KgaOcJ6do9OfSWnIXeS56EfYQaZx/pub?gid=403465757&single=true&output=csv",

        trends:
        "https://docs.google.com/spreadsheets/d/e/2PACX-1vRp1qdWZXtA4IB8NB6xnrtirs_Lv3EWNyyJbfpmR4_BZNujv-u4KgaOcJ6do9OfSWnIXeS56EfYQaZx/pub?gid=1443511953&single=true&output=csv",

        gameOdds:
        "https://docs.google.com/spreadsheets/d/e/2PACX-1vRp1qdWZXtA4IB8NB6xnrtirs_Lv3EWNyyJbfpmR4_BZNujv-u4KgaOcJ6do9OfSWnIXeS56EfYQaZx/pub?gid=989861231&single=true&output=csv",

        playerProps:
        "https://docs.google.com/spreadsheets/d/e/2PACX-1vRp1qdWZXtA4IB8NB6xnrtirs_Lv3EWNyyJbfpmR4_BZNujv-u4KgaOcJ6do9OfSWnIXeS56EfYQaZx/pub?gid=1502960090&single=true&output=csv",

        schedule:
        "https://docs.google.com/spreadsheets/d/e/2PACX-1vRp1qdWZXtA4IB8NB6xnrtirs_Lv3EWNyyJbfpmR4_BZNujv-u4KgaOcJ6do9OfSWnIXeS56EfYQaZx/pub?gid=314629327&single=true&output=csv"

    },

    nba: {},

    nhl: {},

    nfl: {}

};

module.exports = { DATA_SOURCES };