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

    nba: {

        roster:
        "https://docs.google.com/spreadsheets/d/e/2PACX-1vSV5XcArDjbKFyuONKov27C10JpN63ZcNiVKMnz5G4OEbM4tGToyslSZw9anHPAQfCE0IQupDMg8Cay/pub?gid=2086896815&single=true&output=csv",

        seasonStats:
        "https://docs.google.com/spreadsheets/d/e/2PACX-1vSV5XcArDjbKFyuONKov27C10JpN63ZcNiVKMnz5G4OEbM4tGToyslSZw9anHPAQfCE0IQupDMg8Cay/pub?gid=2028823596&single=true&output=csv",

        gameLogs:
        "https://docs.google.com/spreadsheets/d/e/2PACX-1vSV5XcArDjbKFyuONKov27C10JpN63ZcNiVKMnz5G4OEbM4tGToyslSZw9anHPAQfCE0IQupDMg8Cay/pub?gid=516015867&single=true&output=csv",

        trends:
        "https://docs.google.com/spreadsheets/d/e/2PACX-1vSV5XcArDjbKFyuONKov27C10JpN63ZcNiVKMnz5G4OEbM4tGToyslSZw9anHPAQfCE0IQupDMg8Cay/pub?gid=1458653646&single=true&output=csv",

        gameOdds:
        "https://docs.google.com/spreadsheets/d/e/2PACX-1vSV5XcArDjbKFyuONKov27C10JpN63ZcNiVKMnz5G4OEbM4tGToyslSZw9anHPAQfCE0IQupDMg8Cay/pub?gid=1553479471&single=true&output=csv",

        playerProps:
        "https://docs.google.com/spreadsheets/d/e/2PACX-1vSV5XcArDjbKFyuONKov27C10JpN63ZcNiVKMnz5G4OEbM4tGToyslSZw9anHPAQfCE0IQupDMg8Cay/pub?gid=590324617&single=true&output=csv",

        schedule:
        "https://docs.google.com/spreadsheets/d/e/2PACX-1vSV5XcArDjbKFyuONKov27C10JpN63ZcNiVKMnz5G4OEbM4tGToyslSZw9anHPAQfCE0IQupDMg8Cay/pub?gid=1724367340&single=true&output=csv"

    },

    nhl: {},

    nfl: {

        roster:
        "https://docs.google.com/spreadsheets/d/e/2PACX-1vS7eg-0liRvxa9q2k6IM2mipst48DHUMa8yXltD8irldOtim2Emic7w0rtl1gfT5xl_AVhR29jBrqY1/pub?gid=1700733763&single=true&output=csv",

        seasonStats:
        "https://docs.google.com/spreadsheets/d/e/2PACX-1vS7eg-0liRvxa9q2k6IM2mipst48DHUMa8yXltD8irldOtim2Emic7w0rtl1gfT5xl_AVhR29jBrqY1/pub?gid=143489768&single=true&output=csv",

        gameLogs:
        "https://docs.google.com/spreadsheets/d/e/2PACX-1vS7eg-0liRvxa9q2k6IM2mipst48DHUMa8yXltD8irldOtim2Emic7w0rtl1gfT5xl_AVhR29jBrqY1/pub?gid=528043960&single=true&output=csv",

        trends:
        "https://docs.google.com/spreadsheets/d/e/2PACX-1vS7eg-0liRvxa9q2k6IM2mipst48DHUMa8yXltD8irldOtim2Emic7w0rtl1gfT5xl_AVhR29jBrqY1/pub?gid=1953623841&single=true&output=csv",

        gameOdds:
        "https://docs.google.com/spreadsheets/d/e/2PACX-1vS7eg-0liRvxa9q2k6IM2mipst48DHUMa8yXltD8irldOtim2Emic7w0rtl1gfT5xl_AVhR29jBrqY1/pub?gid=1933017030&single=true&output=csv",

        playerProps:
        "https://docs.google.com/spreadsheets/d/e/2PACX-1vS7eg-0liRvxa9q2k6IM2mipst48DHUMa8yXltD8irldOtim2Emic7w0rtl1gfT5xl_AVhR29jBrqY1/pub?gid=2077637558&single=true&output=csv",

        schedule:
        "https://docs.google.com/spreadsheets/d/e/2PACX-1vS7eg-0liRvxa9q2k6IM2mipst48DHUMa8yXltD8irldOtim2Emic7w0rtl1gfT5xl_AVhR29jBrqY1/pub?gid=1131205016&single=true&output=csv"

}

    }

export { DATA_SOURCES };