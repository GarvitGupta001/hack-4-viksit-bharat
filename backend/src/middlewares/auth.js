const jwt = require("jsonwebtoken");
const User = require("../models/user.model");

const protect = async (req, res, next) => {
    try {
        let token;

        if (
            req.headers.authorization &&
            req.headers.authorization.startsWith("Bearer")
        ) {
            token = req.headers.authorization.split(" ")[1];
        }

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Not authorized to access this route",
            });
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = await User.findById(decoded.id).select("-password");

            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: "User not found",
                });
            }

            next();
        } catch (error) {
            return res.status(401).json({
                success: false,
                message: "Not authorized to access this route",
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message,
        });
    }
};

const authorize = (...types) => {
    return (req, res, next) => {
        if (!types.includes(req.user.type)) {
            return res.status(403).json({
                success: false,
                message: `User type ${req.user.type} is not authorized to access this route`,
            });
        }
        next();
    };
};

const verifyUser = (req, res, next) => {
    if (!req.user.verified) {
        return res.status(403).json({
            success: false,
            message: "Please verify your account to access this route",
        });
    }
    next();
};

module.exports = { protect, authorize, verifyUser };
