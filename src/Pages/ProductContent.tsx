import { useEffect, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import "../ProductContent.css";

const PRODUCT_SERVICE =
  "http://localhost:8082/shopsmart/product";

export interface Shop {
  shopId: number;
  shopName: string;
  address: string;
}

export interface Product {
  productId: number;
  productName: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  category?: string;
  description?: string;
  stockLeft: number;
  stockUsed?: number;
  shopId: number;
  imageUrl?: string;
}

interface ProductContentProps {
  selectedShop: Shop;
  onBackToShops: () => void;
}

interface ApiError {
  message?: string;
  error?: string;
}

// ============================================================
// AUTH HELPERS
// ============================================================

const getToken = (): string | null => {
  return localStorage.getItem("shopsmart_token");
};

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

const getErrorMessage = async (
  response: Response,
  fallback: string
): Promise<string> => {
  try {
    const data: ApiError = await response.json();

    return data.message || data.error || fallback;
  } catch {
    return fallback;
  }
};

// ============================================================
// COMPONENT
// ============================================================

export default function ProductContent({
  selectedShop,
  onBackToShops,
}: ProductContentProps) {
  const [products, setProducts] =
    useState<Product[]>([]);

  const [loading, setLoading] =
    useState<boolean>(true);

  const [error, setError] =
    useState<string | null>(null);

  // ==========================================================
  // SEARCH / FILTER / SORT
  // ==========================================================

  const [searchQuery, setSearchQuery] =
    useState<string>("");

  const [selectedCategory, setSelectedCategory] =
    useState<string>("All");

  const [sortBy, setSortBy] =
    useState<string>("Newest");

  // ==========================================================
  // ADD PRODUCT
  // ==========================================================

  const [isAdding, setIsAdding] =
    useState<boolean>(false);

  const [productName, setProductName] =
    useState<string>("");

  const [price, setPrice] =
    useState<string>("");

  const [originalPrice, setOriginalPrice] =
    useState<string>("");

  const [discount, setDiscount] =
    useState<string>("");

  const [category, setCategory] =
    useState<string>("");

  const [description, setDescription] =
    useState<string>("");

  const [stockLeft, setStockLeft] =
    useState<string>("");

  const [adding, setAdding] =
    useState<boolean>(false);

  // ==========================================================
  // PRODUCT IMAGE
  // ==========================================================

  const [imageUrl, setImageUrl] =
    useState<string>("");

  const [imageSource, setImageSource] =
    useState<"url" | "device">("url");

  const [imagePreview, setImagePreview] =
    useState<string>("");

  // ==========================================================
  // EDIT PRODUCT
  // ==========================================================

  const [editingProduct, setEditingProduct] =
    useState<Product | null>(null);

  const [editName, setEditName] =
    useState<string>("");

  const [editDescription, setEditDescription] =
    useState<string>("");

  const [editPrice, setEditPrice] =
    useState<string>("");

  const [editOriginalPrice, setEditOriginalPrice] =
    useState<string>("");

  const [editDiscount, setEditDiscount] =
    useState<string>("");

  const [editStockLeft, setEditStockLeft] =
    useState<string>("");

  const [editStockUsed, setEditStockUsed] =
    useState<string>("");

  const [editCategory, setEditCategory] =
    useState<string>("");

  const [updating, setUpdating] =
    useState<boolean>(false);

  // ==========================================================
  // ADD STOCK
  // ==========================================================

  const [stockProduct, setStockProduct] =
    useState<Product | null>(null);

  const [stockQuantity, setStockQuantity] =
    useState<string>("");

  const [addingStock, setAddingStock] =
    useState<boolean>(false);

  // ==========================================================
  // CSV IMPORT
  // ==========================================================

  const [importing, setImporting] =
    useState<boolean>(false);

  // ==========================================================
  // FETCH PRODUCTS
  // ==========================================================

  const fetchProducts = async (): Promise<void> => {
    if (!selectedShop) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${PRODUCT_SERVICE}/shop/${selectedShop.shopId}`,
        {
          method: "GET",
          headers: getHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error(
          await getErrorMessage(
            response,
            "Failed to fetch products."
          )
        );
      }

      const data: Product[] =
        await response.json();

      setProducts(data || []);
    } catch (err) {
      console.error(
        "Error fetching products:",
        err
      );

      setProducts([]);

      setError(
        err instanceof Error
          ? err.message
          : "Could not connect to Product Service on port 8082."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchProducts();
  }, [selectedShop]);

  // ==========================================================
  // IMAGE URL
  // ==========================================================

  const handleImageUrlChange = (
    value: string
  ): void => {
    setImageUrl(value);
    setImagePreview(value);
  };

  // ==========================================================
  // REMOVE IMAGE
  // ==========================================================

  const handleRemoveImage = (): void => {
    setImageUrl("");
    setImagePreview("");
    setImageSource("url");

    const fileInput =
      document.getElementById(
        "productImageInput"
      ) as HTMLInputElement | null;

    if (fileInput) {
      fileInput.value = "";
    }
  };

  // ==========================================================
  // DEVICE IMAGE UPLOAD
  // ==========================================================

  const handleProductImageUpload = (
    event: ChangeEvent<HTMLInputElement>
  ): void => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert(
        "Please select a valid image file."
      );

      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert(
        "Image size must be less than 5 MB."
      );

      event.target.value = "";
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      const result = reader.result;

      if (typeof result !== "string") {
        alert(
          "Could not read the selected image."
        );
        return;
      }

      setImageUrl(result);
      setImagePreview(result);
      setImageSource("device");
    };

    reader.onerror = () => {
      alert("Failed to read image.");
    };

    reader.readAsDataURL(file);
  };

  // ==========================================================
  // EXPORT CSV
  // ==========================================================

  const handleExportCSV = (): void => {
    if (products.length === 0) {
      alert(
        "No products available to export."
      );
      return;
    }

    const headers = [
      "Product ID",
      "Product Name",
      "Category",
      "Price",
      "Original Price",
      "Discount (%)",
      "Stock Left",
      "Stock Used",
      "Description",
    ];

    const rows = products.map((product) => [
      product.productId,
      `"${(product.productName || "").replace(
        /"/g,
        '""'
      )}"`,
      `"${(product.category || "").replace(
        /"/g,
        '""'
      )}"`,
      product.price,
      product.originalPrice || 0,
      product.discount || 0,
      product.stockLeft || 0,
      product.stockUsed || 0,
      `"${(product.description || "").replace(
        /"/g,
        '""'
      )}"`,
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.join(",")),
    ].join("\n");

    const blob = new Blob(
      [csvContent],
      {
        type: "text/csv;charset=utf-8;",
      }
    );

    const url =
      URL.createObjectURL(blob);

    const link =
      document.createElement("a");

    link.setAttribute(
      "href",
      url
    );

    link.setAttribute(
      "download",
      `${selectedShop.shopName.replace(
        /\s+/g,
        "_"
      )}_Inventory.csv`
    );

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  // ==========================================================
  // IMPORT CSV
  // ==========================================================

  const handleFileUpload = (
    event: ChangeEvent<HTMLInputElement>
  ): void => {
    const file = event.target.files?.[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = async (loadEvent) => {
      const text =
        loadEvent.target?.result;

      if (typeof text !== "string") {
        alert(
          "Could not read CSV file."
        );
        return;
      }

      const lines = text
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);

      if (lines.length < 2) {
        alert(
          "The CSV file is empty or missing data rows."
        );
        return;
      }

      const rows = lines.slice(1);

      setImporting(true);

      let successCount = 0;

      try {
        for (const line of rows) {
          const cols = line
            .split(",")
            .map((column) =>
              column
                .replace(/^"|"$/g, "")
                .trim()
            );

          const [
            importedProductName,
            importedPrice,
            importedOriginalPrice,
            importedDiscount,
            importedCategory,
            importedStockLeft,
            importedStockUsed,
            importedDescription,
          ] = cols;

          if (
            !importedProductName ||
            !importedPrice
          ) {
            continue;
          }

          const productPayload = {
            productName:
              importedProductName,

            price:
              Number(importedPrice) || 0,

            originalPrice:
              importedOriginalPrice
                ? Number(
                    importedOriginalPrice
                  )
                : 0,

            discount:
              importedDiscount
                ? Number(importedDiscount)
                : 0,

            category:
              importedCategory ||
              "General",

            description:
              importedDescription ||
              "",

            stockLeft:
              importedStockLeft
                ? Number(
                    importedStockLeft
                  )
                : 0,

            stockUsed:
              importedStockUsed
                ? Number(
                    importedStockUsed
                  )
                : 0,

            shopId:
              selectedShop.shopId,

            imageUrl: "",
          };

          const response =
            await fetch(
              PRODUCT_SERVICE,
              {
                method: "POST",
                headers: getHeaders(),
                body: JSON.stringify(
                  productPayload
                ),
              }
            );

          if (response.ok) {
            successCount++;
          }
        }

        alert(
          `Successfully imported ${successCount} products!`
        );

        await fetchProducts();
      } catch (err) {
        alert(
          "Error during CSV import: " +
            (err instanceof Error
              ? err.message
              : "Unknown error")
        );
      } finally {
        setImporting(false);
        event.target.value = "";
      }
    };

    reader.readAsText(file);
  };

  // ==========================================================
  // ADD PRODUCT - POST
  // ==========================================================

  const handleAddProduct = async (
    event: FormEvent<HTMLFormElement>
  ): Promise<void> => {
    event.preventDefault();

    setAdding(true);

    try {
      const response = await fetch(
        PRODUCT_SERVICE,
        {
          method: "POST",
          headers: getHeaders(),

          body: JSON.stringify({
            productName,
            price: Number(price),

            originalPrice:
              originalPrice
                ? Number(originalPrice)
                : 0,

            discount:
              discount
                ? Number(discount)
                : 0,

            category:
              category || "General",

            description,

            stockLeft:
              Number(stockLeft),

            stockUsed: 0,

            shopId:
              selectedShop.shopId,

            imageUrl:
              imageUrl || "",
          }),
        }
      );

      if (!response.ok) {
        throw new Error(
          await getErrorMessage(
            response,
            "Failed to create product."
          )
        );
      }

      alert(
        "Product added successfully!"
      );

      // Reset product fields
      setProductName("");
      setPrice("");
      setOriginalPrice("");
      setDiscount("");
      setCategory("");
      setDescription("");
      setStockLeft("");

      // Reset image
      setImageUrl("");
      setImagePreview("");
      setImageSource("url");

      const fileInput =
        document.getElementById(
          "productImageInput"
        ) as HTMLInputElement | null;

      if (fileInput) {
        fileInput.value = "";
      }

      setIsAdding(false);

      await fetchProducts();
    } catch (err) {
      alert(
        "Error adding product: " +
          (err instanceof Error
            ? err.message
            : "Unknown error")
      );
    } finally {
      setAdding(false);
    }
  };

  // ==========================================================
  // UPDATE PRODUCT - PUT
  // ==========================================================

  const handleUpdateProduct = async (
    event: FormEvent<HTMLFormElement>
  ): Promise<void> => {
    event.preventDefault();

    if (!editingProduct) return;

    setUpdating(true);

    try {
      const response = await fetch(
        `${PRODUCT_SERVICE}/${editingProduct.productId}`,
        {
          method: "PUT",
          headers: getHeaders(),

          body: JSON.stringify({
            productName: editName,

            description:
              editDescription,

            price:
              Number(editPrice),

            originalPrice:
              editOriginalPrice
                ? Number(
                    editOriginalPrice
                  )
                : 0,

            discount:
              editDiscount
                ? Number(editDiscount)
                : 0,

            stockLeft:
              Number(editStockLeft),

            stockUsed:
              editStockUsed
                ? Number(editStockUsed)
                : 0,

            category:
              editCategory,

            shopId:
              selectedShop.shopId,

            imageUrl:
              editingProduct.imageUrl ||
              "",
          }),
        }
      );

      if (!response.ok) {
        throw new Error(
          await getErrorMessage(
            response,
            "Failed to update product."
          )
        );
      }

      alert(
        "Product updated successfully!"
      );

      setEditingProduct(null);

      await fetchProducts();
    } catch (err) {
      alert(
        "Error updating product: " +
          (err instanceof Error
            ? err.message
            : "Unknown error")
      );
    } finally {
      setUpdating(false);
    }
  };

  // ==========================================================
  // ADD STOCK - PATCH
  // ==========================================================

  const handleAddStock = async (
    event: FormEvent<HTMLFormElement>
  ): Promise<void> => {
    event.preventDefault();

    if (!stockProduct) return;

    const quantity =
      Number(stockQuantity);

    if (
      !Number.isInteger(quantity) ||
      quantity <= 0
    ) {
      alert(
        "Please enter a valid stock quantity."
      );
      return;
    }

    setAddingStock(true);

    try {
      const response =
        await fetch(
          `${PRODUCT_SERVICE}/${stockProduct.productId}/add-stock?quantity=${quantity}`,
          {
            method: "PATCH",
            headers: getHeaders(),
          }
        );

      if (!response.ok) {
        throw new Error(
          await getErrorMessage(
            response,
            "Failed to add stock."
          )
        );
      }

      alert(
        `${quantity} stock item(s) added successfully!`
      );

      setStockProduct(null);
      setStockQuantity("");

      await fetchProducts();
    } catch (err) {
      alert(
        "Error adding stock: " +
          (err instanceof Error
            ? err.message
            : "Unknown error")
      );
    } finally {
      setAddingStock(false);
    }
  };

  // ==========================================================
  // DELETE PRODUCT - DELETE
  // ==========================================================

  const handleDeleteProduct = async (
    productId: number
  ): Promise<void> => {
    if (
      !window.confirm(
        `Delete product ID #${productId}?`
      )
    ) {
      return;
    }

    try {
      const response =
        await fetch(
          `${PRODUCT_SERVICE}/${productId}`,
          {
            method: "DELETE",
            headers: getHeaders(),
          }
        );

      if (
        !response.ok &&
        response.status !== 204
      ) {
        throw new Error(
          await getErrorMessage(
            response,
            "Failed to delete product."
          )
        );
      }

      alert("Product deleted!");

      await fetchProducts();
    } catch (err) {
      alert(
        "Error deleting product: " +
          (err instanceof Error
            ? err.message
            : "Unknown error")
      );
    }
  };

  // ==========================================================
  // CATEGORIES
  // ==========================================================

  const categories: string[] = [
    "All",

    ...Array.from(
      new Set(
        products
          .map(
            (product) =>
              product.category
          )
          .filter(
            (
              category
            ): category is string =>
              Boolean(category)
          )
      )
    ),
  ];

  // ==========================================================
  // FILTERING & SORTING
  // ==========================================================

  const filteredProducts =
    [...products]
      .filter((product) => {
        const search =
          searchQuery.toLowerCase();

        const matchesSearch =
          product.productName
            ?.toLowerCase()
            .includes(search) ||
          product.category
            ?.toLowerCase()
            .includes(search) ||
          String(
            product.productId
          ).includes(search);

        const matchesCategory =
          selectedCategory ===
            "All" ||
          product.category ===
            selectedCategory;

        return Boolean(
          matchesSearch &&
            matchesCategory
        );
      })
      .sort((a, b) => {
        if (sortBy === "PriceLow") {
          return (
            a.price - b.price
          );
        }

        if (sortBy === "PriceHigh") {
          return (
            b.price - a.price
          );
        }

        if (
          sortBy ===
          "DiscountHigh"
        ) {
          return (
            (b.discount || 0) -
            (a.discount || 0)
          );
        }

        if (sortBy === "NameAZ") {
          return (
            a.productName || ""
          ).localeCompare(
            b.productName || ""
          );
        }

        if (
          sortBy === "Category"
        ) {
          return (
            a.category || ""
          ).localeCompare(
            b.category || ""
          );
        }

        return (
          b.productId -
          a.productId
        );
      });

  // ==========================================================
  // TOTAL INVENTORY VALUATION
  // ==========================================================

  const totalValuation =
    products.reduce(
      (total, product) =>
        total +
        product.price *
          (product.stockLeft || 0),
      0
    );

  // ==========================================================
  // OPEN EDIT MODAL
  // ==========================================================

  const openEditProduct = (
    product: Product
  ): void => {
    setEditingProduct(product);

    setEditName(
      product.productName || ""
    );

    setEditDescription(
      product.description || ""
    );

    setEditPrice(
      String(product.price ?? "")
    );

    setEditOriginalPrice(
      String(
        product.originalPrice ?? ""
      )
    );

    setEditDiscount(
      String(
        product.discount ?? ""
      )
    );

    setEditStockLeft(
      String(
        product.stockLeft ?? ""
      )
    );

    setEditStockUsed(
      String(
        product.stockUsed ?? ""
      )
    );

    setEditCategory(
      product.category || ""
    );
  };

  // ==========================================================
  // JSX
  // ==========================================================

  return (
    <div className="product-page">

      {/* =====================================================
          TOP NAVIGATION
          ===================================================== */}

      <div className="product-topbar">

        <button
          className="back-shops-btn"
          onClick={onBackToShops}
        >
          ← Back to Shops
        </button>

        <span className="inventory-label">
          {selectedShop.shopName} Retail Inventory
        </span>

      </div>

      <main className="product-container">

        {/* ===================================================
            HEADER
            =================================================== */}

        <div className="product-header">

          <div className="product-heading">

            <div className="product-title-row">

              <h1 className="product-title">

                Products Of Shop{" "}
                {selectedShop.shopId}:{" "}

                <span>
                  {selectedShop.shopName}
                </span>

              </h1>

              <span className="active-store-badge">
                🟢 Active Store
              </span>

            </div>

            <p className="shop-meta">

              📍 {selectedShop.address}

              &nbsp; • &nbsp;

              Shop ID:{" "}
              {selectedShop.shopId}

              &nbsp; • &nbsp;

              {products.length} items

            </p>

          </div>

          {/* CSV hidden input */}

          <input
            type="file"
            accept=".csv"
            id="csvFileInput"
            className="hidden-file-input"
            onChange={handleFileUpload}
          />

          <div className="product-header-actions">

            <button
              className="secondary-btn"
              onClick={
                handleExportCSV
              }
            >
              📤 Export CSV
            </button>

            <button
              className="secondary-btn"
              onClick={() =>
                document
                  .getElementById(
                    "csvFileInput"
                  )
                  ?.click()
              }
              disabled={importing}
            >
              📥{" "}
              {importing
                ? "Importing..."
                : "Import CSV"}
            </button>

            <button
              className="add-product-btn"
              onClick={() =>
                setIsAdding(
                  !isAdding
                )
              }
            >
              {isAdding
                ? "Cancel"
                : "➕ Add Product"}
            </button>

          </div>

        </div>

        {/* ===================================================
            ADD PRODUCT
            =================================================== */}

        {isAdding && (
          <section className="add-product-card">

            <h3 className="section-title">
              Add New Product
            </h3>

            <form
              onSubmit={
                handleAddProduct
              }
              className="add-product-form"
            >

              {/* Product Name */}

              <div className="form-field">

                <label>
                  Product Name
                </label>

                <input
                  type="text"
                  value={productName}
                  onChange={(e) =>
                    setProductName(
                      e.target.value
                    )
                  }
                  required
                />

              </div>

              {/* Price */}

              <div className="form-field">

                <label>
                  Price (₹)
                </label>

                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={price}
                  onChange={(e) =>
                    setPrice(
                      e.target.value
                    )
                  }
                  required
                />

              </div>

              {/* Original Price */}

              <div className="form-field">

                <label>
                  Original Price (₹)
                </label>

                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={
                    originalPrice
                  }
                  onChange={(e) =>
                    setOriginalPrice(
                      e.target.value
                    )
                  }
                />

              </div>

              {/* Discount */}

              <div className="form-field">

                <label>
                  Discount (%)
                </label>

                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={discount}
                  onChange={(e) =>
                    setDiscount(
                      e.target.value
                    )
                  }
                />

              </div>

              {/* Category */}

              <div className="form-field">

                <label>
                  Category
                </label>

                <input
                  type="text"
                  value={category}
                  onChange={(e) =>
                    setCategory(
                      e.target.value
                    )
                  }
                  placeholder="e.g. Electronics"
                />

              </div>

              {/* Stock */}

              <div className="form-field">

                <label>
                  Stock Left
                </label>

                <input
                  type="number"
                  min="0"
                  step="1"
                  value={stockLeft}
                  onChange={(e) =>
                    setStockLeft(
                      e.target.value
                    )
                  }
                  required
                />

              </div>

              {/* Description */}

              <div className="form-field full-width">

                <label>
                  Description
                </label>

                <input
                  type="text"
                  value={
                    description
                  }
                  onChange={(e) =>
                    setDescription(
                      e.target.value
                    )
                  }
                  placeholder="Short product summary..."
                />

              </div>

              {/* =================================================
                  PRODUCT IMAGE
                  ================================================= */}

              <div className="form-field full-width product-image-field">

                <label className="product-image-main-label">
                  Product Image
                </label>

                <p className="product-image-help">
                  Add a product image using a URL
                  or upload one directly from
                  your device.
                </p>

                {/* =================================================
                    IMAGE SOURCE SELECTOR
                    ================================================= */}

                <div className="image-source-selector">

                  {/* URL */}

                  <button
                    type="button"
                    className={
                      imageSource ===
                      "url"
                        ? "image-source-option active"
                        : "image-source-option"
                    }
                    onClick={() => {
                      setImageSource(
                        "url"
                      );

                      if (
                        imageUrl &&
                        !imageUrl.startsWith(
                          "data:image"
                        )
                      ) {
                        setImagePreview(
                          imageUrl
                        );
                      }
                    }}
                  >

                    <span className="image-option-icon">
                      🔗
                    </span>

                    <span className="image-option-content">

                      <strong>
                        Image URL
                      </strong>

                      <small>
                        Use an online image
                      </small>

                    </span>

                    {imageSource ===
                      "url" && (
                      <span className="image-option-check">
                        ✓
                      </span>
                    )}

                  </button>

                  {/* DEVICE */}

                  <button
                    type="button"
                    className={
                      imageSource ===
                      "device"
                        ? "image-source-option active"
                        : "image-source-option"
                    }
                    onClick={() => {
                      setImageSource(
                        "device"
                      );

                      if (
                        imageUrl &&
                        imageUrl.startsWith(
                          "data:image"
                        )
                      ) {
                        setImagePreview(
                          imageUrl
                        );
                      } else {
                        setImagePreview(
                          ""
                        );
                      }
                    }}
                  >

                    <span className="image-option-icon">
                      📁
                    </span>

                    <span className="image-option-content">

                      <strong>
                        Upload from Device
                      </strong>

                      <small>
                        JPG, PNG or WEBP
                      </small>

                    </span>

                    {imageSource ===
                      "device" && (
                      <span className="image-option-check">
                        ✓
                      </span>
                    )}

                  </button>

                </div>

                {/* =================================================
                    URL INPUT
                    ================================================= */}

                {imageSource ===
                  "url" && (
                  <div className="image-url-section">

                    <div className="image-url-input-wrapper">

                      <span className="image-url-icon">
                        🔗
                      </span>

                      <input
                        type="url"
                        value={
                          imageUrl.startsWith(
                            "data:image"
                          )
                            ? ""
                            : imageUrl
                        }
                        onChange={(e) =>
                          handleImageUrlChange(
                            e.target.value
                          )
                        }
                        placeholder="https://example.com/product-image.jpg"
                      />

                      {imageUrl &&
                        !imageUrl.startsWith(
                          "data:image"
                        ) && (
                          <button
                            type="button"
                            className="image-input-clear"
                            onClick={
                              handleRemoveImage
                            }
                            title="Remove image URL"
                            aria-label="Remove image URL"
                          >
                            ×
                          </button>
                        )}

                    </div>

                    <small className="image-input-hint">
                      Paste a direct link to
                      the product image.
                    </small>

                  </div>
                )}

                {/* =================================================
                    DEVICE UPLOAD
                    ================================================= */}

                {imageSource ===
                  "device" && (
                  <div className="image-device-section">

                    <input
                      type="file"
                      id="productImageInput"
                      accept="image/png,image/jpeg,image/jpg,image/webp"
                      onChange={
                        handleProductImageUpload
                      }
                      className="product-image-file-input"
                    />

                    <label
                      htmlFor="productImageInput"
                      className="product-upload-box"
                    >

                      <span className="upload-box-icon">
                        📷
                      </span>

                      <span className="upload-box-title">
                        Choose Product Image
                      </span>

                      <span className="upload-box-subtitle">
                        Click to browse from your device
                      </span>

                      <span className="upload-box-formats">
                        JPG • PNG • WEBP • Max 5 MB
                      </span>

                    </label>

                  </div>
                )}

                {/* =================================================
                    IMAGE PREVIEW
                    ================================================= */}

                {imagePreview && (
                  <div className="product-image-preview">

                    <div className="preview-header">

                      <span>
                        Image Preview
                      </span>

                      <button
                        type="button"
                        className="remove-image-btn"
                        onClick={
                          handleRemoveImage
                        }
                        title="Remove image"
                        aria-label="Remove image"
                      >
                        ×
                      </button>

                    </div>

                    <div className="preview-image-wrapper">

                      <img
                        src={
                          imagePreview
                        }
                        alt="Product preview"
                        onError={() => {
                          setImagePreview(
                            ""
                          );

                          alert(
                            "Unable to load this image. Please check the URL."
                          );
                        }}
                      />

                      <button
                        type="button"
                        className="preview-remove-btn"
                        onClick={
                          handleRemoveImage
                        }
                        title="Remove image"
                        aria-label="Remove image"
                      >
                        ×
                      </button>

                    </div>

                  </div>
                )}

              </div>

              {/* =================================================
                  SUBMIT
                  ================================================= */}

              <div className="form-submit-area">

                <button
                  type="submit"
                  className="save-product-btn"
                  disabled={adding}
                >
                  {adding
                    ? "Saving..."
                    : "Save Product"}
                </button>

              </div>

            </form>

          </section>
        )}

        {/* ===================================================
            EDIT MODAL
            =================================================== */}

        {editingProduct && (
          <div className="modal-overlay">

            <div className="edit-modal">

              <h3 className="edit-modal-title">
                Edit Product{" "}
                {
                  editingProduct.productId
                }
              </h3>

              <form
                onSubmit={
                  handleUpdateProduct
                }
                className="edit-product-form"
              >

                <div className="form-field">

                  <label>
                    Product Name
                  </label>

                  <input
                    type="text"
                    value={editName}
                    onChange={(e) =>
                      setEditName(
                        e.target.value
                      )
                    }
                    required
                  />

                </div>

                <div className="form-field">

                  <label>
                    Description
                  </label>

                  <input
                    type="text"
                    value={
                      editDescription
                    }
                    onChange={(e) =>
                      setEditDescription(
                        e.target.value
                      )
                    }
                  />

                </div>

                <div className="edit-row">

                  <div className="form-field">

                    <label>
                      Price (₹)
                    </label>

                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={
                        editPrice
                      }
                      onChange={(e) =>
                        setEditPrice(
                          e.target.value
                        )
                      }
                      required
                    />

                  </div>

                  <div className="form-field">

                    <label>
                      Original Price (₹)
                    </label>

                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={
                        editOriginalPrice
                      }
                      onChange={(e) =>
                        setEditOriginalPrice(
                          e.target.value
                        )
                      }
                    />

                  </div>

                  <div className="form-field">

                    <label>
                      Discount (%)
                    </label>

                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={
                        editDiscount
                      }
                      onChange={(e) =>
                        setEditDiscount(
                          e.target.value
                        )
                      }
                    />

                  </div>

                </div>

                <div className="edit-row">

                  <div className="form-field">

                    <label>
                      Stock Left
                    </label>

                    <input
                      type="number"
                      min="0"
                      value={
                        editStockLeft
                      }
                      onChange={(e) =>
                        setEditStockLeft(
                          e.target.value
                        )
                      }
                      required
                    />

                  </div>

                  <div className="form-field">

                    <label>
                      Stock Used
                    </label>

                    <input
                      type="number"
                      min="0"
                      value={
                        editStockUsed
                      }
                      onChange={(e) =>
                        setEditStockUsed(
                          e.target.value
                        )
                      }
                    />

                  </div>

                  <div className="form-field">

                    <label>
                      Category
                    </label>

                    <input
                      type="text"
                      value={
                        editCategory
                      }
                      onChange={(e) =>
                        setEditCategory(
                          e.target.value
                        )
                      }
                      required
                    />

                  </div>

                </div>

                <div className="modal-actions">

                  <button
                    type="submit"
                    className="save-changes-btn"
                    disabled={
                      updating
                    }
                  >
                    {updating
                      ? "Updating..."
                      : "Save Changes"}
                  </button>

                  <button
                    type="button"
                    className="cancel-btn"
                    onClick={() =>
                      setEditingProduct(
                        null
                      )
                    }
                  >
                    Cancel
                  </button>

                </div>

              </form>

            </div>

          </div>
        )}

        {/* ===================================================
            ADD STOCK MODAL
            =================================================== */}

        {stockProduct && (
          <div className="modal-overlay">

            <div className="edit-modal">

              <h3 className="edit-modal-title">
                Add Stock
              </h3>

              <p>
                Product:{" "}
                <strong>
                  {
                    stockProduct.productName
                  }
                </strong>
              </p>

              <p>
                Current Stock:{" "}
                <strong>
                  {
                    stockProduct.stockLeft
                  }
                </strong>
              </p>

              <form
                onSubmit={
                  handleAddStock
                }
                className="edit-product-form"
              >

                <div className="form-field">

                  <label>
                    Quantity to Add
                  </label>

                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={
                      stockQuantity
                    }
                    onChange={(e) =>
                      setStockQuantity(
                        e.target.value
                      )
                    }
                    placeholder="Enter quantity"
                    required
                  />

                </div>

                <div className="modal-actions">

                  <button
                    type="submit"
                    className="save-changes-btn"
                    disabled={
                      addingStock
                    }
                  >
                    {addingStock
                      ? "Adding..."
                      : "Add Stock"}
                  </button>

                  <button
                    type="button"
                    className="cancel-btn"
                    onClick={() => {
                      setStockProduct(
                        null
                      );

                      setStockQuantity(
                        ""
                      );
                    }}
                  >
                    Cancel
                  </button>

                </div>

              </form>

            </div>

          </div>
        )}

        {/* ===================================================
            SEARCH / FILTERS
            =================================================== */}

        <div className="filter-toolbar">

          <div className="filter-left">

            <div className="search-box">

              <span>
                🔍
              </span>

              <input
                type="text"
                placeholder="Search by name, ID, or category..."
                value={
                  searchQuery
                }
                onChange={(e) =>
                  setSearchQuery(
                    e.target.value
                  )
                }
              />

            </div>

            <div className="category-filters">

              {categories.map(
                (cat) => {

                  const isActive =
                    selectedCategory ===
                    cat;

                  const count =
                    cat === "All"
                      ? products.length
                      : products.filter(
                          (
                            product
                          ) =>
                            product.category ===
                            cat
                        ).length;

                  return (
                    <button
                      key={cat}
                      className={
                        isActive
                          ? "category-pill active"
                          : "category-pill"
                      }
                      onClick={() =>
                        setSelectedCategory(
                          cat
                        )
                      }
                    >
                      {cat} ({count})
                    </button>
                  );
                }
              )}

            </div>

          </div>

          <div className="sort-area">

            <span>
              Sort by:
            </span>

            <select
              value={sortBy}
              onChange={(e) =>
                setSortBy(
                  e.target.value
                )
              }
            >

              <option value="Newest">
                Newest Added
              </option>

              <option value="PriceLow">
                Price: Low to High
              </option>

              <option value="PriceHigh">
                Price: High to Low
              </option>

              <option value="DiscountHigh">
                Highest Discount %
              </option>

              <option value="NameAZ">
                Product Name (A-Z)
              </option>

              <option value="Category">
                Category (A-Z)
              </option>

            </select>

          </div>

        </div>

        {/* ===================================================
            PRODUCTS
            =================================================== */}

        {loading ? (

          <div className="products-loading">
            Loading products inventory...
          </div>

        ) : error ? (

          <div className="products-error">
            {error}
          </div>

        ) : filteredProducts.length ===
          0 ? (

          <div className="no-products">

            <p className="no-products-title">
              No products found
            </p>

            <p>
              Try clearing your search or
              category filter.
            </p>

          </div>

        ) : (

          <div className="products-grid">

            {filteredProducts.map(
              (product) => {

                const isLowStock =
                  product.stockLeft <
                  10;

                return (

                  <div
                    key={
                      product.productId
                    }
                    className="product-card"
                  >

                    {/* =================================================
                        PRODUCT IMAGE
                        ================================================= */}

                    {product.imageUrl && (
                      <div className="product-card-image">

                        <img
                          src={
                            product.imageUrl
                          }
                          alt={
                            product.productName
                          }
                          onError={(
                            event
                          ) => {
                            event.currentTarget.style.display =
                              "none";
                          }}
                        />

                      </div>
                    )}

                    {/* Product information */}

                    <div>

                      <div className="product-card-top">

                        <span className="product-id">
                          ID: #
                          {
                            product.productId
                          }
                        </span>

                        {product.category && (
                          <span className="product-category">
                            {
                              product.category
                            }
                          </span>
                        )}

                      </div>

                      <h3 className="product-name">
                        {
                          product.productName
                        }
                      </h3>

                      <p className="product-description">
                        {
                          product.description ||
                          "No description provided"
                        }
                      </p>

                      <div className="product-pricing">

                        <span className="product-price">
                          ₹
                          {
                            product.price
                          }
                        </span>

                        {product.originalPrice &&
                          product.originalPrice >
                            0 && (
                            <span className="original-price">
                              ₹
                              {
                                product.originalPrice
                              }
                            </span>
                          )}

                        {product.discount &&
                          product.discount >
                            0 && (
                            <span className="discount-badge">
                              {
                                product.discount
                              }
                              % OFF
                            </span>
                          )}

                      </div>

                      <div
                        className={
                          isLowStock
                            ? "stock-status low"
                            : "stock-status"
                        }
                      >

                        <span>
                          Stock Left / Used:
                        </span>

                        <strong>
                          {
                            product.stockLeft
                          }{" "}
                          /{" "}
                          {
                            product.stockUsed ||
                            0
                          }
                        </strong>

                      </div>

                    </div>

                    {/* =================================================
                        PRODUCT ACTIONS
                        ================================================= */}

                    <div className="product-actions">

                      <button
                        className="edit-product-btn"
                        onClick={() =>
                          openEditProduct(
                            product
                          )
                        }
                      >
                        ✏️ Edit
                      </button>

                      <button
                        className="add-stock-btn"
                        onClick={() => {
                          setStockProduct(
                            product
                          );

                          setStockQuantity(
                            ""
                          );
                        }}
                      >
                        📦 Add Stock
                      </button>

                      <button
                        className="delete-product-btn"
                        onClick={() =>
                          void handleDeleteProduct(
                            product.productId
                          )
                        }
                      >
                        🗑️ Delete
                      </button>

                    </div>

                  </div>
                );
              }
            )}

          </div>

        )}

      </main>

      {/* =====================================================
          FOOTER
          ===================================================== */}

      <footer className="product-footer">

        <span>

          {selectedShop.shopName}

          {" — "}

          Total inventory valuation:{" "}

          <strong>
            ₹
            {totalValuation.toLocaleString()}
          </strong>

        </span>

      </footer>

    </div>
  );
}