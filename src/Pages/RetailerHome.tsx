import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../RetailerHome.css";

interface Shop {
    shopId: number;
    shopName: string;
    address?: string;
    ownerId?: number;
    status?: string;
}

interface Order {
    orderId: number;
    customerId: number;
    shopId: number;
    totalAmount: number;
    paymentMethod: string;
    paymentStatus: string;
    loyaltyPointsEarned?: number;
    loyaltyPointsRedeemed?: number;
    status: string;
    createdAt: string;
}

interface RetailerHomeProps {
    retailerId: number;
}

const SHOP_URL =
    "http://localhost:8085/shopsmart/shop";

const ORDER_URL =
    "http://localhost:8087/shopsmart/orders";

const VOUCHER_URL =
    "http://localhost:8089/shopsmart/loyaltyTransaction/retailer/vouchers";

const RETAILER_URL =
    "http://localhost:8084/shopsmart/retailer";


const RetailerHome: React.FC<RetailerHomeProps> = ({
    retailerId
}) => {

    const navigate = useNavigate();


    // =====================================================
    // STATE
    // =====================================================

    const [shops, setShops] =
        useState<Shop[]>([]);

    const [orders, setOrders] =
        useState<Order[]>([]);

    const [voucherCount, setVoucherCount] =
        useState(0);

    const [ownerName, setOwnerName] =
        useState("Retailer");

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState("");


    // =====================================================
    // TOKEN
    // =====================================================

    const getToken = () => {
        return localStorage.getItem(
            "shopsmart_token"
        );
    };


    // =====================================================
    // AUTH HEADERS
    // =====================================================

    const getHeaders = (): HeadersInit => {

        const token = getToken();

        if (!token) {
            return {
                "Content-Type": "application/json"
            };
        }

        return {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        };
    };


    // =====================================================
    // LOAD DASHBOARD
    // =====================================================

    useEffect(() => {

        if (!retailerId) {
            return;
        }

        const loadDashboard = async () => {

            setLoading(true);
            setError("");

            try {

                // =================================================
                // 1. RETAILER PROFILE
                // =================================================

                try {

                    const profileResponse =
                        await fetch(
                            `${RETAILER_URL}/${retailerId}`,
                            {
                                headers: getHeaders()
                            }
                        );

                    if (profileResponse.ok) {

                        const profile =
                            await profileResponse.json();

                        setOwnerName(
                            profile.ownerName ||
                            profile.name ||
                            "Retailer"
                        );
                    }

                } catch (profileError) {

                    console.warn(
                        "Retailer profile unavailable:",
                        profileError
                    );
                }


                // =================================================
                // 2. RETAILER SHOPS
                // =================================================

                const shopResponse =
                    await fetch(
                        `${SHOP_URL}/retailer/${retailerId}`,
                        {
                            headers: getHeaders()
                        }
                    );

                if (!shopResponse.ok) {

                    throw new Error(
                        "Unable to load your shops."
                    );
                }

                const shopData =
                    await shopResponse.json();

                let retailerShops: Shop[] = [];


                if (Array.isArray(shopData)) {

                    retailerShops = shopData;

                } else if (
                    shopData &&
                    Array.isArray(shopData.shops)
                ) {

                    retailerShops =
                        shopData.shops;

                } else if (
                    shopData &&
                    Array.isArray(shopData.data)
                ) {

                    retailerShops =
                        shopData.data;
                }


                setShops(retailerShops);


                // =================================================
                // 3. FETCH ORDERS FOR OWNED SHOPS
                // =================================================

                const orderRequests =
                    retailerShops.map(async shop => {

                        try {

                            const response =
                                await fetch(
                                    `${ORDER_URL}/shop/${shop.shopId}/retailer/${retailerId}`,
                                    {
                                        headers: getHeaders()
                                    }
                                );

                            if (!response.ok) {
                                return [];
                            }

                            const data =
                                await response.json();

                            return Array.isArray(data)
                                ? data
                                : [];

                        } catch (orderError) {

                            console.warn(
                                `Could not load orders for shop ${shop.shopId}`,
                                orderError
                            );

                            return [];
                        }
                    });


                const orderResults =
                    await Promise.all(
                        orderRequests
                    );


                const combinedOrders =
                    orderResults.flat();


                setOrders(
                    combinedOrders
                );


                // =================================================
                // 4. VOUCHERS
                // =================================================

                try {

                    const voucherResponse =
                        await fetch(
                            VOUCHER_URL,
                            {
                                headers: getHeaders()
                            }
                        );

                    if (voucherResponse.ok) {

                        const voucherData =
                            await voucherResponse.json();

                        if (
                            Array.isArray(
                                voucherData
                            )
                        ) {

                            const retailerVouchers =
                                voucherData.filter(
                                    (voucher: any) =>
                                        Number(
                                            voucher.ownerId
                                        ) ===
                                        Number(
                                            retailerId
                                        )
                                );

                            setVoucherCount(
                                retailerVouchers.length
                            );
                        }
                    }

                } catch (voucherError) {

                    console.warn(
                        "Voucher service unavailable:",
                        voucherError
                    );

                    setVoucherCount(0);
                }


            } catch (err: any) {

                console.error(
                    "Retailer dashboard error:",
                    err
                );

                setError(
                    err.message ||
                    "Unable to load dashboard."
                );

            } finally {

                setLoading(false);
            }
        };


        loadDashboard();

    }, [retailerId]);


    // =====================================================
    // DATE
    // =====================================================

    const now =
        new Date();

    const currentMonth =
        now.getMonth();

    const currentYear =
        now.getFullYear();


    // =====================================================
    // CURRENT MONTH ORDERS
    // =====================================================

    const monthOrders =
        useMemo(() => {

            return orders.filter(order => {

                if (!order.createdAt) {
                    return false;
                }

                const date =
                    new Date(
                        order.createdAt
                    );

                return (
                    date.getMonth() ===
                    currentMonth &&
                    date.getFullYear() ===
                    currentYear
                );
            });

        }, [
            orders,
            currentMonth,
            currentYear
        ]);


    // =====================================================
    // VALID REVENUE ORDERS
    // =====================================================

    const revenueOrders =
        useMemo(() => {

            return monthOrders.filter(
                order => {

                    const payment =
                        String(
                            order.paymentStatus ||
                            ""
                        ).toUpperCase();

                    const status =
                        String(
                            order.status ||
                            ""
                        ).toUpperCase();

                    // Cancelled orders never count
                    if (
                        status ===
                        "CANCELLED"
                    ) {
                        return false;
                    }

                    // Paid orders
                    if (
                        payment === "PAID" ||
                        payment === "SUCCESS" ||
                        payment === "COMPLETED" ||
                        payment === "SUCCESSFUL"
                    ) {
                        return true;
                    }

                    // COD orders
                    if (
                        String(
                            order.paymentMethod ||
                            ""
                        ).toUpperCase() ===
                        "COD"
                    ) {
                        return (
                            status !==
                            "CANCELLED"
                        );
                    }

                    return false;
                }
            );

        }, [monthOrders]);


    // =====================================================
    // MONTHLY REVENUE
    // =====================================================

    const monthlyRevenue =
        useMemo(() => {

            return revenueOrders.reduce(
                (
                    total,
                    order
                ) =>
                    total +
                    Number(
                        order.totalAmount ||
                        0
                    ),
                0
            );

        }, [revenueOrders]);


    // =====================================================
    // AVERAGE ORDER VALUE
    // =====================================================

    const averageOrderValue =
        revenueOrders.length > 0
            ? monthlyRevenue /
              revenueOrders.length
            : 0;


    // =====================================================
    // RECENT ORDERS
    // =====================================================

    const recentOrders =
        useMemo(() => {

            return [...orders]
                .sort(
                    (a, b) =>
                        new Date(
                            b.createdAt
                        ).getTime() -
                        new Date(
                            a.createdAt
                        ).getTime()
                )
                .slice(0, 5);

        }, [orders]);


    // =====================================================
    // SHOP PERFORMANCE
    // =====================================================

    const shopPerformance =
        useMemo(() => {

            return shops
                .map(shop => {

                    const shopOrders =
                        revenueOrders.filter(
                            order =>
                                Number(
                                    order.shopId
                                ) ===
                                Number(
                                    shop.shopId
                                )
                        );

                    const revenue =
                        shopOrders.reduce(
                            (
                                total,
                                order
                            ) =>
                                total +
                                Number(
                                    order.totalAmount ||
                                    0
                                ),
                            0
                        );

                    return {
                        ...shop,
                        orderCount:
                            shopOrders.length,
                        revenue
                    };

                })
                .sort(
                    (a, b) =>
                        b.revenue -
                        a.revenue
                );

        }, [
            shops,
            revenueOrders
        ]);


    // =====================================================
    // DAILY REVENUE
    // =====================================================

    const dailyRevenue =
        useMemo(() => {

            const days =
                new Date(
                    currentYear,
                    currentMonth + 1,
                    0
                ).getDate();

            const result =
                Array.from(
                    {
                        length: days
                    },
                    (_, index) => ({
                        day: index + 1,
                        revenue: 0
                    })
                );


            revenueOrders.forEach(
                order => {

                    const date =
                        new Date(
                            order.createdAt
                        );

                    const day =
                        date.getDate();

                    if (
                        result[day - 1]
                    ) {

                        result[
                            day - 1
                        ].revenue +=
                            Number(
                                order.totalAmount ||
                                0
                            );
                    }
                }
            );


            return result;

        }, [
            revenueOrders,
            currentMonth,
            currentYear
        ]);


    const maxDailyRevenue =
        Math.max(
            ...dailyRevenue.map(
                item =>
                    item.revenue
            ),
            1
        );


    // =====================================================
    // MONTH NAME
    // =====================================================

    const monthName =
        now.toLocaleString(
            "en-IN",
            {
                month: "long"
            }
        );


    // =====================================================
    // NAVIGATION
    // =====================================================

    const goToShops = () => {
        navigate("/retailer/shop");
    };

    const goToOrders = () => {
        navigate("/retailer/orders");
    };

    const goToVouchers = () => {
        navigate("/retailer/add-voucher");
    };


    // =====================================================
    // LOADING
    // =====================================================

    if (loading) {

        return (
            <div className="retailer-home-page">

                <div className="retailer-home-container">

                    <div className="retailer-dashboard-loading">

                        <div className="retailer-loading-spinner"></div>

                        <h3>
                            Preparing your dashboard
                        </h3>

                        <p>
                            Fetching your shops,
                            orders and sales data...
                        </p>

                    </div>

                </div>

            </div>
        );
    }


    // =====================================================
    // PAGE
    // =====================================================

    return (

        <div className="retailer-home-page">

            <div className="retailer-home-container">


                {/* =================================================
                    DASHBOARD HEADER
                ================================================= */}

                <div className="retailer-dashboard-header">

                    <div>

                        <span className="retailer-section-label">
                            BUSINESS OVERVIEW
                        </span>

                        <h1>
                            Welcome back,{" "}
                            <span>
                                {ownerName}
                            </span>
                        </h1>

                        <p>
                            Here's how your business
                            is performing this{" "}
                            {monthName}.
                        </p>

                    </div>


                    <div className="dashboard-period">

                        <i className="bi bi-calendar3"></i>

                        <span>
                            {monthName}{" "}
                            {currentYear}
                        </span>

                    </div>

                </div>


                {/* =================================================
                    ERROR
                ================================================= */}

                {error && (

                    <div className="dashboard-inline-error">

                        <i className="bi bi-exclamation-circle"></i>

                        <span>
                            {error}
                        </span>

                        <button
                            onClick={() =>
                                window.location.reload()
                            }
                        >
                            Retry
                        </button>

                    </div>

                )}


                {/* =================================================
                    KPI CARDS
                ================================================= */}

                <div className="retailer-kpi-grid">


                    {/* REVENUE */}

                    <div className="retailer-kpi-card revenue-kpi">

                        <div className="kpi-top">

                            <div className="kpi-icon">
                                <i className="bi bi-currency-rupee"></i>
                            </div>

                            <span className="kpi-period">
                                THIS MONTH
                            </span>

                        </div>

                        <div className="kpi-value">
                            ₹
                            {monthlyRevenue.toLocaleString(
                                "en-IN",
                                {
                                    maximumFractionDigits: 0
                                }
                            )}
                        </div>

                        <div className="kpi-label">
                            Revenue
                        </div>

                    </div>


                    {/* ORDERS */}

                    <div className="retailer-kpi-card">

                        <div className="kpi-top">

                            <div className="kpi-icon">
                                <i className="bi bi-bag-check"></i>
                            </div>

                            <span className="kpi-period">
                                THIS MONTH
                            </span>

                        </div>

                        <div className="kpi-value">
                            {monthOrders.length}
                        </div>

                        <div className="kpi-label">
                            Orders
                        </div>

                    </div>


                    {/* SHOPS */}

                    <div className="retailer-kpi-card">

                        <div className="kpi-top">

                            <div className="kpi-icon">
                                <i className="bi bi-shop"></i>
                            </div>

                            <span className="kpi-period">
                                ACTIVE
                            </span>

                        </div>

                        <div className="kpi-value">

                            {
                                shops.filter(
                                    shop =>
                                        String(
                                            shop.status ||
                                            "ACTIVE"
                                        ).toUpperCase() !==
                                        "INACTIVE"
                                ).length
                            }

                        </div>

                        <div className="kpi-label">
                            Shops
                        </div>

                    </div>


                    {/* VOUCHERS */}

                    <div className="retailer-kpi-card">

                        <div className="kpi-top">

                            <div className="kpi-icon">
                                <i className="bi bi-ticket-perforated"></i>
                            </div>

                            <span className="kpi-period">
                                ACTIVE
                            </span>

                        </div>

                        <div className="kpi-value">
                            {voucherCount}
                        </div>

                        <div className="kpi-label">
                            Vouchers
                        </div>

                    </div>

                </div>


                {/* =================================================
                    SECONDARY METRICS
                ================================================= */}

                <div className="secondary-metrics">

                    <div className="secondary-metric">

                        <span>
                            Average Order Value
                        </span>

                        <strong>
                            ₹
                            {averageOrderValue.toLocaleString(
                                "en-IN",
                                {
                                    maximumFractionDigits: 0
                                }
                            )}
                        </strong>

                    </div>


                    <div className="secondary-divider"></div>


                    <div className="secondary-metric">

                        <span>
                            Total Orders
                        </span>

                        <strong>
                            {orders.length}
                        </strong>

                    </div>


                    <div className="secondary-divider"></div>


                    <div className="secondary-metric">

                        <span>
                            Your Shops
                        </span>

                        <strong>
                            {shops.length}
                        </strong>

                    </div>

                </div>


                {/* =================================================
                    MAIN ANALYTICS
                ================================================= */}

                <div className="dashboard-main-grid">


                    {/* =================================================
                        REVENUE
                    ================================================= */}

                    <div className="dashboard-panel revenue-panel">

                        <div className="panel-header">

                            <div>

                                <span className="panel-mini-label">
                                    SALES PERFORMANCE
                                </span>

                                <h2>
                                    Revenue overview
                                </h2>

                                <p>
                                    Daily revenue for{" "}
                                    {monthName}
                                </p>

                            </div>


                            <div className="panel-revenue-total">

                                <span>
                                    MTD
                                </span>

                                <strong>
                                    ₹
                                    {monthlyRevenue.toLocaleString(
                                        "en-IN",
                                        {
                                            maximumFractionDigits: 0
                                        }
                                    )}
                                </strong>

                            </div>

                        </div>


                        <div className="revenue-chart">

                            {dailyRevenue.map(
                                item => {

                                    const height =
                                        item.revenue === 0
                                            ? 3
                                            :
                                            Math.max(
                                                6,
                                                (
                                                    item.revenue /
                                                    maxDailyRevenue
                                                ) * 100
                                            );

                                    return (

                                        <div
                                            className="revenue-bar-wrapper"
                                            key={item.day}
                                        >

                                            <div className="revenue-tooltip">
                                                ₹
                                                {item.revenue.toLocaleString(
                                                    "en-IN",
                                                    {
                                                        maximumFractionDigits: 0
                                                    }
                                                )}
                                            </div>


                                            <div
                                                className="revenue-bar"
                                                style={{
                                                    height:
                                                        `${height}%`
                                                }}
                                            >
                                            </div>


                                            {(
                                                item.day === 1 ||
                                                item.day === 5 ||
                                                item.day === 10 ||
                                                item.day === 15 ||
                                                item.day === 20 ||
                                                item.day === 25 ||
                                                item.day ===
                                                dailyRevenue.length
                                            ) && (

                                                <span>
                                                    {item.day}
                                                </span>

                                            )}

                                        </div>
                                    );
                                }
                            )}

                        </div>

                    </div>


                    {/* =================================================
                        SHOP PERFORMANCE
                    ================================================= */}

                    <div className="dashboard-panel shop-performance-panel">

                        <div className="panel-header">

                            <div>

                                <span className="panel-mini-label">
                                    PERFORMANCE
                                </span>

                                <h2>
                                    Shop performance
                                </h2>

                            </div>


                            <button
                                className="panel-link"
                                onClick={goToShops}
                            >
                                View shops
                                <i className="bi bi-arrow-right"></i>
                            </button>

                        </div>


                        {shopPerformance.length === 0 ? (

                            <div className="panel-empty">

                                <i className="bi bi-shop"></i>

                                <p>
                                    No shops available.
                                </p>

                            </div>

                        ) : (

                            <div className="shop-performance-list">

                                {shopPerformance
                                    .slice(0, 5)
                                    .map(
                                        (
                                            shop,
                                            index
                                        ) => {

                                            const maxShopRevenue =
                                                Math.max(
                                                    ...shopPerformance.map(
                                                        item =>
                                                            item.revenue
                                                    ),
                                                    1
                                                );

                                            const width =
                                                (
                                                    shop.revenue /
                                                    maxShopRevenue
                                                ) * 100;


                                            return (

                                                <div
                                                    className="shop-performance-row"
                                                    key={
                                                        shop.shopId
                                                    }
                                                >

                                                    <div className="shop-rank">
                                                        {index + 1}
                                                    </div>


                                                    <div className="shop-performance-info">

                                                        <div className="shop-name-line">

                                                            <strong>
                                                                {
                                                                    shop.shopName
                                                                }
                                                            </strong>

                                                            <span>
                                                                {
                                                                    shop.orderCount
                                                                }{" "}
                                                                orders
                                                            </span>

                                                        </div>


                                                        <div className="shop-progress">

                                                            <div
                                                                style={{
                                                                    width:
                                                                        `${width}%`
                                                                }}
                                                            >
                                                            </div>

                                                        </div>

                                                    </div>


                                                    <strong className="shop-revenue">

                                                        ₹
                                                        {shop.revenue.toLocaleString(
                                                            "en-IN",
                                                            {
                                                                maximumFractionDigits: 0
                                                            }
                                                        )}

                                                    </strong>

                                                </div>
                                            );
                                        }
                                    )}

                            </div>
                        )}

                    </div>

                </div>


                {/* =================================================
                    LOWER SECTION
                ================================================= */}

                <div className="dashboard-lower-grid">


                    {/* =================================================
                        RECENT ORDERS
                    ================================================= */}

                    <div className="dashboard-panel recent-orders-panel">

                        <div className="panel-header">

                            <div>

                                <span className="panel-mini-label">
                                    ORDER ACTIVITY
                                </span>

                                <h2>
                                    Recent orders
                                </h2>

                            </div>


                            <button
                                className="panel-link"
                                onClick={goToOrders}
                            >
                                View all
                                <i className="bi bi-arrow-right"></i>
                            </button>

                        </div>


                        {recentOrders.length === 0 ? (

                            <div className="panel-empty">

                                <i className="bi bi-bag"></i>

                                <h3>
                                    No orders yet
                                </h3>

                                <p>
                                    Orders will appear here
                                    when customers purchase
                                    from your shops.
                                </p>

                            </div>

                        ) : (

                            <div className="recent-orders-list">

                                {recentOrders.map(
                                    order => (

                                        <div
                                            className="recent-order-row"
                                            key={
                                                order.orderId
                                            }
                                        >

                                            <div className="recent-order-icon">
                                                <i className="bi bi-bag-check"></i>
                                            </div>


                                            <div className="recent-order-info">

                                                <strong>
                                                    Order #
                                                    {
                                                        order.orderId
                                                    }
                                                </strong>

                                                <span>
                                                    Customer #
                                                    {
                                                        order.customerId
                                                    }
                                                </span>

                                            </div>


                                            <div className="recent-order-date">

                                                {
                                                    new Date(
                                                        order.createdAt
                                                    ).toLocaleDateString(
                                                        "en-IN",
                                                        {
                                                            day: "2-digit",
                                                            month: "short"
                                                        }
                                                    )
                                                }

                                            </div>


                                            <div className="recent-order-payment">

                                                <span
                                                    className={`payment-badge ${String(
                                                        order.paymentStatus ||
                                                        ""
                                                    ).toLowerCase()}`}
                                                >
                                                    {
                                                        order.paymentStatus
                                                    }
                                                </span>

                                            </div>


                                            <strong className="recent-order-amount">

                                                ₹
                                                {Number(
                                                    order.totalAmount ||
                                                    0
                                                ).toLocaleString(
                                                    "en-IN",
                                                    {
                                                        maximumFractionDigits: 0
                                                    }
                                                )}

                                            </strong>

                                        </div>

                                    )
                                )}

                            </div>
                        )}

                    </div>


                    {/* =================================================
                        QUICK ACTIONS
                    ================================================= */}

                    <div className="dashboard-panel quick-actions-panel">

                        <div className="panel-header">

                            <div>

                                <span className="panel-mini-label">
                                    QUICK ACCESS
                                </span>

                                <h2>
                                    Manage your store
                                </h2>

                            </div>

                        </div>


                        <div className="quick-actions">


                            {/* SHOPS */}

                            <button
                                onClick={goToShops}
                            >

                                <div className="quick-action-icon">
                                    <i className="bi bi-shop"></i>
                                </div>

                                <div>

                                    <strong>
                                        My Shops
                                    </strong>

                                    <span>
                                        Manage your stores
                                    </span>

                                </div>

                                <i className="bi bi-arrow-right"></i>

                            </button>


                            {/* ORDERS */}

                            <button
                                onClick={goToOrders}
                            >

                                <div className="quick-action-icon">
                                    <i className="bi bi-bag-check"></i>
                                </div>

                                <div>

                                    <strong>
                                        Orders
                                    </strong>

                                    <span>
                                        View customer orders
                                    </span>

                                </div>

                                <i className="bi bi-arrow-right"></i>

                            </button>


                            {/* ORDER HISTORY */}

                            <button
                                onClick={() =>
                                    navigate(
                                        "/retailer/order-history"
                                    )
                                }
                            >

                                <div className="quick-action-icon">
                                    <i className="bi bi-clock-history"></i>
                                </div>

                                <div>

                                    <strong>
                                        Order History
                                    </strong>

                                    <span>
                                        Review previous orders
                                    </span>

                                </div>

                                <i className="bi bi-arrow-right"></i>

                            </button>


                            {/* VOUCHERS */}

                            <button
                                onClick={goToVouchers}
                            >

                                <div className="quick-action-icon">
                                    <i className="bi bi-ticket-perforated"></i>
                                </div>

                                <div>

                                    <strong>
                                        Add Voucher
                                    </strong>

                                    <span>
                                        Create customer offers
                                    </span>

                                </div>

                                <i className="bi bi-arrow-right"></i>

                            </button>

                        </div>

                    </div>

                </div>

            </div>

        </div>
    );
};


export default RetailerHome;