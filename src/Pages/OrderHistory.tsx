import { useEffect, useState } from "react";
import "../OrderHistory.css";

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

interface OrderHistoryProps {
    retailerId: number;
}

const SHOP_SERVICE = "http://localhost:8085/shopsmart/shop";
const ORDER_SERVICE = "http://localhost:8087/shopsmart/orders";

function getToken(): string | null {
    return localStorage.getItem("shopsmart_token");
}

function getHeaders(): HeadersInit {
    const token = getToken();

    return {
        "Content-Type": "application/json",
        ...(token
            ? {
                  Authorization: `Bearer ${token}`,
              }
            : {}),
    };
}

function getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
        return error.message;
    }

    return "Something went wrong. Please try again.";
}

function formatDate(dateString: string): string {
    if (!dateString) {
        return "N/A";
    }

    const date = new Date(dateString);

    if (Number.isNaN(date.getTime())) {
        return dateString;
    }

    return date.toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

function getStatusClass(status: string): string {
    const value = status?.toLowerCase();

    if (
        value === "completed" ||
        value === "delivered" ||
        value === "success" ||
        value === "confirmed"
    ) {
        return "history-status success";
    }

    if (
        value === "pending" ||
        value === "processing"
    ) {
        return "history-status pending";
    }

    if (
        value === "cancelled" ||
        value === "canceled" ||
        value === "failed"
    ) {
        return "history-status cancelled";
    }

    return "history-status";
}

export default function OrderHistory({
    retailerId,
}: OrderHistoryProps) {
    const [shops, setShops] = useState<Shop[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);

    const [loadingShops, setLoadingShops] = useState(true);
    const [loadingOrders, setLoadingOrders] = useState(false);

    const [error, setError] = useState("");
    const [selectedShopId, setSelectedShopId] = useState<number | "all">(
        "all"
    );

    // =====================================================
    // FETCH RETAILER SHOPS
    // =====================================================

    useEffect(() => {
        const fetchShops = async () => {
            try {
                setLoadingShops(true);
                setError("");

                const response = await fetch(
                    `${SHOP_SERVICE}/retailer/${retailerId}`,
                    {
                        headers: getHeaders(),
                    }
                );

                if (!response.ok) {
                    throw new Error(
                        `Unable to load shops (${response.status})`
                    );
                }

                const data = await response.json();

                let shopList: Shop[] = [];

                if (Array.isArray(data)) {
                    shopList = data;
                } else if (Array.isArray(data?.shops)) {
                    shopList = data.shops;
                } else if (Array.isArray(data?.data)) {
                    shopList = data.data;
                }

                setShops(shopList);
            } catch (err) {
                setError(getErrorMessage(err));
            } finally {
                setLoadingShops(false);
            }
        };

        fetchShops();
    }, [retailerId]);

    // =====================================================
    // FETCH ORDER HISTORY
    // =====================================================

    useEffect(() => {
        if (shops.length === 0) {
            setOrders([]);
            return;
        }

        const fetchOrderHistory = async () => {
            try {
                setLoadingOrders(true);
                setError("");

                let allOrders: Order[] = [];

                const shopsToFetch =
                    selectedShopId === "all"
                        ? shops
                        : shops.filter(
                              (shop) =>
                                  shop.shopId === selectedShopId
                          );

                for (const shop of shopsToFetch) {
                    const response = await fetch(
                        `${ORDER_SERVICE}/shop/${shop.shopId}/retailer/${retailerId}`,
                        {
                            headers: getHeaders(),
                        }
                    );

                    if (!response.ok) {
                        // Skip one shop if its endpoint has no orders.
                        if (response.status === 404) {
                            continue;
                        }

                        throw new Error(
                            `Unable to load orders for ${shop.shopName}`
                        );
                    }

                    const data = await response.json();

                    let shopOrders: Order[] = [];

                    if (Array.isArray(data)) {
                        shopOrders = data;
                    } else if (Array.isArray(data?.orders)) {
                        shopOrders = data.orders;
                    } else if (Array.isArray(data?.data)) {
                        shopOrders = data.data;
                    }

                    allOrders = [...allOrders, ...shopOrders];
                }

                // Newest orders first
                allOrders.sort((a, b) => {
                    return (
                        new Date(b.createdAt).getTime() -
                        new Date(a.createdAt).getTime()
                    );
                });

                setOrders(allOrders);
            } catch (err) {
                setError(getErrorMessage(err));
            } finally {
                setLoadingOrders(false);
            }
        };

        fetchOrderHistory();
    }, [shops, selectedShopId, retailerId]);

    // =====================================================
    // CALCULATIONS
    // =====================================================

    const totalOrders = orders.length;

    const totalSales = orders.reduce(
        (sum, order) => sum + Number(order.totalAmount || 0),
        0
    );

    const completedOrders = orders.filter((order) => {
        const status = order.status?.toLowerCase();

        return (
            status === "completed" ||
            status === "delivered" ||
            status === "success" ||
            status === "confirmed"
        );
    }).length;

    const pendingOrders = orders.filter((order) => {
        const status = order.status?.toLowerCase();

        return (
            status === "pending" ||
            status === "processing"
        );
    }).length;

    // =====================================================
    // RENDER
    // =====================================================

    return (
        <div className="order-history-page">

            {/* HEADER */}
            <div className="history-header">
                <div>
                    <div className="history-header-label">
                        RETAILER
                    </div>

                    <h1 className="history-title">
                        Order History
                    </h1>

                    <p className="history-subtitle">
                        View and track all orders from your shops
                    </p>
                </div>

                <div className="history-header-icon">
                    📋
                </div>
            </div>

            {/* SHOP FILTER */}
            <div className="history-filter-card">

                <div className="history-filter-left">
                    <div className="history-filter-icon">
                        🏪
                    </div>

                    <div>
                        <h3>Filter by Shop</h3>
                        <p>
                            Select a shop to view its order history
                        </p>
                    </div>
                </div>

                <select
                    className="history-shop-select"
                    value={selectedShopId}
                    onChange={(e) => {
                        const value = e.target.value;

                        setSelectedShopId(
                            value === "all"
                                ? "all"
                                : Number(value)
                        );
                    }}
                    disabled={
                        loadingShops || shops.length === 0
                    }
                >
                    <option value="all">
                        All Shops
                    </option>

                    {shops.map((shop) => (
                        <option
                            key={shop.shopId}
                            value={shop.shopId}
                        >
                            {shop.shopName}
                        </option>
                    ))}
                </select>
            </div>

            {/* ERROR */}
            {error && (
                <div className="history-error">
                    <div className="history-error-icon">
                        ⚠️
                    </div>

                    <div>
                        <h3>Unable to load order history</h3>
                        <p>{error}</p>
                    </div>
                </div>
            )}

            {/* LOADING SHOPS */}
            {loadingShops && (
                <div className="history-loading">
                    <div className="history-spinner"></div>
                    <p>Loading your shops...</p>
                </div>
            )}

            {/* SUMMARY */}
            {!loadingShops && (
                <div className="history-summary">

                    <div className="history-summary-card">
                        <div className="summary-card-icon">
                            📦
                        </div>

                        <div>
                            <span>Total Orders</span>
                            <strong>{totalOrders}</strong>
                        </div>
                    </div>

                    <div className="history-summary-card">
                        <div className="summary-card-icon">
                            💰
                        </div>

                        <div>
                            <span>Total Sales</span>
                            <strong>
                                ₹{totalSales.toFixed(2)}
                            </strong>
                        </div>
                    </div>

                    <div className="history-summary-card">
                        <div className="summary-card-icon">
                            ✅
                        </div>

                        <div>
                            <span>Completed</span>
                            <strong>{completedOrders}</strong>
                        </div>
                    </div>

                    <div className="history-summary-card">
                        <div className="summary-card-icon">
                            ⏳
                        </div>

                        <div>
                            <span>Pending</span>
                            <strong>{pendingOrders}</strong>
                        </div>
                    </div>

                </div>
            )}

            {/* ORDER HISTORY */}
            <section className="history-section">

                <div className="history-section-header">
                    <div>
                        <h2>All Orders</h2>
                        <p>
                            {orders.length} order
                            {orders.length !== 1 ? "s" : ""} found
                        </p>
                    </div>
                </div>

                {loadingOrders && (
                    <div className="history-loading">
                        <div className="history-spinner"></div>
                        <p>Loading order history...</p>
                    </div>
                )}

                {!loadingOrders &&
                    !loadingShops &&
                    shops.length === 0 && (
                        <div className="history-empty">
                            <div className="history-empty-icon">
                                🏪
                            </div>

                            <h3>No Shops Found</h3>

                            <p>
                                You don't have any shops associated
                                with your retailer account yet.
                            </p>
                        </div>
                    )}

                {!loadingOrders &&
                    shops.length > 0 &&
                    orders.length === 0 && (
                        <div className="history-empty">
                            <div className="history-empty-icon">
                                📦
                            </div>

                            <h3>No Orders Found</h3>

                            <p>
                                There are no orders in the selected
                                shop's history yet.
                            </p>
                        </div>
                    )}

                {!loadingOrders && orders.length > 0 && (
                    <div className="history-order-list">

                        {orders.map((order) => (
                            <div
                                className="history-order-card"
                                key={order.orderId}
                            >
                                {/* TOP */}
                                <div className="history-order-top">

                                    <div className="history-order-number">
                                        <div className="history-order-icon">
                                            📦
                                        </div>

                                        <div>
                                            <span>ORDER</span>
                                            <h3>
                                                #{order.orderId}
                                            </h3>
                                        </div>
                                    </div>

                                    <div
                                        className={getStatusClass(
                                            order.status
                                        )}
                                    >
                                        <span className="status-dot"></span>
                                        {order.status || "Unknown"}
                                    </div>
                                </div>

                                {/* DETAILS */}
                                <div className="history-order-details">

                                    <div className="history-detail">
                                        <span>Customer ID</span>
                                        <strong>
                                            #{order.customerId}
                                        </strong>
                                    </div>

                                    <div className="history-detail">
                                        <span>Shop ID</span>
                                        <strong>
                                            #{order.shopId}
                                        </strong>
                                    </div>

                                    <div className="history-detail">
                                        <span>Order Date</span>
                                        <strong>
                                            {formatDate(
                                                order.createdAt
                                            )}
                                        </strong>
                                    </div>

                                    <div className="history-detail">
                                        <span>Payment Method</span>
                                        <strong>
                                            {order.paymentMethod ||
                                                "N/A"}
                                        </strong>
                                    </div>

                                    <div className="history-detail">
                                        <span>Payment Status</span>
                                        <strong
                                            className="payment-status"
                                        >
                                            {order.paymentStatus ||
                                                "N/A"}
                                        </strong>
                                    </div>

                                    <div className="history-detail">
                                        <span>Loyalty Points</span>
                                        <strong>
                                            {order.loyaltyPointsEarned ??
                                                0}
                                        </strong>
                                    </div>

                                </div>

                                {/* FOOTER */}
                                <div className="history-order-footer">

                                    <span>Total Amount</span>

                                    <strong>
                                        ₹
                                        {Number(
                                            order.totalAmount || 0
                                        ).toFixed(2)}
                                    </strong>

                                </div>
                            </div>
                        ))}

                    </div>
                )}

            </section>
        </div>
    );
}