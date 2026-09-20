import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { QRCodeCanvas } from "qrcode.react";
import { useNavigate } from "react-router-dom";
import "../OrderPage.css";

// =========================================================
// API URLS
// =========================================================

const ORDER_URL = "http://localhost:8087/shopsmart/orders";
const PRODUCT_URL = "http://localhost:8082/shopsmart/product";
const CART_URL = "http://localhost:8083/shopsmart/cart";
const LOYALTY_URL = "http://localhost:8090/shopsmart/loyalty";
const LOYALTY_TRANSACTION_URL =
    "http://localhost:8091/shopsmart/loyaltyTransaction";
const VOUCHER_URL = "http://localhost:8092/voucher";


// =========================================================
// YOUR UPI ID
// =========================================================

const SHOPSMART_UPI_ID = "6281991025@ibl";
const SHOPSMART_UPI_NAME = "ShopSmart";

// =========================================================
// INTERFACES
// =========================================================

interface CartProduct {
    id?: number;
    customerId?: number;
    productId: number;
    productName: string;
    description?: string;
    originalPrice?: number;
    discount?: number;
    price?: number;
    category?: string;
    shopId?: number;
    imageUrl?: string | null;
    stockLeft?: number;     
    stockUsed?: number;
    quantity: number;
    createdAt?: string;
    updatedAt?: string;
}

interface FareSummary {
    subTotal: number;
    voucherDiscount: number;
    pointsRedeemed: number;
    finalPayableAmount: number;
    pointsToBeEarned: number;
}

interface Voucher {
    voucherId: number;
    voucherCode: string;
    discountPercentage: number;
    active: boolean;
    minimumOrderAmount: number;
    startDate?: string;
    endDate?: string;
    ownerId?: number;
    shopId?: number;
}

interface LoyaltyAccount {
    loyaltyId: number;
    customerId: number;
    pointsAvail: number;
    pointsRedeemed: number;
    tier: string;
    pointsHistory?: string;
}

interface LoyaltyTransaction {
    transactionId: number;
    customerId: number;
    orderId?: number;
    transactionType: string;
    points: number;
    description?: string;
    createdAt?: string;
}

// =========================================================
// JWT DECODER
// =========================================================

function decodeJwt(token: string) {
    try {
        const payload = token.split(".")[1];

        if (!payload) {
            return null;
        }

        return JSON.parse(
            atob(
                payload
                    .replace(/-/g, "+")
                    .replace(/_/g, "/")
            )
        );
    } catch {
        return null;
    }
}

// =========================================================
// IMAGE FALLBACK
// =========================================================

function getProductInitial(productName: string) {
    if (!productName) {
        return "S";
    }

    return productName.charAt(0).toUpperCase();
}

// =========================================================
// FINAL PRODUCT PRICE
// =========================================================

function getFinalPrice(product: CartProduct) {

    const originalPrice =
        Number(product.originalPrice ?? 0);

    const discount =
        Number(product.discount ?? 0);

    const finalPrice =
        originalPrice -
        (originalPrice * discount) / 100;


    return Math.round(finalPrice * 100) / 100;
}

// =========================================================
// ORDER PAGE
// =========================================================

export function OrderPage() {

    const navigate = useNavigate();

    // =====================================================
    // USER
    // =====================================================

    const [token, setToken] = useState("");
    const [customerId, setCustomerId] = useState<number | null>(null);
    const [shopId, setShopId] = useState<number | null>(null);

    // =====================================================
    // CART
    // =====================================================

    const [cartItems, setCartItems] =
        useState<CartProduct[]>([]);

    // =====================================================
    // LOADING STATES
    // =====================================================

    const [loading, setLoading] =
        useState(true);

    const [processingOrder, setProcessingOrder] =
        useState(false);

    const [loadingLoyalty, setLoadingLoyalty] =
        useState(false);

    // =====================================================
    // PAYMENT
    // =====================================================

    const [paymentMethod, setPaymentMethod] =
        useState<"UPI" | "COD">("UPI");

    const [upiTransactionId, setUpiTransactionId] =
        useState("");

    // =====================================================
    // LOYALTY
    // =====================================================

    const [loyaltyAccount, setLoyaltyAccount] =
        useState<LoyaltyAccount | null>(null);

    const [availablePoints, setAvailablePoints] =
        useState(0);

    const [pointsToRedeem, setPointsToRedeem] =
        useState(0);

    const [transactions, setTransactions] =
        useState<LoyaltyTransaction[]>([]);

    // =====================================================
    // VOUCHER
    // =====================================================

    const [voucherCode, setVoucherCode] = useState("");
    const [appliedVoucher, setAppliedVoucher] =
        useState<Voucher | null>(null);
    const [voucherLoading, setVoucherLoading] =
        useState(false);
    const [voucherMessage, setVoucherMessage] =
        useState("");
    const [voucherError, setVoucherError] =
        useState("");

    const [availableVouchers, setAvailableVouchers] =
        useState<Voucher[]>([]);

    const [loadingVouchers, setLoadingVouchers] =
        useState(false);
    const[voucherprice,setVoucherprice]=useState<number>();
    // =====================================================
    // ERROR / SUCCESS
    // =====================================================

    const [error, setError] =
        useState("");

    const [successMessage, setSuccessMessage] =
        useState("");

    // =====================================================
    // SNACKBAR
    // =====================================================

    const [snackbar, setSnackbar] = useState<{
        type: "success" | "error" | "info";
        message: string;
    } | null>(null);

    useEffect(() => {
        if (!snackbar) {
            return;
        }

        const timer = window.setTimeout(() => {
            setSnackbar(null);
        }, 3500);

        return () => window.clearTimeout(timer);
    }, [snackbar]);

    const showSnackbar = (
        type: "success" | "error" | "info",
        message: string
    ) => {
        setSnackbar({ type, message });
    };

    const getApiErrorMessage = (err: any, fallback: string) => {
        const data = err?.response?.data;

        if (typeof data === "string" && data.trim()) {
            return data;
        }

        if (typeof data?.message === "string" && data.message.trim()) {
            return data.message;
        }

        if (typeof data?.error === "string" && data.error.trim()) {
            return data.error;
        }

        if (typeof err?.message === "string" && err.message.trim()) {
            return err.message;
        }

        return fallback;
    };

    // =====================================================
    // LOAD USER FROM JWT
    // =====================================================

    useEffect(() => {

        const storedToken =
            localStorage.getItem("shopsmart_token");

        if (!storedToken) {
            navigate("/login");
            return;
        }

        const decoded =
            decodeJwt(storedToken);

        if (!decoded?.userId) {
            localStorage.removeItem("shopsmart_token");
            navigate("/login");
            return;
        }

        setToken(storedToken);
        setCustomerId(
            Number(decoded.userId)
        );

        if (decoded.shopId) {
            setShopId(
                Number(decoded.shopId)
            );
        }

    }, [navigate]);

    // =====================================================
    // LOAD CART
    // =====================================================

    useEffect(() => {

        if (!customerId || !token) {
            return;
        }

        loadCart();

    }, [customerId, token]);

    // =====================================================
    // LOAD CART FUNCTION
    // =====================================================

    const loadCart = async () => {

    if (!customerId) {
        return;
    }

    try {

        setLoading(true);
        setError("");

        const response =
            await axios.get(
                `${CART_URL}/${customerId}`,
                {
                    headers: {
                        Authorization:
                            `Bearer ${token}`
                    }
                }
            );
            console.log(response.data)
        const items =
            Array.isArray(response.data)
                ? response.data
                : [];

        // =====================================================
        // FETCH CURRENT PRODUCT DETAILS
        // Cart Service does not currently contain shopId,
        // so get shopId directly from Product Service.
        // =====================================================

        const enrichedItems =
            await Promise.all(
                items.map(async (item: CartProduct) => {

                    try {

                        const productResponse =
                            await axios.get(
                                `${PRODUCT_URL}/${item.productId}`,
                                {
                                    headers: {
                                        Authorization:
                                            `Bearer ${token}`
                                    }
                                }
                            );

                        const product =
                            productResponse.data;

                        return {
                            ...item,

                            // Take shopId from Product Service
                            shopId:
                                product.shopId,

                            // Keep current product information
                            originalPrice:
                                product.originalPrice,

                            discount:
                                product.discount,

                            stockLeft:
                                product.stockLeft,

                            price:
                                product.price,

                            imageUrl:
                                product.imageUrl
                        };

                    } catch (productError) {

                        console.error(
                            `Unable to load product ${item.productId}:`,
                            productError
                        );

                        return item;
                    }
                })
            );

        setCartItems(enrichedItems);

        console.log(
            "CART RESPONSE:",
            enrichedItems
        );

        // =====================================================
        // SET SHOP ID FROM PRODUCT SERVICE
        // =====================================================

        if (enrichedItems.length > 0) {

            const firstShop =
                enrichedItems[0].shopId;

            if (firstShop !== null &&
                firstShop !== undefined) {

                setShopId(
                    Number(firstShop)
                );

                console.log(
                    "SHOP ID FROM PRODUCT SERVICE:",
                    firstShop
                );
            } else {

                console.error(
                    "Shop ID is still missing for product:",
                    enrichedItems[0].productId
                );
            }
        }

    } catch (err) {

        console.error(
            "Cart loading error:",
            err
        );

        setError(
            "Unable to load your cart. Please try again."
        );

    } finally {

        setLoading(false);
    }
};
    // =====================================================
    // LOAD LOYALTY ACCOUNT
    // =====================================================

    useEffect(() => {

        if (!customerId || !token) {
            return;
        }

        loadLoyalty();

    }, [customerId, token]);

    const loadLoyalty = async () => {

        if (!customerId) {
            return;
        }

        try {

            setLoadingLoyalty(true);

            const accountResponse =
                await axios.get(
                    `${LOYALTY_URL}/customer/${customerId}`,
                    {
                        headers: {
                            Authorization:
                                `Bearer ${token}`
                        }
                    }
                );

            const account =
                accountResponse.data;

            setLoyaltyAccount(account);

            setAvailablePoints(
                Number(account?.pointsAvail ?? 0)
            );

            // =============================================
            // LOAD TRANSACTION HISTORY
            // =============================================

            try {

                const transactionResponse =
                    await axios.get(
                        `${LOYALTY_TRANSACTION_URL}/customer/${customerId}`,
                        {
                            headers: {
                                Authorization:
                                    `Bearer ${token}`
                            }
                        }
                    );

                setTransactions(
                    Array.isArray(
                        transactionResponse.data
                    )
                        ? transactionResponse.data
                        : []
                );

            } catch (transactionError) {

                console.warn(
                    "Transaction history unavailable:",
                    transactionError
                );

            }

        } catch (err) {

            console.error(
                "Loyalty loading error:",
                err
            );

            setAvailablePoints(0);

        } finally {

            setLoadingLoyalty(false);
        }
    };

    // =========================================================
    // LOAD AVAILABLE VOUCHERS
    // =========================================================

    useEffect(() => {

        if (!customerId || !token || !shopId) {
            return;
        }

        loadAvailableVouchers();

    }, [customerId, token, shopId]);

    const loadAvailableVouchers = async () => {

        if (!customerId || !token || !shopId) {
            return;
        }

        try {

            setLoadingVouchers(true);

            const response = await axios.get(
                `${VOUCHER_URL}/shop/${shopId}`,
                {
                    headers: {
                        Authorization:
                            `Bearer ${token}`
                    }
                }
            );

            const vouchers: Voucher[] =
                Array.isArray(response.data)
                    ? response.data
                    : [];

            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const validVouchers = vouchers.filter(
                (voucher) => {

                    if (!voucher.active) {
                        return false;
                    }

                    if (
                        voucher.startDate &&
                        today < new Date(
                            `${voucher.startDate}T00:00:00`
                        )
                    ) {
                        return false;
                    }

                    if (
                        voucher.endDate &&
                        today > new Date(
                            `${voucher.endDate}T23:59:59`
                        )
                    ) {
                        return false;
                    }

                    return true;
                }
            );

            setAvailableVouchers(validVouchers);

        } catch (err) {

            console.error(
                "Unable to load vouchers:",
                err
            );

            setAvailableVouchers([]);

        } finally {

            setLoadingVouchers(false);
        }
    };

    // =========================================================
    // LOAD BACKEND FARE SUMMARY
    // =========================================================

    const [fareSummary, setFareSummary] =
        useState<FareSummary | null>(null);

    useEffect(() => {

        if (
            !customerId ||
            !token ||
            cartItems.length === 0
        ) {
            return;
        }

        loadFareSummary();

    }, [
        customerId,
        token,
        cartItems.length,
        pointsToRedeem,
        appliedVoucher?.voucherCode
    ]);

    const loadFareSummary = async () => {

        if (!customerId) {
            return;
        }

        try {

            const response =
                await axios.get(
                    `${ORDER_URL}/pre-checkout`,
                    {
                        params: {
                            customerId,
                            pointsToRedeem,
                            ...(appliedVoucher?.voucherCode
                                ? {
                                    voucherCode:
                                        appliedVoucher.voucherCode
                                }
                                : {})
                        },
                        headers: {
                            Authorization:
                                `Bearer ${token}`
                        }
                    }
                );

            setFareSummary(
                response.data
            );

        } catch (err: any) {

            console.error(
                "Fare calculation error:",
                err
            );

            setFareSummary(null);

            if (appliedVoucher) {
                const message = getApiErrorMessage(
                    err,
                    "Unable to calculate the voucher discount."
                );

                setVoucherError(message);
                showSnackbar("error", message);
            }
        }
    };

    // =========================================================
    // APPLY VOUCHER
    // =========================================================

    const applyVoucher = async () => {

        const code = voucherCode.trim().toUpperCase();

        setVoucherError("");
        setVoucherMessage("");

        if (!code) {
            const message = "Please enter a voucher code.";
            setVoucherError(message);
            showSnackbar("error", message);
            return;
        }

        if (!customerId || !token || cartItems.length === 0) {
            const message = "Unable to apply voucher right now.";
            setVoucherError(message);
            showSnackbar("error", message);
            return;
        }

        try {

            setVoucherLoading(true);

            // =================================================
            // 1. GET VOUCHER DETAILS
            // =================================================

            const response = await axios.get(
                `${VOUCHER_URL}/code/${encodeURIComponent(code)}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const voucher: Voucher = response.data;

            if (!voucher) {
                throw new Error("Voucher not found.");
            }

            if (!voucher.active) {
                throw new Error("This voucher is not active.");
            }

            const today = new Date();
            today.setHours(0, 0, 0, 0);

            if (voucher.startDate) {
                const startDate = new Date(voucher.startDate);
                startDate.setHours(0, 0, 0, 0);

                if (today < startDate) {
                    throw new Error("This voucher is not active yet.");
                }
            }

            if (voucher.endDate) {
                const endDate = new Date(voucher.endDate);
                endDate.setHours(0, 0, 0, 0);

                if (today > endDate) {
                    throw new Error("This voucher has expired.");
                }
            }

            const discountPercentage =
                Number(voucher.discountPercentage ?? 0);
            console.log(discountPercentage)

            if (
                discountPercentage <= 0 ||
                discountPercentage > 100
            ) {
                throw new Error(
                    "Invalid voucher discount percentage."
                );
            }

            const currentSubtotal =
                Math.round(calculatedCartSubtotal * 100) / 100;
            console.log(currentSubtotal)

            if (
                voucher.minimumOrderAmount != null &&
                currentSubtotal <
                    Number(voucher.minimumOrderAmount)
            ) {
                throw new Error(
                    `Minimum order amount for this voucher is ₹${Number(
                        voucher.minimumOrderAmount
                    ).toFixed(2)}.`
                );
            }
            else{
                 setVoucherprice(currentSubtotal)

            }
            // =================================================
            // 2. LET BACKEND CALCULATE THE AUTHORITATIVE FARE
            //    BEFORE SAVING THE VOUCHER IN STATE.
            // =================================================

            const fareResponse = await axios.get(
                `${ORDER_URL}/pre-checkout`,
                {
                    params: {
                        customerId,
                        pointsToRedeem,
                        voucherCode: voucher.voucherCode
                    },
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            if (!fareResponse.data) {
                throw new Error(
                    "Unable to calculate the voucher discount."
                );
            }

            // Only update these states after the backend succeeds.
            setFareSummary(fareResponse.data);
            setAppliedVoucher(voucher);
            setVoucherCode(voucher.voucherCode);

            const message =
                `${voucher.voucherCode} applied successfully.`;

            setVoucherMessage(message);
            showSnackbar("success", message);

        } catch (err: any) {

            console.error(
                "Voucher application error:",
                err
            );

            // IMPORTANT:
            // Never render err.response.data directly.
            // Axios may return an object, which can cause
            // "Objects are not valid as a React child" and a
            // completely white screen.
            const message = getApiErrorMessage(
                err,
                "Invalid or unavailable voucher."
            );

            setAppliedVoucher(null);
            setFareSummary(null);
            setVoucherError(message);
            setVoucherMessage("");
            showSnackbar("error", message);

        } finally {

            setVoucherLoading(false);
        }
    };

    // =========================================================
    // REMOVE VOUCHER
    // =========================================================

    const removeVoucher = async () => {

        setVoucherError("");
        setVoucherMessage("");

        if (customerId && token && cartItems.length > 0) {

            try {

                const response = await axios.get(
                    `${ORDER_URL}/pre-checkout`,
                    {
                        params: {
                            customerId,
                            pointsToRedeem,
                            voucherCode: ""
                        },
                        headers: {
                            Authorization:
                                `Bearer ${token}`
                        }
                    }
                );

                setFareSummary(response.data);
                setAppliedVoucher(null);
                setVoucherCode("");

                const message = "Voucher removed successfully.";
                setVoucherMessage(message);
                showSnackbar("info", message);

            } catch (err: any) {

                console.error(
                    "Fare recalculation error:",
                    err
                );

                const message = getApiErrorMessage(
                    err,
                    "Unable to remove the voucher right now."
                );

                setVoucherError(message);
                showSnackbar("error", message);
            }

            return;
        }

        setAppliedVoucher(null);
        setVoucherCode("");
        setFareSummary(null);
    };

    // =========================================================
    // BACKEND FARE VALUES
    // =========================================================

    const calculatedCartSubtotal = cartItems.reduce(
        (total, product) => {
            return total + (
                getFinalPrice(product) *
                product.quantity
            );
        },
        0
    );

    const subTotal =
        fareSummary?.subTotal !== undefined
            ? Number(fareSummary.subTotal)
            : Math.round(
                calculatedCartSubtotal * 100
            ) / 100;

    const voucherDiscount =
        fareSummary?.voucherDiscount !== undefined
            ? Number(fareSummary.voucherDiscount)
            : 0;

    const amountAfterVoucher =
        Math.max(
            0,
            Math.round(
                (subTotal - voucherDiscount) * 100
            ) / 100
        );

    const finalAmount =
        fareSummary?.finalPayableAmount !== undefined
            ? Number(fareSummary.finalPayableAmount)
            : Math.max(
                0,
                Math.round(
                    (amountAfterVoucher - pointsToRedeem) * 100
                ) / 100
            );

    const estimatedPointsEarned =
        fareSummary?.pointsToBeEarned !== undefined
            ? Number(fareSummary.pointsToBeEarned)
            : Math.floor(finalAmount / 100);

    // =========================================================
    // UPI PAYMENT LINK
    // =========================================================

    const upiPaymentLink = useMemo(() => {

        const amount =
            finalAmount.toFixed(2);

        return (
            `upi://pay?pa=${encodeURIComponent(SHOPSMART_UPI_ID)}` +
            `&pn=${encodeURIComponent(SHOPSMART_UPI_NAME)}` +
            `&am=${amount}` +
            `&cu=INR`
        );

    }, [finalAmount]);

    // =========================================================
    // USE AVAILABLE POINTS
    // =========================================================

    const handlePointsChange = (
        value: number
    ) => {

        if (value < 0) {
            setPointsToRedeem(0);
            return;
        }

        if (value > availablePoints) {

            setPointsToRedeem(
                availablePoints
            );

            return;
        }

        if (value > amountAfterVoucher) {

            setPointsToRedeem(
                Math.floor(amountAfterVoucher)
            );

            return;
        }

        setPointsToRedeem(value);
    };

    // =========================================================
    // USE ALL POINTS
    // =========================================================

    const useAllPoints = () => {

        const usablePoints =
            Math.min(
                availablePoints,
                Math.floor(amountAfterVoucher)
            );

        setPointsToRedeem(
            usablePoints
        );
    };

    // =========================================================
    // PLACE ORDER
    // =========================================================

    const placeOrder = async () => {

        if (!customerId) {
            return;
        }

        setError("");
        setSuccessMessage("");

        // ================================================
        // CART VALIDATION
        // ================================================

        if (cartItems.length === 0) {

            setError(
                "Your cart is empty."
            );

            return;
        }

        // ================================================
        // UPI VALIDATION
        // ================================================

        if (paymentMethod === "UPI") {

            if (
                !upiTransactionId.trim()
                ||
                upiTransactionId.trim().length < 12
            ) {

                setError(
                    "Please enter a valid 12-digit UPI Reference ID."
                );

                return;
            }
        }

        // ================================================
        // POINT VALIDATION
        // ================================================

        if (
            pointsToRedeem >
            availablePoints
        ) {

            setError(
                `You only have ${availablePoints} loyalty points available.`
            );

            return;
        }

        if (
            pointsToRedeem >
            amountAfterVoucher
        ) {

            setError(
                "Loyalty points cannot exceed the payable order amount."
            );

            return;
        }

        try {

            setProcessingOrder(true);

            // ============================================
            // PRE-CHECKOUT
            // ============================================

            const preCheckoutResponse =
                await axios.get(
                    `${ORDER_URL}/pre-checkout`,
                    {
                        params: {
                            customerId,
                            pointsToRedeem,
                            ...(appliedVoucher?.voucherCode
                                ? {
                                    voucherCode:
                                        appliedVoucher.voucherCode
                                }
                                : {})
                        },
                        headers: {
                            Authorization:
                                `Bearer ${token}`
                        }
                    }
                );

            const fare =
                preCheckoutResponse.data;

            /*
             * Backend is the final authority for:
             *
             * subtotal
             * redeemed points
             * final payable amount
             * earned points
             */

            if (
                fare?.finalPayableAmount !== undefined
            ) {

                console.log(
                    "Backend pre-checkout:",
                    fare
                );
            }

            // ============================================
            // CREATE ORDER REQUEST
            // ============================================

            const checkoutRequest = {

                customerId,

                shopId:
                    shopId ??
                    cartItems[0]?.shopId ??
                    null,

                paymentMethod,

                upiTransactionId:
                    paymentMethod === "UPI"
                        ? upiTransactionId.trim()
                        : null,

                pointsToRedeem,

                voucherCode:
                    appliedVoucher?.voucherCode ?? null
            };

            // ============================================
            // PLACE ORDER
            // ============================================

            const orderResponse =
                await axios.post(
                    `${ORDER_URL}/confirm-payment`,
                    checkoutRequest,
                    {
                        headers: {
                            Authorization:
                                `Bearer ${token}`,
                            "Content-Type":
                                "application/json"
                        }
                    }
                );

            console.log(
                "Order response:",
                orderResponse.data
            );

            // ============================================
            // SUCCESS
            // ============================================

            setSuccessMessage(
                "Order placed successfully!"
            );

            // Refresh loyalty data

            await loadLoyalty();
            // Go to order success after short delay

            setTimeout(() => {

                navigate(
                    "/myorders",
                    {
                        state: {
                            orderResponse:
                                orderResponse.data
                        }
                    }
                );

            }, 1200);

        } catch (err: any) {

            console.error(
                "Order placement error:",
                err
            );

            console.error(
                "ORDER SERVICE RESPONSE:",
                err?.response?.data
            );

            const backendMessage =
                err?.response?.data;

            if (
                typeof backendMessage === "string"
            ) {

                setError(
                    backendMessage
                );

            } else {

                setError(
                    "Unable to place your order. Please try again."
                );
            }

        } finally {

            setProcessingOrder(false);
        }
    };

    // =====================================================
    // BACK TO CART
    // =====================================================

    const goBackToCart = () => {

        navigate(
            "/customer/cart"
        );

    };

    // =====================================================
    // CONTINUE SHOPPING
    // =====================================================

    const continueShopping = () => {

        navigate("/");

    };

    // =====================================================
    // LOADING
    // =====================================================

    if (loading) {

        return (
            <div className="order-page-loader">

                <div className="order-loader-ring"></div>

                <h3>
                    Preparing your checkout...
                </h3>

                <p>
                    Loading your cart
                </p>

            </div>
        );
    }

    // =====================================================
    // EMPTY CART
    // =====================================================

    if (cartItems.length === 0) {

        return (
            <div className="order-empty-page">

                <div className="empty-order-icon">
                    <i className="bi bi-bag-x"></i>
                </div>

                <h2>
                    Your cart is empty
                </h2>

                <p>
                    Add some products before proceeding
                    to checkout.
                </p>

                <button
                    className="green-button"
                    onClick={continueShopping}
                >
                    <i className="bi bi-arrow-left"></i>
                    Continue Shopping
                </button>

            </div>
        );
    }

    // =====================================================
    // RENDER
    // =====================================================

    return (

        <div className="order-page">

           
           

            {/* =================================================
                STEPS
            ================================================= */}

            <div className="checkout-progress">

                <div className="checkout-step active">

                    <span>
                        1
                    </span>

                    <p>
                        Cart
                    </p>

                </div>

                <div className="progress-line active"></div>

                <div className="checkout-step active">

                    <span>
                        2
                    </span>

                    <p>
                        Checkout
                    </p>

                </div>

                <div className="progress-line"></div>

                <div className="checkout-step">

                    <span>
                        3
                    </span>

                    <p>
                        Confirmation
                    </p>

                </div>

            </div>

            {/* =================================================
                ERROR
            ================================================= */}

            {error && (

                <div className="order-alert error-alert">

                    <i className="bi bi-exclamation-triangle-fill"></i>

                    <span>
                        {error}
                    </span>

                    <button
                        onClick={() =>
                            setError("")
                        }
                    >
                        ×
                    </button>

                </div>

            )}

            {/* =================================================
                SUCCESS
            ================================================= */}

            {successMessage && (

                <div className="order-alert success-alert">

                    <i className="bi bi-check-circle-fill"></i>

                    <span>
                        {successMessage}
                    </span>

                </div>

            )}

            {/* =================================================
                SNACKBAR
            ================================================= */}

            {snackbar && (
                <div
                    role="alert"
                    aria-live="polite"
                    style={{
                        position: "fixed",
                        top: "24px",
                        right: "24px",
                        zIndex: 99999,
                        minWidth: "300px",
                        maxWidth: "420px",
                        padding: "14px 18px",
                        borderRadius: "10px",
                        background:
                            snackbar.type === "success"
                                ? "#198754"
                                : snackbar.type === "error"
                                    ? "#dc3545"
                                    : "#495057",
                        color: "#ffffff",
                        boxShadow:
                            "0 8px 24px rgba(0,0,0,0.18)",
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        fontSize: "14px",
                        fontWeight: 500
                    }}
                >
                    <i
                        className={
                            snackbar.type === "success"
                                ? "bi bi-check-circle-fill"
                                : snackbar.type === "error"
                                    ? "bi bi-exclamation-circle-fill"
                                    : "bi bi-info-circle-fill"
                        }
                    ></i>

                    <span style={{ flex: 1 }}>
                        {snackbar.message}
                    </span>

                    <button
                        type="button"
                        onClick={() => setSnackbar(null)}
                        aria-label="Close notification"
                        style={{
                            border: "none",
                            background: "transparent",
                            color: "#ffffff",
                            fontSize: "20px",
                            lineHeight: 1,
                            cursor: "pointer",
                            padding: 0
                        }}
                    >
                        ×
                    </button>
                </div>
            )}

            {/* =================================================
                MAIN CONTENT
            ================================================= */}

            <main className="order-container">

                {/* =================================================
                    LEFT SIDE
                ================================================= */}

                <section className="order-main">

                    {/* =================================================
                        DELIVERY
                    ================================================= */}

                    <div className="checkout-card delivery-card">

                        <div className="card-title-row">

                            <div className="title-icon">
                                <i className="bi bi-geo-alt"></i>
                            </div>

                            <div>

                                <h3>
                                    Delivery Details
                                </h3>

                                <p>
                                    Your order will be delivered
                                    to your saved address.
                                </p>

                            </div>

                        </div>

                        <div className="delivery-info">

                            <div className="delivery-badge">
                                <i className="bi bi-house-check"></i>
                            </div>

                            <div>

                                <strong>
                                    Standard Delivery
                                </strong>

                                <p>
                                    Fast and secure delivery
                                    from ShopSmart
                                </p>

                            </div>

                            <span className="delivery-free">
                                FREE
                            </span>

                        </div>

                    </div>

                    {/* =================================================
                        PRODUCTS
                    ================================================= */}

                    <div className="checkout-card">

                        <div className="card-header-flex">

                            <div>

                                <h3>
                                    Your Order
                                </h3>

                                <p>
                                    {cartItems.length}
                                    {" "}
                                    {cartItems.length === 1
                                        ? "item"
                                        : "items"}
                                </p>

                            </div>

                            <button
                                className="text-button"
                                onClick={goBackToCart}
                            >

                                <i className="bi bi-pencil-square"></i>

                                Edit Cart

                            </button>

                        </div>

                        <div className="order-products">

                            {cartItems.map(
                                (product, index) => {

                                    const finalPrice =
                                        getFinalPrice(product);

                                    const originalPrice =
                                        Number(
                                            product.originalPrice ??
                                            0
                                        );

                                    const discount =
                                        Number(
                                            product.discount ??
                                            0
                                        );

                                    return (

                                        <div
                                            className="order-product"
                                            key={
                                                product.productId ??
                                                index
                                            }
                                        >

                                            {/* IMAGE */}

                                            <div className="order-product-image">

                                                {product.imageUrl ? (

                                                    <img
                                                        src={
                                                            product.imageUrl
                                                        }
                                                        alt={
                                                            product.productName
                                                        }
                                                        onError={(event) => {

                                                            const target =
                                                                event.currentTarget;

                                                            target.style.display =
                                                                "none";

                                                            const parent =
                                                                target.parentElement;

                                                            if (parent) {

                                                                parent.classList.add(
                                                                    "image-fallback-visible"
                                                                );

                                                            }

                                                        }}
                                                    />

                                                ) : null}

                                                <div className="product-fallback">

                                                    {getProductInitial(
                                                        product.productName
                                                    )}

                                                </div>

                                            </div>

                                            {/* DETAILS */}

                                            <div className="order-product-details">

                                                <h4>
                                                    {product.productName}
                                                </h4>

                                                {product.description && (

                                                    <p>
                                                        {product.description}
                                                    </p>

                                                )}

                                                <div className="product-meta">

                                                    {product.category && (

                                                        <span>
                                                            {product.category}
                                                        </span>

                                                    )}

                                                    <span>
                                                        Qty:{" "}
                                                        {product.quantity}
                                                    </span>

                                                </div>

                                            </div>

                                            {/* PRICE */}

                                            <div className="order-product-price">

                                                {discount > 0 && (

                                                    <div className="original-price">

                                                        ₹
                                                        {originalPrice.toFixed(2)}

                                                    </div>

                                                )}

                                                <strong>

                                                    ₹
                                                    {(
                                                        finalPrice *
                                                        product.quantity
                                                    ).toFixed(2)}

                                                </strong>

                                                {discount > 0 && (

                                                    <small>
                                                        {discount}% OFF
                                                    </small>

                                                )}

                                            </div>

                                        </div>

                                    );

                                }
                            )}

                        </div>

                    </div>

                    {/* =================================================
                        LOYALTY POINTS
                    ================================================= */}

                    <div className="checkout-card loyalty-card">

                        <div className="card-header-flex">

                            <div className="loyalty-heading">

                                <div className="loyalty-icon">
                                    <i className="bi bi-stars"></i>
                                </div>

                                <div>

                                    <h3>
                                        ShopSmart Loyalty
                                    </h3>

                                    <p>
                                        Use your points to save
                                        on this order
                                    </p>

                                </div>

                            </div>

                            {loyaltyAccount && (

                                <div className="tier-badge">

                                    <i className="bi bi-award"></i>

                                    {loyaltyAccount.tier}

                                </div>

                            )}

                        </div>

                        <div className="loyalty-balance-box">

                            <div>

                                <span>
                                    Available Points
                                </span>

                                <strong>

                                    {loadingLoyalty
                                        ? "..."
                                        : availablePoints}

                                </strong>

                            </div>

                            <div className="points-value">

                                <i className="bi bi-coin"></i>

                                1 point = ₹1

                            </div>

                        </div>

                        <div className="points-redeem-row">

                            <div className="points-input-wrapper">

                                <label>
                                    Points to redeem
                                </label>

                                <input
                                    type="number"
                                    min="0"
                                    max={
                                        Math.min(
                                            availablePoints,
                                            Math.floor(
                                                amountAfterVoucher
                                            )
                                        )
                                    }
                                    value={
                                        pointsToRedeem
                                    }
                                    onChange={(event) =>
                                        handlePointsChange(
                                            Number(
                                                event.target.value
                                            )
                                        )
                                    }
                                />

                            </div>

                            <button
                                className="use-points-button"
                                onClick={useAllPoints}
                                disabled={
                                    availablePoints <= 0
                                }
                            >
                                Use Maximum
                            </button>

                        </div>

                        {pointsToRedeem > 0 && (

                            <div className="points-saving">

                                <i className="bi bi-check-circle-fill"></i>

                                You are saving{" "}

                                <strong>
                                    ₹
                                    {pointsToRedeem.toFixed(2)}
                                </strong>

                                {" "}

                                using loyalty points.

                            </div>

                        )}

                    </div>

                    {/* =================================================
                        VOUCHERS
                    ================================================= */}

                    <div className="checkout-card voucher-card">

                        <div className="card-header-flex">

                            <div className="loyalty-heading">

                                <div className="voucher-icon">

                                    <i className="bi bi-ticket-perforated"></i>

                                </div>

                                <div>

                                    <h3>
                                        Coupons & Vouchers
                                    </h3>

                                    <p>
                                        Apply a voucher and save on your order.
                                    </p>

                                </div>

                            </div>

                        </div>

                        {/* AVAILABLE VOUCHERS */}

                        {!appliedVoucher && (

                            <div style={{ marginTop: "15px" }}>

                                {loadingVouchers ? (

                                    <div className="voucher-minimum">
                                        <i className="bi bi-arrow-repeat"></i>
                                        {" "}
                                        Loading available vouchers...
                                    </div>

                                ) : availableVouchers.length > 0 ? (

                                    <div>

                                        <div
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "space-between",
                                                marginBottom: "10px"
                                            }}
                                        >
                                            <strong>
                                                Available Vouchers
                                            </strong>

                                            <span
                                                style={{
                                                    fontSize: "13px",
                                                    opacity: 0.7
                                                }}
                                            >
                                                {availableVouchers.length} available
                                            </span>
                                        </div>

                                        <div
                                            style={{
                                                display: "flex",
                                                flexDirection: "column",
                                                gap: "8px"
                                            }}
                                        >

                                            {availableVouchers.map(
                                                (voucher) => (

                                                    <div
                                                        key={voucher.voucherId}
                                                        style={{
                                                            display: "flex",
                                                            alignItems: "center",
                                                            justifyContent: "space-between",
                                                            gap: "12px",
                                                            padding: "12px",
                                                            border: "1px solid #e5e5e5",
                                                            borderRadius: "8px"
                                                        }}
                                                    >

                                                        <div>

                                                            <strong>
                                                                {voucher.voucherCode}
                                                            </strong>

                                                            <div
                                                                style={{
                                                                    fontSize: "13px",
                                                                    marginTop: "4px"
                                                                }}
                                                            >
                                                                {Number(
                                                                    voucher.discountPercentage
                                                                ).toFixed(0)}% OFF
                                                                {" • "}
                                                                Min. order ₹
                                                                {Number(
                                                                    voucher.minimumOrderAmount ?? 0
                                                                ).toFixed(2)}
                                                            </div>

                                                        </div>

                                                        <button
                                                            type="button"
                                                            className="text-button"
                                                            onClick={() => {
                                                                setVoucherCode(
                                                                    voucher.voucherCode
                                                                );
                                                                setVoucherError("");
                                                                setVoucherMessage("");
                                                                showSnackbar(
                                                                    "info",
                                                                    `${voucher.voucherCode} selected. Click Apply to use it.`
                                                                );
                                                            }}
                                                        >
                                                            Use
                                                        </button>

                                                    </div>

                                                )
                                            )}

                                        </div>

                                    </div>

                                ) : (

                                    <div className="voucher-minimum">
                                        <i className="bi bi-info-circle"></i>
                                        {" "}
                                        No active vouchers are available for this shop.
                                    </div>

                                )}

                            </div>

                        )}

                        {/* APPLY VOUCHER */}

                        {!appliedVoucher ? (

                            <>

                                <div
                                    style={{
                                        display: "flex",
                                        gap: "10px",
                                        alignItems: "center",
                                        marginTop: "15px"
                                    }}
                                >

                                    <input
                                        type="text"
                                        value={voucherCode}
                                        onChange={(event) => {
                                            setVoucherCode(
                                                event.target.value.toUpperCase()
                                            );
                                            setVoucherError("");
                                            setVoucherMessage("");
                                        }}
                                        placeholder="Enter voucher code"
                                        disabled={voucherLoading}
                                        style={{
                                            flex: 1,
                                            padding: "12px",
                                            borderRadius: "8px",
                                            border: "1px solid #ddd",
                                            textTransform: "uppercase"
                                        }}
                                    />

                                    <button
                                        type="button"
                                        className="use-points-button"
                                        onClick={applyVoucher}
                                        disabled={voucherLoading}
                                    >
                                        {voucherLoading
                                            ? "Applying..."
                                            : "Apply"}
                                    </button>

                                </div>

                                {voucherError && (

                                    <div
                                        className="voucher-minimum"
                                        style={{ marginTop: "12px" }}
                                    >
                                        <i className="bi bi-exclamation-circle"></i>
                                        {" "}
                                        {voucherError}
                                    </div>

                                )}

                            </>

                        ) : (

                            <div
                                className="voucher-minimum"
                                style={{
                                    marginTop: "15px",
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    gap: "12px"
                                }}
                            >

                                <div>

                                    <strong>
                                        <i className="bi bi-check-circle-fill"></i>
                                        {" "}
                                        {appliedVoucher.voucherCode} applied
                                    </strong>

                                    <div style={{ marginTop: "5px" }}>
                                        {Number(
                                            appliedVoucher.discountPercentage
                                        ).toFixed(0)}% discount
                                        {" • "}
                                        You save ₹
                                        {voucherDiscount.toFixed(2)}
                                    </div>

                                </div>

                                <button
                                    type="button"
                                    className="text-button"
                                    onClick={removeVoucher}
                                >
                                    Remove
                                </button>

                            </div>

                        )}

                        {voucherMessage && !voucherError && (

                            <div
                                className="points-saving"
                                style={{ marginTop: "12px" }}
                            >
                                <i className="bi bi-check-circle-fill"></i>
                                {" "}
                                {voucherMessage}
                            </div>

                        )}

                    </div>

                    {/* =================================================
                        PAYMENT
                    ================================================= */}

                    <div className="checkout-card payment-card">

                        <div className="card-header-flex">

                            <div>

                                <h3>
                                    Payment Method
                                </h3>

                                <p>
                                    Choose how you'd like to pay
                                </p>

                            </div>

                            <i className="bi bi-lock-fill payment-lock"></i>

                        </div>

                        <div className="payment-methods">

                            {/* UPI */}

                            <button
                                className={
                                    paymentMethod === "UPI"
                                        ? "payment-method active"
                                        : "payment-method"
                                }
                                onClick={() =>
                                    setPaymentMethod("UPI")
                                }
                            >

                                <div className="payment-radio">

                                    <span>
                                        {paymentMethod === "UPI"
                                            ? "✓"
                                            : ""}
                                    </span>

                                </div>

                                <div className="payment-icon upi-icon">

                                    <i className="bi bi-qr-code"></i>

                                </div>

                                <div className="payment-method-info">

                                    <strong>
                                        UPI
                                    </strong>

                                    <small>
                                        Google Pay, PhonePe,
                                        Paytm & more
                                    </small>

                                </div>

                                <i className="bi bi-chevron-right"></i>

                            </button>

                            {/* COD */}

                            <button
                                className={
                                    paymentMethod === "COD"
                                        ? "payment-method active"
                                        : "payment-method"
                                }
                                onClick={() =>
                                    setPaymentMethod("COD")
                                }
                            >

                                <div className="payment-radio">

                                    <span>
                                        {paymentMethod === "COD"
                                            ? "✓"
                                            : ""}
                                    </span>

                                </div>

                                <div className="payment-icon cod-icon">

                                    <i className="bi bi-cash-stack"></i>

                                </div>

                                <div className="payment-method-info">

                                    <strong>
                                        Cash on Delivery
                                    </strong>

                                    <small>
                                        Pay when your order arrives
                                    </small>

                                </div>

                                <i className="bi bi-chevron-right"></i>

                            </button>

                        </div>

                        {/* =================================================
                            CONDITIONAL UPI SECTION
                        ================================================= */}

                        {paymentMethod === "UPI" && (

                            <div className="upi-payment-panel">

                                <div className="upi-panel-header">

                                    <div>

                                        <h4>
                                            Scan & Pay
                                        </h4>

                                        <p>
                                            Scan the QR code using
                                            any UPI app
                                        </p>

                                    </div>

                                    <div className="upi-secure">

                                        <i className="bi bi-shield-check"></i>

                                        Secure

                                    </div>

                                </div>

                                <div className="upi-payment-content">

                                    <div className="qr-wrapper">

                                        <div className="qr-inner">

                                            <QRCodeCanvas
                                                value={
                                                    upiPaymentLink
                                                }
                                                size={190}
                                                bgColor="#ffffff"
                                                fgColor="#111111"
                                                level="H"
                                            />

                                        </div>

                                        <span>
                                            Scan with your
                                            UPI app
                                        </span>

                                    </div>

                                    <div className="upi-details">

                                        <div className="upi-amount-box">

                                            <span>
                                                Amount to Pay
                                            </span>

                                            <strong>

                                                ₹
                                                {finalAmount
                                                }

                                            </strong>

                                        </div>

                                        <div className="upi-id-box">

                                            <span>
                                                UPI ID
                                            </span>

                                            <strong>
                                                {SHOPSMART_UPI_ID}
                                            </strong>

                                        </div>

                                        <div className="upi-steps">

                                            <div>

                                                <span>
                                                    1
                                                </span>

                                                <p>
                                                    Open your UPI
                                                    payment app
                                                </p>

                                            </div>

                                            <div>

                                                <span>
                                                    2
                                                </span>

                                                <p>
                                                    Scan the QR code
                                                </p>

                                            </div>

                                            <div>

                                                <span>
                                                    3
                                                </span>

                                                <p>
                                                    Complete payment
                                                </p>

                                            </div>

                                            <div>

                                                <span>
                                                    4
                                                </span>

                                                <p>
                                                    Enter your UPI
                                                    reference ID below
                                                </p>

                                            </div>

                                        </div>

                                    </div>

                                </div>

                                <div className="upi-reference">

                                    <label>
                                        UPI Reference ID
                                    </label>

                                    <input
                                        type="text"
                                        placeholder="Enter 12-digit UPI transaction ID"
                                        value={
                                            upiTransactionId
                                        }
                                        onChange={(event) =>
                                            setUpiTransactionId(
                                                event.target.value
                                            )
                                        }
                                        maxLength={30}
                                    />

                                    <small>
                                        This is the transaction
                                        reference number shown
                                        after successful payment.
                                    </small>

                                </div>

                            </div>

                        )}

                        {/* =================================================
                            COD CONDITIONAL SECTION
                        ================================================= */}

                        {paymentMethod === "COD" && (

                            <div className="cod-payment-panel">

                                <div className="cod-icon-large">

                                    <i className="bi bi-box-seam"></i>

                                </div>

                                <div>

                                    <h4>
                                        Cash on Delivery
                                    </h4>

                                    <p>

                                        Pay ₹
                                        {finalAmount.toFixed(2)}
                                        {" "}
                                        in cash when your
                                        order is delivered.

                                    </p>

                                    <span>

                                        <i className="bi bi-check-circle-fill"></i>

                                        No online payment required

                                    </span>

                                </div>

                            </div>

                        )}

                    </div>

                    {/* =================================================
                        LOYALTY HISTORY
                    ================================================= */}

                    {transactions.length > 0 && (

                        <div className="checkout-card transaction-card">

                            <div className="card-header-flex">

                                <div>

                                    <h3>
                                        Loyalty Activity
                                    </h3>

                                    <p>
                                        Your recent points activity
                                    </p>

                                </div>

                                <i className="bi bi-clock-history"></i>

                            </div>

                            <div className="transaction-list">

                                {transactions
                                    .slice(0, 4)
                                    .map(
                                        (
                                            transaction,
                                            index
                                        ) => (

                                            <div
                                                className="transaction-item"
                                                key={
                                                    transaction.transactionId ??
                                                    index
                                                }
                                            >

                                                <div
                                                    className={
                                                        transaction.transactionType
                                                            ?.toUpperCase() ===
                                                        "EARNED"
                                                            ? "transaction-icon earned"
                                                            : "transaction-icon redeemed"
                                                    }
                                                >

                                                    <i
                                                        className={
                                                            transaction.transactionType
                                                                ?.toUpperCase() ===
                                                            "EARNED"
                                                                ? "bi bi-plus-lg"
                                                                : "bi bi-dash-lg"
                                                        }
                                                    ></i>

                                                </div>

                                                <div className="transaction-info">

                                                    <strong>
                                                        {
                                                            transaction.transactionType
                                                        }
                                                    </strong>

                                                    <span>
                                                        {
                                                            transaction.description ??
                                                            "Loyalty points transaction"
                                                        }
                                                    </span>

                                                </div>

                                                <strong
                                                    className={
                                                        transaction.transactionType
                                                            ?.toUpperCase() ===
                                                        "EARNED"
                                                            ? "transaction-points earned-text"
                                                            : "transaction-points redeemed-text"
                                                    }
                                                >

                                                    {
                                                        transaction.transactionType
                                                            ?.toUpperCase() ===
                                                        "EARNED"
                                                            ? "+"
                                                            : "-"
                                                    }

                                                    {transaction.points}

                                                </strong>

                                            </div>

                                        )
                                    )}

                            </div>

                        </div>

                    )}

                </section>

                {/* =================================================
                    RIGHT SUMMARY
                ================================================= */}

                <aside className="order-summary-column">

                    <div className="summary-card">

                        <div className="summary-title">

                            <h3>
                                Price Details
                            </h3>

                            <span>
                                {cartItems.length} items
                            </span>

                        </div>

                        {/* SUBTOTAL */}

                        <div className="summary-row">

                            <span>
                                Subtotal
                            </span>

                            <strong>

                                ₹
                                {subTotal.toFixed(2)}

                            </strong>

                        </div>

                        {/* VOUCHER */}

                        {voucherDiscount > 0 && (

                            <div className="summary-row loyalty-discount-row">

                                <span>
                                    Voucher Discount
                                </span>

                                <strong>
                                    -₹
                                    {voucherDiscount.toFixed(2)}
                                </strong>

                            </div>

                        )}

                        {/* LOYALTY */}

                        {pointsToRedeem > 0 && (

                            <div className="summary-row loyalty-discount-row">

                                <span>
                                    Loyalty Points
                                </span>

                                <strong>

                                    -₹
                                    {pointsToRedeem.toFixed(2)}

                                </strong>

                            </div>

                        )}

                        {/* DELIVERY */}

                        <div className="summary-row">

                            <span>
                                Delivery
                            </span>

                            <strong className="free-text">
                                FREE
                            </strong>

                        </div>

                        <div className="summary-divider"></div>

                        {/* TOTAL */}

                        <div className="summary-total">

                            <span>
                                Total Amount
                            </span>

                            <strong>

                                ₹
                                {finalAmount.toFixed(2)}

                            </strong>

                        </div>

                        {/* SAVINGS */}

                        {pointsToRedeem > 0 && (

                            <div className="total-saving">

                                <i className="bi bi-piggy-bank-fill"></i>

                                You're saving ₹
                               {(pointsToRedeem + (voucherprice ?? 0)).toFixed(2)}
                                {" "}
                                on this order

                            </div>

                        )}

                        {/* EARNED POINTS */}

                        <div className="earning-preview">

                            <div className="earning-icon">

                                <i className="bi bi-stars"></i>

                            </div>

                            <div>

                                <span>
                                    You'll earn
                                </span>

                                <strong>

                                    {estimatedPointsEarned}
                                    {" "}
                                    points

                                </strong>

                            </div>

                        </div>

                        {/* PLACE ORDER */}

                        <button
                            className="place-order-button"
                            onClick={placeOrder}
                            disabled={
                                processingOrder
                            }
                        >

                            {processingOrder ? (

                                <>

                                    <span className="button-spinner"></span>

                                    Processing...

                                </>

                            ) : (

                                <>

                                    <i className="bi bi-lock-fill"></i>

                                    Place Order

                                    <span>

                                        ₹
                                        {finalAmount.toFixed(2)}

                                    </span>

                                </>

                            )}

                        </button>

                        <div className="secure-note">

                            <i className="bi bi-shield-lock-fill"></i>

                            Your payment information
                            is encrypted and secure.

                        </div>

                    </div>

                    {/* =================================================
                        TRUST CARD
                    ================================================= */}

                    <div className="trust-card">

                        <div className="trust-item">

                            <i className="bi bi-shield-check"></i>

                            <div>

                                <strong>
                                    Secure Payments
                                </strong>

                                <span>
                                    100% protected checkout
                                </span>

                            </div>

                        </div>

                        <div className="trust-item">

                            <i className="bi bi-arrow-repeat"></i>

                            <div>

                                <strong>
                                    Easy Returns
                                </strong>

                                <span>
                                    Hassle-free support
                                </span>

                            </div>

                        </div>

                        <div className="trust-item">

                            <i className="bi bi-headset"></i>

                            <div>

                                <strong>
                                    ShopSmart Support
                                </strong>

                                <span>
                                    We're here to help
                                </span>

                            </div>

                        </div>

                    </div>

                    <button
                        className="continue-shopping-button"
                        onClick={
                            continueShopping
                        }
                    >

                        <i className="bi bi-arrow-left"></i>

                        Continue Shopping

                    </button>

                </aside>

            </main>

            {/* =================================================
                FOOTER
            ================================================= */}

            <footer className="order-footer">

                <span>

                    © {new Date().getFullYear()}
                    {" "}
                    ShopSmart

                </span>

                <span>
                    Secure Checkout
                </span>

                <span>
                    Privacy Protected
                </span>

            </footer>

        </div>
    );
}

export default OrderPage;