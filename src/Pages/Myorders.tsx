import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import "../Myorders.css";

// ============================================================
// API URLS
// ============================================================

const ORDER_SERVICE =
    "http://localhost:8087/shopsmart/orders";

const PRODUCT_SERVICE =
    "http://localhost:8082/shopsmart/product";
const CUSTOMER_SERVICE =
    "http://localhost:8086/customers";
const VOUCHER_URL="https://localhost:8092/voucher"

// ============================================================
// JWT
// ============================================================

interface JwtPayload {
    sub: string;
    role: string;
    userId?: number;
    retailerId?: number;
    exp: number;
}

interface Customer {
    address?: string | null;
}


// ============================================================
// ORDER
// ============================================================

interface Order {
    orderId: number;
    customerId: number;
    shopId: number;
    totalAmount: number;
    paymentMethod: string;
    paymentStatus: string;

    upiTransactionId?: string | null;

    deliveryAddress?: string | null;

    expectedDeliveryDate?: string | null;

    loyaltyPointsEarned?: number;

    loyaltyPointsRedeemed?: number;

    status: string;

    createdAt: string;
}


// ============================================================
// ORDER ITEM
// ============================================================

interface OrderItem {
    orderItemId: number;
    orderId: number;
    productId: number;
    quantity: number;
    priceAtPurchase: number;
}


// ============================================================
// PRODUCT
// ============================================================

interface Product {
    productId: number;
    productName: string;
    description?: string | null;

    imageUrl?: string | null;

    originalPrice?: number | null;
    discount?: number | null;

    stockLeft?: number | null;

    shopId?: number | null;

    category?: string | null;

    price?: number | null;
}


// ============================================================
// ORDER PRODUCT
// Combined frontend object
// ============================================================

interface OrderProduct {
    item: OrderItem;
    product: Product | null;
}


// ============================================================
// COMPONENT
// ============================================================

export function Myorders() {

    const [orders, setOrders] =
        useState<Order[]>([]);

    const [orderProducts, setOrderProducts] =
        useState<Record<number, OrderProduct[]>>({});

    const [loading, setLoading] =
        useState(true);

    const [refreshing, setRefreshing] =
        useState(false);

    const [error, setError] =
        useState("");

    const [customerAddress, setCustomerAddress] =
        useState<string>("");


    // ========================================================
    // FETCH PRODUCT DETAILS
    // ========================================================

    const fetchProductDetails = async (
        productId: number,
        token: string
    ): Promise<Product | null> => {

        try {

            const response =
                await axios.get<Product>(
                    `${PRODUCT_SERVICE}/${productId}`,
                    {
                        headers: {
                            Authorization:
                                `Bearer ${token}`,
                            Accept:
                                "application/json"
                        }
                    }
                );

            return response.data;

        } catch (error) {

            console.error(
                `Unable to fetch product ${productId}:`,
                error
            );

            return null;
        }
    };


    // ========================================================
    // FETCH ORDER ITEMS + PRODUCTS
    // ========================================================

    const fetchProductsForOrders = async (
        orderList: Order[],
        token: string
    ) => {

        if (
            !orderList ||
            orderList.length === 0
        ) {
            setOrderProducts({});
            return;
        }

        try {

            const result:
                Record<number, OrderProduct[]> = {};


            // ------------------------------------------------
            // Fetch items for every order
            // ------------------------------------------------

            await Promise.all(
                orderList.map(async (order) => {

                    try {

                        const itemResponse =
                            await axios.get<OrderItem[]>(
                                `${ORDER_SERVICE}/${order.orderId}/items`,
                                {
                                    headers: {
                                        Authorization:
                                            `Bearer ${token}`,
                                        Accept:
                                            "application/json"
                                    }
                                }
                            );

                        const items =
                            Array.isArray(
                                itemResponse.data
                            )
                                ? itemResponse.data
                                : [];


                        // ------------------------------------------------
                        // Fetch product information for each item
                        // ------------------------------------------------

                        const productResults =
                            await Promise.all(
                                items.map(
                                    async (item) => {

                                        const product =
                                            await fetchProductDetails(
                                                item.productId,
                                                token
                                            );

                                        return {
                                            item,
                                            product
                                        };
                                    }
                                )
                            );


                        result[order.orderId] =
                            productResults;

                    } catch (itemError) {

                        console.error(
                            `Unable to fetch items for order ${order.orderId}:`,
                            itemError
                        );

                        result[order.orderId] = [];
                    }
                })
            );


            setOrderProducts(result);

        } catch (error) {

            console.error(
                "Error loading order products:",
                error
            );
        }
    };


    // ========================================================
    // FETCH CUSTOMER ADDRESS
    // ========================================================

    const fetchCustomerAddress = async (
        customerId: number,
        token: string
    ) => {
        try {
            const response =
                await axios.get<Customer>(
                    `${CUSTOMER_SERVICE}/${customerId}`,
                    {
                        headers: {
                            Authorization:
                                `Bearer ${token}`,
                            Accept:
                                "application/json"
                        }
                    }
                );

            const address =
                typeof response.data?.address === "string"
                    ? response.data.address.trim()
                    : "";

            setCustomerAddress(address);

            console.log(
                "Customer address:",
                address
            );
        } catch (error) {
            console.error(
                "Unable to fetch customer address:",
                error
            );

            setCustomerAddress("");
        }
    };


    // ========================================================
    // FETCH ORDERS
    // ========================================================

    const fetchOrders = useCallback(
        async (isRefresh = false) => {

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
                        "Please login to view your orders."
                    );

                    return;
                }


                // ------------------------------------------------
                // DECODE JWT
                // ------------------------------------------------

                let decoded: JwtPayload;

                try {

                    decoded =
                        jwtDecode<JwtPayload>(
                            token
                        );

                } catch {

                    localStorage.removeItem(
                        "shopsmart_token"
                    );

                    setError(
                        "Your session is invalid. Please login again."
                    );

                    return;
                }


                // ------------------------------------------------
                // TOKEN EXPIRY
                // ------------------------------------------------

                if (
                    decoded.exp &&
                    decoded.exp <=
                        Math.floor(
                            Date.now() / 1000
                        )
                ) {

                    localStorage.removeItem(
                        "shopsmart_token"
                    );

                    setError(
                        "Your session has expired. Please login again."
                    );

                    return;
                }


                // ------------------------------------------------
                // CUSTOMER ID
                // ------------------------------------------------

                const userId =
                    Number(decoded.userId);


                if (
                    !Number.isFinite(userId) ||
                    userId <= 0
                ) {

                    setError(
                        "Customer information not found."
                    );

                    return;
                }


                console.log(
                    "Fetching orders for customer:",
                    userId
                );

                // ------------------------------------------------
                // GET CUSTOMER ADDRESS
                // ------------------------------------------------

                await fetchCustomerAddress(
                    userId,
                    token
                );


                // ------------------------------------------------
                // GET ORDERS
                // ------------------------------------------------

                const response =
                    await axios.get<Order[]>(
                        `${ORDER_SERVICE}/customer/${userId}`,
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
                    "Customer orders response:",
                    response.status,
                    response.data
                );


                const orderList =
                    Array.isArray(response.data)
                        ? response.data
                        : [];


                setOrders(orderList);


                // ------------------------------------------------
                // GET PRODUCTS FOR ORDERS
                // ------------------------------------------------

                await fetchProductsForOrders(
                    orderList,
                    token
                );

            } catch (error) {

                console.error(
                    "Error fetching customer orders:",
                    error
                );


                if (
                    axios.isAxiosError(error)
                ) {

                    if (
                        error.response?.status ===
                            401 ||
                        error.response?.status ===
                            403
                    ) {

                        setError(
                            "You are not authorized to view your orders. Please login again."
                        );

                    } else if (
                        error.response?.data
                    ) {

                        const serverMessage =
                            typeof error.response.data ===
                            "string"
                                ? error.response.data
                                : error.response.data
                                      ?.message;

                        setError(
                            serverMessage ||
                                "Unable to load your orders. Please try again."
                        );

                    } else {

                        setError(
                            "Unable to load your orders. Please try again."
                        );
                    }

                } else {

                    setError(
                        "Unable to load your orders. Please try again."
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

        fetchOrders();

    }, [fetchOrders]);


    // ========================================================
    // FORMAT DATE
    // ========================================================

    const formatDate = (
        date?: string | null
    ): string => {

        if (!date) {
            return "Not set";
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
        date?: string | null
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
    // STATUS CLASS
    // ========================================================

    const getStatusClass = (
        status?: string
    ): string => {

        const normalized =
            String(status || "")
                .toLowerCase()
                .replace(/\s+/g, "-");


        if (
            normalized.includes("deliver") ||
            normalized.includes("complete")
        ) {

            return "status-delivered";
        }


        if (
            normalized.includes("cancel")
        ) {

            return "status-cancelled";
        }


        if (
            normalized.includes("ship")
        ) {

            return "status-shipped";
        }


        if (
            normalized.includes("process") ||
            normalized.includes("confirm") ||
            normalized.includes("pending") ||
            normalized.includes("placed")
        ) {

            return "status-processing";
        }


        return "status-default";
    };


    // ========================================================
    // PAYMENT STATUS CLASS
    // ========================================================

    const getPaymentStatusClass = (
        paymentStatus?: string
    ): string => {

        const normalized =
            String(paymentStatus || "")
                .toLowerCase();


        if (
            normalized.includes("paid") ||
            normalized.includes("success") ||
            normalized.includes("complete")
        ) {

            return "status-delivered";
        }


        if (
            normalized.includes("pending")
        ) {

            return "status-processing";
        }


        if (
            normalized.includes("fail") ||
            normalized.includes("cancel")
        ) {

            return "status-cancelled";
        }


        return "status-default";
    };


    // ========================================================
    // PRODUCT INITIAL
    // ========================================================

    const getProductInitial = (
        productName?: string
    ): string => {

        if (
            !productName ||
            productName.trim().length === 0
        ) {

            return "S";
        }

        return productName
            .trim()
            .charAt(0)
            .toUpperCase();
    };


    // ========================================================
    // PRODUCT PRICE
    // ========================================================

    const getProductFinalPrice = (
        product?: Product | null
    ): number => {

        if (!product) {
            return 0;
        }


        // Backend returns calculated price
        // through Product.getPrice()

        if (
            product.price !== undefined &&
            product.price !== null
        ) {

            return Number(product.price);
        }


        const originalPrice =
            Number(
                product.originalPrice ?? 0
            );

        const discount =
            Number(
                product.discount ?? 0
            );

        const finalPrice =
            originalPrice -
            (
                originalPrice *
                discount /
                100
            );


        return Math.round(
            finalPrice * 100
        ) / 100;
    };


    // ========================================================
    // LOADING
    // ========================================================

    if (loading) {

        return (
            <div className="my-orders-page">

                <div className="orders-container">

                    <div className="orders-header">

                        <div>

                            <div className="skeleton-title"></div>

                            <div className="skeleton-subtitle"></div>

                        </div>

                    </div>


                    <div className="orders-loading">

                        <div className="loading-orbit">

                            <div className="loading-ring"></div>

                            <span>🛍️</span>

                        </div>

                        <h3>
                            Loading your orders...
                        </h3>

                        <p>
                            We're getting your latest
                            purchases ready.
                        </p>

                    </div>


                    <div className="skeleton-grid">

                        {[1, 2, 3].map(
                            (item) => (

                                <div
                                    className="order-skeleton"
                                    key={item}
                                >

                                    <div className="skeleton-row">

                                        <div className="skeleton-box small"></div>

                                        <div className="skeleton-box status"></div>

                                    </div>

                                    <div className="skeleton-box medium"></div>

                                    <div className="skeleton-box large"></div>

                                    <div className="skeleton-box medium"></div>

                                </div>
                            )
                        )}

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
            <div className="my-orders-page">

                <div className="orders-container">

                    <div className="orders-header">

                        <div>

                            <span className="orders-eyebrow">
                                SHOPSMART
                            </span>

                            <h1>
                                My Orders
                            </h1>

                            <p>
                                Track and manage your
                                ShopSmart purchases
                            </p>

                        </div>

                    </div>


                    <div className="orders-error">

                        <div className="error-icon">
                            ⚠️
                        </div>

                        <h2>
                            Something went wrong
                        </h2>

                        <p>
                            {error}
                        </p>

                        <button
                            className="retry-button"
                            onClick={() =>
                                fetchOrders()
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
    // EMPTY ORDERS
    // ========================================================

    if (orders.length === 0) {

        return (
            <div className="my-orders-page">

                <div className="orders-container">

                    <div className="orders-header">

                        <div>

                            <span className="orders-eyebrow">
                                SHOPSMART
                            </span>

                            <h1>
                                My Orders
                            </h1>

                            <p>
                                Track and manage your
                                purchases
                            </p>

                        </div>


                        <button
                            className="retry-button"
                            onClick={() =>
                                fetchOrders(true)
                            }
                            disabled={refreshing}
                        >
                            {refreshing
                                ? "Refreshing..."
                                : "↻ Refresh"}
                        </button>

                    </div>


                    <div className="empty-orders">

                        <div className="empty-icon">
                            🛍️
                        </div>

                        <h2>
                            No orders yet
                        </h2>

                        <p>
                            You haven't placed any
                            orders yet. Start shopping
                            and your purchases will
                            appear here.
                        </p>

                        <button
                            className="shop-now-button"
                            onClick={() =>
                                window.location.href =
                                    "/"
                            }
                        >
                            Start Shopping
                            <span>→</span>
                        </button>

                    </div>

                </div>

            </div>
        );
    }


    // ========================================================
    // MAIN ORDERS PAGE
    // ========================================================

    return (
        <div className="my-orders-page">

            <div className="orders-container">

                {/* =================================================
                    HEADER
                ================================================= */}

                <div className="orders-header">

                    <div>

                        <span className="orders-eyebrow">
                            SHOPSMART
                        </span>

                        <h1>
                            My Orders
                        </h1>

                        <p>
                            Track and manage your
                            purchases
                        </p>

                    </div>


                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "12px"
                        }}
                    >

                        <button
                            className="retry-button"
                            onClick={() =>
                                fetchOrders(true)
                            }
                            disabled={refreshing}
                        >
                            {refreshing
                                ? "Refreshing..."
                                : "↻ Refresh"}
                        </button>


                        <div className="orders-count">

                            <span className="count-number">
                                {orders.length}
                            </span>

                            <span className="count-label">
                                {orders.length === 1
                                    ? "Order"
                                    : "Orders"}
                            </span>

                        </div>

                    </div>

                </div>


                {/* =================================================
                    ORDER LIST
                ================================================= */}

                <div className="orders-list">

                    {orders.map(
                        (order, index) => {

                            const status =
                                order.status ||
                                "PLACED";


                            const isUpi =
                                String(
                                    order.paymentMethod ||
                                    ""
                                ).toUpperCase() ===
                                "UPI";


                            const products =
                                orderProducts[
                                    order.orderId
                                ] || [];


                            return (

                                <div
                                    className="order-card"
                                    key={order.orderId}
                                    style={{
                                        animationDelay:
                                            `${index * 80}ms`
                                    }}
                                >

                                    {/* =================================================
                                        TOP
                                    ================================================= */}

                                    <div className="order-card-top">

                                        <div className="order-id-section">

                                            <div className="order-icon">
                                                📦
                                            </div>

                                            <div>

                                                <span className="order-label">
                                                    ORDER
                                                </span>

                                                <h3>
                                                    #{order.orderId}
                                                </h3>

                                            </div>

                                        </div>


                                        <span
                                            className={`order-status ${getStatusClass(
                                                status
                                            )}`}
                                        >

                                            <span className="status-dot"></span>

                                            {status}

                                        </span>

                                    </div>


                                    {/* =================================================
                                        DIVIDER
                                    ================================================= */}

                                    <div className="order-divider"></div>


                                    {/* =================================================
                                        BASIC DETAILS
                                    ================================================= */}

                                    <div className="order-details">

                                        <div className="order-detail">

                                            <div className="detail-icon">
                                                📅
                                            </div>

                                            <div>

                                                <span>
                                                    ORDER DATE
                                                </span>

                                                <strong>
                                                    {formatDate(
                                                        order.createdAt
                                                    )}
                                                </strong>

                                            </div>

                                        </div>


                                        <div className="order-detail">

                                            <div className="detail-icon">
                                                🕐
                                            </div>

                                            <div>

                                                <span>
                                                    TIME
                                                </span>

                                                <strong>
                                                    {formatTime(
                                                        order.createdAt
                                                    ) ||
                                                        "—"}
                                                </strong>

                                            </div>

                                        </div>


                                        <div className="order-detail amount-detail">

                                            <div className="detail-icon">
                                                💰
                                            </div>

                                            <div>

                                                <span>
                                                    TOTAL AMOUNT
                                                </span>

                                                <strong>
                                                    ₹
                                                    {Number(
                                                        order.totalAmount ||
                                                            0
                                                    ).toLocaleString(
                                                        "en-IN",
                                                        {
                                                            minimumFractionDigits:
                                                                2,
                                                            maximumFractionDigits:
                                                                2
                                                        }
                                                    )}
                                                </strong>

                                            </div>

                                        </div>

                                    </div>


                                    {/* =================================================
                                        PRODUCTS
                                    ================================================= */}

                                    <div
                                        style={{
                                            marginTop:
                                                "18px",
                                            padding:
                                                "18px",
                                            borderRadius:
                                                "14px",
                                            background:
                                                "#ffffff",
                                            border:
                                                "1px solid #e2e8f0"
                                        }}
                                    >

                                        <div
                                            style={{
                                                fontSize:
                                                    "11px",
                                                fontWeight:
                                                    800,
                                                letterSpacing:
                                                    "1px",
                                                color:
                                                    "#64748b",
                                                marginBottom:
                                                    "14px"
                                            }}
                                        >
                                            ORDER ITEMS
                                        </div>


                                        {products.length ===
                                        0 ? (

                                            <div
                                                style={{
                                                    padding:
                                                        "14px",
                                                    borderRadius:
                                                        "10px",
                                                    background:
                                                        "#f8fafc",
                                                    color:
                                                        "#64748b",
                                                    fontSize:
                                                        "14px"
                                                }}
                                            >
                                                Product details
                                                are loading or
                                                unavailable.
                                            </div>

                                        ) : (

                                            <div
                                                style={{
                                                    display:
                                                        "flex",
                                                    flexDirection:
                                                        "column",
                                                    gap:
                                                        "12px"
                                                }}
                                            >

                                                {products.map(
                                                    ({
                                                        item,
                                                        product
                                                    }) => {

                                                        const finalPrice =
                                                            getProductFinalPrice(
                                                                product
                                                            );


                                                        const quantity =
                                                            Number(
                                                                item.quantity ||
                                                                    0
                                                            );


                                                        const productTotal =
                                                            finalPrice *
                                                            quantity;


                                                        const discount =
                                                            Number(
                                                                product?.discount ??
                                                                    0
                                                            );


                                                        const originalPrice =
                                                            Number(
                                                                product?.originalPrice ??
                                                                    0
                                                            );


                                                        return (

                                                            <div
                                                                key={
                                                                    item.orderItemId
                                                                }
                                                                style={{
                                                                    display:
                                                                        "flex",
                                                                    alignItems:
                                                                        "center",
                                                                    gap:
                                                                        "16px",
                                                                    padding:
                                                                        "12px",
                                                                    borderRadius:
                                                                        "12px",
                                                                    background:
                                                                        "#f8fafc",
                                                                    border:
                                                                        "1px solid #e2e8f0"
                                                                }}
                                                            >

                                                                {/* PRODUCT IMAGE */}

                                                                <div
                                                                    style={{
                                                                        width:
                                                                            "78px",
                                                                        height:
                                                                            "78px",
                                                                        minWidth:
                                                                            "78px",
                                                                        borderRadius:
                                                                            "10px",
                                                                        overflow:
                                                                            "hidden",
                                                                        background:
                                                                            "#e2e8f0",
                                                                        display:
                                                                            "flex",
                                                                        alignItems:
                                                                            "center",
                                                                        justifyContent:
                                                                            "center",
                                                                        position:
                                                                            "relative"
                                                                    }}
                                                                >

                                                                    {product?.imageUrl ? (

                                                                        <img
                                                                            src={
                                                                                product.imageUrl
                                                                            }
                                                                            alt={
                                                                                product.productName ||
                                                                                "Product"
                                                                            }
                                                                            style={{
                                                                                width:
                                                                                    "100%",
                                                                                height:
                                                                                    "100%",
                                                                                objectFit:
                                                                                    "cover"
                                                                            }}
                                                                            onError={(
                                                                                event
                                                                            ) => {

                                                                                const target =
                                                                                    event.currentTarget;

                                                                                target.style.display =
                                                                                    "none";

                                                                                const fallback =
                                                                                    target.parentElement
                                                                                        ?.querySelector(
                                                                                            ".order-product-fallback"
                                                                                        ) as HTMLElement | null;

                                                                                if (
                                                                                    fallback
                                                                                ) {

                                                                                    fallback.style.display =
                                                                                        "flex";
                                                                                }
                                                                            }}
                                                                        />

                                                                    ) : null}


                                                                    <div
                                                                        className="order-product-fallback"
                                                                        style={{
                                                                            display:
                                                                                product?.imageUrl
                                                                                    ? "none"
                                                                                    : "flex",
                                                                            position:
                                                                                "absolute",
                                                                            inset:
                                                                                0,
                                                                            alignItems:
                                                                                "center",
                                                                            justifyContent:
                                                                                "center",
                                                                            fontSize:
                                                                                "28px",
                                                                            fontWeight:
                                                                                800,
                                                                            color:
                                                                                "#0f766e",
                                                                            background:
                                                                                "#ccfbf1"
                                                                        }}
                                                                    >
                                                                        {getProductInitial(
                                                                            product?.productName
                                                                        )}
                                                                    </div>

                                                                </div>


                                                                {/* PRODUCT DETAILS */}

                                                                <div
                                                                    style={{
                                                                        flex:
                                                                            1,
                                                                        minWidth:
                                                                            0
                                                                    }}
                                                                >

                                                                    <h4
                                                                        style={{
                                                                            margin:
                                                                                "0 0 5px",
                                                                            fontSize:
                                                                                "16px",
                                                                            fontWeight:
                                                                                750,
                                                                            color:
                                                                                "#0f172a"
                                                                        }}
                                                                    >
                                                                        {product?.productName ||
                                                                            `Product #${item.productId}`}
                                                                    </h4>


                                                                    {product?.description && (

                                                                        <p
                                                                            style={{
                                                                                margin:
                                                                                    "0 0 8px",
                                                                                fontSize:
                                                                                    "13px",
                                                                                lineHeight:
                                                                                    1.5,
                                                                                color:
                                                                                    "#64748b",
                                                                                display:
                                                                                    "-webkit-box",
                                                                                WebkitLineClamp:
                                                                                    2,
                                                                                WebkitBoxOrient:
                                                                                    "vertical",
                                                                                overflow:
                                                                                    "hidden"
                                                                            }}
                                                                        >
                                                                            {
                                                                                product.description
                                                                            }
                                                                        </p>

                                                                    )}


                                                                    <div
                                                                        style={{
                                                                            display:
                                                                                "flex",
                                                                            alignItems:
                                                                                "center",
                                                                            gap:
                                                                                "10px",
                                                                            flexWrap:
                                                                                "wrap"
                                                                        }}
                                                                    >

                                                                        {product?.category && (

                                                                            <span
                                                                                style={{
                                                                                    padding:
                                                                                        "4px 8px",
                                                                                    borderRadius:
                                                                                        "6px",
                                                                                    background:
                                                                                        "#e0f2fe",
                                                                                    color:
                                                                                        "#0369a1",
                                                                                    fontSize:
                                                                                        "11px",
                                                                                    fontWeight:
                                                                                        700
                                                                                }}
                                                                            >
                                                                                {
                                                                                    product.category
                                                                                }
                                                                            </span>

                                                                        )}


                                                                        <span
                                                                            style={{
                                                                                fontSize:
                                                                                    "12px",
                                                                                color:
                                                                                    "#64748b",
                                                                                fontWeight:
                                                                                    600
                                                                            }}
                                                                        >
                                                                            Qty:
                                                                            {" "}
                                                                            {quantity}
                                                                        </span>

                                                                    </div>

                                                                </div>


                                                                {/* PRODUCT PRICE */}

                                                                <div
                                                                    style={{
                                                                        minWidth:
                                                                            "100px",
                                                                        textAlign:
                                                                            "right"
                                                                    }}
                                                                >

                                                                    {discount >
                                                                        0 &&
                                                                        originalPrice >
                                                                            0 && (

                                                                            <div
                                                                                style={{
                                                                                    fontSize:
                                                                                        "12px",
                                                                                    color:
                                                                                        "#94a3b8",
                                                                                    textDecoration:
                                                                                        "line-through",
                                                                                    marginBottom:
                                                                                        "2px"
                                                                                }}
                                                                            >
                                                                                ₹
                                                                                {originalPrice.toLocaleString(
                                                                                    "en-IN",
                                                                                    {
                                                                                        minimumFractionDigits:
                                                                                            2,
                                                                                        maximumFractionDigits:
                                                                                            2
                                                                                    }
                                                                                )}
                                                                            </div>

                                                                        )}


                                                                    <strong
                                                                        style={{
                                                                            display:
                                                                                "block",
                                                                            fontSize:
                                                                                "16px",
                                                                            color:
                                                                                "#0f766e"
                                                                        }}
                                                                    >
                                                                        ₹
                                                                        {productTotal.toLocaleString(
                                                                            "en-IN",
                                                                            {
                                                                                minimumFractionDigits:
                                                                                    2,
                                                                                maximumFractionDigits:
                                                                                    2
                                                                            }
                                                                        )}
                                                                    </strong>


                                                                    {discount >
                                                                        0 && (

                                                                        <small
                                                                            style={{
                                                                                display:
                                                                                    "inline-block",
                                                                                marginTop:
                                                                                    "3px",
                                                                                color:
                                                                                    "#16a34a",
                                                                                fontWeight:
                                                                                    700,
                                                                                fontSize:
                                                                                    "11px"
                                                                            }}
                                                                        >
                                                                            {
                                                                                discount
                                                                            }%
                                                                            {" "}
                                                                            OFF
                                                                        </small>

                                                                    )}

                                                                </div>

                                                            </div>
                                                        );
                                                    }
                                                )}

                                            </div>
                                        )}

                                    </div>


                                    {/* =================================================
                                        PAYMENT INFORMATION
                                    ================================================= */}

                                    <div
                                        style={{
                                            marginTop:
                                                "18px",
                                            padding:
                                                "16px",
                                            borderRadius:
                                                "12px",
                                            background:
                                                "#f8fafc",
                                            border:
                                                "1px solid #e2e8f0"
                                        }}
                                    >

                                        <div
                                            style={{
                                                fontSize:
                                                    "11px",
                                                fontWeight:
                                                    800,
                                                letterSpacing:
                                                    "1px",
                                                color:
                                                    "#64748b",
                                                marginBottom:
                                                    "12px"
                                            }}
                                        >
                                            PAYMENT INFORMATION
                                        </div>


                                        <div
                                            style={{
                                                display:
                                                    "grid",
                                                gridTemplateColumns:
                                                    "repeat(auto-fit, minmax(180px, 1fr))",
                                                gap:
                                                    "14px"
                                            }}
                                        >

                                            <div>

                                                <span
                                                    style={{
                                                        display:
                                                            "block",
                                                        fontSize:
                                                            "11px",
                                                        fontWeight:
                                                            700,
                                                        color:
                                                            "#64748b",
                                                        marginBottom:
                                                            "4px"
                                                    }}
                                                >
                                                    PAYMENT METHOD
                                                </span>

                                                <strong>
                                                    {order.paymentMethod ||
                                                        "—"}
                                                </strong>

                                            </div>


                                            <div>

                                                <span
                                                    style={{
                                                        display:
                                                            "block",
                                                        fontSize:
                                                            "11px",
                                                        fontWeight:
                                                            700,
                                                        color:
                                                            "#64748b",
                                                        marginBottom:
                                                            "4px"
                                                    }}
                                                >
                                                    PAYMENT STATUS
                                                </span>

                                                <strong
                                                    className={getPaymentStatusClass(
                                                        order.paymentStatus
                                                    )}
                                                >
                                                    {order.paymentStatus ||
                                                        "—"}
                                                </strong>

                                            </div>


                                            {isUpi && (

                                                <div>

                                                    <span
                                                        style={{
                                                            display:
                                                                "block",
                                                            fontSize:
                                                                "11px",
                                                            fontWeight:
                                                                700,
                                                            color:
                                                                "#64748b",
                                                            marginBottom:
                                                                "4px"
                                                        }}
                                                    >
                                                        UPI TRANSACTION ID
                                                    </span>

                                                    <strong
                                                        style={{
                                                            wordBreak:
                                                                "break-all"
                                                        }}
                                                    >
                                                        {order.upiTransactionId ||
                                                            "Not available"}
                                                    </strong>

                                                </div>

                                            )}

                                        </div>

                                    </div>


                                    {/* =================================================
                                        DELIVERY INFORMATION
                                    ================================================= */}

                                    <div
                                        style={{
                                            marginTop:
                                                "14px",
                                            padding:
                                                "16px",
                                            borderRadius:
                                                "12px",
                                            background:
                                                "#f8fafc",
                                            border:
                                                "1px solid #e2e8f0"
                                        }}
                                    >

                                        <div
                                            style={{
                                                fontSize:
                                                    "11px",
                                                fontWeight:
                                                    800,
                                                letterSpacing:
                                                    "1px",
                                                color:
                                                    "#64748b",
                                                marginBottom:
                                                    "12px"
                                            }}
                                        >
                                            DELIVERY INFORMATION
                                        </div>


                                        <div
                                            style={{
                                                display:
                                                    "grid",
                                                gridTemplateColumns:
                                                    "repeat(auto-fit, minmax(220px, 1fr))",
                                                gap:
                                                    "16px"
                                            }}
                                        >

                                            <div>

                                                <span
                                                    style={{
                                                        display:
                                                            "block",
                                                        fontSize:
                                                            "11px",
                                                        fontWeight:
                                                            700,
                                                        color:
                                                            "#64748b",
                                                        marginBottom:
                                                            "5px"
                                                    }}
                                                >
                                                    📍 DELIVERY ADDRESS
                                                </span>

                                                <strong
                                                    style={{
                                                        display:
                                                            "block",
                                                        lineHeight:
                                                            1.5,
                                                        color:
                                                            "#334155",
                                                        wordBreak:
                                                            "break-word"
                                                    }}
                                                >
                                                    {order.deliveryAddress ||
                                                        customerAddress ||
                                                        "Address not available"}
                                                </strong>

                                            </div>


                                            <div>

                                                <span
                                                    style={{
                                                        display:
                                                            "block",
                                                        fontSize:
                                                            "11px",
                                                        fontWeight:
                                                            700,
                                                        color:
                                                            "#64748b",
                                                        marginBottom:
                                                            "5px"
                                                    }}
                                                >
                                                    🚚 EXPECTED DELIVERY
                                                </span>

                                                <strong
                                                    style={{
                                                        display:
                                                            "block",
                                                        color:
                                                            order.expectedDeliveryDate
                                                                ? "#0f766e"
                                                                : "#64748b"
                                                    }}
                                                >
                                                    {order.expectedDeliveryDate
                                                        ? formatDate(
                                                              order.expectedDeliveryDate
                                                          )
                                                        : "Not updated yet"}
                                                </strong>

                                            </div>

                                        </div>

                                    </div>


                                    {/* =================================================
                                        LOYALTY INFORMATION
                                    ================================================= */}

                                    {(
                                        order.loyaltyPointsEarned !==
                                            undefined ||
                                        order.loyaltyPointsRedeemed !==
                                            undefined
                                    ) && (

                                        <div
                                            style={{
                                                marginTop:
                                                    "14px",
                                                padding:
                                                    "14px 16px",
                                                borderRadius:
                                                    "12px",
                                                background:
                                                    "#fffbeb",
                                                border:
                                                    "1px solid #fde68a",
                                                display:
                                                    "flex",
                                                gap:
                                                    "18px",
                                                flexWrap:
                                                    "wrap"
                                            }}
                                        >

                                            {order.loyaltyPointsEarned !==
                                                undefined && (

                                                <span>
                                                    ⭐ Earned:
                                                    {" "}
                                                    <strong>
                                                        {
                                                            order.loyaltyPointsEarned
                                                        }
                                                    </strong>
                                                </span>

                                            )}


                                            {order.loyaltyPointsRedeemed !==
                                                undefined && (

                                                <span>
                                                    🎁 Redeemed:
                                                    {" "}
                                                    <strong>
                                                        {
                                                            order.loyaltyPointsRedeemed
                                                        }
                                                    </strong>
                                                </span>

                                            )}

                                        </div>

                                    )}


                                    {/* =================================================
                                        FOOTER
                                    ================================================= */}

                                    <div className="order-card-footer">

                                        <div className="order-protection">

                                            <span>
                                                ✓
                                            </span>

                                            ShopSmart Order

                                        </div>


                                        <div className="order-status-text">

                                            {status
                                                .toLowerCase()
                                                .includes(
                                                    "deliver"
                                                )

                                                ? "Your order has been delivered"

                                                : status
                                                      .toLowerCase()
                                                      .includes(
                                                          "cancel"
                                                      )

                                                ? "This order was cancelled"

                                                : order.expectedDeliveryDate

                                                ? `Expected delivery: ${formatDate(
                                                      order.expectedDeliveryDate
                                                  )}`

                                                : "Your order is being processed"}

                                        </div>

                                    </div>

                                </div>
                            );
                        }
                    )}

                </div>

            </div>

        </div>
    );
}


export default Myorders;