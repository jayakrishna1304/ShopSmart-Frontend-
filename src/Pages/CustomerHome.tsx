import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import axios from "axios";
import "../CustomerHome.css";

interface Product {
  productId: number;
  productName: string;
  productDescription: string;
  originalPrice: number;
  shopId: number;
  productImageUrl: string;
  productCategory: string;
  productStockQuantity: number;
}

interface JwtPayload {
  sub?: string;
  userId?: number;
  role?: string;
  iat?: number;
  exp?: number;
}

interface AiMessage {
  sender: "user" | "ai";
  message: string;
}

const PRODUCT_URL = "http://localhost:8082/shopsmart/product";
const AI_URL = "http://localhost:8089/shopsmart/ai/chatbot";
const CART_URL = "http://localhost:8083/shopsmart/cart/add";

const categories = [
  { name: "Groceries", icon: "bi-basket2-fill", title: "Fresh groceries", description: "Everyday essentials from your local shops" },
  { name: "Electronics", icon: "bi-phone-fill", title: "Smart electronics", description: "Discover useful tech from nearby retailers" },
  { name: "Fashion", icon: "bi-handbag-fill", title: "Style & fashion", description: "Find something new from local stores" },
  { name: "Home", icon: "bi-house-heart-fill", title: "Home essentials", description: "Everything you need for your home" },
  { name: "Rewards", icon: "bi-stars", title: "Shop. Earn. Reward.", description: "Earn loyalty points every time you shop" },
];

function normalizeProduct(raw: any): Product {
  const imageValue =
    raw?.productImageUrl ??
    raw?.imageUrl ??
    raw?.productImage ??
    raw?.image ??
    raw?.product_image_url ??
    raw?.product_image ??
    "";

  return {
    productId: Number(raw?.productId ?? raw?.productid ?? raw?.id ?? 0),
    productName: String(
      raw?.productName ?? raw?.name ?? raw?.product_name ?? "Product"
    ).trim(),
    productDescription: String(
      raw?.productDescription ??
      raw?.description ??
      raw?.product_description ??
      raw?.productDesc ??
      ""
    ).trim(),
    originalPrice: Number(
      raw?.originalPrice ?? raw?.price ?? raw?.productPrice ?? 0
    ),
    shopId: Number(
      raw?.shopId ?? raw?.shopID ?? raw?.shop?.shopId ?? raw?.shop?.id ?? 0
    ),
    productImageUrl:
      typeof imageValue === "string" ? imageValue.trim() : "",
    productCategory: String(
      raw?.productCategory ??
      raw?.category ??
      raw?.product_category ??
      raw?.productCategoryName ??
      "General"
    ).trim(),
    productStockQuantity: Number(
      raw?.productStockQuantity ??
      raw?.stockLeft ??
      raw?.stockQuantity ??
      raw?.stock ??
      raw?.quantity ??
      0
    ),
  };
}

function resolveProductImage(imageUrl: string): string {
  if (!imageUrl) return "";

  // Absolute URL or data/blob URL: use exactly as supplied.
  if (/^(https?:|data:|blob:)/i.test(imageUrl)) return imageUrl;

  // Root-relative path from Product Service.
  if (imageUrl.startsWith("/")) {
    return `http://localhost:8082${imageUrl}`;
  }

  // Filename / relative path from Product Service.
  return `http://localhost:8082/${imageUrl.replace(/^\.?\//, "")}`;
}

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

    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const paddedBase64 = base64 + "=".repeat((4 - (base64.length % 4)) % 4);

    const jsonPayload = decodeURIComponent(
      atob(paddedBase64)
        .split("")
        .map((char) => "%" + ("00" + char.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );

    return JSON.parse(jsonPayload) as JwtPayload;
  } catch (error) {
    console.error("Unable to decode JWT:", error);
    return null;
  }
}

export function CustomerHome() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [loading, setLoading] = useState(true);
  const [currentCategory, setCurrentCategory] = useState(0);
  const [userId, setUserId] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const PRODUCTS_PER_PAGE = 8;

  const [aiOpen, setAiOpen] = useState(false);
  const [open, setOpen] = useState(false);
  const [aiMessage, setAiMessage] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiMessages, setAiMessages] = useState<AiMessage[]>([
    {
      sender: "ai",
      message: "Hi! I'm ShopSmart AI 👋 How can I help you find products, offers or rewards today?",
    },
  ]);
  

  useEffect(() => {
    const jwtPayload = getJwtPayload();
    if (jwtPayload?.userId !== undefined) {
      setUserId(jwtPayload.userId);
    } else {
      console.error("JWT does not contain userId:", jwtPayload);
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentCategory((prev) => (prev + 1) % categories.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const response = await axios.get(PRODUCT_URL);
        const rawProducts = Array.isArray(response.data)
          ? response.data
          : Array.isArray(response.data?.content)
            ? response.data.content
            : [];

        const normalizedProducts = rawProducts
          .map(normalizeProduct)
          .filter((product: { productId: number; }) => product.productId > 0);

        console.log("ShopSmart products:", normalizedProducts);
        setProducts(normalizedProducts);
      } catch (error) {
        console.error("Failed to load products:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const searchText = search.toLowerCase();
      const matchesSearch =
        product.productName?.toLowerCase().includes(searchText) ||
        product.productDescription?.toLowerCase().includes(searchText) ||
        product.productCategory?.toLowerCase().includes(searchText);

      const matchesCategory =
        activeCategory === "All" ||
        product.productCategory?.toLowerCase() === activeCategory.toLowerCase();

      return matchesSearch && matchesCategory;
    });
  }, [products, search, activeCategory]);

  const activeHero = categories[currentCategory];

  useEffect(() => {
    setCurrentPage(1);
  }, [search, activeCategory]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE));
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * PRODUCTS_PER_PAGE,
    currentPage * PRODUCTS_PER_PAGE
  );

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const paginationPages = useMemo(() => {
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, index) => index + 1);
    const pages: (number | string)[] = [1];
    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);
    if (start > 2) pages.push("left");
    for (let page = start; page <= end; page++) pages.push(page);
    if (end < totalPages - 1) pages.push("right");
    pages.push(totalPages);
    return pages;
  }, [currentPage, totalPages]);

  const sendAIMessage = async () => {
    if (!aiMessage.trim() || aiLoading) return;

    const userMessage = aiMessage.trim();
    const token = localStorage.getItem("shopsmart_token");

    if (!token) {
      setAiMessages((prev) => [...prev, { sender: "ai", message: "Your session has expired. Please log in again." }]);
      return;
    }

    const jwtPayload = getJwtPayload();
    if (!jwtPayload) {
      setAiMessages((prev) => [...prev, { sender: "ai", message: "Unable to read your login information. Please log in again." }]);
      return;
    }

    const currentUserId = jwtPayload.userId;
    if (currentUserId === undefined) {
      console.error("JWT does not contain userId:", jwtPayload);
      setAiMessages((prev) => [...prev, { sender: "ai", message: "Your customer information could not be found. Please log in again." }]);
      return;
    }

    const userRole = jwtPayload.role?.toLowerCase();
    if (!userRole) {
      setAiMessages((prev) => [...prev, { sender: "ai", message: "Your user role could not be determined." }]);
      return;
    }

    setAiMessages((prev) => [...prev, { sender: "user", message: userMessage }]);
    setAiMessage("");
    setAiLoading(true);

    try {
      const requestBody = {
        userRole,
        activeContextId: currentUserId,
        userPrompt: userMessage,
      };

      const response = await axios.post(AI_URL, requestBody, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      setAiMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          message: response.data || "I couldn't generate a response right now.",
        },
      ]);
    } catch (error: any) {
      console.error("AI Service error:", error);
      const message =
        error?.response?.status === 401
          ? "Your login session is no longer valid. Please log in again."
          : error?.response?.status === 403
            ? "You do not have permission to use the ShopSmart AI assistant."
            : "Sorry, I couldn't connect to the AI service right now.";
      setAiMessages((prev) => [...prev, { sender: "ai", message }]);
    } finally {
      setAiLoading(false);
    }
  };
const handleClose = (
  event?: React.SyntheticEvent | Event,
  reason?: string
) => {
  if (reason === "clickaway") {
    return;
  }

  setOpen(false);
};
const handleCart = async (
  product: Product,
  customerId: number
) => {
  try {
    const token = localStorage.getItem("shopsmart_token");

    if (!token) {
      console.error("ShopSmart JWT token not found.");
      return;
    }

    console.log("PRODUCT OBJECT:", product);
    console.log("PRODUCT ID:", product.productId);

    const cartobj = {
      productId: product.productId,
      customerId: customerId,
      quantity: 1,
    };

    console.log("CART OBJECT:", cartobj);

    const response = await axios.post(
      CART_URL,
      cartobj,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log(
      "Product added to cart:",
      response.data
    );

    // OPEN SUCCESS SNACKBAR
    setOpen(true);
    alert(`${product.productName} added to cart successfully!`);

  } catch (error) {
    console.error(
      "Failed to add product to cart:",
      error
    );

    // OPEN ERROR SNACKBAR
    setOpen(true);
  }
};
  return (
    <div className="shopsmart-home">
     
      <section className="hero-section">
        <div className="hero-container">
          <div className="hero-content">
            <div className="hero-badge"><span className="badge-dot"></span>Smart shopping starts locally</div>
            <h1>Shop Local.<br /><span className="gradient-text">Earn More.</span><br />Live Smarter.</h1>
            <p className="hero-description">Discover products from local retailers, earn loyalty rewards and get offers personalized just for you.</p>

            <div className="hero-search">
              <i className="bi bi-search"></i>
              <input type="text" placeholder="Search products, categories or shops..." value={search} onChange={(e) => setSearch(e.target.value)} />
              {search && <button className="clear-search" onClick={() => setSearch("")}><i className="bi bi-x"></i></button>}
              <button className="search-button">Search</button>
            </div>

            <div className="hero-actions">
              <button className="primary-button" onClick={() => document.getElementById("products")?.scrollIntoView({ behavior: "smooth" })}>Explore Products <i className="bi bi-arrow-right"></i></button>
              <button className="secondary-button" onClick={() => setActiveCategory("All")}>View All</button>
            </div>

            <div className="hero-trust">
              <div><i className="bi bi-shop"></i><span>Local Shops</span></div>
              <div><i className="bi bi-gift"></i><span>Smart Rewards</span></div>
              <div><i className="bi bi-stars"></i><span>Personalized Offers</span></div>
            </div>
          </div>

          <div className="hero-visual">
            <div className="visual-glow"></div>
            <div className="floating-dot dot-one"></div>
            <div className="floating-dot dot-two"></div>
            <div className="floating-dot dot-three"></div>
            <div className="shopping-bag"><div className="bag-handle"></div><div className="bag-body"><div className="bag-logo">S</div><div className="bag-shine"></div></div></div>

            <div key={activeHero.name} className="hero-product-animation">
              <div className="hero-product-icon"><i className={`bi ${activeHero.icon}`}></i></div>
              <div className="hero-product-info"><span>SHOPSMART</span><h3>{activeHero.title}</h3><p>{activeHero.description}</p></div>
            </div>

            <div className="floating-product floating-product-one"><i className="bi bi-cart3"></i><span>Shop</span></div>
            <div className="floating-product floating-product-two"><i className="bi bi-award"></i><span>Earn</span></div>
            <div className="floating-product floating-product-three"><i className="bi bi-tag"></i><span>Save</span></div>

            <div className="hero-indicators">
              {categories.map((category, index) => (
                <button key={category.name} className={index === currentCategory ? "active" : ""} onClick={() => setCurrentCategory(index)} aria-label={category.name}></button>
              ))}
            </div>
          </div>
        </div>

        <div className="benefits-container">
          <div className="benefit"><div className="benefit-icon"><i className="bi bi-shop"></i></div><div><strong>Shop Local</strong><span>Support nearby retailers</span></div></div>
          <div className="benefit"><div className="benefit-icon"><i className="bi bi-coin"></i></div><div><strong>Earn Rewards</strong><span>Get points on every purchase</span></div></div>
          <div className="benefit"><div className="benefit-icon"><i className="bi bi-stars"></i></div><div><strong>Smart Offers</strong><span>Deals made for you</span></div></div>
          <div className="benefit"><div className="benefit-icon"><i className="bi bi-shield-check"></i></div><div><strong>Secure Shopping</strong><span>Safe and reliable checkout</span></div></div>
        </div>
      </section>

      <section className="categories-section">
        <div className="section-heading">
          <div><span className="section-label">EXPLORE</span><h2>Shop by category</h2><p>Find everything you need from your favorite local shops.</p></div>
          <button className="view-all-button" onClick={() => setActiveCategory("All")}>View all <i className="bi bi-arrow-right"></i></button>
        </div>

        <div className="category-grid">
          {categories.slice(0, 4).map((category) => (
            <button className={`category-card ${activeCategory === category.name ? "selected" : ""}`} key={category.name} onClick={() => setActiveCategory(category.name)}>
              <div className="category-icon"><i className={`bi ${category.icon}`}></i></div>
              <div><h4>{category.name}</h4><span>Explore products</span></div>
              <i className="bi bi-arrow-up-right category-arrow"></i>
            </button>
          ))}
        </div>
      </section>

      <section className="products-section" id="products">
        <div className="section-heading">
          <div><span className="section-label">DISCOVER</span><h2>{activeCategory === "All" ? "Featured products" : `${activeCategory} products`}</h2><p>Handpicked products from our local retailers.</p></div>
          <div className="product-count">{filteredProducts.length} products</div>
        </div>

        {loading ? (
          <div className="product-loading"><div className="loading-spinner"></div><p>Finding the best products for you...</p></div>
        ) : filteredProducts.length === 0 ? (
          <div className="empty-products"><div className="empty-icon"><i className="bi bi-search"></i></div><h3>No products found</h3><p>Try searching for something else.</p><button onClick={() => { setSearch(""); setActiveCategory("All"); }}>Clear filters</button></div>
        ) : (
          <div className="product-grid">
            {paginatedProducts.map((product) => (
              <div className="product-card" key={product.productId}>
                <div className="product-image-container">
                  {product.productImageUrl ? (
                    <>
                      <img
                        src={resolveProductImage(product.productImageUrl)}
                        alt={product.productName}
                        className="product-image"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                          e.currentTarget.nextElementSibling?.classList.add("show");
                        }}
                      />
                      <div className="product-image-fallback">
                        <div className="product-fallback-icon"><i className="bi bi-box-seam"></i></div>
                        <span>{product.productName}</span>
                      </div>
                    </>
                  ) : (
                    <div className="product-image-fallback show">
                      <div className="product-fallback-icon"><i className="bi bi-box-seam"></i></div>
                      <span>{product.productName}</span>
                    </div>
                  )}
                  <span className="product-category">{product.productCategory}</span>
                  {product.productStockQuantity <= 0 && <span className="out-of-stock">Out of stock</span>}
                  <button className="wishlist-button"><i className="bi bi-heart"></i></button>
                </div>

                <div className="product-details">
                  <span className="shop-label"><i className="bi bi-shop"></i>Local Shop #{product.shopId}</span>
                  <h3>{product.productName}</h3>
                  <p>{product.productDescription}</p>

                  <div className="product-bottom">
                    <div className="price">₹{product.originalPrice}</div>
                    <button
                      className="add-cart-button"
                      onClick={() => {
                        if (userId !== null) {
                          handleCart(product, userId);
                        }
                      }}
                      disabled={product.productStockQuantity <= 0 || userId === null}
                    >
                      <i className="bi bi-cart-plus"></i>
                      Add
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      {filteredProducts.length > 0 && (
        <div className="product-pagination">
          <div className="pagination-summary">
            Showing <strong>{(currentPage - 1) * PRODUCTS_PER_PAGE + 1}</strong>–
            <strong>{Math.min(currentPage * PRODUCTS_PER_PAGE, filteredProducts.length)}</strong> of <strong>{filteredProducts.length}</strong>
          </div>
          <div className="pagination-controls">
            <button type="button" className="pagination-arrow" onClick={() => setCurrentPage((page) => Math.max(1, page - 1))} disabled={currentPage === 1} aria-label="Previous page">
              <i className="bi bi-chevron-left"></i>
            </button>
            <div className="pagination-pages">
              {paginationPages.map((page, index) => typeof page === "string" ? (
                <span key={`${page}-${index}`} className="pagination-ellipsis">…</span>
              ) : (
                <button key={page} type="button" className={`pagination-page ${currentPage === page ? "active" : ""}`} onClick={() => setCurrentPage(page)} aria-label={`Go to page ${page}`} aria-current={currentPage === page ? "page" : undefined}>{page}</button>
              ))}
            </div>
            <button type="button" className="pagination-arrow" onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))} disabled={currentPage === totalPages} aria-label="Next page">
              <i className="bi bi-chevron-right"></i>
            </button>
          </div>
        </div>
      )}
    </section>

      <section className="loyalty-banner">
        <div className="loyalty-content">
          <span className="section-label light">SHOPSMART REWARDS</span>
          <h2>Every purchase gets<br />you closer to something better.</h2>
          <p>Shop at participating local stores, collect loyalty points and unlock personalized rewards.</p>
          <button className="loyalty-button">Explore Rewards <i className="bi bi-arrow-right"></i></button>
        </div>
        <div className="loyalty-visual">
          <div className="reward-circle"><i className="bi bi-stars"></i><span>REWARDS</span></div>
          <div className="reward-card reward-card-one"><i className="bi bi-coin"></i><strong>+20</strong><span>Points</span></div>
          <div className="reward-card reward-card-two"><i className="bi bi-gift"></i><strong>10%</strong><span>Offer</span></div>
        </div>
      </section>

      <section className="home-footer-message">
        <div className="footer-logo-mark">S</div>
        <h2>Shop local. Earn more. Live smarter.</h2>
        <p>ShopSmart connects you with local retailers, better offers and rewards that actually matter.</p>
      </section>

      {createPortal(
        <div className="ai-floating-layer">
          <button
            className="ai-assistant-button"
            onClick={() => setAiOpen((prev) => !prev)}
            aria-label="Open ShopSmart AI Assistant"
            type="button"
          >
            <i className="bi bi-stars"></i>
            <span>ShopSmart AI</span>
          </button>

          {aiOpen && (
            <div className="ai-chat-window">
              <div className="ai-chat-header">
                <div className="ai-chat-title">
                  <div className="ai-avatar">
                    <i className="bi bi-stars"></i>
                  </div>

                  <div>
                    <strong>ShopSmart AI</strong>
                    <span>
                      <span className="ai-online-dot"></span>
                      Online
                    </span>
                  </div>
                </div>

                <button
                  className="ai-close-button"
                  onClick={() => setAiOpen(false)}
                  aria-label="Close AI Assistant"
                  type="button"
                >
                  <i className="bi bi-x-lg"></i>
                </button>
              </div>

              <div className="ai-chat-messages">
                {aiMessages.map((chat, index) => (
                  <div
                    key={index}
                    className={
                      chat.sender === "user"
                        ? "ai-message user-message"
                        : "ai-message bot-message"
                    }
                  >
                    {chat.sender === "ai" && (
                      <div className="message-avatar">
                        <i className="bi bi-stars"></i>
                      </div>
                    )}

                    <div className="message-content">
                      {chat.message}
                    </div>
                  </div>
                ))}

                {aiLoading && (
                  <div className="ai-message bot-message">
                    <div className="message-avatar">
                      <i className="bi bi-stars"></i>
                    </div>

                    <div className="message-content">
                      Thinking...
                    </div>
                  </div>
                )}
              </div>

              <div className="ai-quick-actions">
                <button
                  type="button"
                  onClick={() =>
                    setAiMessage("Show me products I might like")
                  }
                >
                  <i className="bi bi-stars"></i>
                  Recommendations
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setAiMessage("What offers are available for me?")
                  }
                >
                  <i className="bi bi-tag"></i>
                  My offers
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setAiMessage("How can I use my loyalty points?")
                  }
                >
                  <i className="bi bi-coin"></i>
                  Rewards
                </button>
              </div>

              <div className="ai-chat-input">
                <input
                  type="text"
                  placeholder="Ask ShopSmart AI..."
                  value={aiMessage}
                  disabled={aiLoading}
                  onChange={(e) => setAiMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendAIMessage();
                    }
                  }}
                />

                <button
                  type="button"
                  onClick={sendAIMessage}
                  disabled={!aiMessage.trim() || aiLoading}
                  aria-label="Send message"
                >
                  <i className="bi bi-arrow-up"></i>
                </button>
              </div>
            </div>
          )}
        </div>,
        document.body
      )}

    </div>
  );
}
