export function renderAnalyticsSummary(analytics = {}) {

    const score =
        analytics.sportacularScore ??
        analytics.score ??
        "-";

    const edge =
        analytics.modelEdge ??
        analytics.edgePercent ??
        null;

    const confidence =
        analytics.confidence ??
        "-";

    const recommendation =
        analytics.recommendation ??
        "-";

    return `

        <div class="analytics-summary">

            <div class="analytics-item">

                <span>⭐ Score</span>

                <strong>${score}</strong>

            </div>

            <div class="analytics-item">

                <span>📈 Model Edge</span>

                <strong>

                    ${
                        Number.isFinite(Number(edge))
                            ? `${Number(edge).toFixed(1)}%`
                            : "-"

                    }

                </strong>

            </div>

            <div class="analytics-item">

                <span>🟢 Confidence</span>

                <strong>${confidence}</strong>

            </div>

            <div class="analytics-item">

                <span>🏆 Recommendation</span>

                <strong>${recommendation}</strong>

            </div>

        </div>

    `;

}