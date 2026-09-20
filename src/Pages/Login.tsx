import React, { useState, useEffect } from 'react';
import { useForm } from "react-hook-form";
import type { SubmitHandler } from "react-hook-form";

import { Link, useNavigate } from "react-router-dom";

import axios from "axios";

import { jwtDecode } from "jwt-decode";

// Imports for Theme and Language components based on your project structure
import { ThemeToggle, useTheme } from "../Components/modecontext/modes";
import { TranslateDropdown } from "../Components/language/TranslateDropdown";
import { useLanguage } from '../Components/language/LanguageContext'; 

interface LoginFormData {
    email: string;
    password: string;
}

interface JwtPayload {
    sub?: string;
    role?: string;
    userId?: number;
    exp?: number;
}

function Login(): React.JSX.Element {

    // Access theme state from context
    const { isDarkMode } = useTheme();
    const { language, translateCurrentPage } = useLanguage();
    useEffect(() => {
        if (language !== 'en') {
        translateCurrentPage(language);
        }
    }, []);
    const navigate = useNavigate();

    const [showPassword, setShowPassword] =
        useState<boolean>(false);

    const [loading, setLoading] =
        useState<boolean>(false);

    const [apiError, setApiError] =
        useState<string | null>(null);

    const [showSnackbar, setShowSnackbar] =
        useState<boolean>(false);

    const [snackbarMsg, setSnackbarMsg] =
        useState<string>("");

    const [isForgotPassword, setIsForgotPassword] =
        useState<boolean>(false);

    const [showResetPassword, setShowResetPassword] =
        useState<boolean>(false);

    const [showConfirmPassword, setShowConfirmPassword] =
        useState<boolean>(false);

    const [resetLoading, setResetLoading] =
        useState<boolean>(false);

    const {
        register,
        handleSubmit,
        formState: { errors, isValid }
    } = useForm<LoginFormData>({
        mode: "onChange"
    });

    const {
        register: registerReset,
        handleSubmit: handleResetSubmit,
        watch: watchReset,
        formState: {
            errors: resetErrors,
            isValid: isResetValid
        },
        reset: resetResetForm
    } = useForm<{
        email: string;
        newPassword: string;
        confirmPassword: string;
    }>({
        mode: "onChange"
    });

    const resetPasswordValue = watchReset("newPassword");


    // ==========================================
    // LOGIN
    // ==========================================

    const onSubmit: SubmitHandler<LoginFormData> = async (data) => {

        setLoading(true);
        setApiError(null);

        console.log(
            "Dispatching login credentials:",
            data
        );

        try {

            const response = await axios.post(
                "http://localhost:8081/auth/login",
                data
            );

            console.log(
                "Login response:",
                response.data
            );


            // ==========================================
            // GET JWT TOKEN
            // ==========================================

            const token =
                response.data?.token || response.data;


            if (!token || typeof token !== "string") {

                throw new Error(
                    "Login successful but JWT token was not received."
                );
            }


            // ==========================================
            // STORE TOKEN
            // ==========================================

            localStorage.setItem(
                "shopsmart_token",
                token
            );

            console.log(
                "JWT token stored successfully."
            );


            // ==========================================
            // DECODE JWT
            // ==========================================

            const decoded =
                jwtDecode<JwtPayload>(token);

            console.log(
                "Decoded JWT:",
                decoded
            );


            // ==========================================
            // GET ROLE
            // ==========================================

            const role =
                decoded.role?.toUpperCase();

            console.log(
                "Logged-in user role:",
                role
            );


            // ==========================================
            // VALIDATE ROLE
            // ==========================================

            if (
                role !== "CUSTOMER" &&
                role !== "RETAILER"
            ) {

                localStorage.removeItem(
                    "shopsmart_token"
                );

                throw new Error(
                    "Invalid user role received from server."
                );
            }


            // ==========================================
            // VALIDATE USER ID
            // ==========================================
// ==========================================
// VALIDATE USER IDENTIFIER
// ==========================================

const userIdentifier = decoded.userId ?? decoded.sub;

if (!userIdentifier) {

    localStorage.removeItem(
        "shopsmart_token"
    );

    throw new Error(
        "User identification was not found in the JWT."
    );
}


            // ==========================================
            // WELCOME MESSAGE
            // ==========================================

            const loggedInUser =
                response.data?.userName ||
                decoded.sub ||
                "User";

            setSnackbarMsg(
                `Welcome back, ${loggedInUser}!`
            );

            setShowSnackbar(true);


            // ==========================================
            // ROLE-BASED DASHBOARD
            // ==========================================

            setTimeout(() => {

                setShowSnackbar(false);

                if (role === "CUSTOMER") {

                    console.log(
                        "Navigating to Customer Dashboard"
                    );

                    navigate("/");

                } else if (role === "RETAILER") {

                    console.log(
                        "Navigating to Retailer Dashboard"
                    );

                    navigate("/retailer");
                }

            }, 1000);


        } catch (error: any) {

            console.error(
                "Login processing exception:",
                error
            );

            const fallbackMsg =
                "Invalid connection state or bad credentials. Please check auth node values.";

            setApiError(
                error.response?.data?.message ||
                error.message ||
                fallbackMsg
            );

        } finally {

            setLoading(false);

        }
    };


    // ==========================================
    // FORGOT PASSWORD
    // ==========================================

    const onResetPassword: SubmitHandler<{
        email: string;
        newPassword: string;
        confirmPassword: string;
    }> = async (data) => {

        if (data.newPassword !== data.confirmPassword) {
            setApiError("New password and confirm password do not match.");
            return;
        }

        setResetLoading(true);
        setApiError(null);

        try {
            const response = await axios.put(
                "http://localhost:8081/auth/forgot-password",
                null,
                {
                    params: {
                        email: data.email,
                        newPassword: data.newPassword
                    }
                }
            );

            const successMessage =
                typeof response.data === "string"
                    ? response.data
                    : response.data?.message ||
                      "Password reset successfully!";

            setSnackbarMsg(successMessage);
            setShowSnackbar(true);
            resetResetForm();

            setTimeout(() => {
                setShowSnackbar(false);
                setIsForgotPassword(false);
            }, 2000);

        } catch (error: any) {
            console.error(
                "Password reset processing exception:",
                error
            );

            setApiError(
                error.response?.data?.message ||
                (typeof error.response?.data === "string"
                    ? error.response.data
                    : null) ||
                error.message ||
                "Unable to reset password. Please try again."
            );
        } finally {
            setResetLoading(false);
        }
    };


    return (

        <div
            className="d-flex align-items-center justify-content-center min-vh-100 position-relative"
            style={{
                backgroundColor: isDarkMode ? "#0a0f0d" : "#f4f6f8",
            //    backgroundImage: `url("/logo.png")`,
                backgroundSize: "contain",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
                transition: "all 0.3s ease"
            }}
        >

            {/* Continuous Marquee Animation Styles */}
            <style>{`
                @keyframes marquee-continuous {
                    0% { transform: translateX(0%); }
                    100% { transform: translateX(-50%); }
                }
                .scroll-container {
                    display: flex;
                    width: max-content;
                    animation: marquee-continuous 25s linear infinite;
                }
                .scroll-container:hover {
                    animation-play-state: paused;
                }
            `}</style>

            {/* ==========================================
                TOP CONTROL BAR (Matched Height & Vertical Alignment)
            ========================================== */}
            <div 
                className="position-fixed top-0 start-0 end-0 p-3 d-flex align-items-center justify-content-between gap-3"
                style={{ zIndex: 1040 }}
            >
                {/* Banner Expanded Across Left Side with Exact Height Matching Controls */}
                <div 
                    className="flex-grow-1 overflow-hidden rounded shadow-sm d-flex align-items-center"
                    style={{
                        height: "48px",
                        borderTop: "2px solid #10b981",
                        borderBottom: "2px solid #10b981",
                        background: 'linear-gradient(to bottom, rgba(16, 185, 129, 0.25) 0%, rgba(16, 185, 129, 0.02) 100%)',
                        color: isDarkMode ? "#a7f3d0" : "#065f46",
                        padding: "0 12px"
                    }}
                >
                    <div className="scroll-container font-medium" style={{ fontSize: "0.875rem" }}>
                        {/* Copy 1 - Displays immediately on load */}
                        <span className="pe-4 text-nowrap">
                            ⚠️ WARNING: Language selection and mode selection need to be selected now as they cannot be changed later!
                        </span>
                        {/* Copy 2 - Follows seamlessly behind */}
                        <span className="pe-4 text-nowrap">
                            ⚠️ WARNING: Language selection and mode selection need to be selected now as they cannot be changed later!
                        </span>
                        <span className="pe-4 text-nowrap">
                            ⚠️ WARNING: Language selection and mode selection need to be selected now as they cannot be changed later!
                        </span>
                        <span className="pe-4 text-nowrap">
                            ⚠️ WARNING: Language selection and mode selection need to be selected now as they cannot be changed later!
                        </span>

                    </div>
                </div>

                <div 
                    className={`rounded-3 backdrop-blur border shadow d-flex align-items-center gap-2 flex-shrink-0 px-3 ${
                        isDarkMode 
                            ? "bg-dark bg-opacity-50 border-secondary border-opacity-25" 
                            : "bg-white bg-opacity-75 border-light-subtle"
                    }`}
                    style={{ height: "48px" }}
                >
                    <TranslateDropdown />
                    <ThemeToggle />
                </div>
            </div>

            {/* ==========================================
                SNACKBAR
            ========================================== */}

            <div
                className="toast-container position-fixed top-0 start-0 p-3"
                style={{
                    zIndex: 1050,
                    transform: showSnackbar
                        ? "translateY(0)"
                        : "translateY(-20px)",
                    opacity: showSnackbar ? 1 : 0,
                    transition: "all 0.4s ease"
                }}
            >

                <div
                    className="toast show align-items-center text-white border-0 shadow-lg"
                    style={{
                        backgroundColor: "#00C853",
                        borderRadius: "12px",
                        boxShadow: "0 4px 20px rgba(0, 200, 83, 0.4)"
                    }}
                    role="alert"
                >

                    <div className="d-flex p-3">

                        <div className="toast-body d-flex align-items-center gap-2 fw-semibold">

                            <i className="bi bi-check-circle-fill fs-5"></i>

                            {snackbarMsg}

                        </div>

                    </div>

                </div>

            </div>


            {/* ==========================================
                LOGIN CARD
            ========================================== */}

            <div
                className="card p-4 border-0 m-3"
                style={{
                    width: "100%",
                    maxWidth: "440px",
                    borderRadius: "20px",
                    background: isDarkMode 
                        ? "rgba(18, 26, 22, 0.65)" 
                        : "rgba(255, 255, 255, 0.85)",
                    backdropFilter: "blur(20px)",
                    WebkitBackdropFilter: "blur(20px)",
                    boxShadow: isDarkMode
                        ? "0 12px 40px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(0, 230, 118, 0.3)"
                        : "0 12px 40px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.8)",
                    border: isDarkMode 
                        ? "1px solid rgba(0, 230, 118, 0.2)" 
                        : "1px solid rgba(0, 200, 83, 0.2)",
                    transition: "all 0.3s ease"
                }}
            >

                {/* Branding */}

                <div className="text-center mb-4">

                    <div
                        className="d-inline-flex align-items-center justify-content-center rounded-circle text-white mb-3 shadow"
                        style={{
                            background: "linear-gradient(135deg, #00E676 0%, #007E33 100%)",
                            boxShadow: "0 0 20px rgba(0, 230, 118, 0.5)",
                            width: "60px",
                            height: "60px",
                            border: "2px solid #AEEA00"
                        }}
                    >

                        <i className="bi bi-bag-check-fill fs-3 text-white"></i>

                    </div>

                    <h3
                        className="fw-bold"
                        style={{ 
                            color: isDarkMode ? "#ffffff" : "#111111", 
                            letterSpacing: "0.5px" 
                        }}
                    >
                        {isForgotPassword
                            ? "Reset Your Password"
                            : "Welcome Back"}
                    </h3>

                    <p
                        style={{ color: isDarkMode ? "#AEEA00" : "#2e7d32" }}
                        className="small fw-semibold mb-0"
                    >
                        {isForgotPassword
                            ? "Securely update your ShopSmart password"
                            : "Access your ShopSmart Portal"}
                    </p>

                </div>


                {/* Error */}

                {apiError && (

                    <div
                        className="alert alert-danger d-flex align-items-center gap-2 small fw-semibold border-0 py-2 shadow-sm"
                        style={{ backgroundColor: "rgba(220, 53, 69, 0.85)", color: "#fff" }}
                        role="alert"
                    >

                        <i className="bi bi-exclamation-triangle-fill"></i>

                        <div>
                            {apiError}
                        </div>

                    </div>

                )}


                {/* ==========================================
                    FORM
                ========================================== */}

                {isForgotPassword ? (

                    <form
                        onSubmit={handleResetSubmit(onResetPassword)}
                        noValidate
                    >

                        <div className="mb-3">

                            <label
                                className="form-label fw-semibold small"
                                style={{
                                    color: isDarkMode ? "#ffffff" : "#212529"
                                }}
                            >
                                Email Address
                            </label>

                            <div className="input-group">

                                <span
                                    className="input-group-text border-end-0"
                                    style={{
                                        backgroundColor: isDarkMode
                                            ? "rgba(255, 255, 255, 0.1)"
                                            : "rgba(0, 0, 0, 0.05)",
                                        color: isDarkMode
                                            ? "#00E676"
                                            : "#00A846",
                                        borderColor: isDarkMode
                                            ? "rgba(0, 230, 118, 0.3)"
                                            : "rgba(0, 0, 0, 0.15)"
                                    }}
                                >
                                    <i className="bi bi-envelope"></i>
                                </span>

                                <input
                                    type="email"
                                    className={`form-control border-start-0 ${
                                        resetErrors.email ? "is-invalid" : ""
                                    }`}
                                    style={{
                                        backgroundColor: isDarkMode
                                            ? "rgba(255, 255, 255, 0.1)"
                                            : "rgba(0, 0, 0, 0.05)",
                                        borderColor: isDarkMode
                                            ? "rgba(0, 230, 118, 0.3)"
                                            : "rgba(0, 0, 0, 0.15)",
                                        color: isDarkMode ? "#ffffff" : "#212529",
                                        fontWeight: "500"
                                    }}
                                    placeholder="name@shopsmart.com"
                                    {...registerReset("email", {
                                        required: "Email is required",
                                        pattern: {
                                            value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                                            message: "Please enter a valid email address"
                                        }
                                    })}
                                />

                                {resetErrors.email && (
                                    <div className="invalid-feedback fw-bold text-danger">
                                        {resetErrors.email.message}
                                    </div>
                                )}

                            </div>
                        </div>


                        <div className="mb-3">

                            <label
                                className="form-label fw-semibold small"
                                style={{
                                    color: isDarkMode ? "#ffffff" : "#212529"
                                }}
                            >
                                New Password
                            </label>

                            <div className="input-group">

                                <span
                                    className="input-group-text border-end-0"
                                    style={{
                                        backgroundColor: isDarkMode
                                            ? "rgba(255, 255, 255, 0.1)"
                                            : "rgba(0, 0, 0, 0.05)",
                                        color: isDarkMode
                                            ? "#00E676"
                                            : "#00A846",
                                        borderColor: isDarkMode
                                            ? "rgba(0, 230, 118, 0.3)"
                                            : "rgba(0, 0, 0, 0.15)"
                                    }}
                                >
                                    <i className="bi bi-key"></i>
                                </span>

                                <input
                                    type={showResetPassword ? "text" : "password"}
                                    className={`form-control border-start-0 border-end-0 ${
                                        resetErrors.newPassword ? "is-invalid" : ""
                                    }`}
                                    style={{
                                        backgroundColor: isDarkMode
                                            ? "rgba(255, 255, 255, 0.1)"
                                            : "rgba(0, 0, 0, 0.05)",
                                        borderColor: isDarkMode
                                            ? "rgba(0, 230, 118, 0.3)"
                                            : "rgba(0, 0, 0, 0.15)",
                                        color: isDarkMode ? "#ffffff" : "#212529",
                                        fontWeight: "500"
                                    }}
                                    placeholder="Create new password"
                                    {...registerReset("newPassword", {
                                        required: "New password is required",
                                        minLength: {
                                            value: 6,
                                            message: "Password must be at least 6 characters"
                                        }
                                    })}
                                />

                                <button
                                    type="button"
                                    className="input-group-text"
                                    onClick={() =>
                                        setShowResetPassword(!showResetPassword)
                                    }
                                    style={{
                                        borderLeft: "none",
                                        backgroundColor: isDarkMode
                                            ? "rgba(255, 255, 255, 0.1)"
                                            : "rgba(0, 0, 0, 0.05)",
                                        borderColor: isDarkMode
                                            ? "rgba(0, 230, 118, 0.3)"
                                            : "rgba(0, 0, 0, 0.15)",
                                        color: isDarkMode
                                            ? "#00E676"
                                            : "#00A846"
                                    }}
                                >
                                    <i
                                        className={`bi ${
                                            showResetPassword
                                                ? "bi-eye-slash-fill"
                                                : "bi-eye-fill"
                                        }`}
                                    ></i>
                                </button>

                                {resetErrors.newPassword && (
                                    <div className="invalid-feedback fw-bold text-danger">
                                        {resetErrors.newPassword.message}
                                    </div>
                                )}

                            </div>
                        </div>


                        <div className="mb-4">

                            <label
                                className="form-label fw-semibold small"
                                style={{
                                    color: isDarkMode ? "#ffffff" : "#212529"
                                }}
                            >
                                Confirm New Password
                            </label>

                            <div className="input-group">

                                <span
                                    className="input-group-text border-end-0"
                                    style={{
                                        backgroundColor: isDarkMode
                                            ? "rgba(255, 255, 255, 0.1)"
                                            : "rgba(0, 0, 0, 0.05)",
                                        color: isDarkMode
                                            ? "#00E676"
                                            : "#00A846",
                                        borderColor: isDarkMode
                                            ? "rgba(0, 230, 118, 0.3)"
                                            : "rgba(0, 0, 0, 0.15)"
                                    }}
                                >
                                    <i className="bi bi-check-all"></i>
                                </span>

                                <input
                                    type={showConfirmPassword ? "text" : "password"}
                                    className={`form-control border-start-0 border-end-0 ${
                                        resetErrors.confirmPassword ? "is-invalid" : ""
                                    }`}
                                    style={{
                                        backgroundColor: isDarkMode
                                            ? "rgba(255, 255, 255, 0.1)"
                                            : "rgba(0, 0, 0, 0.05)",
                                        borderColor: isDarkMode
                                            ? "rgba(0, 230, 118, 0.3)"
                                            : "rgba(0, 0, 0, 0.15)",
                                        color: isDarkMode ? "#ffffff" : "#212529",
                                        fontWeight: "500"
                                    }}
                                    placeholder="Confirm new password"
                                    {...registerReset("confirmPassword", {
                                        required: "Please confirm your new password",
                                        validate: (value) =>
                                            value === resetPasswordValue ||
                                            "Passwords do not match"
                                    })}
                                />

                                <button
                                    type="button"
                                    className="input-group-text"
                                    onClick={() =>
                                        setShowConfirmPassword(!showConfirmPassword)
                                    }
                                    style={{
                                        borderLeft: "none",
                                        backgroundColor: isDarkMode
                                            ? "rgba(255, 255, 255, 0.1)"
                                            : "rgba(0, 0, 0, 0.05)",
                                        borderColor: isDarkMode
                                            ? "rgba(0, 230, 118, 0.3)"
                                            : "rgba(0, 0, 0, 0.15)",
                                        color: isDarkMode
                                            ? "#00E676"
                                            : "#00A846"
                                    }}
                                >
                                    <i
                                        className={`bi ${
                                            showConfirmPassword
                                                ? "bi-eye-slash-fill"
                                                : "bi-eye-fill"
                                        }`}
                                    ></i>
                                </button>

                                {resetErrors.confirmPassword && (
                                    <div className="invalid-feedback fw-bold text-danger">
                                        {resetErrors.confirmPassword.message}
                                    </div>
                                )}

                            </div>
                        </div>


                        <button
                            type="submit"
                            className="btn w-100 fw-bold py-2 text-dark border-0 mb-3 shadow"
                            style={{
                                background:
                                    "linear-gradient(90deg, #AEEA00 0%, #00E676 100%)",
                                boxShadow:
                                    "0 4px 15px rgba(0, 230, 118, 0.4)",
                                opacity:
                                    !isResetValid || resetLoading ? 0.65 : 1
                            }}
                            disabled={!isResetValid || resetLoading}
                        >
                            {resetLoading ? (
                                <>
                                    <span
                                        className="spinner-border spinner-border-sm me-2"
                                        role="status"
                                        aria-hidden="true"
                                    ></span>
                                    Resetting Password...
                                </>
                            ) : (
                                <>
                                    Reset Password
                                    <i className="bi bi-shield-check ms-1"></i>
                                </>
                            )}
                        </button>


                        <div className="text-center">

                            <button
                                type="button"
                                className="btn btn-link small fw-bold text-decoration-none"
                                style={{
                                    color: isDarkMode ? "#AEEA00" : "#00A846"
                                }}
                                onClick={() => {
                                    setIsForgotPassword(false);
                                    setApiError(null);
                                    resetResetForm();
                                }}
                            >
                                <i className="bi bi-arrow-left me-1"></i>
                                Back to Login
                            </button>

                        </div>

                    </form>

                ) : (

                    <form
                        onSubmit={handleSubmit(onSubmit)}
                        noValidate
                    >

                        {/* Email */}

                        <div className="mb-3">

                            <label 
                                className="form-label fw-semibold small"
                                style={{ color: isDarkMode ? "#ffffff" : "#212529" }}
                            >
                                Corporate Email Address
                            </label>

                            <div className="input-group">

                                <span 
                                    className="input-group-text border-end-0" 
                                    style={{ 
                                        backgroundColor: isDarkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.05)", 
                                        color: isDarkMode ? "#00E676" : "#00A846", 
                                        borderColor: isDarkMode ? "rgba(0, 230, 118, 0.3)" : "rgba(0, 0, 0, 0.15)" 
                                    }}
                                >
                                    <i className="bi bi-envelope"></i>
                                </span>

                                <input
                                    type="email"
                                    className={`form-control border-start-0 ${
                                        errors.email ? "is-invalid" : ""
                                    }`}
                                    style={{
                                        backgroundColor: isDarkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.05)",
                                        borderColor: isDarkMode ? "rgba(0, 230, 118, 0.3)" : "rgba(0, 0, 0, 0.15)",
                                        color: isDarkMode ? "#ffffff" : "#212529",
                                        fontWeight: "500"
                                    }}
                                    placeholder="name@shopsmart.com"
                                    {...register("email", {
                                        required: "Email is required",
                                        pattern: {
                                            value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                                            message: "Please enter a valid email address"
                                        }
                                    })}
                                />

                                {errors.email && (
                                    <div className="invalid-feedback fw-bold text-danger">
                                        {errors.email.message}
                                    </div>
                                )}

                            </div>

                        </div>


                        {/* Password */}

                        <div className="mb-4">

                            <label 
                                className="form-label fw-semibold small"
                                style={{ color: isDarkMode ? "#ffffff" : "#212529" }}
                            >
                                Secure Password
                            </label>

                            <div className="input-group">

                                <span 
                                    className="input-group-text border-end-0" 
                                    style={{ 
                                        backgroundColor: isDarkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.05)", 
                                        color: isDarkMode ? "#00E676" : "#00A846", 
                                        borderColor: isDarkMode ? "rgba(0, 230, 118, 0.3)" : "rgba(0, 0, 0, 0.15)" 
                                    }}
                                >
                                    <i className="bi bi-key"></i>
                                </span>

                                <input
                                    type={
                                        showPassword
                                            ? "text"
                                            : "password"
                                    }
                                    className={`form-control border-start-0 border-end-0 ${
                                        errors.password ? "is-invalid" : ""
                                    }`}
                                    style={{
                                        backgroundColor: isDarkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.05)",
                                        borderColor: isDarkMode ? "rgba(0, 230, 118, 0.3)" : "rgba(0, 0, 0, 0.15)",
                                        color: isDarkMode ? "#ffffff" : "#212529",
                                        fontWeight: "500"
                                    }}
                                    placeholder="••••••••"
                                    {...register("password", {
                                        required: "Password is required"
                                    })}
                                />

                                <button
                                    type="button"
                                    className="input-group-text"
                                    onClick={() =>
                                        setShowPassword(!showPassword)
                                    }
                                    style={{
                                        borderLeft: "none",
                                        backgroundColor: isDarkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.05)",
                                        borderColor: isDarkMode ? "rgba(0, 230, 118, 0.3)" : "rgba(0, 0, 0, 0.15)",
                                        color: isDarkMode ? "#00E676" : "#00A846"
                                    }}
                                >
                                    <i
                                        className={`bi ${
                                            showPassword
                                                ? "bi-eye-slash-fill"
                                                : "bi-eye-fill"
                                        }`}
                                    ></i>
                                </button>

                                {errors.password && (
                                    <div className="invalid-feedback fw-bold text-danger">
                                        {errors.password.message}
                                    </div>
                                )}

                            </div>

                        </div>


                        {/* Forgot Password */}

                        <div className="text-end mb-3">

                            <button
                                type="button"
                                className="btn btn-link p-0 small fw-semibold text-decoration-none"
                                style={{
                                    color: isDarkMode ? "#AEEA00" : "#00A846"
                                }}
                                onClick={() => {
                                    setIsForgotPassword(true);
                                    setApiError(null);
                                }}
                            >
                                Forgot Password?
                            </button>

                        </div>


                        <button
                            type="submit"
                            className="btn w-100 fw-bold py-2 text-dark border-0 mb-3 shadow"
                            style={{
                                background:
                                    "linear-gradient(90deg, #AEEA00 0%, #00E676 100%)",
                                boxShadow:
                                    "0 4px 15px rgba(0, 230, 118, 0.4)",
                                opacity:
                                    !isValid || loading ? 0.65 : 1
                            }}
                            disabled={!isValid || loading}
                        >

                            {loading ? (
                                <>
                                    <span
                                        className="spinner-border spinner-border-sm me-2"
                                        role="status"
                                        aria-hidden="true"
                                    ></span>

                                    Verifying Credentials Token...
                                </>
                            ) : (
                                <>
                                    Login
                                    <i className="bi bi-arrow-right-short ms-1"></i>
                                </>
                            )}

                        </button>

                    </form>

                )}


                {!isForgotPassword && (
                    <>
                        {/* Register */}

                        <div
                            className="text-center pt-2"
                            style={{
                                borderTop: isDarkMode
                                    ? "1px solid rgba(0, 230, 118, 0.2)"
                                    : "1px solid rgba(0, 0, 0, 0.1)"
                            }}
                        >
                            <span
                                className="small opacity-75"
                                style={{
                                    color: isDarkMode
                                        ? "#ffffff"
                                        : "#444444"
                                }}
                            >
                                New terminal operation layout coordinator?{" "}
                            </span>

                            <Link
                                to="/register"
                                className="small fw-bold text-decoration-none ms-1"
                                style={{
                                    color: isDarkMode
                                        ? "#AEEA00"
                                        : "#00A846"
                                }}
                            >
                                Create account
                            </Link>
                        </div>
                    </>
                )}

            </div>

        </div>
    );
}

export default Login;