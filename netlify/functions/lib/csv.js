// ======================================================
// Sportacular Analytics
// CSV Utilities
// ======================================================

import Papa from "papaparse";

// ------------------------------------------------------
// Download a CSV file
// ------------------------------------------------------

const CSV_FETCH_TIMEOUT_MS = 12000;

async function fetchCSV(url) {

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