import React, { useEffect, useState } from "react";
import "../OrderContent.css";

interface Shop {
    shopId: number;
    shopName: string;
    address?: string;
    ownerId?: number;
    status?: string;
}

interface Customer {
    address?: string | null;
    deliveryAddress?: string | null;
    phoneNumber?: string | null;
    phone?: string | null;
    mobileNumber?: string | null;
}

interface OrderItem {
    productId?: number;
    quantity?: number;
}

interface Product {
    productId: number;
    productName: string;
}

interface Order {
    orderId: number;
    customerId: number;
    shopId: number;
    totalAmount: number;
    productName?: string | null;
    productId?: number | null;
    items?: OrderItem[];
    orderItems?: OrderItem[];
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

interface OrdersContentProps {
    retailerId: number;
}

const SHOP_SERVICE =
    "http://localhost:8085/shopsmart/shop";

const ORDER_SERVICE =
    "http://localhost:8087/shopsmart/orders";
const CUSTOMER_URL =
    "http://localhost:8086/customers";

const PRODUCT_URL =
    "http://localhost:8082/shopsmart/product";

const OrdersContent: React.FC<OrdersContentProps> = ({
    retailerId
}) => {

    const [shops, setShops] = useState<Shop[]>([]);
    const [selectedShopId, setSelectedShopId] =
        useState<number | null>(null);

    const [orders, setOrders] = useState<Order[]>([]);

    const [loadingShops, setLoadingShops] =
        useState<boolean>(true);

    const [loadingOrders, setLoadingOrders] =
        useState<boolean>(false);

    const [error, setError] =
        useState<string>("");

    const [updatingOrderId, setUpdatingOrderId] =
        useState<number | null>(null);

    const [deliveryDates, setDeliveryDates] =
        useState<Record<number, string>>({});

    const [customerDetails, setCustomerDetails] =
        useState<Record<number, Customer>>({});

    const [productNames, setProductNames] =
        useState<Record<number, string>>({});

    // =========================================
    // GET JWT TOKEN
    // =========================================

    const getToken = (): string | null => {
        return localStorage.getItem("shopsmart_token");
    };

    // =========================================
    // FETCH CUSTOMER DETAILS
    // =========================================

    const fetchCustomerDetails = async (
        customerId: number,
        token: string
    ): Promise<Customer | null> => {
        try {
            const response = await fetch(
                `${CUSTOMER_URL}/${customerId}`,
                {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        Accept: "application/json"
                    }
                }
            );

            if (!response.ok) {
                console.error(
                    "Customer Service error:",
                    response.status,
                    await response.text()
                );
                return null;
            }

            return await response.json();
        } catch (err) {
            console.error(
                `Unable to fetch customer ${customerId}:`,
                err
            );
            return null;
        }
    };

    // =========================================
    // FETCH PRODUCT NAME
    // =========================================

    const fetchProductName = async (
        productId: number,
        token: string
    ): Promise<string | null> => {
        try {
            const response = await fetch(
                `${PRODUCT_URL}/${productId}`,
                {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        Accept: "application/json"
                    }
                }
            );

            if (!response.ok) {
                console.error(
                    "Product Service error:",
                    response.status,
                    await response.text()
                );
                return null;
            }

            const product: Product =
                await response.json();

            return product?.productName || null;
        } catch (err) {
            console.error(
                `Unable to fetch product ${productId}:`,
                err
            );
            return null;
        }
    };

    // =========================================
    // FETCH RETAILER SHOPS
    // =========================================

    useEffect(() => {

        if (!retailerId) {
            setLoadingShops(false);
            setError("Retailer information is missing.");
            return;
        }

        const token = getToken();

        if (!token) {
            setLoadingShops(false);
            setError(
                "Your session has expired. Please login again."
            );
            return;
        }

        let cancelled = false;

        const fetchRetailerShops = async () => {

            try {

                setLoadingShops(true);
                setError("");

                console.log(
                    "Fetching shops for retailer:",
                    retailerId
                );

                const response = await fetch(
                    `${SHOP_SERVICE}/retailer/${retailerId}`,
                    {
                        method: "GET",
                        headers: {
                            Authorization: `Bearer ${token}`,
                            Accept: "application/json"
                        }
                    }
                );

                console.log(
                    "Shop Service response:",
                    response.status
                );

                if (!response.ok) {

                    const errorText =
                        await response.text();

                    console.error(
                        "Shop Service error:",
                        response.status,
                        errorText
                    );

                    if (
                        response.status === 401 ||
                        response.status === 403
                    ) {
                        throw new Error(
                            "You are not authorized to access your shops."
                        );
                    }

                    throw new Error(
                        `Unable to fetch shops (${response.status}).`
                    );
                }

                const data =
                    await response.json();

                console.log(
                    "Retailer shops:",
                    data
                );

                if (cancelled) {
                    return;
                }

                const shopList: Shop[] =
                    Array.isArray(data)
                        ? data
                        : [];

                setShops(shopList);

                if (shopList.length > 0) {

                    setSelectedShopId(
                        shopList[0].shopId
                    );

                } else {

                    setSelectedShopId(null);
                    setOrders([]);
                    setCustomerDetails({});
                    setProductNames({});
                }

            } catch (err) {

                if (cancelled) {
                    return;
                }

                console.error(
                    "Error fetching retailer shops:",
                    err
                );

                setShops([]);
                setSelectedShopId(null);
                setOrders([]);
                setCustomerDetails({});
                setProductNames({});

                setError(
                    err instanceof Error
                        ? err.message
                        : "Unable to load your shops."
                );

            } finally {

                if (!cancelled) {
                    setLoadingShops(false);
                }
            }
        };

        fetchRetailerShops();

        return () => {
            cancelled = true;
        };

    }, [retailerId]);

    // =========================================
    // FETCH ORDERS FOR SELECTED SHOP
    // =========================================

    useEffect(() => {

        if (!selectedShopId || !retailerId) {

            setOrders([]);
            setCustomerDetails({});
            setProductNames({});
            setLoadingOrders(false);

            return;
        }

        const token = getToken();

        if (!token) {

            setOrders([]);
            setLoadingOrders(false);

            setError(
                "Your session has expired. Please login again."
            );

            return;
        }

        let cancelled = false;

        const fetchShopOrders = async () => {

            try {

                setLoadingOrders(true);
                setError("");

                console.log(
                    "Fetching orders:",
                    {
                        shopId: selectedShopId,
                        retailerId
                    }
                );

                const response = await fetch(
                    `${ORDER_SERVICE}/shop/${selectedShopId}/retailer/${retailerId}`,
                    {
                        method: "GET",
                        headers: {
                            Authorization: `Bearer ${token}`,
                            Accept: "application/json"
                        }
                    }
                );

                console.log(
                    "Order Service response:",
                    response.status
                );

                const contentType =
                    response.headers.get(
                        "content-type"
                    );

                let data: any;

                if (
                    contentType &&
                    contentType.includes(
                        "application/json"
                    )
                ) {

                    data =
                        await response.json();

                } else {

                    data =
                        await response.text();
                }

                if (!response.ok) {

                    console.error(
                        "Order Service error:",
                        response.status,
                        data
                    );

                    if (
                        response.status === 401 ||
                        response.status === 403
                    ) {

                        throw new Error(
                            "You are not authorized to view this shop's orders."
                        );
                    }

                    throw new Error(
                        typeof data === "string"
                            ? data
                            : data?.message ||
                              `Unable to fetch orders (${response.status}).`
                    );
                }

                console.log(
                    "Shop orders:",
                    data
                );

                if (cancelled) {
                    return;
                }

                const orderList: Order[] =
                    Array.isArray(data)
                        ? data
                        : [];

                setOrders(orderList);

                // Load product names for the order cards.
                const productIds = Array.from(
                    new Set(
                        orderList.flatMap(order => {
                            const ids: number[] = [];

                            if (
                                order.productId &&
                                Number.isFinite(order.productId)
                            ) {
                                ids.push(Number(order.productId));
                            }

                            const items =
                                order.items ||
                                order.orderItems ||
                                [];

                            items.forEach(item => {
                                if (
                                    item.productId &&
                                    Number.isFinite(item.productId)
                                ) {
                                    ids.push(Number(item.productId));
                                }
                            });

                            return ids;
                        })
                    )
                );

                const productResults =
                    await Promise.all(
                        productIds.map(
                            async productId => ({
                                productId,
                                productName:
                                    await fetchProductName(
                                        productId,
                                        token
                                    )
                            })
                        )
                    );

                if (!cancelled) {
                    const namesByProductId:
                        Record<number, string> = {};

                    productResults.forEach(
                        ({ productId, productName }) => {
                            if (productName) {
                                namesByProductId[
                                    productId
                                ] = productName;
                            }
                        }
                    );

                    setProductNames(
                        namesByProductId
                    );
                }

                // Load customer address and phone from Customer Service.
                const uniqueCustomerIds = Array.from(
                    new Set(
                        orderList
                            .map(order => order.customerId)
                            .filter(
                                customerId =>
                                    Number.isFinite(customerId) &&
                                    customerId > 0
                            )
                    )
                );

                const customerResults =
                    await Promise.all(
                        uniqueCustomerIds.map(
                            async customerId => ({
                                customerId,
                                customer:
                                    await fetchCustomerDetails(
                                        customerId,
                                        token
                                    )
                            })
                        )
                    );

                if (!cancelled) {
                    const detailsByCustomerId:
                        Record<number, Customer> = {};

                    customerResults.forEach(
                        ({ customerId, customer }) => {
                            if (customer) {
                                detailsByCustomerId[
                                    customerId
                                ] = customer;
                            }
                        }
                    );

                    setCustomerDetails(
                        detailsByCustomerId
                    );
                }

                // Load existing delivery dates
                const existingDates:
                    Record<number, string> = {};

                orderList.forEach(
                    (order) => {

                        if (
                            order.expectedDeliveryDate
                        ) {

                            existingDates[
                                order.orderId
                            ] =
                                order.expectedDeliveryDate;
                        }
                    }
                );

                setDeliveryDates(
                    existingDates
                );

            } catch (err) {

                if (cancelled) {
                    return;
                }

                console.error(
                    "Error fetching shop orders:",
                    err
                );

                setOrders([]);
                setCustomerDetails({});

                setError(
                    err instanceof Error
                        ? err.message
                        : "Unable to load orders."
                );

            } finally {

                if (!cancelled) {
                    setLoadingOrders(false);
                }
            }
        };

        fetchShopOrders();

        return () => {
            cancelled = true;
        };

    }, [selectedShopId, retailerId]);

    // =========================================
    // UPDATE DELIVERY DATE
    // =========================================

    const updateDeliveryDate = async (
        orderId: number
    ) => {

        const token = getToken();

        if (!token) {
            setError(
                "Your session has expired. Please login again."
            );
            return;
        }

        const deliveryDate =
            deliveryDates[orderId];

        if (!deliveryDate) {
            setError(
                "Please select an expected delivery date."
            );
            return;
        }

        try {

            setUpdatingOrderId(orderId);
            setError("");

            const url =
                `${ORDER_SERVICE}/${orderId}/delivery-date` +
                `?retailerId=${retailerId}` +
                `&expectedDeliveryDate=${encodeURIComponent(
                    deliveryDate
                )}`;

            console.log(
                "Updating delivery date:",
                url
            );
            // Customer details are loaded when the orders are fetched.

            const response = await fetch(
                url,
                {
                    method: "PUT",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        Accept: "text/plain"
                    }
                }
            );

            // OrderController returns ResponseEntity<String>,
            // so always read this response as plain text.
            const message =
                await response.text();

            console.log(
                "Delivery date update response:",
                response.status,
                message
            );

            if (!response.ok) {

                if (
                    response.status === 401 ||
                    response.status === 403
                ) {
                    throw new Error(
                        "You are not authorized to update this order."
                    );
                }

                throw new Error(
                    message ||
                    "Failed to update delivery date."
                );
            }

            // Update the order immediately in the UI.
            setOrders(
                previousOrders =>
                    previousOrders.map(
                        order =>
                            order.orderId === orderId
                                ? {
                                      ...order,
                                      expectedDeliveryDate:
                                          deliveryDate
                                  }
                                : order
                    )
            );

            setDeliveryDates(
                previous => ({
                    ...previous,
                    [orderId]: deliveryDate
                })
            );

            setError(
                `Expected delivery date updated for Order #${orderId}`
            );

        } catch (err) {

            console.error(
                "Error updating delivery date:",
                err
            );

            setError(
                err instanceof Error
                    ? err.message
                    : "Failed to update delivery date."
            );

        } finally {

            setUpdatingOrderId(null);
        }
    };

    // =========================================
    // SELECTED SHOP
    // =========================================

    const selectedShop =
        shops.find(
            shop =>
                shop.shopId ===
                selectedShopId
        );

    // =========================================
    // TOTAL SALES
    // =========================================

    const totalSales =
        orders.reduce(
            (total, order) =>
                total +
                Number(
                    order.totalAmount || 0
                ),
            0
        );

    // =========================================
    // FORMAT CURRENCY
    // =========================================

    const formatCurrency = (
        amount: number
    ): string => {

        return Number(
            amount || 0
        ).toLocaleString(
            "en-IN",
            {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }
        );
    };

    // =========================================
    // FORMAT DATE
    // =========================================

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

    // =========================================
    // FORMAT TIME
    // =========================================

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

    // =========================================
    // STATUS CLASS
    // =========================================

    const getStatusClass = (
        status?: string
    ): string => {

        const value =
            String(status || "")
                .toLowerCase()
                .replace(
                    /\s+/g,
                    "-"
                );

        if (
            value.includes("deliver") ||
            value.includes("complete")
        ) {

            return "status-delivered";
        }

        if (
            value.includes("cancel")
        ) {

            return "status-cancelled";
        }

        if (
            value.includes("ship")
        ) {

            return "status-shipped";
        }

        if (
            value.includes("process") ||
            value.includes("confirm") ||
            value.includes("pending")
        ) {

            return "status-processing";
        }

        return "status-default";
    };

    // =========================================
    // LOADING SHOPS
    // =========================================

    if (loadingShops) {

        return (
            <div className="orders-page">

                <div className="orders-loading">

                    <div className="loading-spinner"></div>

                    <h3>
                        Loading your shops
                    </h3>

                    <p>
                        Preparing your retailer dashboard...
                    </p>

                </div>

            </div>
        );
    }

    // =========================================
    // MAIN PAGE
    // =========================================

    return (

        <div className="orders-page">

            {/* PAGE HEADER */}

            <div className="orders-header">

                <div>

                    <div className="orders-title-row">

                        <div className="orders-title-icon">
                            🛍️
                        </div>

                        <div>

                            <span
                                style={{
                                    fontSize: "11px",
                                    fontWeight: 800,
                                    letterSpacing: "1.5px",
                                    color: "#6366f1"
                                }}
                            >
                                SHOPSMART
                            </span>

                            <h1>
                                Shop Orders
                            </h1>

                            <p>
                                Manage and view orders received
                                by your shops
                            </p>

                        </div>

                    </div>

                </div>

            </div>

            {/* ERROR */}

            {error && (

                <div className="orders-error">

                    <span>
                        ⚠️
                    </span>

                    <div>

                        <strong>
                            Unable to process request
                        </strong>

                        <p>
                            {error}
                        </p>

                    </div>

                </div>

            )}

            {/* NO SHOPS */}

            {shops.length === 0 ? (

                <div className="orders-empty">

                    <div className="empty-icon">
                        🏪
                    </div>

                    <h2>
                        No shops found
                    </h2>

                    <p>
                        You don't have any shops yet.
                        Create a shop first to start
                        receiving orders.
                    </p>

                </div>

            ) : (

                <>

                    {/* SHOP SELECTOR */}

                    <div className="shop-selector-card">

                        <div className="selector-left">

                            <div className="selector-icon">
                                🏪
                            </div>

                            <div>

                                <label>
                                    Select Shop
                                </label>

                                <p>
                                    Choose a shop to view
                                    its orders
                                </p>

                            </div>

                        </div>

                        <select
                            value={
                                selectedShopId ?? ""
                            }
                            onChange={(
                                event
                            ) => {

                                const value =
                                    Number(
                                        event.target.value
                                    );

                                setSelectedShopId(
                                    Number.isFinite(
                                        value
                                    )
                                        ? value
                                        : null
                                );

                            }}
                        >

                            {shops.map(
                                shop => (

                                    <option
                                        key={
                                            shop.shopId
                                        }
                                        value={
                                            shop.shopId
                                        }
                                    >
                                        {
                                            shop.shopName
                                        }
                                    </option>

                                )
                            )}

                        </select>

                    </div>

                    {/* SELECTED SHOP */}

                    {selectedShop && (

                        <div className="selected-shop-card">

                            <div className="selected-shop-left">

                                <div className="selected-shop-icon">
                                    🏬
                                </div>

                                <div>

                                    <h3>
                                        {
                                            selectedShop.shopName
                                        }
                                    </h3>

                                    <p>
                                        {
                                            selectedShop.address ||
                                            "Shop address not available"
                                        }
                                    </p>

                                </div>

                            </div>

                            <div className="shop-id-badge">

                                Shop ID:{" "}
                                {
                                    selectedShop.shopId
                                }

                            </div>

                        </div>

                    )}

                    {/* LOADING ORDERS */}

                    {loadingOrders ? (

                        <div className="orders-loading">

                            <div className="loading-spinner"></div>

                            <h3>
                                Loading orders
                            </h3>

                            <p>
                                Fetching the latest orders
                                for this shop...
                            </p>

                        </div>

                    ) : (

                        <>

                            {/* EMPTY ORDERS */}

                            {orders.length === 0 ? (

                                <div className="orders-empty">

                                    <div className="empty-icon">
                                        📦
                                    </div>

                                    <h2>
                                        No orders yet
                                    </h2>

                                    <p>
                                        This shop hasn't received
                                        any orders yet.
                                    </p>

                                </div>

                            ) : (

                                <>

                                    {/* SUMMARY */}

                                    <div className="orders-summary">

                                        <div className="summary-card">

                                            <div className="summary-icon">
                                                📦
                                            </div>

                                            <div>

                                                <span>
                                                    Total Orders
                                                </span>

                                                <strong>
                                                    {
                                                        orders.length
                                                    }
                                                </strong>

                                            </div>

                                        </div>

                                        <div className="summary-card">

                                            <div className="summary-icon">
                                                ₹
                                            </div>

                                            <div>

                                                <span>
                                                    Total Sales
                                                </span>

                                                <strong>
                                                    ₹
                                                    {
                                                        formatCurrency(
                                                            totalSales
                                                        )
                                                    }
                                                </strong>

                                            </div>

                                        </div>

                                    </div>

                                    {/* ORDERS SECTION */}

                                    <div className="orders-section">

                                        <div className="section-heading">

                                            <div>

                                                <h2>
                                                    Recent Orders
                                                </h2>

                                                <p>
                                                    Orders received
                                                    by this shop
                                                </p>

                                            </div>

                                            <span>
                                                {
                                                    orders.length
                                                }{" "}
                                                {
                                                    orders.length === 1
                                                        ? "Order"
                                                        : "Orders"
                                                }
                                            </span>

                                        </div>

                                        {/* ORDER LIST */}

                                        <div className="order-list">

                                            {orders.map(
                                                (
                                                    order,
                                                    index
                                                ) => (

                                                    <div
                                                        key={
                                                            order.orderId
                                                        }
                                                        className="order-card"
                                                        style={{
                                                            animationDelay:
                                                                `${index * 70}ms`,
                                                            background:
                                                                "rgba(255, 255, 255, 0.72)",
                                                            backdropFilter:
                                                                "blur(18px)",
                                                            WebkitBackdropFilter:
                                                                "blur(18px)",
                                                            border:
                                                                "1px solid rgba(255, 255, 255, 0.8)",
                                                            boxShadow:
                                                                "0 18px 45px rgba(15, 23, 42, 0.10)",
                                                            borderRadius:
                                                                "20px",
                                                            overflow:
                                                                "hidden"
                                                        }}
                                                    >

                                                        {/* TOP */}

                                                        <div className="order-card-top">

                                                            <div className="order-number">

                                                                <div className="order-icon">
                                                                    📦
                                                                </div>

                                                                <div>

                                                                    <h3>
                                                                        Order #
                                                                        {
                                                                            order.orderId
                                                                        }
                                                                    </h3>

                                                                    <p>
                                                                        {
                                                                            formatDate(
                                                                                order.createdAt
                                                                            )
                                                                        }

                                                                        {" • "}

                                                                        {
                                                                            formatTime(
                                                                                order.createdAt
                                                                            )
                                                                        }
                                                                    </p>

                                                                </div>

                                                            </div>

                                                            <span
                                                                className={`order-status ${getStatusClass(
                                                                    order.status
                                                                )}`}
                                                            >

                                                                <span className="status-dot"></span>

                                                                {
                                                                    order.status ||
                                                                    "Processing"
                                                                }

                                                            </span>

                                                        </div>

                                                        {/* DETAILS */}

                                                        <div className="order-details">

                                                            <div className="order-detail">

                                                                <span>
                                                                    PRODUCT
                                                                </span>

                                                                <strong>
                                                                    {(() => {
                                                                        if (order.productName) {
                                                                            return order.productName;
                                                                        }
                                                                       

                                                                        const items =
                                                                            order.items ||
                                                                            order.orderItems ||
                                                                            [];

                                                                        const names =
                                                                            items
                                                                                .map(item =>
                                                                                    item.productId
                                                                                        ? productNames[
                                                                                              item.productId
                                                                                          ]
                                                                                        : null
                                                                                )
                                                                                .filter(
                                                                                    Boolean
                                                                                ) as string[];

                                                                        if (
                                                                            names.length >
                                                                            0
                                                                        ) {
                                                                            return names.join(
                                                                                ", "
                                                                            );
                                                                        }

                                                                        if (
                                                                            order.productId &&
                                                                            productNames[
                                                                                order.productId
                                                                            ]
                                                                        ) {
                                                                            return productNames[
                                                                                order.productId
                                                                            ];
                                                                        }

                                                                        return "";
                                                                    })()}
                                                                </strong>

                                                            </div>

                                                            <div className="order-detail">

                                                                <span>
                                                                    CUSTOMER
                                                                </span>

                                                                <strong>
                                                                    #
                                                                    {
                                                                        order.customerId
                                                                    }
                                                                </strong>

                                                            </div>

                                                            <div className="order-detail">

                                                                <span>
                                                                    AMOUNT
                                                                </span>

                                                                <strong>
                                                                    ₹
                                                                    {
                                                                        formatCurrency(
                                                                            order.totalAmount
                                                                        )
                                                                    }
                                                                </strong>

                                                            </div>

                                                            <div className="order-detail">

                                                                <span>
                                                                    PAYMENT
                                                                </span>

                                                                <strong>
                                                                    {
                                                                        order.paymentMethod ||
                                                                        "—"
                                                                    }
                                                                </strong>

                                                            </div>

                                                            <div className="order-detail">

                                                                <span>
                                                                    PAYMENT STATUS
                                                                </span>

                                                                <strong
                                                                    className="payment-status"
                                                                >
                                                                    {
                                                                        order.paymentStatus ||
                                                                        "—"
                                                                    }
                                                                </strong>

                                                            </div>

                                                        </div>

                                                        {/* DELIVERY INFORMATION */}

                                                        <div
                                                            style={{
                                                                marginTop: "18px",
                                                                padding: "16px",
                                                                borderRadius: "12px",
                                                                background: "#f8fafc",
                                                                border: "1px solid #e2e8f0"
                                                            }}
                                                        >

                                                            <div
                                                                style={{
                                                                    fontSize: "11px",
                                                                    fontWeight: 800,
                                                                    letterSpacing: "1px",
                                                                    color: "#64748b",
                                                                    marginBottom: "8px"
                                                                }}
                                                            >
                                                                DELIVERY INFORMATION
                                                            </div>

                                                            {/* ADDRESS */}

                                                            <div
                                                                style={{
                                                                    marginBottom: "14px"
                                                                }}
                                                            >

                                                                <strong>
                                                                    📍 Delivery Address
                                                                </strong>

                                                                <p
                                                                    style={{
                                                                        margin:
                                                                            "5px 0 0",
                                                                        color:
                                                                            "#475569"
                                                                    }}
                                                                >
                                                                    {
                                                                        order.deliveryAddress ||
                                                                        customerDetails[
                                                                            order.customerId
                                                                        ]?.address ||
                                                                        customerDetails[
                                                                            order.customerId
                                                                        ]?.deliveryAddress ||
                                                                        "Address will updated on DeliveryDate"
                                                                    }
                                                                </p>

                                                            </div>

                                                            {/* CUSTOMER CONTACT */}

                                                            <div
                                                                style={{
                                                                    marginBottom: "14px"
                                                                }}
                                                            >
                                                                <strong>
                                                                    📞 Customer Phone
                                                                </strong>

                                                                <p
                                                                    style={{
                                                                        margin:
                                                                            "5px 0 0",
                                                                        color:
                                                                            "#475569"
                                                                    }}
                                                                >
                                                                    {
                                                                        customerDetails[
                                                                            order.customerId
                                                                        ]?.phoneNumber ||
                                                                        customerDetails[
                                                                            order.customerId
                                                                        ]?.phone ||
                                                                        customerDetails[
                                                                            order.customerId
                                                                        ]?.mobileNumber ||
                                                                        "Phone number will be updated shortly.."
                                                                    }
                                                                </p>
                                                            </div>

                                                            {/* EXPECTED DELIVERY */}

                                                            <div>

                                                                <strong>
                                                                    🚚 Expected Delivery
                                                                </strong>

                                                                <p
                                                                    style={{
                                                                        margin:
                                                                            "5px 0 12px",
                                                                        color:
                                                                            "#475569"
                                                                    }}
                                                                >
                                                                    {
                                                                        formatDate(
                                                                            order.expectedDeliveryDate
                                                                        )
                                                                    }
                                                                </p>

                                                                <div
                                                                    style={{
                                                                        display:
                                                                            "flex",
                                                                        gap:
                                                                            "10px",
                                                                        alignItems:
                                                                            "center",
                                                                        flexWrap:
                                                                            "wrap"
                                                                    }}
                                                                >

                                                                    <input
                                                                        type="date"
                                                                        value={
                                                                            deliveryDates[
                                                                                order.orderId
                                                                            ] ||
                                                                            ""
                                                                        }
                                                                        min={
                                                                            new Date()
                                                                                .toISOString()
                                                                                .split(
                                                                                    "T"
                                                                                )[0]
                                                                        }
                                                                        onChange={(
                                                                            event
                                                                        ) => {

                                                                            setDeliveryDates(
                                                                                previous => ({
                                                                                    ...previous,
                                                                                    [order.orderId]:
                                                                                        event
                                                                                            .target
                                                                                            .value
                                                                                })
                                                                            );

                                                                        }}
                                                                        style={{
                                                                            padding:
                                                                                "10px 12px",
                                                                            border:
                                                                                "1px solid #cbd5e1",
                                                                            borderRadius:
                                                                                "8px",
                                                                            fontSize:
                                                                                "14px"
                                                                        }}
                                                                    />

                                                                    <button
                                                                        type="button"
                                                                        onClick={() =>
                                                                            updateDeliveryDate(
                                                                                order.orderId
                                                                            )
                                                                        }
                                                                        disabled={
                                                                            updatingOrderId ===
                                                                            order.orderId
                                                                        }
                                                                        style={{
                                                                            padding:
                                                                                "10px 16px",
                                                                            border:
                                                                                "none",
                                                                            borderRadius:
                                                                                "8px",
                                                                            background:
                                                                                "#4f46e5",
                                                                            color:
                                                                                "#ffffff",
                                                                            fontWeight:
                                                                                700,
                                                                            cursor:
                                                                                updatingOrderId ===
                                                                                order.orderId
                                                                                    ? "not-allowed"
                                                                                    : "pointer",
                                                                            opacity:
                                                                                updatingOrderId ===
                                                                                order.orderId
                                                                                    ? 0.6
                                                                                    : 1
                                                                        }}
                                                                    >
                                                                        {
                                                                            updatingOrderId ===
                                                                            order.orderId
                                                                                ? "Updating..."
                                                                                : "Update Delivery Date"
                                                                        }
                                                                    </button>

                                                                </div>

                                                            </div>

                                                        </div>

                                                        {/* FOOTER */}

                                                        <div className="order-footer">

                                                            <span>
                                                                Shop ID:{" "}
                                                                {
                                                                    order.shopId
                                                                }
                                                            </span>

                                                            {
                                                                order.loyaltyPointsEarned !==
                                                                    undefined && (

                                                                    <span>
                                                                        ⭐ Loyalty Points Earned:{" "}
                                                                        {
                                                                            order.loyaltyPointsEarned
                                                                        }
                                                                    </span>

                                                                )
                                                            }

                                                        </div>

                                                    </div>

                                                )
                                            )}

                                        </div>

                                    </div>

                                </>

                            )}

                        </>

                    )}

                </>

            )}

        </div>
    );
};

export default OrdersContent;