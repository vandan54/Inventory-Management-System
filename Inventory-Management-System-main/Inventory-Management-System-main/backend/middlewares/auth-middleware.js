const {verifyJWTToken} = require('../helpers/webToken-helper');

const authenticate = (req, res, next) => {
    const authHeader = req.headers['authorization'];

    if (!authHeader) {
        return res.status(401).json({
            status: false,
            message: "No token provided. Please login again.",
            alertTitle: "Missing Token",
            alertType: "error",
            autoClose: true
        });
    }

    const token = authHeader.split(' ')[1];

    if(!token) {
        return res.status(401).json({
            status : false,
            message : "No token is provided please try by login again.",
            alertTitle : "Missing token",
            alertType : "error",
            autoClose: true
        });
    }

    try {
        const decodedTokenInfo = verifyJWTToken(token);
        
        req.user = decodedTokenInfo;

        next();
    } catch(err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({
                status: false,
                message: "Your session has expired. Please login again.",
                alertTitle: "Session Expired",
                alertType: "error",
                code: 'TOKEN_EXPIRED',
                autoClose: true
            });
        }

        return res.status(401).json({
            status : false,
            message : "Invalid token. Please login again.",
            alertTitle : "Invalid token",
            alertType : "error",
            autoClose: true
        });
    }
}

module.exports = authenticate;