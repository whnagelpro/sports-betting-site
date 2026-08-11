export function buildAnalyticsSummary(analytics = {}) {

    return `

        <div class="analytics-summary">

            <div class="analytics-item">

                <span>⭐ Score</span>

                <strong>${analytics.score ?? "-"}</strong>

            </div>

            <div class="analytics-item">

                <span>📈 Model Edge</span>

                <strong>

                    ${
                        Number.isFinite(Number(analytics.edgePercent))
                            ? `${Number(analytics.edgePercent).toFixed(1)}%`
                            : "-"
                    }

                </strong>

            </div>

            <div class="analytics-item">

                <span>🟢 Confidence</span>

                <strong>

                    ${analytics.confidence ?? "-"}

                </strong>

            </div>

            <div class="analytics-item">

                <span>🏆 Recommendation</span>

                <strong>

                    ${analytics.recommendation ?? "-"}

                </strong>

            </div>

        </div>

    `;

}