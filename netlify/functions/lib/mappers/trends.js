// ======================================================
// Sportacular Analytics
// Trend Mapper
// ======================================================

export function mapTrends(trendRows) {

    if (!Array.isArray(trendRows)) {

        return [];

    }

    return trendRows.map(row => ({

        // ===== Existing fields =====

        statType: row["Stat Type"],

        seasonAverage: Number(row["Season Avg"] || 0),

        last3Average: Number(row["Last 3 Avg"] || 0),

        last5Average: Number(row["Last 5 Avg"] || 0),

        last10Average: Number(row["Last 10 Avg"] || 0),

        trendDirection: row["Trend Direction"],

        trendScore: Number(row["Trend Score"] || 0),

        consistency: Number(row["Consistency"] || 0),

        riskTier: row["Risk Tier"],

        hitRateLast3: Number(row["Hit Rate Last 3"] || 0),

        hitRateLast5: Number(row["Hit Rate Last 5"] || 0),

        hitRateLast10: Number(row["Hit Rate Last 10"] || 0),

        aboveSeason: Number(row["Above Season %"] || 0),

        trendStrength: row["Trend Strength"],

        trendNote: row["Trend Note"],

        lastUpdated: row["Last Updated"],

        raw: row,

        // ===== Player page compatibility =====

        title: row["Stat Type"],

        description: row["Trend Note"],

        score: Number(row["Trend Score"] || 0),

        modelEdge: Number(row["Above Season %"] || 0),

        confidence: row["Consistency"],

        recommendation: row["Trend Strength"],

        strength: row["Trend Strength"],

        risk: row["Risk Tier"]

    }));

}