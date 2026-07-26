// ======================================================
// Sportacular Analytics
// CSV Utilities
// ======================================================

const Papa = require("papaparse");

// ------------------------------------------------------
// Download a CSV file
// ------------------------------------------------------

async function fetchCSV(url) {

    const response = await fetch(url);

    if (!response.ok) {

        throw new Error(`Unable to download CSV: ${response.status}`);

    }

    return await response.text();

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

module.exports = {

    fetchCSV,

    parseCSV,

    loadCSV,

    findPlayer,

    findRows

};