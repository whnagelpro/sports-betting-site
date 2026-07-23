// ======================================================
// Sportacular Analytics
// CSV Utilities
// ======================================================

import Papa from "papaparse";

/**
 * Download a CSV file.
 */
export async function fetchCSV(url) {

    const response = await fetch(url);

    if (!response.ok) {

        throw new Error(`Unable to download CSV: ${response.status}`);

    }

    return await response.text();

}

/**
 * Convert CSV text into an array of objects.
 */
export function parseCSV(csvText) {

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

/**
 * Convenience helper.
 */
export async function loadCSV(url) {

    const csv = await fetchCSV(url);

    return parseCSV(csv);

}

/**
 * Find a player by Id.
 */
export function findPlayer(rows, id) {

    return rows.find(row =>

        String(row.Id) === String(id)

    );

}

/**
 * Find all matching rows.
 */
export function findRows(rows, field, value) {

    return rows.filter(row =>

        String(row[field]) === String(value)

    );

}