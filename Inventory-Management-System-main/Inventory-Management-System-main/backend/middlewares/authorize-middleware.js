const isOwner = (req, res, next) => {
    if(req.user.userRole !== 'owner') {
        return res.status(403).json({
            status: false,
            message: "You do not have permission to access this resource.",
            alertTitle: "Permission Denied",
            alertType: "warning",
            code: 'ACCESS_DENIED',
            autoClose: true,
        });
    }
    next();
}

const isManager = (req, res, next) => {
    if(req.user.userRole !== 'manager') {
        return res.status(403).json({
            status: false,
            message: "You do not have permission to access this resource.",
            alertTitle: "Permission Denied",
            alertType: "warning",
            code: 'ACCESS_DENIED',
            autoClose: true,
        });
    }
    next();
}

const isStaff = (req, res, next) => {
    if(req.user.userRole !== 'staff') {
        return res.status(403).json({
            status: false,
            message: "You do not have permission to access this resource.",
            alertTitle: "Permission Denied",
            alertType: "warning",
            code: 'ACCESS_DENIED',
            autoClose: true,
        });
    }
    next();
}

module.exports = {
    isOwner,
    isManager,
    isStaff
};
