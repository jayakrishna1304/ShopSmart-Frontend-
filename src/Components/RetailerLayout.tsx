import React, { useEffect, useState } from "react";
import {
    Outlet,
    useNavigate,
    useOutletContext,
} from "react-router-dom";

import Header from "./Header";
import "../RetailerLayout.css";


// ==========================================
// CONTEXT FROM AUTH GUARD
// ==========================================

interface AuthContext {
    userDetails: {
        sub: string;
        role: string;
        userId?: number;
        exp: number;
    };

    userId: number;

    role: "CUSTOMER" | "RETAILER";
}


// ==========================================
// CONTEXT PASSED TO RETAILER PAGES
// ==========================================

export interface RetailerOutletContext {
    retailerId: number;
    ownerName: string;
    profileImage: string | null;
}


// ==========================================
// RETAILER LAYOUT
// ==========================================

export function RetailerLayout(): React.JSX.Element {

    const navigate = useNavigate();


    // ==========================================
    // GET USER FROM AUTH GUARD
    // ==========================================

    const { userId, role } =
        useOutletContext<AuthContext>();


    const retailerId = userId;


    // ==========================================
    // STATE
    // ==========================================

    const [ownerName, setOwnerName] =
        useState<string>("Retailer");

    const [profileImage, setProfileImage] =
        useState<string | null>(null);


    const [loading, setLoading] =
        useState<boolean>(true);


    // ==========================================
    // FETCH RETAILER PROFILE
    // ==========================================

    useEffect(() => {

        // AuthGuard already validates authentication.
        // We do NOT redirect to login here.

        if (!retailerId) {

            console.error(
                "RetailerLayout: Retailer ID not available."
            );

            setLoading(false);

            return;
        }


        if (role !== "RETAILER") {

            console.error(
                "RetailerLayout: Invalid role:",
                role
            );

            setLoading(false);

            return;
        }


        const token =
            localStorage.getItem("shopsmart_token");


        if (!token) {

            console.error(
                "RetailerLayout: JWT token not found."
            );

            setLoading(false);

            return;
        }


        const fetchRetailerProfile =
            async (): Promise<void> => {

                try {

                    setLoading(true);


                    const response =
                        await fetch(
                            `http://localhost:8084/shopsmart/retailer/${retailerId}`,
                            {
                                method: "GET",

                                headers: {
                                    Authorization:
                                        `Bearer ${token}`,

                                    "Content-Type":
                                        "application/json",
                                },
                            }
                        );


                    if (!response.ok) {

                        throw new Error(
                            `Retailer profile request failed: ${response.status}`
                        );
                    }


                    const data =
                        await response.json();


                    console.log(
                        "Retailer profile:",
                        data
                    );


                    setOwnerName(
                        data?.ownerName ||
                        data?.name ||
                        "Retailer"
                    );


                    setProfileImage(
                        data?.profileImage ||
                        null
                    );

                }
                catch (error) {

                    console.error(
                        "Retailer profile error:",
                        error
                    );

                    /*
                     * IMPORTANT:
                     *
                     * Do NOT navigate("/login") here.
                     *
                     * A profile API/CORS failure does NOT mean
                     * that the JWT is invalid.
                     *
                     * AuthGuard handles authentication.
                     */

                    setOwnerName("Retailer");

                }
                finally {

                    setLoading(false);

                }
            };


        fetchRetailerProfile();

    }, [retailerId, role]);


    // ==========================================
    // LOGOUT
    // ==========================================

    const handleLogout = (): void => {

        localStorage.removeItem(
            "shopsmart_token"
        );

        navigate("/login", {
            replace: true,
        });
    };


    // ==========================================
    // LOADING
    // ==========================================

    if (!retailerId || loading) {

        return (

            <div className="retailer-loading">

                <div className="loading-spinner"></div>

                <h3>
                    Loading ShopSmart
                </h3>

                <p>
                    Preparing your retailer dashboard...
                </p>

            </div>

        );
    }


    // ==========================================
    // LAYOUT
    // ==========================================

    return (

        <div className="retailer-layout">


            {/* ======================================
                HEADER
            ====================================== */}

            <Header
                ownerName={ownerName}
                profileImage={
                    profileImage || undefined
                }
                onLogout={handleLogout}
            />


            {/* ======================================
                PAGE CONTENT
            ====================================== */}

            <main className="retailer-main">

                <Outlet
                    context={{
                        retailerId,
                        ownerName,
                        profileImage,
                    }}
                />

            </main>


            {/* ======================================
                FOOTER
            ====================================== */}

            <footer className="retailer-footer">

                <div className="footer-container">


                    {/* ==================================
                        BRAND
                    ================================== */}

                    <div className="footer-brand">

                        <div className="footer-logo">

                            <div className="footer-logo-icon">
                                S
                            </div>

                            <div>

                                <h2>
                                    ShopSmart
                                </h2>

                                <span>
                                    Retailer Portal
                                </span>

                            </div>

                        </div>


                        <p>
                            Manage your shops, products,
                            orders and customer offers
                            from one smart platform.
                        </p>

                    </div>


                    {/* ==================================
                        PLATFORM
                    ================================== */}

                    <div className="footer-column">

                        <h3>
                            Platform
                        </h3>


                        <button
                            onClick={() =>
                                navigate("/retailer")
                            }
                        >
                            Dashboard
                        </button>


                        <button
                            onClick={() =>
                                navigate("/retailer/shop")
                            }
                        >
                            My Shops
                        </button>


                        <button
                            onClick={() =>
                                navigate("/retailer/orders")
                            }
                        >
                            Orders
                        </button>

                    </div>


                    {/* ==================================
                        BUSINESS
                    ================================== */}

                    <div className="footer-column">

                        <h3>
                            Business
                        </h3>


                        <button
                            onClick={() =>
                                navigate(
                                    "/retailer/order-history"
                                )
                            }
                        >
                            Order History
                        </button>


                        <button
                            onClick={() =>
                                navigate(
                                    "/retailer/add-voucher"
                                )
                            }
                        >
                            Vouchers
                        </button>


                        <button
                            onClick={() =>
                                navigate(
                                    "/retailer/profile"
                                )
                            }
                        >
                            Profile
                        </button>

                    </div>


                    {/* ==================================
                        SUPPORT
                    ================================== */}

                    <div className="footer-column footer-support">

                        <h3>
                            ShopSmart
                        </h3>


                        <p>
                            Smart tools for modern
                            local retailers.
                        </p>


                        <div className="footer-status">

                            <span className="status-dot"></span>

                            All systems operational

                        </div>

                    </div>

                </div>


                {/* ======================================
                    FOOTER BOTTOM
                ====================================== */}

                <div className="footer-bottom">

                    <p>
                        © {new Date().getFullYear()}
                        {" "}ShopSmart. All rights reserved.
                    </p>


                    <div>

                        <span>
                            Privacy
                        </span>

                        <span>
                            Terms
                        </span>

                        <span>
                            Help
                        </span>

                    </div>

                </div>

            </footer>

        </div>
    );
}