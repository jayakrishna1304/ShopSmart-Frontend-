import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import '../Header.css'

interface HeaderProps {
    onLogout: () => void;
    profileImage?: string;
    ownerName?: string;
}

const Header: React.FC<HeaderProps> = ({
    onLogout,
    profileImage,
    ownerName = "Retailer"
}) => {

    const navigate = useNavigate();
    const location = useLocation();

    const [mobileMenuOpen, setMobileMenuOpen] =
        useState(false);

    const isActive = (path: string) => {
        return location.pathname === path;
    };

    const navigateTo = (path: string) => {
        navigate(path);
        setMobileMenuOpen(false);
    };

    return (
        <>

            {/* =================================================
                NAVBAR
            ================================================= */}

            <header className="retailer-header">

                <div className="retailer-header-inner">

                    {/* ================= BRAND ================= */}

                    <div
                        className="retailer-brand"
                        onClick={() =>
                            navigateTo("/retailer")
                        }
                    >

                        <div className="retailer-brand-logo">
                            S
                        </div>

                        <div className="retailer-brand-text">

                            <strong>
                                ShopSmart
                            </strong>

                            <span>
                                Retailer Portal
                            </span>

                        </div>

                    </div>


                    {/* ================= DESKTOP NAV ================= */}

                    <nav className="retailer-nav">

                        <button
                            className={
                                isActive("/retailer")
                                    ? "nav-item active"
                                    : "nav-item"
                            }
                            onClick={() =>
                                navigateTo("/retailer")
                            }
                        >
                            <i className="bi bi-grid-1x2-fill"></i>
                            Dashboard
                        </button>

                            <button
                            className={
                                location.pathname.startsWith(
                                    "/retailer"
                                )
                                    ? "nav-item active"
                                    : "nav-item"
                            }
                            onClick={() =>
                                navigateTo(
                                    "/retailer/shop"
                                )
                            }
                        >
                            <i className="bi bi-shop"></i>
                            Home
                        </button>
                        <button
                            className={
                                location.pathname.startsWith(
                                    "/retailer/shop"
                                )
                                    ? "nav-item active"
                                    : "nav-item"
                            }
                            onClick={() =>
                                navigateTo(
                                    "/retailer/shop"
                                )
                            }
                        >
                            <i className="bi bi-shop"></i>
                            My Shops
                        </button>


                        <button
                            className={
                                isActive(
                                    "/retailer/orders"
                                )
                                    ? "nav-item active"
                                    : "nav-item"
                            }
                            onClick={() =>
                                navigateTo(
                                    "/retailer/orders"
                                )
                            }
                        >
                            <i className="bi bi-bag-check"></i>
                            Orders
                        </button>


                        <button
                            className={
                                isActive(
                                    "/retailer/order-history"
                                )
                                    ? "nav-item active"
                                    : "nav-item"
                            }
                            onClick={() =>
                                navigateTo(
                                    "/retailer/order-history"
                                )
                            }
                        >
                            <i className="bi bi-clock-history"></i>
                            Order History
                        </button>


                        <button
                            className={
                                isActive(
                                    "/retailer/add-voucher"
                                )
                                    ? "nav-item active"
                                    : "nav-item"
                            }
                            onClick={() =>
                                navigateTo(
                                    "/retailer/add-voucher"
                                )
                            }
                        >
                            <i className="bi bi-ticket-perforated"></i>
                            Vouchers
                        </button>

                    </nav>


                    {/* ================= RIGHT SIDE ================= */}

                    <div className="retailer-header-right">

                        <button
                            className="header-icon-button"
                            title="Notifications"
                        >
                            <i className="bi bi-bell"></i>

                            <span className="notification-dot"></span>
                        </button>


                        <div className="header-divider"></div>


                        <button
                            className="retailer-profile-button"
                            onClick={() =>
                                navigateTo(
                                    "/retailer/profile"
                                )
                            }
                        >

                            <div className="header-avatar">

                                {profileImage ? (

                                    <img
                                        src={profileImage}
                                        alt="Profile"
                                    />

                                ) : (

                                    <span>
                                        {ownerName
                                            .charAt(0)
                                            .toUpperCase()}
                                    </span>

                                )}

                            </div>


                            <div className="header-user-info">

                                <strong>
                                    {ownerName}
                                </strong>

                                <span>
                                    Retailer
                                </span>

                            </div>


                            <i className="bi bi-chevron-down"></i>

                        </button>


                        <button
                            className="header-logout"
                            title="Logout"
                            onClick={onLogout}
                        >
                            <i className="bi bi-box-arrow-right"></i>
                        </button>


                        {/* MOBILE */}

                        <button
                            className="mobile-menu-button"
                            onClick={() =>
                                setMobileMenuOpen(
                                    !mobileMenuOpen
                                )
                            }
                        >
                            <i
                                className={
                                    mobileMenuOpen
                                        ? "bi bi-x-lg"
                                        : "bi bi-list"
                                }
                            ></i>
                        </button>

                    </div>

                </div>


                {/* =================================================
                    MOBILE NAVIGATION
                ================================================= */}

                {mobileMenuOpen && (

                    <div className="mobile-retailer-nav">

                        <button
                            className={
                                isActive("/retailer")
                                    ? "mobile-nav-item active"
                                    : "mobile-nav-item"
                            }
                            onClick={() =>
                                navigateTo("/retailer")
                            }
                        >
                            <i className="bi bi-grid-1x2-fill"></i>
                            Dashboard
                        </button>


                        <button
                            className="mobile-nav-item"
                            onClick={() =>
                                navigateTo(
                                    "/retailer/shop"
                                )
                            }
                        >
                            <i className="bi bi-shop"></i>
                            My Shops
                        </button>


                        <button
                            className="mobile-nav-item"
                            onClick={() =>
                                navigateTo(
                                    "/retailer/orders"
                                )
                            }
                        >
                            <i className="bi bi-bag-check"></i>
                            Orders
                        </button>


                        <button
                            className="mobile-nav-item"
                            onClick={() =>
                                navigateTo(
                                    "/retailer/order-history"
                                )
                            }
                        >
                            <i className="bi bi-clock-history"></i>
                            Order History
                        </button>


                        <button
                            className="mobile-nav-item"
                            onClick={() =>
                                navigateTo(
                                    "/retailer/add-voucher"
                                )
                            }
                        >
                            <i className="bi bi-ticket-perforated"></i>
                            Vouchers
                        </button>


                        <button
                            className="mobile-nav-item"
                            onClick={() =>
                                navigateTo(
                                    "/retailer/profile"
                                )
                            }
                        >
                            <i className="bi bi-person"></i>
                            Profile
                        </button>

                    </div>

                )}

            </header>

        </>
    );
};

export default Header;