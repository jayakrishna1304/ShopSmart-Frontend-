import React, { useState } from "react";

import { useForm } from "react-hook-form";
import type { SubmitHandler } from "react-hook-form";

import { Link, useNavigate } from "react-router-dom";

import axios from "axios";

import { jwtDecode } from "jwt-decode";

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

    const {
        register,
        handleSubmit,
        formState: { errors, isValid }
    } = useForm<LoginFormData>({
        mode: "onChange"
    });


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

            if (
                decoded.userId === undefined ||
                decoded.userId === null
            ) {

                localStorage.removeItem(
                    "shopsmart_token"
                );

                throw new Error(
                    "User ID was not found in the JWT."
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


    return (

        <div
            className="d-flex align-items-center justify-content-center min-vh-100 position-relative"
            style={{
                background:
                    "linear-gradient(135deg, #E1F8FA, #EBF1FF)"
            }}
        >

            {/* ==========================================
                SNACKBAR
            ========================================== */}

            <div
                className="toast-container position-fixed top-0 end-0 p-3"
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
                        backgroundColor: "#0FAF62",
                        borderRadius: "12px"
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
                className="card p-4 shadow-lg border-0 bg-white m-3"
                style={{
                    width: "100%",
                    maxWidth: "440px",
                    borderRadius: "16px"
                }}
            >

                {/* Branding */}

                <div className="text-center mb-4">

                    <div
                        className="d-inline-flex align-items-center justify-content-center rounded-circle text-white mb-3"
                        style={{
                            backgroundColor: "#3D22C1",
                            width: "56px",
                            height: "56px"
                        }}
                    >

                        <i className="bi bi-shield-lock-fill fs-3"></i>

                    </div>

                    <h3
                        className="fw-bold"
                        style={{ color: "#121127" }}
                    >
                        Welcome Back
                    </h3>

                    <p
                        style={{ color: "#6B7280" }}
                        className="small"
                    >
                        Access your smart shop
                    </p>

                </div>


                {/* Error */}

                {apiError && (

                    <div
                        className="alert alert-danger d-flex align-items-center gap-2 small fw-semibold border-0 py-2"
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

                <form
                    onSubmit={handleSubmit(onSubmit)}
                    noValidate
                >

                    {/* Email */}

                    <div className="mb-3">

                        <label className="form-label fw-medium text-dark small">
                            Corporate Email Address
                        </label>

                        <div className="input-group">

                            <span className="input-group-text bg-light border-end-0 text-muted">
                                <i className="bi bi-envelope"></i>
                            </span>

                            <input
                                type="email"
                                className={`form-control border-start-0 ${
                                    errors.email
                                        ? "is-invalid"
                                        : ""
                                }`}
                                placeholder="name@shopsmart.com"
                                {...register("email", {
                                    required:
                                        "Email is required",
                                    pattern: {
                                        value:
                                            /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                                        message:
                                            "Please enter a valid email address"
                                    }
                                })}
                            />

                            {errors.email && (

                                <div className="invalid-feedback fw-medium">
                                    {errors.email.message}
                                </div>

                            )}

                        </div>

                    </div>


                    {/* Password */}

                    <div className="mb-4">

                        <label className="form-label fw-medium text-dark small">
                            Secure Password
                        </label>

                        <div className="input-group">

                            <span className="input-group-text bg-light border-end-0 text-muted">
                                <i className="bi bi-key"></i>
                            </span>

                            <input
                                type={
                                    showPassword
                                        ? "text"
                                        : "password"
                                }
                                className={`form-control border-start-0 border-end-0 ${
                                    errors.password
                                        ? "is-invalid"
                                        : ""
                                }`}
                                placeholder="••••••••"
                                {...register("password", {
                                    required:
                                        "Password is required"
                                })}
                            />

                            <button
                                type="button"
                                className="input-group-text bg-transparent text-muted"
                                onClick={() =>
                                    setShowPassword(
                                        !showPassword
                                    )
                                }
                                style={{
                                    borderLeft: "none"
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

                                <div className="invalid-feedback fw-medium">
                                    {errors.password.message}
                                </div>

                            )}

                        </div>

                    </div>


                    {/* Submit */}

                    <button
                        type="submit"
                        className="btn w-100 fw-bold py-2 text-white border-0 mb-3"
                        style={{
                            backgroundColor: "#3D22C1",
                            opacity:
                                !isValid || loading
                                    ? 0.75
                                    : 1
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


                {/* Register */}

                <div className="text-center pt-2 border-top">

                    <span className="small text-muted">
                        New terminal operation layout coordinator?{" "}
                    </span>

                    <Link
                        to="/register"
                        className="small fw-bold text-decoration-none"
                        style={{ color: "#3D22C1" }}
                    >
                        Create account
                    </Link>

                </div>

            </div>

        </div>
    );
}

export default Login;