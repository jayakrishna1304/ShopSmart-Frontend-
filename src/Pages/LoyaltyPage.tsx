import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import "../LoyaltyPage.css";

// ============================================================
// API URLS
// ============================================================

const LOYALTY_URL =
    "http://localhost:8090/shopsmart/loyalty";

const LOYALTY_TRANSACTION_URL =
    "http://localhost:8091/shopsmart/loyaltyTransaction";


// ============================================================
// JWT
// ============================================================

interface JwtPayload {
    sub: string;
    role: string;
    userId?: number;
    exp: number;
}


// ============================================================
// LOYALTY ACCOUNT
// ============================================================

interface LoyaltyAccount {
    loyaltyId?: number;
    customerId?: number;
    pointsAvail?: number;
    pointsRedeemed?: number;
    tier?: string;
    pointsHistory?: string;
}


// ============================================================
// LOYALTY TRANSACTION
// ============================================================

interface LoyaltyTransaction {
    transactionId?: number;
    customerId?: number;
    orderId?: number;
    transactionType?: string;
    points?: number;
    description?: string;
    createdAt?: string;
}


// ============================================================
// PAGE
// ============================================================

export function LoyaltyPage() {

    const [loyaltyAccount, setLoyaltyAccount] =
        useState<LoyaltyAccount | null>(null);

    const [transactions, setTransactions] =
        useState<LoyaltyTransaction[]>([]);

    const [loading, setLoading] =
        useState(true);

    const [refreshing, setRefreshing] =
        useState(false);

    const [error, setError] =
        useState("");

    const [activeFilter, setActiveFilter] =
        useState<"ALL" | "EARNED" | "REDEEMED">(
            "ALL"
        );


    // ========================================================
    // GET CUSTOMER ID
    // ========================================================

    const getCustomerId = (): number | null => {

        const token =
            localStorage.getItem(
                "shopsmart_token"
            );

        if (!token) {
            return null;
        }

        try {

            const decoded =
                jwtDecode<JwtPayload>(
                    token
                );

            const userId =
                Number(decoded.userId);

            if (
                !Number.isFinite(userId) ||
                userId <= 0
            ) {
                return null;
            }

            return userId;

        } catch {

            return null;
        }
    };


    // ========================================================
    // FORMAT DATE
    // ========================================================

    const formatDate = (
        date?: string
    ): string => {

        if (!date) {
            return "—";
        }

        const parsedDate =
            new Date(date);

        if (
            Number.isNaN(
                parsedDate.getTime()
            )
        ) {
            return date;
        }

        return parsedDate.toLocaleDateString(
            "en-IN",
            {
                day: "2-digit",
                month: "short",
                year: "numeric"
            }
        );
    };


    // ========================================================
    // FORMAT TIME
    // ========================================================

    const formatTime = (
        date?: string
    ): string => {

        if (!date) {
            return "";
        }

        const parsedDate =
            new Date(date);

        if (
            Number.isNaN(
                parsedDate.getTime()
            )
        ) {
            return "";
        }

        return parsedDate.toLocaleTimeString(
            "en-IN",
            {
                hour: "2-digit",
                minute: "2-digit"
            }
        );
    };


    // ========================================================
    // LOAD LOYALTY DATA
    // ========================================================

    const loadLoyalty = useCallback(
        async (
            isRefresh = false
        ) => {

            try {

                if (isRefresh) {
                    setRefreshing(true);
                } else {
                    setLoading(true);
                }

                setError("");


                // ------------------------------------------------
                // TOKEN
                // ------------------------------------------------

                const token =
                    localStorage.getItem(
                        "shopsmart_token"
                    );

                if (!token) {

                    setError(
                        "Please login to view your loyalty account."
                    );

                    return;
                }


                // ------------------------------------------------
                // CUSTOMER ID
                // ------------------------------------------------

                const customerId =
                    getCustomerId();

                if (!customerId) {

                    setError(
                        "Customer information not found. Please login again."
                    );

                    return;
                }


                console.log(
                    "Loading loyalty account for customer:",
                    customerId
                );


                // =================================================
                // LOYALTY ACCOUNT
                // =================================================

                const accountResponse =
                    await axios.get<LoyaltyAccount>(
                        `${LOYALTY_URL}/customer/${customerId}`,
                        {
                            headers: {
                                Authorization:
                                    `Bearer ${token}`,
                                Accept:
                                    "application/json"
                            }
                        }
                    );


                console.log(
                    "Loyalty account:",
                    accountResponse.data
                );


                setLoyaltyAccount(
                    accountResponse.data
                );


                // =================================================
                // TRANSACTION HISTORY
                // =================================================

                try {

                    const transactionResponse =
                        await axios.get<
                            LoyaltyTransaction[]
                        >(
                            `${LOYALTY_TRANSACTION_URL}/customer/${customerId}`,
                            {
                                headers: {
                                    Authorization:
                                        `Bearer ${token}`,
                                    Accept:
                                        "application/json"
                                }
                            }
                        );


                    const transactionList =
                        Array.isArray(
                            transactionResponse.data
                        )
                            ? transactionResponse.data
                            : [];


                    console.log(
                        "Loyalty transactions:",
                        transactionList
                    );


                    setTransactions(
                        transactionList
                    );

                } catch (transactionError) {

                    console.warn(
                        "Transaction history could not be loaded:",
                        transactionError
                    );

                    setTransactions([]);
                }

            } catch (err) {

                console.error(
                    "Loyalty loading error:",
                    err
                );


                if (
                    axios.isAxiosError(err)
                ) {

                    if (
                        err.response?.status ===
                            401 ||
                        err.response?.status ===
                            403
                    ) {

                        setError(
                            "You are not authorized to view your loyalty account. Please login again."
                        );

                    } else {

                        const serverMessage =
                            typeof err.response?.data ===
                            "string"
                                ? err.response.data
                                : err.response?.data
                                      ?.message;

                        setError(
                            serverMessage ||
                                "Unable to load your loyalty account."
                        );
                    }

                } else {

                    setError(
                        "Unable to load your loyalty account. Please try again."
                    );
                }

            } finally {

                setLoading(false);
                setRefreshing(false);
            }

        },
        []
    );


    // ========================================================
    // INITIAL LOAD
    // ========================================================

    useEffect(() => {

        loadLoyalty();

    }, [loadLoyalty]);


    // ========================================================
    // CALCULATIONS
    // ========================================================

    const availablePoints =
        Number(
            loyaltyAccount?.pointsAvail ?? 0
        );


    const accountRedeemed =
        Number(
            loyaltyAccount?.pointsRedeemed ?? 0
        );


    const totalEarned =
        transactions
            .filter(
                (transaction) =>
                    String(
                        transaction.transactionType ||
                            ""
                    ).toUpperCase() ===
                    "EARNED"
            )
            .reduce(
                (total, transaction) =>
                    total +
                    Number(
                        transaction.points ?? 0
                    ),
                0
            );


    const transactionRedeemed =
        transactions
            .filter(
                (transaction) =>
                    String(
                        transaction.transactionType ||
                            ""
                    ).toUpperCase() ===
                    "REDEEMED"
            )
            .reduce(
                (total, transaction) =>
                    total +
                    Number(
                        transaction.points ?? 0
                    ),
                0
            );


    const totalRedeemed =
        Math.max(
            accountRedeemed,
            transactionRedeemed
        );


    // ========================================================
    // FILTER TRANSACTIONS
    // ========================================================

    const filteredTransactions =
        transactions.filter(
            (transaction) => {

                const type =
                    String(
                        transaction.transactionType ||
                            ""
                    ).toUpperCase();

                if (
                    activeFilter ===
                    "ALL"
                ) {
                    return true;
                }

                return (
                    type === activeFilter
                );
            }
        );


    // ========================================================
    // TRANSACTION ICON
    // ========================================================

    const getTransactionIcon = (
        type?: string
    ): string => {

        const normalized =
            String(
                type || ""
            ).toUpperCase();

        if (
            normalized === "EARNED"
        ) {
            return "↗";
        }

        if (
            normalized === "REDEEMED"
        ) {
            return "↘";
        }

        return "•";
    };


    // ========================================================
    // TRANSACTION LABEL
    // ========================================================

    const getTransactionLabel = (
        type?: string
    ): string => {

        const normalized =
            String(
                type || ""
            ).toUpperCase();

        if (
            normalized === "EARNED"
        ) {
            return "Points Earned";
        }

        if (
            normalized === "REDEEMED"
        ) {
            return "Points Redeemed";
        }

        return (
            transactionTypeFallback(
                type
            )
        );
    };


    // ========================================================
    // TRANSACTION FALLBACK
    // ========================================================

    const transactionTypeFallback = (
        type?: string
    ): string => {

        if (!type) {
            return "Loyalty Activity";
        }

        return type
            .charAt(0)
            .toUpperCase() +
            type
                .slice(1)
                .toLowerCase();
    };


    // ========================================================
    // LOADING SCREEN
    // ========================================================

    if (loading) {

        return (
            <div className="loyalty-page">

                <div className="loyalty-container">

                    <div className="loyalty-loading">

                        <div className="loyalty-loader">

                            <div className="loader-ring"></div>

                            <span>
                                ⭐
                            </span>

                        </div>

                        <h2>
                            Loading your rewards...
                        </h2>

                        <p>
                            We're preparing your
                            loyalty dashboard.
                        </p>

                    </div>


                    <div className="loyalty-skeleton-grid">

                        <div className="loyalty-skeleton hero"></div>

                        <div className="loyalty-skeleton"></div>

                        <div className="loyalty-skeleton"></div>

                        <div className="loyalty-skeleton"></div>

                    </div>

                </div>

            </div>
        );
    }


    // ========================================================
    // ERROR
    // ========================================================

    if (error) {

        return (
            <div className="loyalty-page">

                <div className="loyalty-container">

                    <div className="loyalty-page-header">

                        <div>

                            <span className="loyalty-eyebrow">
                                SHOPSMART REWARDS
                            </span>

                            <h1>
                                My Loyalty
                            </h1>

                            <p>
                                Earn points, unlock rewards
                                and enjoy more benefits.
                            </p>

                        </div>

                    </div>


                    <div className="loyalty-error-card">

                        <div className="loyalty-error-icon">
                            ⚠️
                        </div>

                        <h2>
                            Something went wrong
                        </h2>

                        <p>
                            {error}
                        </p>

                        <button
                            className="loyalty-primary-button"
                            onClick={() =>
                                loadLoyalty()
                            }
                        >
                            ↻ Try Again
                        </button>

                    </div>

                </div>

            </div>
        );
    }


    // ========================================================
    // MAIN PAGE
    // ========================================================

    return (
        <div className="loyalty-page">

            <div className="loyalty-container">

                {/* =================================================
                    PAGE HEADER
                ================================================= */}

                <div className="loyalty-page-header">

                    <div>

                        <span className="loyalty-eyebrow">
                            SHOPSMART REWARDS
                        </span>

                        <h1>
                            Loyalty & Rewards
                        </h1>

                        <p>
                            Keep shopping, keep earning.
                            Your rewards are all in one place.
                        </p>

                    </div>


                    <button
                        className="loyalty-refresh-button"
                        onClick={() =>
                            loadLoyalty(true)
                        }
                        disabled={refreshing}
                    >

                        <span
                            className={
                                refreshing
                                    ? "refresh-spin"
                                    : ""
                            }
                        >
                            ↻
                        </span>

                        {refreshing
                            ? "Refreshing..."
                            : "Refresh"}

                    </button>

                </div>


                {/* =================================================
                    HERO LOYALTY CARD
                ================================================= */}

                <div className="loyalty-hero-card">

                    <div className="hero-glow glow-one"></div>
                    <div className="hero-glow glow-two"></div>


                    <div className="hero-content">

                        <div className="hero-left">

                            <div className="hero-icon">
                                ⭐
                            </div>


                            <div>

                                <span className="hero-small-title">
                                    AVAILABLE POINTS
                                </span>

                                <div className="hero-points">

                                    {availablePoints.toLocaleString(
                                        "en-IN"
                                    )}

                                </div>

                                <p className="hero-description">
                                    Use your points during
                                    checkout to save money.
                                </p>

                            </div>

                        </div>


                        <div className="tier-display">

                            <span className="tier-label">
                                CURRENT TIER
                            </span>

                            <div className="tier-icon">
                                👑
                            </div>

                            <strong>
                                {loyaltyAccount?.tier ||
                                    "MEMBER"}
                            </strong>

                            <span className="tier-subtitle">
                                ShopSmart Rewards Member
                            </span>

                        </div>

                    </div>


                    <div className="hero-bottom">

                        <div className="hero-info-item">

                            <span>
                                💎
                            </span>

                            <div>
                                <small>
                                    Point Value
                                </small>

                                <strong>
                                    1 Point = ₹1
                                </strong>
                            </div>

                        </div>


                        <div className="hero-info-item">

                            <span>
                                🛒
                            </span>

                            <div>
                                <small>
                                    Earn More
                                </small>

                                <strong>
                                    Shop & collect points
                                </strong>
                            </div>

                        </div>


                        <div className="hero-info-item">

                            <span>
                                🎁
                            </span>

                            <div>
                                <small>
                                    Redeem
                                </small>

                                <strong>
                                    Use at checkout
                                </strong>
                            </div>

                        </div>

                    </div>

                </div>


                {/* =================================================
                    STAT CARDS
                ================================================= */}

                <div className="loyalty-stats-grid">

                    {/* AVAILABLE */}

                    <div className="loyalty-stat-card">

                        <div className="stat-icon available">
                            ⭐
                        </div>

                        <div className="stat-content">

                            <span>
                                Available Points
                            </span>

                            <strong>
                                {availablePoints.toLocaleString(
                                    "en-IN"
                                )}
                            </strong>

                            <small>
                                Ready to use
                            </small>

                        </div>

                    </div>


                    {/* EARNED */}

                    <div className="loyalty-stat-card">

                        <div className="stat-icon earned">
                            ↗
                        </div>

                        <div className="stat-content">

                            <span>
                                Total Earned
                            </span>

                            <strong>
                                {totalEarned.toLocaleString(
                                    "en-IN"
                                )}
                            </strong>

                            <small>
                                Lifetime earnings
                            </small>

                        </div>

                    </div>


                    {/* REDEEMED */}

                    <div className="loyalty-stat-card">

                        <div className="stat-icon redeemed">
                            ↘
                        </div>

                        <div className="stat-content">

                            <span>
                                Total Redeemed
                            </span>

                            <strong>
                                {totalRedeemed.toLocaleString(
                                    "en-IN"
                                )}
                            </strong>

                            <small>
                                Points used
                            </small>

                        </div>

                    </div>


                    {/* TIER */}

                    <div className="loyalty-stat-card">

                        <div className="stat-icon tier">
                            👑
                        </div>

                        <div className="stat-content">

                            <span>
                                Current Tier
                            </span>

                            <strong className="tier-stat">
                                {loyaltyAccount?.tier ||
                                    "MEMBER"}
                            </strong>

                            <small>
                                ShopSmart member
                            </small>

                        </div>

                    </div>

                </div>


                {/* =================================================
                    CONTENT GRID
                ================================================= */}

                <div className="loyalty-content-grid">


                    {/* =================================================
                        HOW IT WORKS
                    ================================================= */}

                    <div className="loyalty-info-card">

                        <div className="section-heading">

                            <div>

                                <span>
                                    REWARDS PROGRAM
                                </span>

                                <h2>
                                    How your points work
                                </h2>

                            </div>

                            <div className="section-heading-icon">
                                💡
                            </div>

                        </div>


                        <div className="reward-steps">

                            <div className="reward-step">

                                <div className="step-number">
                                    01
                                </div>

                                <div>

                                    <strong>
                                        Shop on ShopSmart
                                    </strong>

                                    <p>
                                        Place orders from your
                                        favorite products.
                                    </p>

                                </div>

                            </div>


                            <div className="reward-line"></div>


                            <div className="reward-step">

                                <div className="step-number">
                                    02
                                </div>

                                <div>

                                    <strong>
                                        Earn points
                                    </strong>

                                    <p>
                                        Points are automatically
                                        added after eligible orders.
                                    </p>

                                </div>

                            </div>


                            <div className="reward-line"></div>


                            <div className="reward-step">

                                <div className="step-number">
                                    03
                                </div>

                                <div>

                                    <strong>
                                        Redeem at checkout
                                    </strong>

                                    <p>
                                        Apply your available
                                        points to reduce your bill.
                                    </p>

                                </div>

                            </div>

                        </div>

                    </div>


                    {/* =================================================
                        ACCOUNT SUMMARY
                    ================================================= */}

                    <div className="loyalty-summary-card">

                        <div className="section-heading">

                            <div>

                                <span>
                                    YOUR ACCOUNT
                                </span>

                                <h2>
                                    Rewards summary
                                </h2>

                            </div>

                        </div>


                        <div className="summary-tier-box">

                            <div className="summary-crown">
                                👑
                            </div>

                            <div>

                                <span>
                                    CURRENT TIER
                                </span>

                                <strong>
                                    {loyaltyAccount?.tier ||
                                        "MEMBER"}
                                </strong>

                            </div>

                        </div>


                        <div className="summary-row">

                            <span>
                                Available balance
                            </span>

                            <strong>
                                {availablePoints}
                                {" "}
                                pts
                            </strong>

                        </div>


                        <div className="summary-row">

                            <span>
                                Points earned
                            </span>

                            <strong className="summary-earned">
                                +{totalEarned}
                            </strong>

                        </div>


                        <div className="summary-row">

                            <span>
                                Points redeemed
                            </span>

                            <strong className="summary-redeemed">
                                -{totalRedeemed}
                            </strong>

                        </div>


                        <div className="summary-divider"></div>


                        <div className="summary-tip">

                            <span>
                                ✨
                            </span>

                            <p>
                                Keep shopping to earn more
                                points and unlock better rewards.
                            </p>

                        </div>

                    </div>

                </div>


                {/* =================================================
                    TRANSACTION HISTORY
                ================================================= */}

                <div className="transactions-card">

                    <div className="transactions-header">

                        <div>

                            <span className="transactions-eyebrow">
                                ACTIVITY
                            </span>

                            <h2>
                                Points History
                            </h2>

                            <p>
                                View all your loyalty
                                transactions.
                            </p>

                        </div>


                        <div className="transaction-count">

                            <strong>
                                {transactions.length}
                            </strong>

                            <span>
                                Transactions
                            </span>

                        </div>

                    </div>


                    {/* FILTERS */}

                    <div className="transaction-filters">

                        <button
                            className={
                                activeFilter === "ALL"
                                    ? "active"
                                    : ""
                            }
                            onClick={() =>
                                setActiveFilter(
                                    "ALL"
                                )
                            }
                        >
                            All Activity
                        </button>


                        <button
                            className={
                                activeFilter ===
                                "EARNED"
                                    ? "active"
                                    : ""
                            }
                            onClick={() =>
                                setActiveFilter(
                                    "EARNED"
                                )
                            }
                        >
                            ↗ Earned
                        </button>


                        <button
                            className={
                                activeFilter ===
                                "REDEEMED"
                                    ? "active"
                                    : ""
                            }
                            onClick={() =>
                                setActiveFilter(
                                    "REDEEMED"
                                )
                            }
                        >
                            ↘ Redeemed
                        </button>

                    </div>


                    {/* TRANSACTION LIST */}

                    {filteredTransactions.length >
                    0 ? (

                        <div className="transaction-list">

                            {filteredTransactions.map(
                                (
                                    transaction,
                                    index
                                ) => {

                                    const type =
                                        String(
                                            transaction.transactionType ||
                                                ""
                                        ).toUpperCase();


                                    const isEarned =
                                        type ===
                                        "EARNED";


                                    return (

                                        <div
                                            className="transaction-row"
                                            key={
                                                transaction.transactionId ??
                                                `${transaction.orderId}-${index}`
                                            }
                                            style={{
                                                animationDelay:
                                                    `${index * 60}ms`
                                            }}
                                        >

                                            {/* ICON */}

                                            <div
                                                className={
                                                    isEarned
                                                        ? "transaction-main-icon earned"
                                                        : "transaction-main-icon redeemed"
                                                }
                                            >
                                                {getTransactionIcon(
                                                    transaction.transactionType
                                                )}
                                            </div>


                                            {/* INFO */}

                                            <div className="transaction-main-info">

                                                <strong>
                                                    {getTransactionLabel(
                                                        transaction.transactionType
                                                    )}
                                                </strong>

                                                <span>
                                                    {transaction.description ||
                                                        "Loyalty points transaction"}
                                                </span>


                                                <div className="transaction-meta">

                                                    {transaction.orderId && (

                                                        <span>
                                                            Order #
                                                            {
                                                                transaction.orderId
                                                            }
                                                        </span>

                                                    )}

                                                    {transaction.createdAt && (

                                                        <span>
                                                            {formatDate(
                                                                transaction.createdAt
                                                            )}

                                                            {" "}
                                                            •{" "}

                                                            {formatTime(
                                                                transaction.createdAt
                                                            )}
                                                        </span>

                                                    )}

                                                </div>

                                            </div>


                                            {/* POINTS */}

                                            <div
                                                className={
                                                    isEarned
                                                        ? "transaction-value earned"
                                                        : "transaction-value redeemed"
                                                }
                                            >

                                                <strong>
                                                    {isEarned
                                                        ? "+"
                                                        : "-"}
                                                    {Number(
                                                        transaction.points ??
                                                            0
                                                    ).toLocaleString(
                                                        "en-IN"
                                                    )}
                                                </strong>

                                                <span>
                                                    points
                                                </span>

                                            </div>

                                        </div>
                                    );
                                }
                            )}

                        </div>

                    ) : (

                        /* =================================================
                           EMPTY TRANSACTIONS
                        ================================================= */

                        <div className="empty-transactions">

                            <div className="empty-transaction-icon">
                                🧾
                            </div>

                            <h3>
                                No transactions found
                            </h3>

                            <p>
                                {transactions.length === 0
                                    ? "Your loyalty activity will appear here once you earn or redeem points."
                                    : "There are no transactions for this filter."}
                            </p>

                            {activeFilter !==
                                "ALL" && (

                                <button
                                    onClick={() =>
                                        setActiveFilter(
                                            "ALL"
                                        )
                                    }
                                >
                                    View All Activity
                                </button>

                            )}

                        </div>

                    )}

                </div>


                {/* =================================================
                    FOOTER TIP
                ================================================= */}

                <div className="loyalty-footer-tip">

                    <div className="footer-tip-icon">
                        💚
                    </div>

                    <div>

                        <strong>
                            Make every purchase count
                        </strong>

                        <span>
                            Your ShopSmart loyalty points
                            are automatically tracked for you.
                        </span>

                    </div>

                </div>

            </div>

        </div>
    );
}


export default LoyaltyPage;