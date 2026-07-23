// ======================================================
// Response Helpers
// ======================================================

const HEADERS = {

    "Content-Type": "application/json",

    "Access-Control-Allow-Origin": "*"

};

export function success(data) {

    return {

        statusCode: 200,

        headers: HEADERS,

        body: JSON.stringify(data)

    };

}

export function badRequest(message) {

    return {

        statusCode: 400,

        headers: HEADERS,

        body: JSON.stringify({

            error: message

        })

    };

}

export function notFound(message) {

    return {

        statusCode: 404,

        headers: HEADERS,

        body: JSON.stringify({

            error: message

        })

    };

}

export function serverError(error) {

    console.error(error);

    return {

        statusCode: 500,

        headers: HEADERS,

        body: JSON.stringify({

            error: "Internal Server Error"

        })

    };

}