const authService = require("../services/auth.service");

class AuthController {
    async register(req, res, next) {
        try {
            const result = await authService.register(req.body);
            res.status(201).json({
                success: true,
                message: "User registered successfully",
                data: result,
            });
        } catch (error) {
            next(error);
        }
    }

    async login(req, res, next) {
        try {
            const { email, password } = req.body;

            if (!email || !password) {
                return res.status(400).json({
                    success: false,
                    message: "Please provide email and password",
                });
            }

            const result = await authService.login(email, password);
            res.status(200).json({
                success: true,
                message: "Login successful",
                data: result,
            });
        } catch (error) {
            next(error);
        }
    }

    async getProfile(req, res, next) {
        try {
            const profile = await authService.getProfile(req.user._id);
            res.status(200).json({
                success: true,
                data: profile,
            });
        } catch (error) {
            next(error);
        }
    }

    async updateProfile(req, res, next) {
        try {
            const user = await authService.updateProfile(
                req.user._id,
                req.body,
            );
            res.status(200).json({
                success: true,
                message: "Profile updated successfully",
                data: user,
            });
        } catch (error) {
            next(error);
        }
    }

    async logout(req, res) {
        res.status(200).json({
            success: true,
            message: "Logout successful",
        });
    }
}

module.exports = new AuthController();
