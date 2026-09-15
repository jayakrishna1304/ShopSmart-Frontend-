import { useEffect, useMemo, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import "../AddVoucherPage.css";

interface Voucher {
    id?: number;
    voucherId?: number;
    ownerId?: number;
    voucherCode: string;
    pointsCost: number;
    expiryDays?: number;
    expiryDate?: string;
}

interface Shop {
    shopId: number;
    shopName: string;
    ownerId?: number;
}

interface AddVoucherPageProps {
    retailerId: number;
}

interface VoucherFormData {
    ownerId: string;
    voucherCode: string;
    pointsCost: string;
    expiryDays: string;
}

const VOUCHER_URL =
    "http://localhost:8089/shopsmart/loyaltyTransaction/retailer/vouchers";

const SHOP_URL = "http://localhost:8081/shopsmart/shop";

export default function AddVoucherPage({
    retailerId,
}: AddVoucherPageProps) {
    const [formData, setFormData] = useState<VoucherFormData>({
        ownerId: String(retailerId),
        voucherCode: "",
        pointsCost: "40",
        expiryDays: "30",
    });

    const [retailerVouchers, setRetailerVouchers] = useState<Voucher[]>([]);
    const [shopsList, setShopsList] = useState<Shop[]>([]);

    const [statusMessage, setStatusMessage] = useState("");
    const [loading, setLoading] = useState(false);

    const [editingVoucherId, setEditingVoucherId] =
        useState<number | null>(null);

    const [searchTerm, setSearchTerm] = useState("");
    const [copiedCode, setCopiedCode] = useState("");

    // =====================================================
    // AUTH
    // =====================================================

    const getHeaders = (): HeadersInit => {
        const token = localStorage.getItem("shopsmart_token");

        return {
            "Content-Type": "application/json",
            ...(token
                ? {
                      Authorization: `Bearer ${token}`,
                  }
                : {}),
        };
    };

    // =====================================================
    // SYNC RETAILER ID
    // =====================================================

    useEffect(() => {
        setFormData((prev) => ({
            ...prev,
            ownerId: String(retailerId),
        }));
    }, [retailerId]);

    // =====================================================
    // FETCH VOUCHERS
    // =====================================================

    const fetchRetailerVouchers = async () => {
        try {
            const response = await fetch(VOUCHER_URL, {
                headers: getHeaders(),
            });

            if (!response.ok) {
                throw new Error("Unable to load vouchers");
            }

            const data = await response.json();

            if (Array.isArray(data)) {
                // Only show vouchers belonging to logged-in retailer
                const retailerOnly = data.filter(
                    (voucher: Voucher) =>
                        Number(voucher.ownerId) === Number(retailerId)
                );

                setRetailerVouchers(retailerOnly);
            }
        } catch (error) {
            console.error("Error fetching vouchers:", error);
            setStatusMessage("Unable to load vouchers.");
        }
    };

    // =====================================================
    // FETCH SHOPS
    // =====================================================

    const fetchShopsList = async () => {
        try {
            const response = await fetch(
                `${SHOP_URL}/retailer/${retailerId}`,
                {
                    headers: getHeaders(),
                }
            );

            if (!response.ok) {
                return;
            }

            const data = await response.json();

            if (Array.isArray(data)) {
                setShopsList(data);
            } else if (Array.isArray(data?.shops)) {
                setShopsList(data.shops);
            } else if (Array.isArray(data?.data)) {
                setShopsList(data.data);
            }
        } catch (error) {
            console.error("Error fetching shops:", error);
        }
    };

    useEffect(() => {
        fetchRetailerVouchers();
        fetchShopsList();
    }, [retailerId]);

    // =====================================================
    // FORM CHANGE
    // =====================================================

    const handleChange = (
        event: ChangeEvent<HTMLInputElement>
    ) => {
        const { name, value } = event.target;

        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    // =====================================================
    // QUICK EXPIRY
    // =====================================================

    const handleQuickPick = (days: string) => {
        setFormData((prev) => ({
            ...prev,
            expiryDays: days,
        }));
    };

    // =====================================================
    // AUTO GENERATE VOUCHER
    // =====================================================

    const handleAutoGenerate = () => {
        let shopPrefix = "SHOPSMART";

        const matchedShop = shopsList.find(
            (shop) =>
                Number(shop.ownerId) === Number(retailerId)
        );

        if (matchedShop?.shopName) {
            shopPrefix = matchedShop.shopName
                .replace(/[^a-zA-Z0-9]/g, "")
                .toUpperCase()
                .slice(0, 8);
        }

        const currentYear = new Date().getFullYear();

        const randomSuffix = Math.random()
            .toString(36)
            .substring(2, 6)
            .toUpperCase();

        const generatedCode =
            `${shopPrefix}-${currentYear}-${randomSuffix}`;

        setFormData((prev) => ({
            ...prev,
            voucherCode: generatedCode,
        }));
    };

    // =====================================================
    // COPY CODE
    // =====================================================

    const handleCopyCode = async (code: string) => {
        try {
            await navigator.clipboard.writeText(code);

            setCopiedCode(code);

            setTimeout(() => {
                setCopiedCode("");
            }, 2000);
        } catch {
            setStatusMessage("Unable to copy voucher code.");
        }
    };

    // =====================================================
    // EDIT
    // =====================================================

    const handleEditClick = (voucher: Voucher) => {
        const voucherId =
            voucher.id ?? voucher.voucherId;

        if (voucherId === undefined) {
            return;
        }

        setEditingVoucherId(voucherId);

        setFormData({
            ownerId: String(
                voucher.ownerId ?? retailerId
            ),
            voucherCode: voucher.voucherCode ?? "",
            pointsCost: String(
                voucher.pointsCost ?? 40
            ),
            expiryDays: String(
                voucher.expiryDays ?? 30
            ),
        });

        setStatusMessage(
            `Editing voucher: ${voucher.voucherCode}`
        );
    };

    // =====================================================
    // CANCEL EDIT
    // =====================================================

    const handleCancelEdit = () => {
        setEditingVoucherId(null);

        setFormData({
            ownerId: String(retailerId),
            voucherCode: "",
            pointsCost: "40",
            expiryDays: "30",
        });

        setStatusMessage("");
    };

    // =====================================================
    // DELETE
    // =====================================================

    const handleDeleteClick = async (
        voucherId?: number
    ) => {
        if (voucherId === undefined) {
            return;
        }

        const confirmed = window.confirm(
            "Are you sure you want to delete this voucher?"
        );

        if (!confirmed) {
            return;
        }

        try {
            const response = await fetch(
                `${VOUCHER_URL}/${voucherId}`,
                {
                    method: "DELETE",
                    headers: getHeaders(),
                }
            );

            if (!response.ok) {
                throw new Error("Delete failed");
            }

            setStatusMessage(
                "Voucher deleted successfully!"
            );

            if (editingVoucherId === voucherId) {
                handleCancelEdit();
            }

            await fetchRetailerVouchers();
        } catch (error) {
            console.error(error);

            setStatusMessage(
                "Unable to delete voucher."
            );
        }
    };

    // =====================================================
    // SUBMIT CREATE / UPDATE
    // =====================================================

    const handleSubmit = async (
        event: FormEvent<HTMLFormElement>
    ) => {
        event.preventDefault();

        setLoading(true);
        setStatusMessage("");

        const isEditing =
            editingVoucherId !== null;

        const url = isEditing
            ? `${VOUCHER_URL}/${editingVoucherId}`
            : VOUCHER_URL;

        try {
            const response = await fetch(url, {
                method: isEditing ? "PUT" : "POST",
                headers: getHeaders(),
                body: JSON.stringify({
                    ownerId: Number(retailerId),
                    voucherCode:
                        formData.voucherCode.trim(),
                    pointsCost:
                        Number(formData.pointsCost),
                    expiryDays:
                        Number(formData.expiryDays),
                }),
            });

            if (!response.ok) {
                throw new Error(
                    `Request failed: ${response.status}`
                );
            }

            setStatusMessage(
                isEditing
                    ? "Voucher updated successfully!"
                    : "Voucher created successfully!"
            );

            setFormData({
                ownerId: String(retailerId),
                voucherCode: "",
                pointsCost: "40",
                expiryDays: "30",
            });

            setEditingVoucherId(null);

            await fetchRetailerVouchers();
        } catch (error) {
            console.error(error);

            setStatusMessage(
                "Failed to save voucher. Please check your inputs."
            );
        } finally {
            setLoading(false);
        }
    };

    // =====================================================
    // EXPORT CSV
    // =====================================================

    const handleExportCSV = () => {
        if (retailerVouchers.length === 0) {
            setStatusMessage(
                "No vouchers available to export."
            );
            return;
        }

        const headers = [
            "id",
            "ownerId",
            "voucherCode",
            "pointsCost",
            "expiryDays",
        ];

        const rows = retailerVouchers.map(
            (voucher) => [
                voucher.id ??
                    voucher.voucherId ??
                    "",
                voucher.ownerId ?? "",
                `"${voucher.voucherCode.replace(
                    /"/g,
                    '""'
                )}"`,
                voucher.pointsCost ?? "",
                voucher.expiryDays ?? "",
            ].join(",")
        );

        const csv = [
            headers.join(","),
            ...rows,
        ].join("\n");

        const blob = new Blob([csv], {
            type: "text/csv;charset=utf-8;",
        });

        const url =
            URL.createObjectURL(blob);

        const link =
            document.createElement("a");

        link.href = url;
        link.download =
            `retailer_vouchers_${new Date()
                .toISOString()
                .slice(0, 10)}.csv`;

        document.body.appendChild(link);

        link.click();

        document.body.removeChild(link);

        URL.revokeObjectURL(url);

        setStatusMessage(
            "Vouchers exported successfully!"
        );
    };

    // =====================================================
    // IMPORT CSV
    // =====================================================

    const handleImportCSV = (
        event: ChangeEvent<HTMLInputElement>
    ) => {
        const file = event.target.files?.[0];

        if (!file) {
            return;
        }

        const reader = new FileReader();

        reader.onload = async () => {
            const result = reader.result;

            if (typeof result !== "string") {
                return;
            }

            const lines = result
                .split("\n")
                .filter((line) => line.trim());

            if (lines.length < 2) {
                setStatusMessage(
                    "CSV file is empty or missing data."
                );
                return;
            }

            const headers = lines[0]
                .split(",")
                .map((header) =>
                    header.trim().replace(/"/g, "")
                );

            const ownerIndex =
                headers.indexOf("ownerId");

            const codeIndex =
                headers.indexOf("voucherCode");

            const costIndex =
                headers.indexOf("pointsCost");

            const daysIndex =
                headers.indexOf("expiryDays");

            if (
                ownerIndex === -1 ||
                codeIndex === -1 ||
                costIndex === -1 ||
                daysIndex === -1
            ) {
                setStatusMessage(
                    "Invalid CSV headers."
                );
                return;
            }

            setLoading(true);

            let successCount = 0;

            try {
                for (
                    let i = 1;
                    i < lines.length;
                    i++
                ) {
                    const row = lines[i]
                        .split(
                            /,(?=(?:(?:[^"]*"){2})*[^"]*$)/
                        )
                        .map((value) =>
                            value
                                .trim()
                                .replace(
                                    /^"|"$/g,
                                    ""
                                )
                        );

                    if (row.length < 4) {
                        continue;
                    }

                    const ownerId =
                        Number(row[ownerIndex]);

                    // Security: import only for logged-in retailer
                    if (
                        ownerId !==
                        Number(retailerId)
                    ) {
                        continue;
                    }

                    const payload = {
                        ownerId,
                        voucherCode:
                            row[codeIndex],
                        pointsCost:
                            Number(row[costIndex]),
                        expiryDays:
                            Number(row[daysIndex]),
                    };

                    try {
                        const response =
                            await fetch(
                                VOUCHER_URL,
                                {
                                    method: "POST",
                                    headers:
                                        getHeaders(),
                                    body: JSON.stringify(
                                        payload
                                    ),
                                }
                            );

                        if (response.ok) {
                            successCount++;
                        }
                    } catch (error) {
                        console.error(
                            "CSV row error:",
                            error
                        );
                    }
                }

                setStatusMessage(
                    `Imported ${successCount} vouchers successfully!`
                );

                await fetchRetailerVouchers();
            } finally {
                setLoading(false);
                event.target.value = "";
            }
        };

        reader.readAsText(file);
    };

    // =====================================================
    // REMAINING DAYS
    // =====================================================

    const getRemainingDays = (
        voucher: Voucher
    ): number | null => {
        if (voucher.expiryDate) {
            const expiryDate =
                new Date(voucher.expiryDate);

            const today = new Date();

            const difference =
                expiryDate.getTime() -
                today.getTime();

            return Math.ceil(
                difference /
                    (1000 * 60 * 60 * 24)
            );
        }

        if (
            voucher.expiryDays !== undefined &&
            voucher.expiryDays !== null
        ) {
            return Number(voucher.expiryDays);
        }

        return null;
    };

    // =====================================================
    // FILTER
    // =====================================================

    const filteredVouchers =
        useMemo(() => {
            const search =
                searchTerm.toLowerCase().trim();

            return retailerVouchers.filter(
                (voucher) => {
                    if (!search) {
                        return true;
                    }

                    return (
                        voucher.voucherCode
                            .toLowerCase()
                            .includes(search) ||
                        String(
                            voucher.ownerId ?? ""
                        ).includes(search)
                    );
                }
            );
        }, [
            retailerVouchers,
            searchTerm,
        ]);

    // =====================================================
    // STATISTICS
    // =====================================================

    const totalPointsAdded =
        filteredVouchers.reduce(
            (total, voucher) =>
                total +
                Number(
                    voucher.pointsCost || 0
                ),
            0
        );

    const expiringSoonCount =
        filteredVouchers.filter(
            (voucher) => {
                const remaining =
                    getRemainingDays(
                        voucher
                    );

                return (
                    remaining !== null &&
                    remaining >= 0 &&
                    remaining <= 30
                );
            }
        ).length;

    const avgVoucherCost =
        filteredVouchers.length > 0
            ? Math.round(
                  totalPointsAdded /
                      filteredVouchers.length
              )
            : 0;

    // =====================================================
    // UI
    // =====================================================

    return (
        <div className="voucher-page">

            {/* HEADER */}

            <div className="voucher-header">
                <div>
                    <div className="voucher-label">
                        RETAILER
                    </div>

                    <h1>
                        Vouchers Section
                    </h1>

                    <p>
                        Manage vouchers, imports,
                        and exports for Retailer ID:
                        {" "}
                        <strong>
                            {retailerId}
                        </strong>
                    </p>
                </div>

                <div className="voucher-header-actions">
                    <button
                        className="secondary-btn"
                        onClick={
                            handleExportCSV
                        }
                    >
                        📤 Export CSV
                    </button>

                    <label className="secondary-btn import-btn">
                        📥 Import CSV

                        <input
                            type="file"
                            accept=".csv"
                            onChange={
                                handleImportCSV
                            }
                        />
                    </label>
                </div>
            </div>

            {/* STATISTICS */}

            <div className="voucher-stats">

                <div className="voucher-stat-card">
                    <div>
                        <span>
                            Active Vouchers
                        </span>

                        <strong>
                            {
                                filteredVouchers.length
                            }
                        </strong>

                        <small>
                            active records
                        </small>
                    </div>

                    <div className="stat-icon">
                        🛡️
                    </div>
                </div>

                <div className="voucher-stat-card">
                    <div>
                        <span>
                            Total Points Added
                        </span>

                        <strong>
                            {
                                totalPointsAdded.toLocaleString()
                            }
                            {" "}
                            <small>Pts</small>
                        </strong>

                        <small>
                            points
                        </small>
                    </div>

                    <div className="stat-icon">
                        🪙
                    </div>
                </div>

                <div className="voucher-stat-card">
                    <div>
                        <span>
                            Expiring Soon
                        </span>

                        <strong>
                            {expiringSoonCount}
                        </strong>

                        <small>
                            within 30 days
                        </small>
                    </div>

                    <div className="stat-icon">
                        ⏳
                    </div>
                </div>

                <div className="voucher-stat-card">
                    <div>
                        <span>
                            Avg Voucher Cost
                        </span>

                        <strong>
                            {avgVoucherCost}
                            {" "}
                            <small>Pts</small>
                        </strong>

                        <small>
                            average cost
                        </small>
                    </div>

                    <div className="stat-icon">
                        📊
                    </div>
                </div>

            </div>

            {/* MAIN CONTENT */}

            <div className="voucher-layout">

                {/* FORM */}

                <div className="voucher-form-card">

                    <div className="form-card-header">
                        <div>
                            <h2>
                                {editingVoucherId
                                    ? "Edit Voucher"
                                    : "Create Retailer Voucher"}
                            </h2>

                            <p>
                                {editingVoucherId
                                    ? "Modify the existing voucher."
                                    : "Add a new voucher for your customers."}
                            </p>
                        </div>

                        <span
                            className={
                                editingVoucherId
                                    ? "mode-badge editing"
                                    : "mode-badge create"
                            }
                        >
                            {editingVoucherId
                                ? "Editing"
                                : "Create"}
                        </span>
                    </div>

                    {statusMessage && (
                        <div
                            className={
                                statusMessage
                                    .toLowerCase()
                                    .includes(
                                        "success"
                                    )
                                    ? "voucher-message success"
                                    : "voucher-message"
                            }
                        >
                            {statusMessage}
                        </div>
                    )}

                    <form
                        onSubmit={
                            handleSubmit
                        }
                    >

                        {/* OWNER */}

                        <div className="form-group">
                            <label>
                                Retailer ID
                            </label>

                            <input
                                type="text"
                                value={
                                    formData.ownerId
                                }
                                readOnly
                                className="readonly-input"
                            />
                        </div>

                        {/* CODE */}

                        <div className="form-group">

                            <div className="label-row">
                                <label>
                                    Voucher Code
                                </label>

                                <button
                                    type="button"
                                    className="auto-generate-btn"
                                    onClick={
                                        handleAutoGenerate
                                    }
                                >
                                    Auto Generate
                                </button>
                            </div>

                            <input
                                type="text"
                                name="voucherCode"
                                value={
                                    formData.voucherCode
                                }
                                onChange={
                                    handleChange
                                }
                                placeholder="e.g. SHOP-2026-X8K"
                                required
                            />
                        </div>

                        {/* POINTS */}

                        <div className="form-group">
                            <label>
                                Points Cost
                            </label>

                            <input
                                type="number"
                                name="pointsCost"
                                value={
                                    formData.pointsCost
                                }
                                onChange={
                                    handleChange
                                }
                                min="1"
                                required
                            />
                        </div>

                        {/* EXPIRY */}

                        <div className="form-group">

                            <label>
                                Expiry Days
                            </label>

                            <input
                                type="number"
                                name="expiryDays"
                                value={
                                    formData.expiryDays
                                }
                                onChange={
                                    handleChange
                                }
                                min="1"
                                required
                            />

                            <div className="quick-picks">
                                <span>
                                    Quick pick:
                                </span>

                                {[
                                    "30",
                                    "60",
                                    "90",
                                    "365",
                                ].map(
                                    (days) => (
                                        <button
                                            type="button"
                                            key={days}
                                            className={
                                                formData.expiryDays ===
                                                days
                                                    ? "quick-btn active"
                                                    : "quick-btn"
                                            }
                                            onClick={() =>
                                                handleQuickPick(
                                                    days
                                                )
                                            }
                                        >
                                            {days ===
                                            "365"
                                                ? "1 Year"
                                                : `${days}d`}
                                        </button>
                                    )
                                )}
                            </div>
                        </div>

                        {/* BUTTONS */}

                        <div className="form-buttons">

                            <button
                                type="submit"
                                className={
                                    editingVoucherId
                                        ? "save-btn update"
                                        : "save-btn"
                                }
                                disabled={
                                    loading
                                }
                            >
                                {loading
                                    ? "Saving..."
                                    : editingVoucherId
                                    ? "Update Voucher"
                                    : "Create Voucher"}
                            </button>

                            {editingVoucherId && (
                                <button
                                    type="button"
                                    className="cancel-btn"
                                    onClick={
                                        handleCancelEdit
                                    }
                                >
                                    Cancel
                                </button>
                            )}

                        </div>
                    </form>
                </div>

                {/* VOUCHER LIST */}

                <div className="voucher-list-section">

                    <div className="list-header">
                        <div>
                            <h2>
                                All Vouchers
                            </h2>

                            <span>
                                {
                                    filteredVouchers.length
                                } records
                            </span>
                        </div>

                        <div className="search-box">
                            🔍

                            <input
                                type="text"
                                placeholder="Search code or Owner ID..."
                                value={
                                    searchTerm
                                }
                                onChange={(e) =>
                                    setSearchTerm(
                                        e.target
                                            .value
                                    )
                                }
                            />
                        </div>
                    </div>

                    {filteredVouchers.length ===
                    0 ? (
                        <div className="no-vouchers">
                            <div>
                                🎟️
                            </div>

                            <h3>
                                No retailer vouchers
                                found
                            </h3>

                            <p>
                                Create your first
                                voucher using the
                                form.
                            </p>
                        </div>
                    ) : (
                        <div className="voucher-grid">

                            {filteredVouchers.map(
                                (voucher) => {
                                    const voucherId =
                                        voucher.id ??
                                        voucher.voucherId;

                                    const remaining =
                                        getRemainingDays(
                                            voucher
                                        );

                                    return (
                                        <div
                                            className="voucher-card"
                                            key={
                                                voucherId
                                            }
                                        >

                                            <div>

                                                <div className="voucher-card-top">
                                                    <h3>
                                                        {
                                                            voucher.voucherCode
                                                        }
                                                    </h3>

                                                    <span className="active-badge">
                                                        Active
                                                    </span>
                                                </div>

                                                <div className="voucher-info-row">
                                                    <span>
                                                        Owner ID
                                                    </span>

                                                    <strong>
                                                        #
                                                        {
                                                            voucher.ownerId
                                                        }
                                                    </strong>
                                                </div>

                                                <div className="voucher-info-row">
                                                    <span>
                                                        Cost
                                                    </span>

                                                    <strong>
                                                        ⭐{" "}
                                                        {
                                                            voucher.pointsCost
                                                        }{" "}
                                                        Points
                                                    </strong>
                                                </div>

                                                <div className="voucher-info-row">
                                                    <span>
                                                        Expires
                                                    </span>

                                                    <strong>
                                                        {voucher.expiryDate
                                                            ? new Date(
                                                                  voucher.expiryDate
                                                              ).toLocaleDateString()
                                                            : remaining !==
                                                              null
                                                            ? `${remaining} Days`
                                                            : "N/A"}
                                                    </strong>
                                                </div>

                                            </div>

                                            <div className="voucher-card-footer">

                                                <button
                                                    className="copy-btn"
                                                    onClick={() =>
                                                        handleCopyCode(
                                                            voucher.voucherCode
                                                        )
                                                    }
                                                >
                                                    📋{" "}
                                                    {copiedCode ===
                                                    voucher.voucherCode
                                                        ? "Copied!"
                                                        : "Copy Code"}
                                                </button>

                                                <div className="voucher-actions">

                                                    <button
                                                        onClick={() =>
                                                            handleEditClick(
                                                                voucher
                                                            )
                                                        }
                                                        title="Edit"
                                                    >
                                                        ✏️
                                                    </button>

                                                    <button
                                                        onClick={() =>
                                                            handleDeleteClick(
                                                                voucherId
                                                            )
                                                        }
                                                        title="Delete"
                                                    >
                                                        🗑️
                                                    </button>

                                                </div>

                                            </div>
                                        </div>
                                    );
                                }
                            )}

                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}