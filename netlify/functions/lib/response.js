// ======================================================
// Response Helpers
// ======================================================

const HEADERS = {

    "Content-Type": "application/json",

    "Access-Control-Allow-Origin": "*"

};

// ------------------------------------------------------
// Success
// ------------------------------------------------------

function success(data) {

    return {

        statusCode: 200,

        headers: HEADERS,

        body: JSON.stringify(data)

    };

}

// ------------------------------------------------------
// Bad Request
// ------------------------------------------------------

function badRequest(message) {

    return {

        statusCode: 400,

        headers: HEADERS,

        body: JSON.stringify({

            error: message

        })

    };

}

// ------------------------------------------------------
// Not Found
// ------------------------------------------------------

function notFound(message) {

    return {

        statusCode: 404,

        headers: HEADERS,

        body: JSON.stringify({

            error: message

        })

    };

}

// ------------------------------------------------------
// Server Error
// ------------------------------------------------------

function serverError(error) {

    console.error(error);

    return {

        statusCode: 500,

        headers: HEADERS,

        body: JSON.stringify({

            error: "Internal Server Error"

        })

    };

}

// ------------------------------------------------------
// Exports
// ------------------------------------------------------

module.exports = {

    success,

    badRequest,

    notFound,

    serverError

};