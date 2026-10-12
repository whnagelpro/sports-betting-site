import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot =
    path.resolve(
        __dirname,
        "../../../../"
    );

const playerPagePath =
    path.join(
        projectRoot,
        "player-page.js"
    );

const source =
    fs.readFileSync(
        playerPagePath,
        "utf8"
    );

const results = [];

function assertSource(name, condition, details = {}) {

    const result = {
        name,
        pass: Boolean(condition),
        ...details
    };

    results.push(result);

    console.log(
        JSON.stringify(result)
    );
}

function includes(fragment) {
    return source.includes(fragment);
}

// ======================================================
// P18-D2
// REAL PLAYER-PAGE SOURCE CONTRACT
// ======================================================

assertSource(
    "P18-D2 production player-page.js exists",
    fs.existsSync(playerPagePath),
    {
        path: playerPagePath
    }
);

assertSource(
    "P18-D2 player page owns renderAnalyticsDashboard",
    includes(
        "function renderAnalyticsDashboard()"
    )
);

assertSource(
    "P18-D2 player page owns renderProps",
    includes(
        "function renderProps()"
    )
);

assertSource(
    "P18-D2 dashboard requires backend analytics",
    includes(
        "!player.analytics"
    )
);

assertSource(
    "P18-D2 dashboard requires backend Best Prop",
    includes(
        "!player.analytics.bestProp"
    )
);

assertSource(
    "P18-D2 dashboard consumes authoritative Best Prop",
    includes(
        "analytics?.bestProp ??"
    )
);

assertSource(
    "P18-D2 props consumer consumes authoritative Best Prop",
    includes(
        "player.analytics?.bestProp ??"
    )
);

assertSource(
    "P18-D2 Best Prop is matched by ID",
    includes(
        "String(prop.id) ==="
    ) &&
    includes(
        "String(authoritativeBestProp.id)"
    )
);

assertSource(
    "P18-D2 legacy Score fallback remains present",
    includes(
        "legacyScoreMatchedProp"
    )
);

assertSource(
    "P18-D2 frontend does not fall back to actionableProps first row",
    includes(
        `const topProp =
        matchedBestProp ??
        legacyScoreMatchedProp ??
        null;`
    )
);

assertSource(
    "P18-D2 actionable props remain Over or Under only",
    includes(
        'recommendation === "over"'
    ) &&
    includes(
        'recommendation === "under"'
    )
);

assertSource(
    "P18-D2 No Recommended Play fallback remains present",
    includes(
        '"No Recommended Play"'
    )
);

assertSource(
    "P18-D2 No Play display suppression remains present",
    includes(
        '"top-prop-recommendation":\n                "No Play"'
    )
);

assertSource(
    "P18-D2 probability consumes bestModelProbability",
    includes(
        "topProp.bestModelProbability ??"
    )
);

assertSource(
    "P18-D2 Sportacular Edge remains preferred Top Prop edge",
    includes(
        "topProp.sportacularEdge ??"
    )
);

assertSource(
    "P18-D2 All Props probability consumes bestModelProbability",
    includes(
        "prop.bestModelProbability ??"
    )
);

assertSource(
    "P18-D2 All Props edge consumes Sportacular Edge",
    includes(
        "prop.sportacularEdge ??"
    )
);

assertSource(
    "P18-D2 All Props Score consumes Sportacular Score",
    includes(
        "prop.sportacularScore ??"
    )
);

assertSource(
    "P18-D2 missing probability is preserved before Number conversion",
    includes(
        "function formatProbability(value)"
    ) &&
    includes(
        "value === null"
    ) &&
    includes(
        "value === undefined"
    )
);

assertSource(
    "P18-D2 Edge decimal converts to percent exactly once",
    includes(
        "number * 100"
    ) &&
    includes(
        "function formatEdgePercent(value)"
    )
);

assertSource(
    "P18-D2 probability decimal converts to percent exactly once",
    includes(
        "function formatProbability(value)"
    ) &&
    includes(
        "number * 100"
    )
);

assertSource(
    "P18-D2 dashboard stars consume backend analytics stars",
    includes(
        "analytics?.stars ??"
    )
);

assertSource(
    "P18-D2 sample-size helper remains present",
    includes(
        "function getTrendSampleSize(trend = null)"
    )
);

assertSource(
    "P18-D2 dashboard Early confidence boundary remains present",
    includes(
        "dashboardSampleSize < 3"
    ) &&
    includes(
        '? "Early"'
    )
);

// ------------------------------------------------------
// Current league-render boundary
//
// Freeze what production currently does before we decide
// whether P18 should expand the Player Props UI to NBA/NHL.
// ------------------------------------------------------

assertSource(
    "P18-D2 production currently renders props for MLB",
    includes(
        'currentLeague === "mlb"'
    )
);

assertSource(
    "P18-D2 production currently renders props for NFL",
    includes(
        'currentLeague === "nfl"'
    )
);

assertSource(
    "P18-D2 production currently contains NBA league support",
    includes(
        'case "nba":'
    )
);

assertSource(
    "P18-D2 production currently contains NHL league support",
    includes(
        'case "nhl":'
    )
);

// ======================================================
// SUMMARY
// ======================================================

const failed =
    results.filter(
        result => !result.pass
    );

const summary = {

    test:
        "P18-D2 REAL PLAYER PAGE SOURCE CONTRACT REGRESSION",

    tests:
        results.length,

    passed:
        results.length - failed.length,

    failed:
        failed.length,

    pass:
        failed.length === 0,

    productionFile:
        "player-page.js",

    frozenFrontendSourceContract: [
        "Backend-authoritative Best Prop",
        "Best Prop ID matching",
        "Legacy Score fallback",
        "No frontend Top Prop invention",
        "Actionable Over / Under only",
        "No Play suppression",
        "Sportacular Score",
        "Sportacular Edge",
        "Model Probability",
        "Backend stars",
        "Single percentage formatting",
        "Sample-size confidence boundary"
    ],

    results

};

console.log(
    JSON.stringify(
        summary,
        null,
        2
    )
);

if (failed.length) {

    throw new Error(
        "P18-D2 real player-page source regression failed."
    );

}