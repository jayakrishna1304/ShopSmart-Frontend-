import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

interface CustomJwtPayload {
    sub: string;
    role: string;
    userId?: number;
    exp: number;
}

export interface UserContext {
    userDetails: CustomJwtPayload;
    userId: number;
    role: "CUSTOMER" | "RETAILER";
}

interface AuthGuardProps {
    allowedRoles: ("CUSTOMER" | "RETAILER")[];
}

export default function AuthGuard({
    allowedRoles,
}: AuthGuardProps): React.JSX.Element {

    const location = useLocation();

    const token = localStorage.getItem("shopsmart_token");

    // ------------------------------------------
    // No token
    // ------------------------------------------
    if (!token) {
        console.log("AuthGuard: No token found");

        return (
            <Navigate
                to="/login"
                replace
                state={{ from: location }}
            />
        );
    }

    try {

        // ------------------------------------------
        // Decode JWT
        // ------------------------------------------
        const decoded = jwtDecode<CustomJwtPayload>(token);

        console.log("AuthGuard - Decoded JWT:", decoded);

        // ------------------------------------------
        // Check expiry
        // ------------------------------------------
        const currentTime = Math.floor(Date.now() / 1000);

        if (!decoded.exp || decoded.exp <= currentTime) {

            console.log("AuthGuard: Token expired");

            localStorage.removeItem("shopsmart_token");

            return (
                <Navigate
                    to="/login"
                    replace
                />
            );
        }

        // ------------------------------------------
        // Get role
        // ------------------------------------------
        const userRole = decoded.role?.toUpperCase();

        console.log("AuthGuard - Role:", userRole);

        // ------------------------------------------
        // Validate role
        // ------------------------------------------
        if (
            userRole !== "CUSTOMER" &&
            userRole !== "RETAILER"
        ) {

            console.error(
                "AuthGuard: Invalid role:",
                decoded.role
            );

            localStorage.removeItem("shopsmart_token");

            return (
                <Navigate
                    to="/login"
                    replace
                />
            );
        }

        // ------------------------------------------
        // Check whether this route allows the role
        // ------------------------------------------
        if (
            !allowedRoles.includes(
                userRole as "CUSTOMER" | "RETAILER"
            )
        ) {

            console.log(
                "AuthGuard: Role not allowed",
                {
                    userRole,
                    allowedRoles,
                    currentPath: location.pathname,
                }
            );

            return (
                <Navigate
                    to="/unauthorized"
                    replace
                />
            );
        }

        // ------------------------------------------
        // Get user ID
        // ------------------------------------------
        const userId = Number(decoded.userId);

        console.log("AuthGuard - User ID:", userId);

        if (!Number.isFinite(userId) || userId <= 0) {

            console.error(
                "AuthGuard: Invalid userId in JWT:",
                decoded.userId
            );

            localStorage.removeItem("shopsmart_token");

            return (
                <Navigate
                    to="/login"
                    replace
                />
            );
        }

        // ------------------------------------------
        // Create context
        // ------------------------------------------
        const context: UserContext = {
            userDetails: decoded,
            userId: userId,
            role: userRole as "CUSTOMER" | "RETAILER",
        };

        console.log(
            "AuthGuard: Access granted",
            context
        );

        // ------------------------------------------
        // Allow route
        // ------------------------------------------
        return (
            <Outlet context={context} />
        );

    } catch (error) {

        console.error(
            "AuthGuard: Invalid JWT",
            error
        );

        localStorage.removeItem("shopsmart_token");

        return (
            <Navigate
                to="/login"
                replace
            />
        );
    }
}