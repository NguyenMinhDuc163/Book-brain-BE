const createResponse = (status, message, code, data = [], error = null) => {
    return {
        code,
        data: Array.isArray(data) ? data : [data],
        status,
        message: message || "",
        error: error || ""
    };
};

module.exports = {
    createResponse
};
