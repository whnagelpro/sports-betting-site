// ======================================================
// Sportacular Analytics
// CSV Utilities
// ======================================================

import Papa from "papaparse";

// ------------------------------------------------------
// Download a CSV file
// ------------------------------------------------------

const CSV_FETCH_TIMEOUT_MS = 12000;
const CSV_FETCH_MAX_ATTEMPTS = 2;

const CSV_CACHE_TTL_MS = 5 * 60 * 1000;

const csvCache = new Map();

async function fetchCSVOnce(url) {

    const controller =
        new AbortController();

    const timeoutId =
        setTimeout(
            () => controller.abort(),
            CSV_FETCH_TIMEOUT_MS
        );

    try {

        const response =
            await fetch(
                url,
                {
                    signal: controller.signal
                }
            );

        if (!response.ok) {

            throw new Error(
                `Unable to download CSV: ${response.status}`
            );

        }

        return await response.text();

    } catch (error) {

        if (error?.name === "AbortError") {

            throw new Error(
                `CSV request timed out after ${CSV_FETCH_TIMEOUT_MS} ms`
            );

        }

        throw error;

    } finally {

        clearTimeout(timeoutId);

    }

}

function getCachedCSV(url) {

    const cached =
        csvCache.get(url);

    if (!cached) {
        return null;
    }

    const age =
        Date.now() - cached.timestamp;

    if (age > CSV_CACHE_TTL_MS) {
        return null;
    }

    return cached.csv;

}


function setCachedCSV(url, csv) {

    csvCache.set(url, {
        csv,
        timestamp: Date.now()
    });

}

async function fetchCSV(url) {

    let lastError = null;

    const cached =
        getCachedCSV(url);

    if (cached !== null) {

        console.log(
            "✓ Using cached CSV"
        );

        return cached;

    }


    for (
        let attempt = 1;
        attempt <= CSV_FETCH_MAX_ATTEMPTS;
        attempt++
    ) {

        try {

            if (attempt > 1) {

                console.warn(
                    `Retrying CSV request — attempt ${attempt} of ${CSV_FETCH_MAX_ATTEMPTS}`
                );

            }

            const csv =
                await fetchCSVOnce(url);

            setCachedCSV(
                url,
                csv
            );

            return csv;

        } catch (error) {

            lastError =
                error;

            console.warn(
                `CSV request attempt ${attempt} failed:`,
                error?.message || String(error)
            );

        }

    }


    /*
      A stale cached copy is still preferable
      to completely failing a player profile
      when Google Sheets is temporarily unavailable.
    */

    const stale =
        csvCache.get(url);

    if (stale?.csv) {

        console.warn(
            "⚠ Using stale cached CSV after live request failure"
        );

        return stale.csv;

    }


    throw new Error(
        `CSV request failed after ${CSV_FETCH_MAX_ATTEMPTS} attempts: ${lastError?.message || "Unknown error"}`
    );

}

// ------------------------------------------------------
// Convert CSV into objects
// ------------------------------------------------------

function parseCSV(csvText) {
    const results = Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: false,
        transformHeader: header => header.trim()
    });

    if (results.errors.length > 0) {
        console.error(results.errors);
        throw new Error("CSV parsing failed.");
    }

    return results.data;
}

// ------------------------------------------------------
// Convenience loader
// ------------------------------------------------------

async function loadCSV(url) {
    const csv = await fetchCSV(url);
    return parseCSV(csv);
}

// ------------------------------------------------------
// Find one player
// ------------------------------------------------------

function findPlayer(rows, id) {
    return rows.find(row =>
        String(row.Id) === String(id)
    );
}

// ------------------------------------------------------
// Find matching rows
// ------------------------------------------------------

function findRows(rows, field, value) {
    return rows.filter(row =>
        String(row[field]) === String(value)
    );
}

// ------------------------------------------------------
// Exports
// ------------------------------------------------------

export {
    fetchCSV,
    parseCSV,
    loadCSV,
    findPlayer,
    findRows
};