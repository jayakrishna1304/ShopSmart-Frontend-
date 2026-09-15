import { useEffect, useState } from "react";
import "../ShopView.css";

const SHOP_SERVICE = "http://localhost:8085/shopsmart/shop";
const RETAILER_SERVICE = "http://localhost:8084/shopsmart/retailer";

export interface Shop {
  shopId: number;
  shopName: string;
  address: string;
  ownerId?: number;
  status: string;
}

interface RetailerInfo {
  ownerName: string;
  ownerEmail: string;
}

interface ShopViewProps {
  retailerId: number;
  onSelectShop: (shop: Shop) => void;
}

interface ApiErrorResponse {
  message?: string;
  error?: string;
}

export default function ShopView({
  retailerId,
  onSelectShop,
}: ShopViewProps) {
  const [shops, setShops] = useState<Shop[]>([]);

  const [ownerInfo, setOwnerInfo] =
    useState<RetailerInfo>({
      ownerName: "Loading...",
      ownerEmail: "Loading...",
    });

  const [loading, setLoading] =
    useState<boolean>(true);

  const [error, setError] =
    useState<string>("");

  // --------------------------------------------------
  // Add Shop
  // --------------------------------------------------

  const [isAdding, setIsAdding] =
    useState<boolean>(false);

  const [newShopName, setNewShopName] =
    useState<string>("");

  const [newAddress, setNewAddress] =
    useState<string>("");

  const [adding, setAdding] =
    useState<boolean>(false);

  // --------------------------------------------------
  // Edit Shop
  // --------------------------------------------------

  const [editingShopId, setEditingShopId] =
    useState<number | null>(null);

  const [editShopName, setEditShopName] =
    useState<string>("");

  const [editAddress, setEditAddress] =
    useState<string>("");

  const [updating, setUpdating] =
    useState<boolean>(false);

  // --------------------------------------------------
  // JWT TOKEN
  // --------------------------------------------------

  const getToken = (): string | null => {
    return localStorage.getItem(
      "shopsmart_token"
    );
  };

  // --------------------------------------------------
  // COMMON HEADERS
  // --------------------------------------------------

  const getHeaders = (): HeadersInit => {
    const token = getToken();

    return {
      "Content-Type": "application/json",
      ...(token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : {}),
    };
  };

  // --------------------------------------------------
  // READ ERROR FROM BACKEND
  // --------------------------------------------------

  const getErrorMessage = async (
    response: Response,
    defaultMessage: string
  ): Promise<string> => {
    try {
      const data: ApiErrorResponse =
        await response.json();

      return (
        data.message ||
        data.error ||
        defaultMessage
      );
    } catch {
      return defaultMessage;
    }
  };

  // --------------------------------------------------
  // FETCH RETAILER + SHOPS
  // --------------------------------------------------

  const fetchData = async (): Promise<void> => {
    if (!retailerId) {
      setError("Retailer ID is missing.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const headers = getHeaders();

      // Get retailer information
      const retailerResponse = await fetch(
        `${RETAILER_SERVICE}/${retailerId}`,
        {
          method: "GET",
          headers,
        }
      );

      if (!retailerResponse.ok) {
        const message =
          await getErrorMessage(
            retailerResponse,
            "Unable to load retailer details."
          );

        throw new Error(message);
      }

      const retailerData: RetailerInfo =
        await retailerResponse.json();

      setOwnerInfo({
        ownerName:
          retailerData.ownerName ||
          "Retailer",

        ownerEmail:
          retailerData.ownerEmail ||
          "No email available",
      });

      // Get shops
      const shopsResponse = await fetch(
        `${SHOP_SERVICE}/retailer/${retailerId}`,
        {
          method: "GET",
          headers,
        }
      );

      if (!shopsResponse.ok) {
        const message =
          await getErrorMessage(
            shopsResponse,
            "Unable to load shops."
          );

        throw new Error(message);
      }

      const shopData: Shop[] =
        await shopsResponse.json();

      const shopList: Shop[] =
        Array.isArray(shopData)
          ? shopData.map((shop) => ({
              ...shop,
              status:
                shop.status || "ACTIVE",
            }))
          : [];

      setShops(shopList);
    } catch (err: unknown) {
      console.error(
        "ShopView error:",
        err
      );

      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(
          "Something went wrong while loading shops."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [retailerId]);

  // --------------------------------------------------
  // ADD SHOP
  // --------------------------------------------------

  const handleCreateShop = async (
    event: React.FormEvent<HTMLFormElement>
  ): Promise<void> => {
    event.preventDefault();

    if (
      !newShopName.trim() ||
      !newAddress.trim()
    ) {
      alert(
        "Please enter shop name and address."
      );
      return;
    }

    try {
      setAdding(true);

      const response = await fetch(
        SHOP_SERVICE,
        {
          method: "POST",
          headers: getHeaders(),
          body: JSON.stringify({
            shopName: newShopName.trim(),
            address: newAddress.trim(),
            ownerId: Number(retailerId),
            status: "ACTIVE",
          }),
        }
      );

      if (!response.ok) {
        const message =
          await getErrorMessage(
            response,
            "Failed to create shop."
          );

        throw new Error(message);
      }

      alert(
        "Shop added successfully!"
      );

      setNewShopName("");
      setNewAddress("");
      setIsAdding(false);

      await fetchData();
    } catch (err: unknown) {
      console.error(
        "Create shop error:",
        err
      );

      alert(
        err instanceof Error
          ? err.message
          : "Failed to add shop."
      );
    } finally {
      setAdding(false);
    }
  };

  // --------------------------------------------------
  // START EDITING
  // --------------------------------------------------

  const startEditing = (
    shop: Shop
  ): void => {
    setEditingShopId(shop.shopId);
    setEditShopName(
      shop.shopName || ""
    );
    setEditAddress(
      shop.address || ""
    );
  };

  // --------------------------------------------------
  // CANCEL EDIT
  // --------------------------------------------------

  const cancelEditing = (): void => {
    setEditingShopId(null);
    setEditShopName("");
    setEditAddress("");
  };

  // --------------------------------------------------
  // UPDATE SHOP
  // --------------------------------------------------

  const handleUpdateShop = async (
    event: React.FormEvent<HTMLFormElement>,
    shop: Shop
  ): Promise<void> => {
    event.preventDefault();

    if (
      !editShopName.trim() ||
      !editAddress.trim()
    ) {
      alert(
        "Please enter shop name and address."
      );
      return;
    }

    try {
      setUpdating(true);

      const response = await fetch(
        `${SHOP_SERVICE}/${shop.shopId}`,
        {
          method: "PUT",
          headers: getHeaders(),
          body: JSON.stringify({
            shopName:
              editShopName.trim(),
            address:
              editAddress.trim(),
            ownerId:
              Number(retailerId),
            status:
              shop.status || "ACTIVE",
          }),
        }
      );

      if (!response.ok) {
        const message =
          await getErrorMessage(
            response,
            "Failed to update shop."
          );

        throw new Error(message);
      }

      alert(
        "Shop updated successfully!"
      );

      cancelEditing();

      await fetchData();
    } catch (err: unknown) {
      console.error(
        "Update shop error:",
        err
      );

      alert(
        err instanceof Error
          ? err.message
          : "Failed to update shop."
      );
    } finally {
      setUpdating(false);
    }
  };

  // --------------------------------------------------
  // TOGGLE STATUS
  // --------------------------------------------------

  const handleToggleStatus = async (
    shop: Shop
  ): Promise<void> => {
    const newStatus =
      shop.status === "INACTIVE"
        ? "ACTIVE"
        : "INACTIVE";

    try {
      const response = await fetch(
        `${SHOP_SERVICE}/${shop.shopId}`,
        {
          method: "PUT",
          headers: getHeaders(),
          body: JSON.stringify({
            shopName: shop.shopName,
            address: shop.address,
            ownerId:
              Number(retailerId),
            status: newStatus,
          }),
        }
      );

      if (!response.ok) {
        const message =
          await getErrorMessage(
            response,
            "Failed to change shop status."
          );

        throw new Error(message);
      }

      setShops(
        (currentShops) =>
          currentShops.map(
            (currentShop) =>
              currentShop.shopId ===
              shop.shopId
                ? {
                    ...currentShop,
                    status: newStatus,
                  }
                : currentShop
          )
      );
    } catch (err: unknown) {
      console.error(
        "Toggle status error:",
        err
      );

      alert(
        err instanceof Error
          ? err.message
          : "Failed to change shop status."
      );
    }
  };

  // --------------------------------------------------
  // DELETE SHOP
  // --------------------------------------------------

  const handleDeleteShop = async (
    shop: Shop
  ): Promise<void> => {
    const confirmed =
      window.confirm(
        `Are you sure you want to delete "${shop.shopName}"?`
      );

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(
        `${SHOP_SERVICE}/${shop.shopId}`,
        {
          method: "DELETE",
          headers: getHeaders(),
        }
      );

      if (
        !response.ok &&
        response.status !== 204
      ) {
        const message =
          await getErrorMessage(
            response,
            "Failed to delete shop."
          );

        throw new Error(message);
      }

      alert(
        "Shop deleted successfully!"
      );

      setShops(
        (currentShops) =>
          currentShops.filter(
            (currentShop) =>
              currentShop.shopId !==
              shop.shopId
          )
      );
    } catch (err: unknown) {
      console.error(
        "Delete shop error:",
        err
      );

      alert(
        err instanceof Error
          ? err.message
          : "Failed to delete shop."
      );
    }
  };

  // --------------------------------------------------
  // LOADING
  // --------------------------------------------------

  if (loading) {
    return (
      <div
        style={{
          width: "100%",
          padding: "60px 20px",
          textAlign: "center",
          fontFamily: "sans-serif",
          color: "#6b7280",
        }}
      >
        <div
          style={{
            fontSize: "32px",
            marginBottom: "12px",
          }}
        >
          🏪
        </div>

        <div
          style={{
            fontSize: "16px",
            fontWeight: "600",
          }}
        >
          Loading your shops...
        </div>
      </div>
    );
  }

  // --------------------------------------------------
  // ERROR
  // --------------------------------------------------

  if (error) {
    return (
      <div
        style={{
          maxWidth: "800px",
          margin: "60px auto",
          padding: "28px",
          backgroundColor: "#fef2f2",
          border: "1px solid #fecaca",
          borderRadius: "16px",
          textAlign: "center",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            fontSize: "32px",
            marginBottom: "10px",
          }}
        >
          ⚠️
        </div>

        <h3
          style={{
            color: "#991b1b",
            margin: "0 0 8px",
          }}
        >
          Unable to Load Shops
        </h3>

        <p
          style={{
            color: "#b91c1c",
            fontSize: "14px",
            marginBottom: "20px",
          }}
        >
          {error}
        </p>

        <button
          onClick={fetchData}
          style={{
            backgroundColor: "#4f46e5",
            color: "#fff",
            border: "none",
            padding: "10px 20px",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: "600",
          }}
        >
          Try Again
        </button>
      </div>
    );
  }

  // --------------------------------------------------
  // MAIN UI
  // --------------------------------------------------

  return (
    <div
      style={{
        width: "100%",
        maxWidth: "1600px",
        margin: "0 auto",
        padding: "40px 32px",
        boxSizing: "border-box",
        fontFamily: "sans-serif",
      }}
    >
      {/* HEADER */}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: "20px",
          marginBottom: "32px",
          flexWrap: "wrap",
        }}
      >
        <div>
          <p
            style={{
              margin: "0 0 5px",
              fontSize: "14px",
              color: "#6b7280",
              fontWeight: "500",
            }}
          >
            My Shops
          </p>

          <h1
            style={{
              fontSize: "32px",
              fontWeight: "700",
              margin: 0,
              color: "#111827",
            }}
          >
            Welcome back
          </h1>

          <h2
            style={{
              fontSize: "30px",
              fontWeight: "700",
              margin: "2px 0 0",
              color: "#4f46e5",
            }}
          >
            {ownerInfo.ownerName}
          </h2>

          <p
            style={{
              fontSize: "14px",
              color: "#6b7280",
              margin: "8px 0 0",
            }}
          >
            Retailer ID: {retailerId} &bull;{" "}
            {ownerInfo.ownerEmail}
          </p>
        </div>

        <button
          onClick={() =>
            setIsAdding(
              (value) => !value
            )
          }
          style={{
            backgroundColor: "#4f46e5",
            color: "#fff",
            border: "none",
            padding: "12px 20px",
            borderRadius: "10px",
            cursor: "pointer",
            fontWeight: "600",
            fontSize: "14px",
            boxShadow:
              "0 2px 5px rgba(79, 70, 229, 0.25)",
          }}
        >
          {isAdding
            ? "Cancel"
            : "➕ Add New Shop"}
        </button>
      </div>

      {/* ADD SHOP */}

      {isAdding && (
        <div
          style={{
            backgroundColor: "#f8fafc",
            border: "1px solid #cbd5e1",
            borderRadius: "16px",
            padding: "28px",
            marginBottom: "36px",
            boxShadow:
              "0 4px 10px rgba(0, 0, 0, 0.04)",
          }}
        >
          <h3
            style={{
              margin: "0 0 20px",
              fontSize: "18px",
              color: "#1e293b",
            }}
          >
            Register New Shop
          </h3>

          <form
            onSubmit={handleCreateShop}
            style={{
              display: "flex",
              gap: "18px",
              flexWrap: "wrap",
              alignItems: "flex-end",
            }}
          >
            <div
              style={{
                flex: 1,
                minWidth: "250px",
              }}
            >
              <label
                style={{
                  display: "block",
                  fontSize: "13px",
                  fontWeight: "600",
                  marginBottom: "7px",
                  color: "#374151",
                }}
              >
                Shop Name
              </label>

              <input
                type="text"
                value={newShopName}
                onChange={(event) =>
                  setNewShopName(
                    event.target.value
                  )
                }
                placeholder="Enter shop name"
                required
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  borderRadius: "8px",
                  border:
                    "1px solid #d1d5db",
                  boxSizing:
                    "border-box",
                  fontSize: "14px",
                }}
              />
            </div>

            <div
              style={{
                flex: 1,
                minWidth: "250px",
              }}
            >
              <label
                style={{
                  display: "block",
                  fontSize: "13px",
                  fontWeight: "600",
                  marginBottom: "7px",
                  color: "#374151",
                }}
              >
                Address
              </label>

              <input
                type="text"
                value={newAddress}
                onChange={(event) =>
                  setNewAddress(
                    event.target.value
                  )
                }
                placeholder="Enter shop address"
                required
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  borderRadius: "8px",
                  border:
                    "1px solid #d1d5db",
                  boxSizing:
                    "border-box",
                  fontSize: "14px",
                }}
              />
            </div>

            <button
              type="submit"
              disabled={adding}
              style={{
                backgroundColor: "#059669",
                color: "#fff",
                border: "none",
                padding: "12px 24px",
                borderRadius: "8px",
                cursor: adding
                  ? "not-allowed"
                  : "pointer",
                fontWeight: "600",
                height: "44px",
                fontSize: "14px",
                opacity: adding
                  ? 0.7
                  : 1,
              }}
            >
              {adding
                ? "Saving..."
                : "Save Shop"}
            </button>
          </form>
        </div>
      )}

      {/* SHOP TITLE */}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
        }}
      >
        <h2
          style={{
            fontSize: "22px",
            fontWeight: "700",
            margin: 0,
            color: "#111827",
          }}
        >
          Registered Shops
        </h2>

        <span
          style={{
            backgroundColor: "#eef2ff",
            color: "#4f46e5",
            padding: "6px 12px",
            borderRadius: "20px",
            fontSize: "13px",
            fontWeight: "700",
          }}
        >
          {shops.length}{" "}
          {shops.length === 1
            ? "Shop"
            : "Shops"}
        </span>
      </div>

      {/* EMPTY STATE */}

      {shops.length === 0 ? (
        <div
          style={{
            backgroundColor: "#f9fafb",
            border:
              "1px dashed #d1d5db",
            borderRadius: "16px",
            padding: "60px 30px",
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: "42px",
              marginBottom: "12px",
            }}
          >
            🏪
          </div>

          <h3
            style={{
              margin: "0 0 8px",
              color: "#374151",
              fontSize: "18px",
            }}
          >
            No Shops Yet
          </h3>

          <p
            style={{
              color: "#6b7280",
              fontSize: "14px",
              margin: 0,
            }}
          >
            Add your first shop to start
            managing products and orders.
          </p>
        </div>
      ) : (
        /* SHOP LIST */

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "24px",
          }}
        >
          {shops.map((shop) => {
            const isInactive =
              shop.status === "INACTIVE";

            const isEditing =
              editingShopId ===
              shop.shopId;

            return (
              <div
                key={shop.shopId}
                style={{
                  backgroundColor:
                    isInactive
                      ? "#f3f4f6"
                      : "#fff",
                  borderRadius: "18px",
                  border:
                    "1px solid #e5e7eb",
                  padding: "28px",
                  boxShadow:
                    "0 5px 14px rgba(0,0,0,0.05)",
                  opacity: isInactive
                    ? 0.75
                    : 1,
                }}
              >
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "minmax(0, 3fr) minmax(200px, 1fr)",
                    gap: "32px",
                    alignItems: "center",
                  }}
                >
                  {/* LEFT SIDE */}

                  <div
                    style={{
                      display: "flex",
                      gap: "24px",
                      alignItems: "center",
                      minWidth: 0,
                    }}
                  >
                    {/* SHOP IMAGE */}

                    <div
                      style={{
                        width: "220px",
                        height: "150px",
                        borderRadius: "12px",
                        overflow: "hidden",
                        backgroundColor:
                          "#f3f4f6",
                        flexShrink: 0,
                        filter: isInactive
                          ? "grayscale(100%)"
                          : "none",
                        boxShadow:
                          "0 1px 4px rgba(0,0,0,0.1)",
                      }}
                    >
                      <img
                        src="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80&w=600"
                        alt="Shop"
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit:
                            "cover",
                        }}
                      />
                    </div>

                    {/* SHOP DETAILS */}

                    <div
                      style={{
                        flex: 1,
                        minWidth: 0,
                      }}
                    >
                      {/* BADGES */}

                      <div
                        style={{
                          display: "flex",
                          gap: "10px",
                          marginBottom:
                            "10px",
                          alignItems:
                            "center",
                          flexWrap: "wrap",
                        }}
                      >
                        <span
                          style={{
                            fontSize: "12px",
                            fontWeight: "700",
                            color:
                              "#4f46e5",
                            backgroundColor:
                              "#eef2ff",
                            padding:
                              "4px 10px",
                            borderRadius:
                              "6px",
                          }}
                        >
                          SHOP #
                          {shop.shopId}
                        </span>

                        <button
                          type="button"
                          onClick={() =>
                            handleToggleStatus(
                              shop
                            )
                          }
                          style={{
                            fontSize: "12px",
                            fontWeight: "700",
                            textTransform:
                              "uppercase",
                            color: isInactive
                              ? "#dc2626"
                              : "#059669",
                            backgroundColor:
                              isInactive
                                ? "#fee2e2"
                                : "#d1fae5",
                            padding:
                              "4px 10px",
                            borderRadius:
                              "6px",
                            border: "none",
                            cursor:
                              "pointer",
                            display:
                              "inline-flex",
                            alignItems:
                              "center",
                            gap: "6px",
                          }}
                        >
                          <span
                            style={{
                              width: "7px",
                              height: "7px",
                              borderRadius:
                                "50%",
                              backgroundColor:
                                isInactive
                                  ? "#dc2626"
                                  : "#059669",
                            }}
                          />

                          {isInactive
                            ? "Inactive"
                            : "Active"}
                        </button>
                      </div>

                      <h3
                        style={{
                          fontSize: "24px",
                          fontWeight: "700",
                          color: isInactive
                            ? "#4b5563"
                            : "#111827",
                          margin:
                            "0 0 7px",
                          wordBreak:
                            "break-word",
                        }}
                      >
                        {shop.shopName}
                      </h3>

                      <p
                        style={{
                          fontSize: "14px",
                          color:
                            "#6b7280",
                          margin:
                            "0 0 18px",
                        }}
                      >
                        📍 {shop.address}
                      </p>

                      {/* PRODUCT MANAGEMENT CARD */}

                      <div
                        style={{
                          backgroundColor:
                            isInactive
                              ? "#e5e7eb"
                              : "#f5f3ff",
                          border:
                            isInactive
                              ? "1px solid #d1d5db"
                              : "1px solid #ddd6fe",
                          borderRadius:
                            "12px",
                          padding:
                            "14px 16px",
                          marginBottom:
                            "14px",
                        }}
                      >
                        <div
                          style={{
                            display:
                              "flex",
                            justifyContent:
                              "space-between",
                            alignItems:
                              "center",
                            gap: "15px",
                          }}
                        >
                          <div>
                            <div
                              style={{
                                fontSize:
                                  "15px",
                                fontWeight:
                                  "700",
                                color:
                                  isInactive
                                    ? "#6b7280"
                                    : "#312e81",
                                marginBottom:
                                  "4px",
                              }}
                            >
                              📦 Product
                              Management
                            </div>

                            <div
                              style={{
                                fontSize:
                                  "12px",
                                color:
                                  "#6b7280",
                                lineHeight:
                                  "1.5",
                              }}
                            >
                              Create, edit,
                              update stock
                              and delete
                              products
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              !isInactive &&
                              onSelectShop(
                                shop
                              )
                            }
                            disabled={
                              isInactive
                            }
                            style={{
                              backgroundColor:
                                isInactive
                                  ? "#9ca3af"
                                  : "#4f46e5",
                              color:
                                "#fff",
                              border:
                                "none",
                              padding:
                                "10px 18px",
                              borderRadius:
                                "9px",
                              cursor:
                                isInactive
                                  ? "not-allowed"
                                  : "pointer",
                              fontWeight:
                                "700",
                              fontSize:
                                "13px",
                              whiteSpace:
                                "nowrap",
                              boxShadow:
                                isInactive
                                  ? "none"
                                  : "0 2px 5px rgba(79,70,229,0.2)",
                            }}
                          >
                            {isInactive
                              ? "🔒 Unavailable"
                              : "📦 Manage Products →"}
                          </button>
                        </div>

                        {!isInactive && (
                          <div
                            style={{
                              display:
                                "flex",
                              gap: "8px",
                              flexWrap:
                                "wrap",
                              marginTop:
                                "11px",
                            }}
                          >
                            <span
                              style={{
                                backgroundColor:
                                  "#fff",
                                border:
                                  "1px solid #ddd6fe",
                                color:
                                  "#5b21b6",
                                padding:
                                  "4px 9px",
                                borderRadius:
                                  "6px",
                                fontSize:
                                  "11px",
                                fontWeight:
                                  "600",
                              }}
                            >
                              + Create
                            </span>

                            <span
                              style={{
                                backgroundColor:
                                  "#fff",
                                border:
                                  "1px solid #ddd6fe",
                                color:
                                  "#5b21b6",
                                padding:
                                  "4px 9px",
                                borderRadius:
                                  "6px",
                                fontSize:
                                  "11px",
                                fontWeight:
                                  "600",
                              }}
                            >
                              ✏️ Update
                            </span>

                            <span
                              style={{
                                backgroundColor:
                                  "#fff",
                                border:
                                  "1px solid #ddd6fe",
                                color:
                                  "#5b21b6",
                                padding:
                                  "4px 9px",
                                borderRadius:
                                  "6px",
                                fontSize:
                                  "11px",
                                fontWeight:
                                  "600",
                              }}
                            >
                              📦 Stock
                            </span>

                            <span
                              style={{
                                backgroundColor:
                                  "#fff",
                                border:
                                  "1px solid #ddd6fe",
                                color:
                                  "#5b21b6",
                                padding:
                                  "4px 9px",
                                borderRadius:
                                  "6px",
                                fontSize:
                                  "11px",
                                fontWeight:
                                  "600",
                              }}
                            >
                              🗑️ Delete
                            </span>
                          </div>
                        )}
                      </div>

                      {/* SHOP ACTION BUTTONS */}

                      <div
                        style={{
                          display:
                            "flex",
                          gap: "10px",
                          flexWrap:
                            "wrap",
                        }}
                      >
                        {/* EDIT SHOP */}

                        <button
                          type="button"
                          disabled={
                            isInactive
                          }
                          onClick={() => {
                            if (
                              isEditing
                            ) {
                              cancelEditing();
                            } else {
                              startEditing(
                                shop
                              );
                            }
                          }}
                          style={{
                            backgroundColor:
                              isInactive
                                ? "#e5e7eb"
                                : "#f9fafb",
                            color:
                              isInactive
                                ? "#9ca3af"
                                : "#374151",
                            border:
                              "1px solid #d1d5db",
                            padding:
                              "9px 14px",
                            borderRadius:
                              "8px",
                            cursor:
                              isInactive
                                ? "not-allowed"
                                : "pointer",
                            fontWeight:
                              "600",
                            fontSize:
                              "13px",
                          }}
                        >
                          ✏️{" "}
                          {isEditing
                            ? "Cancel"
                            : "Edit Shop"}
                        </button>

                        {/* DELETE SHOP */}

                        <button
                          type="button"
                          disabled={
                            isInactive
                          }
                          onClick={() =>
                            !isInactive &&
                            handleDeleteShop(
                              shop
                            )
                          }
                          style={{
                            backgroundColor:
                              isInactive
                                ? "#e5e7eb"
                                : "#fef2f2",
                            color:
                              isInactive
                                ? "#9ca3af"
                                : "#dc2626",
                            border:
                              "1px solid #fecaca",
                            padding:
                              "9px 14px",
                            borderRadius:
                              "8px",
                            cursor:
                              isInactive
                                ? "not-allowed"
                                : "pointer",
                            fontWeight:
                              "600",
                            fontSize:
                              "13px",
                          }}
                        >
                          🗑️ Delete Shop
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* RIGHT DETAILS */}

                  <div
                    style={{
                      borderLeft:
                        "1px solid #e5e7eb",
                      paddingLeft:
                        "28px",
                    }}
                  >
                    <span
                      style={{
                        display: "block",
                        fontSize: "12px",
                        fontWeight: "700",
                        color:
                          "#9ca3af",
                        textTransform:
                          "uppercase",
                        marginBottom:
                          "10px",
                      }}
                    >
                      Shop Details
                    </span>

                    <p
                      style={{
                        fontSize: "14px",
                        color:
                          "#374151",
                        margin:
                          "7px 0",
                      }}
                    >
                      <strong>
                        Owner ID:
                      </strong>{" "}
                      {shop.ownerId ??
                        retailerId}
                    </p>

                    <p
                      style={{
                        fontSize: "14px",
                        color:
                          "#374151",
                        margin:
                          "7px 0",
                      }}
                    >
                      <strong>
                        Shop ID:
                      </strong>{" "}
                      {shop.shopId}
                    </p>

                    <p
                      style={{
                        fontSize: "14px",
                        color:
                          "#374151",
                        margin:
                          "7px 0",
                      }}
                    >
                      <strong>
                        Status:
                      </strong>{" "}
                      {shop.status ||
                        "ACTIVE"}
                    </p>

                    <div
                      style={{
                        marginTop:
                          "18px",
                        padding:
                          "14px",
                        borderRadius:
                          "10px",
                        backgroundColor:
                          isInactive
                            ? "#e5e7eb"
                            : "#f0fdf4",
                        border:
                          isInactive
                            ? "1px solid #d1d5db"
                            : "1px solid #bbf7d0",
                      }}
                    >
                      <div
                        style={{
                          fontSize:
                            "12px",
                          fontWeight:
                            "700",
                          color:
                            isInactive
                              ? "#6b7280"
                              : "#166534",
                          marginBottom:
                            "4px",
                        }}
                      >
                        {isInactive
                          ? "🔒 Shop Locked"
                          : "✓ Shop Ready"}
                      </div>

                      <div
                        style={{
                          fontSize:
                            "11px",
                          color:
                            "#6b7280",
                          lineHeight:
                            "1.5",
                        }}
                      >
                        {isInactive
                          ? "Activate this shop to manage its products."
                          : "Products are managed separately for this shop."}
                      </div>
                    </div>
                  </div>
                </div>

                {/* EDIT FORM */}

                {isEditing &&
                  !isInactive && (
                    <div
                      style={{
                        marginTop:
                          "24px",
                        paddingTop:
                          "22px",
                        borderTop:
                          "1px solid #e5e7eb",
                      }}
                    >
                      <h4
                        style={{
                          margin:
                            "0 0 14px",
                          fontSize:
                            "16px",
                          color:
                            "#1f2937",
                        }}
                      >
                        Edit Shop #
                        {shop.shopId}
                      </h4>

                      <form
                        onSubmit={(
                          event
                        ) =>
                          handleUpdateShop(
                            event,
                            shop
                          )
                        }
                        style={{
                          display:
                            "flex",
                          gap: "14px",
                          flexWrap:
                            "wrap",
                        }}
                      >
                        <input
                          type="text"
                          value={
                            editShopName
                          }
                          onChange={(
                            event
                          ) =>
                            setEditShopName(
                              event
                                .target
                                .value
                            )
                          }
                          placeholder="Shop name"
                          required
                          style={{
                            flex: 1,
                            minWidth:
                              "200px",
                            padding:
                              "10px 12px",
                            borderRadius:
                              "8px",
                            border:
                              "1px solid #d1d5db",
                            fontSize:
                              "14px",
                            boxSizing:
                              "border-box",
                          }}
                        />

                        <input
                          type="text"
                          value={
                            editAddress
                          }
                          onChange={(
                            event
                          ) =>
                            setEditAddress(
                              event
                                .target
                                .value
                            )
                          }
                          placeholder="Address"
                          required
                          style={{
                            flex: 1,
                            minWidth:
                              "200px",
                            padding:
                              "10px 12px",
                            borderRadius:
                              "8px",
                            border:
                              "1px solid #d1d5db",
                            fontSize:
                              "14px",
                            boxSizing:
                              "border-box",
                          }}
                        />

                        <button
                          type="submit"
                          disabled={
                            updating
                          }
                          style={{
                            backgroundColor:
                              "#4f46e5",
                            color:
                              "#fff",
                            border:
                              "none",
                            padding:
                              "10px 20px",
                            borderRadius:
                              "8px",
                            cursor:
                              updating
                                ? "not-allowed"
                                : "pointer",
                            fontWeight:
                              "600",
                            fontSize:
                              "14px",
                            opacity:
                              updating
                                ? 0.7
                                : 1,
                          }}
                        >
                          {updating
                            ? "Saving..."
                            : "Save Changes"}
                        </button>
                      </form>
                    </div>
                  )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}