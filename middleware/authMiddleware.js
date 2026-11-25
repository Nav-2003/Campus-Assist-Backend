import jwt from "jsonwebtoken";

const authMiddleware = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                message: "A bearer access token is required"
            });
        }

        const token = authHeader.slice(7).trim();
        if (!token) return res.status(401).json({ message: "Access token required" });

        const decoded = jwt.verify(
            token,
            process.env.JWT_ACCESS_SECRET
        );

        if (!decoded.userId) return res.status(401).json({ message: "Access token does not contain a user" });

        req.user = decoded;

        next();

    } catch (error) {
        return res.status(401).json({
            message: "Invalid or expired access token"
        });
    }
};

export default authMiddleware;
