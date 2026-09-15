import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../Cart.css";

interface CartProduct {
  id?: number;

  customerId?: number;
  productId?: number;

  productName?: string;
  description?: string;

  originalPrice?: number;
  price?: number;
  discount?: number;

  quantity?: number;

  stockLeft?: number;
  stockUsed?: number;

  category?: string;
  shopId?: number;

  imageUrl?: string;

  createdAt?: string;
  updatedAt?: string;
}

interface JwtPayload {
  sub?: string;
  userId?: number;
  role?: string;
  iat?: number;
  exp?: number;
}

// ============================================================
// CART ENDPOINT
// ============================================================

const CART_URL = "http://localhost:8083/shopsmart/cart";

// ============================================================
// JWT PAYLOAD
// ============================================================

function getJwtPayload(): JwtPayload | null {
  try {
    const token = localStorage.getItem("shopsmart_token");

    if (!token) {
      console.error("ShopSmart JWT token not found.");
      return null;
    }

    const parts = token.split(".");

    if (parts.length !== 3) {
      console.error("Invalid JWT token.");
      return null;
    }

    const base64Url = parts[1];

    const base64 = base64Url
      .replace(/-/g, "+")
      .replace(/_/g, "/");

    const paddedBase64 =
      base64 + "=".repeat((4 - (base64.length % 4)) % 4);

    const jsonPayload = decodeURIComponent(
      atob(paddedBase64)
        .split("")
        .map(
          (char) =>
            "%" +
            ("00" + char.charCodeAt(0).toString(16)).slice(-2)
        )
        .join("")
    );

    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error("Unable to decode JWT:", error);
    return null;
  }
}

// ============================================================
// CART COMPONENT
// ============================================================

export function Cart() {
  const navigate = useNavigate();

  const [cartProducts, setCartProducts] =
    useState<CartProduct[]>([]);

  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [updatingProductId, setUpdatingProductId] =
    useState<number | null>(null);

  // ==========================================================
  // GET USER ID
  // ==========================================================

  const getUserIdFromToken = (): number | null => {
    const jwtPayload = getJwtPayload();

    if (!jwtPayload) {
      return null;
    }

    const userId = jwtPayload.userId;

    if (!userId) {
      console.error(
        "JWT does not contain userId:",
        jwtPayload
      );

      return null;
    }

    return userId;
  };

  // ==========================================================
  // FETCH CART
  // ==========================================================

  const fetchCart = async () => {
    try {
      setLoading(true);
      setError("");

      const token =
        localStorage.getItem("shopsmart_token");

      if (!token) {
        setError(
          "Your session has expired. Please log in again."
        );
        return;
      }

      const userId =
        getUserIdFromToken();

      if (!userId) {
        setError(
          "Unable to identify your account. Please log in again."
        );
        return;
      }

      const response = await axios.get(
        `${CART_URL}/${userId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log(
        "CART RESPONSE:",
        response.data
      );

      setCartProducts(
        Array.isArray(response.data)
          ? response.data
          : []
      );
    } catch (err: any) {
      console.error(
        "Failed to load cart:",
        err
      );

      if (err?.response?.status === 401) {
        setError(
          "Your login session is no longer valid. Please log in again."
        );
      } else if (err?.response?.status === 403) {
        setError(
          "You do not have permission to access this cart."
        );
      } else {
        setError(
          "Unable to load your cart right now. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // ==========================================================
  // LOAD CART
  // ==========================================================

  useEffect(() => {
    fetchCart();
  }, []);

  // ==========================================================
  // PRODUCT ID
  // ==========================================================

  const getProductId = (
    product: CartProduct
  ): number | null => {
    return product.productId ?? null;
  };

  // ==========================================================
  // QUANTITY
  // ==========================================================

  const getQuantity = (
    product: CartProduct
  ): number => {
    return product.quantity && product.quantity > 0
      ? product.quantity
      : 1;
  };

  // ==========================================================
  // ORIGINAL PRICE
  // ==========================================================

  const getOriginalPrice = (
    product: CartProduct
  ): number => {
    return Number(product.originalPrice ?? 0);
  };

  // ==========================================================
  // DISCOUNT
  // ==========================================================

  const getDiscount = (
    product: CartProduct
  ): number => {
    return Number(product.discount ?? 0);
  };

  // ==========================================================
  // FINAL PRICE
  // ==========================================================

  const getFinalPrice = (
    product: CartProduct
  ): number => {
    // If backend already returned price, use it.
    if (
      product.price !== undefined &&
      product.price !== null
    ) {
      return Number(product.price);
    }

    const originalPrice =
      getOriginalPrice(product);

    const discount =
      getDiscount(product);

    const finalPrice =
      originalPrice -
      (originalPrice * discount) / 100;

    return Math.round(finalPrice * 100) / 100;
  };

  // ==========================================================
  // FALLBACK IMAGE
  // ==========================================================

  const getFallbackImage = (
    product: CartProduct
  ): string => {
    const category =
      product.category?.toLowerCase() || "";

    if (category.includes("electronic")) {
      return "https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&w=800&q=80";
    }

    if (
      category.includes("grocery") ||
      category.includes("food")
    ) {
      return "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80";
    }

    if (
      category.includes("cloth") ||
      category.includes("fashion")
    ) {
      return "https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=800&q=80";
    }

    if (
      category.includes("home") ||
      category.includes("furniture")
    ) {
      return "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80";
    }

    return "https://images.unsplash.com/photo-1607082349566-187342175e2f?auto=format&fit=crop&w=800&q=80";
  };

  // ==========================================================
  // IMAGE COMPONENT
  // ==========================================================

  const ProductImage = ({
    product,
  }: {
    product: CartProduct;
  }) => {
    const [imageSrc, setImageSrc] = useState(
      product.imageUrl || getFallbackImage(product)
    );

    const [failed, setFailed] = useState(false);

    return (
      <div className="cart-product-image">
        {!failed ? (
          <img
            src={imageSrc}
            alt={product.productName || "Product"}
            loading="lazy"
            onError={() => {
              // If product image fails, use stable fallback.
              if (
                product.imageUrl &&
                imageSrc !== getFallbackImage(product)
              ) {
                setImageSrc(
                  getFallbackImage(product)
                );
              } else {
                setFailed(true);
              }
            }}
          />
        ) : (
          <div className="cart-product-placeholder">
            <i className="bi bi-box-seam"></i>

            <span>
              {product.productName?.charAt(0) || "P"}
            </span>
          </div>
        )}

        <div className="cart-image-overlay">
          <i className="bi bi-eye"></i>
        </div>
      </div>
    );
  };

  // ==========================================================
  // INCREASE QUANTITY
  // ==========================================================

  const increaseQuantity = async (
    product: CartProduct
  ) => {
    const productId =
      getProductId(product);

    const token =
      localStorage.getItem(
        "shopsmart_token"
      );

    const userId =
      getUserIdFromToken();

    if (!productId || !userId || !token) {
      setError(
        "Your session has expired. Please log in again."
      );
      return;
    }

    const currentQuantity =
      getQuantity(product);

    const stockLeft =
      Number(product.stockLeft ?? 0);

    // Prevent exceeding available stock.
    if (
      stockLeft > 0 &&
      currentQuantity >= stockLeft
    ) {
      setError(
        `Only ${stockLeft} units are available for ${product.productName}.`
      );
      return;
    }

    try {
      setUpdatingProductId(productId);
      setError("");

      // SAME existing backend endpoint.
      //
      // Existing product:
      // customerId + productId + quantity 1
      //
      // Backend will increment the existing quantity.

      await axios.post(
        `${CART_URL}/add`,
        {
          customerId: userId,
          productId: productId,
          quantity: 1,
        },
        {
          headers: {
            Authorization:
              `Bearer ${token}`,
            "Content-Type":
              "application/json",
          },
        }
      );

      // Update frontend immediately.
      setCartProducts(
        (previousProducts) =>
          previousProducts.map(
            (item) => {
              if (
                getProductId(item) ===
                productId
              ) {
                return {
                  ...item,
                  quantity:
                    getQuantity(item) + 1,
                };
              }

              return item;
            }
          )
      );
    } catch (err: any) {
      console.error(
        "Failed to increase quantity:",
        err
      );

      if (
        err?.response?.status === 400
      ) {
        setError(
          err?.response?.data ||
          "Unable to increase quantity."
        );
      } else {
        setError(
          "Unable to increase product quantity."
        );
      }
    } finally {
      setUpdatingProductId(null);
    }
  };

  // ==========================================================
  // DECREASE QUANTITY
  // ==========================================================

  const decreaseQuantity = async (
    product: CartProduct
  ) => {
    const productId =
      getProductId(product);

    const token =
      localStorage.getItem(
        "shopsmart_token"
      );

    const userId =
      getUserIdFromToken();

    if (!productId || !userId || !token) {
      setError(
        "Your session has expired. Please log in again."
      );
      return;
    }

    const currentQuantity =
      getQuantity(product);

    try {
      setUpdatingProductId(productId);
      setError("");

      // Use the EXISTING backend remove endpoint.
      await axios.post(
        `${CART_URL}/remove`,
        {
          customerId: userId,
          productId: productId,
          quantity: 1,
        },
        {
          headers: {
            Authorization:
              `Bearer ${token}`,
            "Content-Type":
              "application/json",
          },
        }
      );

      if (currentQuantity <= 1) {
        setCartProducts(
          (previousProducts) =>
            previousProducts.filter(
              (item) =>
                getProductId(item) !==
                productId
            )
        );
      } else {
        setCartProducts(
          (previousProducts) =>
            previousProducts.map(
              (item) => {
                if (
                  getProductId(item) ===
                  productId
                ) {
                  return {
                    ...item,
                    quantity:
                      getQuantity(item) - 1,
                  };
                }

                return item;
              }
            )
        );
      }
    } catch (err: any) {
      console.error(
        "Failed to decrease quantity:",
        err
      );

      setError(
        "Unable to decrease product quantity."
      );
    } finally {
      setUpdatingProductId(null);
    }
  };

  // ==========================================================
  // REMOVE ENTIRE PRODUCT
  // ==========================================================

  const removeProduct = async (
    product: CartProduct
  ) => {
    const productId =
      getProductId(product);

    const token =
      localStorage.getItem(
        "shopsmart_token"
      );

    const userId =
      getUserIdFromToken();

    if (!productId || !userId || !token) {
      setError(
        "Your session has expired. Please log in again."
      );
      return;
    }

    const quantity =
      getQuantity(product);

    try {
      setUpdatingProductId(productId);
      setError("");

      // Remove complete quantity using
      // existing /remove endpoint.

      await axios.post(
        `${CART_URL}/remove`,
        {
          customerId: userId,
          productId: productId,
          quantity: quantity,
        },
        {
          headers: {
            Authorization:
              `Bearer ${token}`,
            "Content-Type":
              "application/json",
          },
        }
      );

      setCartProducts(
        (previousProducts) =>
          previousProducts.filter(
            (item) =>
              getProductId(item) !==
              productId
          )
      );
    } catch (err: any) {
      console.error(
        "Failed to remove product:",
        err
      );

      setError(
        "Unable to remove this product from your cart."
      );
    } finally {
      setUpdatingProductId(null);
    }
  };

  // ==========================================================
  // SEARCH
  // ==========================================================

  const filteredCartProducts =
    useMemo(() => {
      const searchText =
        search.toLowerCase().trim();

      if (!searchText) {
        return cartProducts;
      }

      return cartProducts.filter(
        (product) =>
          product.productName
            ?.toLowerCase()
            .includes(searchText) ||
          product.description
            ?.toLowerCase()
            .includes(searchText) ||
          product.category
            ?.toLowerCase()
            .includes(searchText)
      );
    }, [
      cartProducts,
      search,
    ]);

  // ==========================================================
  // TOTAL ITEMS
  // ==========================================================

  const totalItems =
    cartProducts.reduce(
      (total, product) =>
        total + getQuantity(product),
      0
    );

  // ==========================================================
  // TOTAL PRICE
  // ==========================================================

  const totalPrice =
    cartProducts.reduce(
      (total, product) =>
        total +
        getFinalPrice(product) *
          getQuantity(product),
      0
    );

  // ==========================================================
  // LOYALTY POINTS
  // ==========================================================

  const loyaltyPoints =
    Math.floor(totalPrice / 100);

  // ==========================================================
  // CHECKOUT
  // ==========================================================

  const handleCheckout = () => {
    if (cartProducts.length === 0) {
      return;
    }

    navigate(
      "/order",
      {
        state: {
          products: cartProducts,
          totalPrice: totalPrice,
          loyaltyPoints:
            loyaltyPoints,
          totalItems: totalItems,
        },
      }
    );
  };

 
  const continueShopping = () => {
    navigate("/");
  };

  // ==========================================================
  // LOADING
  // ==========================================================

  if (loading) {
    return (
      <div className="cart-page">
        <div className="cart-container">
          <div className="cart-loading">
            <div className="cart-loading-spinner"></div>

            <h3>
              Loading your cart...
            </h3>

            <p>
              We're fetching your selected
              products.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================================
  // ERROR
  // ==========================================================

  if (error && cartProducts.length === 0) {
    return (
      <div className="cart-page">
        <div className="cart-container">
          <div className="cart-error">
            <div className="cart-error-icon">
              <i className="bi bi-exclamation-triangle"></i>
            </div>

            <h2>
              Something went wrong
            </h2>

            <p>
              {error}
            </p>

            <button
              className="cart-primary-button"
              onClick={() =>
                window.location.reload()
              }
            >
              <i className="bi bi-arrow-clockwise"></i>
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================================
  // EMPTY CART
  // ==========================================================

  if (cartProducts.length === 0) {
    return (
      <div className="cart-page">
        <div className="cart-container">

          <button
            className="cart-back-button"
            onClick={continueShopping}
          >
            <i className="bi bi-arrow-left"></i>
            Back
          </button>

          <div className="cart-header">
            <div>
              <span className="cart-section-label">
                SHOPSMART CART
              </span>

              <h1>
                Your <span>Cart</span>
              </h1>

              <p>
                Everything you want to take home.
              </p>
            </div>
          </div>

          <div className="empty-cart">
            <div className="empty-cart-icon">
              <i className="bi bi-cart3"></i>
            </div>

            <h2>
              Your cart is empty
            </h2>

            <p>
              Looks like you haven't added
              anything yet.
            </p>

            <button
              className="cart-primary-button"
              onClick={continueShopping}
            >
              <i className="bi bi-arrow-left"></i>
              Continue Shopping
            </button>
          </div>

        </div>
      </div>
    );
  }

  // ==========================================================
  // MAIN CART
  // ==========================================================

  return (
    <div className="cart-page">

      <div className="cart-container">

        {/* =====================================================
            HEADER
        ====================================================== */}

        <div className="cart-top-row">

          <button
            className="cart-back-button"
            onClick={continueShopping}
          >
            <i className="bi bi-arrow-left"></i>
            Back
          </button>

          <div className="cart-item-summary">
            <i className="bi bi-cart-check"></i>

            <span>
              {totalItems}{" "}
              {totalItems === 1
                ? "item"
                : "items"}
            </span>
          </div>

        </div>

        <div className="cart-header">

          <div>
            <span className="cart-section-label">
              SHOPSMART CART
            </span>

            <h1>
              Your <span>Cart</span>
            </h1>

            <p>
              Review your products before checkout.
            </p>
          </div>

        </div>

        {/* =====================================================
            SEARCH
        ====================================================== */}

        <div className="cart-search-container">

          <i className="bi bi-search"></i>

          <input
            type="text"
            placeholder="Search products in your cart..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
          />

          {search && (
            <button
              onClick={() =>
                setSearch("")
              }
              className="cart-search-clear"
            >
              <i className="bi bi-x"></i>
            </button>
          )}

        </div>

        {/* =====================================================
            INLINE ERROR
        ====================================================== */}

        {error && (
          <div className="cart-inline-error">
            <i className="bi bi-exclamation-circle"></i>
            {error}

            <button
              onClick={() =>
                setError("")
              }
            >
              <i className="bi bi-x"></i>
            </button>
          </div>
        )}

        {/* =====================================================
            MAIN LAYOUT
        ====================================================== */}

        <div className="cart-layout">

          {/* ===================================================
              PRODUCTS
          ==================================================== */}

          <div className="cart-products-section">

            <div className="cart-products-header">

              <div>
                <span className="cart-mini-label">
                  YOUR SELECTION
                </span>

                <h2>
                  Cart Items
                </h2>
              </div>

              <span>
                {filteredCartProducts.length} shown
              </span>

            </div>

            {filteredCartProducts.length === 0 ? (

              <div className="cart-no-results">

                <i className="bi bi-search"></i>

                <h3>
                  No matching products
                </h3>

                <p>
                  Try a different search term.
                </p>

              </div>

            ) : (

              <div className="cart-product-list">

                {filteredCartProducts.map(
                  (product, index) => {

                    const productId =
                      getProductId(product);

                    const quantity =
                      getQuantity(product);

                    const originalPrice =
                      getOriginalPrice(product);

                    const discount =
                      getDiscount(product);

                    const finalPrice =
                      getFinalPrice(product);

                    const itemTotal =
                      finalPrice * quantity;

                    const isUpdating =
                      updatingProductId ===
                      productId;

                    return (

                      <div
                        className="cart-product-card"
                        key={
                          productId ??
                          `cart-${index}`
                        }
                      >

                        {/* IMAGE */}

                        <ProductImage
                          product={product}
                        />

                        {/* DETAILS */}

                        <div className="cart-product-details">

                          <div className="cart-product-top">

                            <div className="cart-product-info">

                              {product.category && (
                                <span className="cart-product-category">
                                  {product.category}
                                </span>
                              )}

                              <h3>
                                {product.productName ||
                                  "Unnamed Product"}
                              </h3>

                              {product.description && (
                                <p>
                                  {product.description}
                                </p>
                              )}

                              <div className="cart-product-meta">

                                <span>
                                  Product ID:{" "}
                                  <strong>
                                    {product.productId}
                                  </strong>
                                </span>

                                {product.shopId !==
                                  undefined && (
                                  <span>
                                    Shop:{" "}
                                    <strong>
                                      {product.shopId}
                                    </strong>
                                  </span>
                                )}

                              </div>

                            </div>

                            <button
                              className="remove-cart-button"
                              onClick={() =>
                                removeProduct(
                                  product
                                )
                              }
                              disabled={isUpdating}
                              title="Remove product"
                            >

                              {isUpdating ? (
                                <span className="remove-spinner"></span>
                              ) : (
                                <i className="bi bi-trash3"></i>
                              )}

                            </button>

                          </div>

                          {/* PRICE + QUANTITY */}

                          <div className="cart-product-bottom">

                            <div className="cart-price-area">

                              <div className="cart-price-line">

                                <span className="cart-final-price">
                                  ₹
                                  {finalPrice.toFixed(
                                    2
                                  )}
                                </span>

                                {discount > 0 && (
                                  <>
                                    <span className="cart-original-price">
                                      ₹
                                      {originalPrice.toFixed(
                                        2
                                      )}
                                    </span>

                                    <span className="cart-discount">
                                      {discount}% OFF
                                    </span>
                                  </>
                                )}

                              </div>

                              <span className="cart-price-label">
                                Price per item
                              </span>

                            </div>

                            {/* QUANTITY */}

                            <div className="cart-quantity-box">

                              <span className="cart-quantity-label">
                                Quantity
                              </span>

                              <div className="quantity-controls">

                                <button
                                  className="quantity-button"
                                  onClick={() =>
                                    decreaseQuantity(
                                      product
                                    )
                                  }
                                  disabled={
                                    isUpdating
                                  }
                                >
                                  <i className="bi bi-dash"></i>
                                </button>

                                <span className="quantity-value">
                                  {quantity}
                                </span>

                                <button
                                  className="quantity-button"
                                  onClick={() =>
                                    increaseQuantity(
                                      product
                                    )
                                  }
                                  disabled={
                                    isUpdating
                                  }
                                >
                                  <i className="bi bi-plus"></i>
                                </button>

                              </div>

                            </div>

                            {/* TOTAL */}

                            <div className="cart-product-total-area">

                              <span>
                                Item Total
                              </span>

                              <strong>
                                ₹
                                {itemTotal.toFixed(
                                  2
                                )}
                              </strong>

                            </div>

                          </div>

                          {/* STOCK */}

                          {product.stockLeft !==
                            undefined && (
                            <div className="cart-stock-row">

                              <i className="bi bi-box-seam"></i>

                              {product.stockLeft > 0 ? (
                                <span>
                                  {product.stockLeft}{" "}
                                  units available
                                </span>
                              ) : (
                                <span className="out-of-stock">
                                  Out of stock
                                </span>
                              )}

                            </div>
                          )}

                        </div>

                      </div>
                    );
                  }
                )}

              </div>
            )}

          </div>

          {/* ===================================================
              ORDER SUMMARY
          ==================================================== */}

          <aside className="cart-summary">

            <div className="cart-summary-header">

              <div>
                <span>
                  SHOPSMART
                </span>

                <h2>
                  Order Summary
                </h2>
              </div>

              <i className="bi bi-receipt"></i>

            </div>

            <div className="summary-row">

              <span>
                Items
              </span>

              <strong>
                {totalItems}
              </strong>

            </div>

            <div className="summary-row">

              <span>
                Subtotal
              </span>

              <strong>
                ₹{totalPrice.toFixed(2)}
              </strong>

            </div>

            <div className="summary-row">

              <span>
                Delivery
              </span>

              <strong className="free-text">
                FREE
              </strong>

            </div>

            <div className="summary-divider"></div>

            <div className="loyalty-summary-card">

              <div className="loyalty-summary-icon">
                <i className="bi bi-stars"></i>
              </div>

              <div>
                <span>
                  Loyalty Points
                </span>

                <strong>
                  +{loyaltyPoints} points
                </strong>
              </div>

            </div>

            <div className="summary-divider"></div>

            <div className="summary-total">

              <span>
                Total
              </span>

              <strong>
                ₹{totalPrice.toFixed(2)}
              </strong>

            </div>

            <button
              className="checkout-button"
              onClick={handleCheckout}
            >
              Proceed to Checkout
              <i className="bi bi-arrow-right"></i>
            </button>

            <button
              className="continue-shopping-button"
              onClick={continueShopping}
            >
              <i className="bi bi-arrow-left"></i>
              Continue Shopping
            </button>

            <div className="cart-secure-message">

              <i className="bi bi-shield-check"></i>

              <span>
                Secure ShopSmart checkout
              </span>

            </div>

          </aside>

        </div>

      </div>
    </div>
  );
}