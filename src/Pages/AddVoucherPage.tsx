import { useEffect, useMemo, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import "../AddVoucherPage.css";

interface Voucher {
    voucherId: number;
    voucherCode: string;
    discountPercentage: number;
    active: boolean;
    minimumOrderAmount?: number;
    startDate?: string;
    endDate?: string;
    ownerId: number;
    shopId: number;
}

interface Shop {
    shopId: number;
    shopName: string;
    address?: string;
    ownerId?: number;
    status?: string;
}

interface AddVoucherPageProps {
    retailerId: number;
}

interface VoucherFormData {
    ownerId: string;
    shopId: string;
    voucherCode: string;
    discountPercentage: string;
    minimumOrderAmount: string;
    startDate: string;
    endDate: string;
}

const VOUCHER_URL =
    "http://localhost:8092/voucher";

const SHOP_URL =
    "http://localhost:8085/shopsmart/shop";

export default function AddVoucherPage({
    retailerId,
}: AddVoucherPageProps) {

    // =====================================================
    // FORM
    // =====================================================

    const [formData, setFormData] =
        useState<VoucherFormData>({
            ownerId: String(retailerId),
            shopId: "",
            voucherCode: "",
            discountPercentage: "10",
            minimumOrderAmount: "500",
            startDate: new Date()
                .toISOString()
                .split("T")[0],
            endDate: "",
        });

    const [retailerVouchers, setRetailerVouchers] =
        useState<Voucher[]>([]);

    const [shopsList, setShopsList] =
        useState<Shop[]>([]);

    const [statusMessage, setStatusMessage] =
        useState("");

    const [loading, setLoading] =
        useState(false);

    const [editingVoucherId, setEditingVoucherId] =
        useState<number | null>(null);

    const [searchTerm, setSearchTerm] =
        useState("");

    const [copiedCode, setCopiedCode] =
        useState("");

    // =====================================================
    // AUTH
    // =====================================================

    const getHeaders = (): HeadersInit => {

        const token =
            localStorage.getItem(
                "shopsmart_token"
            );

        return {
            "Content-Type": "application/json",

            ...(token
                ? {
                      Authorization:
                          `Bearer ${token}`,
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
    // FETCH RETAILER VOUCHERS
    // =====================================================

    const fetchRetailerVouchers =
        async () => {

            try {

                const response =
                    await fetch(
                        `${VOUCHER_URL}/owner/${retailerId}`,
                        {
                            method: "GET",
                            headers: getHeaders(),
                        }
                    );

                if (
                    response.status === 401 ||
                    response.status === 403
                ) {
                    throw new Error(
                        "You are not authorized to view vouchers."
                    );
                }

                if (!response.ok) {
                    throw new Error(
                        "Unable to load vouchers."
                    );
                }

                const data =
                    await response.json();

                if (Array.isArray(data)) {

                    setRetailerVouchers(
                        data.filter(
                            (voucher: Voucher) =>
                                Number(
                                    voucher.ownerId
                                ) ===
                                Number(retailerId)
                        )
                    );
                } else {

                    setRetailerVouchers([]);
                }

            } catch (error) {

                console.error(
                    "Error fetching vouchers:",
                    error
                );

                setStatusMessage(
                    error instanceof Error
                        ? error.message
                        : "Unable to load vouchers."
                );
            }
        };

    // =====================================================
    // FETCH RETAILER SHOPS
    // =====================================================

    const fetchShopsList =
        async () => {

            try {

                const response =
                    await fetch(
                        `${SHOP_URL}/retailer/${retailerId}`,
                        {
                            method: "GET",
                            headers: getHeaders(),
                        }
                    );

                if (!response.ok) {
                    console.error(
                        "Unable to load shops:",
                        response.status
                    );

                    return;
                }

                const data =
                    await response.json();

                if (Array.isArray(data)) {

                    setShopsList(data);

                } else if (
                    Array.isArray(data?.shops)
                ) {

                    setShopsList(data.shops);

                } else if (
                    Array.isArray(data?.data)
                ) {

                    setShopsList(data.data);

                } else {

                    setShopsList([]);
                }

            } catch (error) {

                console.error(
                    "Error fetching shops:",
                    error
                );
            }
        };

    // =====================================================
    // INITIAL LOAD
    // =====================================================

    useEffect(() => {

        if (!retailerId) {
            return;
        }

        fetchRetailerVouchers();
        fetchShopsList();

    }, [retailerId]);

    // =====================================================
    // FORM CHANGE
    // =====================================================

    const handleChange = (
        event: ChangeEvent<
            HTMLInputElement | HTMLSelectElement
        >
    ) => {

        const {
            name,
            value,
        } = event.target;

        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    // =====================================================
    // QUICK DISCOUNT
    // =====================================================

    const handleQuickDiscount =
        (percentage: string) => {

            setFormData((prev) => ({
                ...prev,
                discountPercentage:
                    percentage,
            }));
        };

    // =====================================================
    // QUICK EXPIRY
    // =====================================================

    const handleQuickExpiry =
        (days: number) => {

            const start =
                new Date();

            const end =
                new Date();

            end.setDate(
                end.getDate() + days
            );

            setFormData((prev) => ({
                ...prev,

                startDate:
                    start
                        .toISOString()
                        .split("T")[0],

                endDate:
                    end
                        .toISOString()
                        .split("T")[0],
            }));
        };

    // =====================================================
    // AUTO GENERATE VOUCHER
    // =====================================================

    const handleAutoGenerate =
        () => {

            let shopPrefix =
                "SHOPSMART";

            const selectedShop =
                shopsList.find(
                    (shop) =>
                        String(
                            shop.shopId
                        ) ===
                        String(
                            formData.shopId
                        )
                );

            if (
                selectedShop?.shopName
            ) {

                shopPrefix =
                    selectedShop.shopName
                        .replace(
                            /[^a-zA-Z0-9]/g,
                            ""
                        )
                        .toUpperCase()
                        .slice(0, 8);
            }

            const currentYear =
                new Date()
                    .getFullYear();

            const randomSuffix =
                Math.random()
                    .toString(36)
                    .substring(2, 6)
                    .toUpperCase();

            const generatedCode =
                `${shopPrefix}-${currentYear}-${randomSuffix}`;

            setFormData((prev) => ({
                ...prev,
                voucherCode:
                    generatedCode,
            }));
        };

    // =====================================================
    // COPY CODE
    // =====================================================

    const handleCopyCode =
        async (code: string) => {

            try {

                await navigator.clipboard
                    .writeText(code);

                setCopiedCode(code);

                setTimeout(() => {
                    setCopiedCode("");
                }, 2000);

            } catch {

                setStatusMessage(
                    "Unable to copy voucher code."
                );
            }
        };

    // =====================================================
    // EDIT
    // =====================================================

    const handleEditClick =
        (voucher: Voucher) => {

            setEditingVoucherId(
                voucher.voucherId
            );

            setFormData({
                ownerId:
                    String(
                        voucher.ownerId ??
                        retailerId
                    ),

                shopId:
                    String(
                        voucher.shopId
                    ),

                voucherCode:
                    voucher.voucherCode ??
                    "",

                discountPercentage:
                    String(
                        voucher.discountPercentage ??
                        10
                    ),

                minimumOrderAmount:
                    String(
                        voucher.minimumOrderAmount ??
                        0
                    ),

                startDate:
                    voucher.startDate ??
                    new Date()
                        .toISOString()
                        .split("T")[0],

                endDate:
                    voucher.endDate ??
                    "",
            });

            setStatusMessage(
                `Editing voucher: ${voucher.voucherCode}`
            );
        };

    // =====================================================
    // CANCEL EDIT
    // =====================================================

    const handleCancelEdit =
        () => {

            setEditingVoucherId(null);

            setFormData({
                ownerId:
                    String(retailerId),

                shopId: "",

                voucherCode: "",

                discountPercentage:
                    "10",

                minimumOrderAmount:
                    "500",

                startDate:
                    new Date()
                        .toISOString()
                        .split("T")[0],

                endDate: "",
            });

            setStatusMessage("");
        };

    // =====================================================
    // DELETE
    // =====================================================

    const handleDeleteClick =
        async (
            voucherId?: number
        ) => {

            if (
                voucherId ===
                undefined
            ) {
                return;
            }

            const confirmed =
                window.confirm(
                    "Are you sure you want to delete this voucher?"
                );

            if (!confirmed) {
                return;
            }

            try {

                setLoading(true);

                const response =
                    await fetch(
                        `${VOUCHER_URL}/${voucherId}`,
                        {
                            method: "DELETE",
                            headers:
                                getHeaders(),
                        }
                    );

                if (
                    response.status === 401 ||
                    response.status === 403
                ) {

                    throw new Error(
                        "You are not authorized to delete this voucher."
                    );
                }

                if (!response.ok) {

                    const errorText =
                        await response.text();

                    throw new Error(
                        errorText ||
                        "Delete failed."
                    );
                }

                setStatusMessage(
                    "Voucher deleted successfully!"
                );

                if (
                    editingVoucherId ===
                    voucherId
                ) {

                    handleCancelEdit();
                }

                await fetchRetailerVouchers();

            } catch (error) {

                console.error(error);

                setStatusMessage(
                    error instanceof Error
                        ? error.message
                        : "Unable to delete voucher."
                );

            } finally {

                setLoading(false);
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

        if (
            !formData.shopId
        ) {

            setStatusMessage(
                "Please select a shop."
            );

            setLoading(false);

            return;
        }

        if (
            !formData.voucherCode.trim()
        ) {

            setStatusMessage(
                "Voucher code is required."
            );

            setLoading(false);

            return;
        }

        const discount =
            Number(
                formData.discountPercentage
            );

        if (
            discount <= 0 ||
            discount > 100
        ) {

            setStatusMessage(
                "Discount must be between 1% and 100%."
            );

            setLoading(false);

            return;
        }

        const minimumOrder =
            Number(
                formData.minimumOrderAmount
            );

        if (
            minimumOrder < 0
        ) {

            setStatusMessage(
                "Minimum order amount cannot be negative."
            );

            setLoading(false);

            return;
        }

        if (
            formData.startDate &&
            formData.endDate &&
            formData.endDate <
                formData.startDate
        ) {

            setStatusMessage(
                "End date cannot be before start date."
            );

            setLoading(false);

            return;
        }

        const isEditing =
            editingVoucherId !== null;

        const url =
            isEditing
                ? `${VOUCHER_URL}/${editingVoucherId}`
                : VOUCHER_URL;

        const payload = {
            ownerId:
                Number(retailerId),

            shopId:
                Number(formData.shopId),

            voucherCode:
                formData.voucherCode
                    .trim()
                    .toUpperCase(),

            discountPercentage:
                discount,

            active: true,

            minimumOrderAmount:
                minimumOrder,

            startDate:
                formData.startDate ||
                null,

            endDate:
                formData.endDate ||
                null,
        };

        try {

            const response =
                await fetch(
                    url,
                    {
                        method:
                            isEditing
                                ? "PUT"
                                : "POST",

                        headers:
                            getHeaders(),

                        body:
                            JSON.stringify(
                                payload
                            ),
                    }
                );

            if (
                response.status ===
                    401 ||
                response.status ===
                    403
            ) {

                throw new Error(
                    "You are not authorized to manage this voucher."
                );
            }

            if (!response.ok) {

                const errorText =
                    await response.text();

                throw new Error(
                    errorText ||
                    `Request failed: ${response.status}`
                );
            }

            setStatusMessage(
                isEditing
                    ? "Voucher updated successfully!"
                    : "Voucher created successfully!"
            );

            handleCancelEdit();

            await fetchRetailerVouchers();

        } catch (error) {

            console.error(
                "Voucher save error:",
                error
            );

            setStatusMessage(
                error instanceof Error
                    ? error.message
                    : "Failed to save voucher."
            );

        } finally {

            setLoading(false);
        }
    };

    // =====================================================
    // EXPORT CSV
    // =====================================================

    const handleExportCSV =
        () => {

            if (
                retailerVouchers.length ===
                0
            ) {

                setStatusMessage(
                    "No vouchers available to export."
                );

                return;
            }

            const headers = [
                "voucherId",
                "ownerId",
                "shopId",
                "voucherCode",
                "discountPercentage",
                "active",
                "minimumOrderAmount",
                "startDate",
                "endDate",
            ];

            const rows =
                retailerVouchers.map(
                    (voucher) => {

                        return [
                            voucher.voucherId,
                            voucher.ownerId,
                            voucher.shopId,

                            `"${voucher.voucherCode.replace(
                                /"/g,
                                '""'
                            )}"`,

                            voucher.discountPercentage,

                            voucher.active,

                            voucher.minimumOrderAmount ??
                                "",

                            voucher.startDate ??
                                "",

                            voucher.endDate ??
                                "",
                        ].join(",");
                    }
                );

            const csv = [
                headers.join(","),
                ...rows,
            ].join("\n");

            const blob =
                new Blob(
                    [csv],
                    {
                        type:
                            "text/csv;charset=utf-8;",
                    }
                );

            const url =
                URL.createObjectURL(
                    blob
                );

            const link =
                document.createElement(
                    "a"
                );

            link.href = url;

            link.download =
                `retailer_vouchers_${new Date()
                    .toISOString()
                    .slice(0, 10)}.csv`;

            document.body.appendChild(
                link
            );

            link.click();

            document.body.removeChild(
                link
            );

            URL.revokeObjectURL(
                url
            );

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

        const file =
            event.target.files?.[0];

        if (!file) {
            return;
        }

        const reader =
            new FileReader();

        reader.onload = async () => {

            const result =
                reader.result;

            if (
                typeof result !==
                "string"
            ) {
                return;
            }

            const lines =
                result
                    .split("\n")
                    .map((line) =>
                        line.trim()
                    )
                    .filter(Boolean);

            if (
                lines.length < 2
            ) {

                setStatusMessage(
                    "CSV file is empty or missing data."
                );

                return;
            }

            const headers =
                lines[0]
                    .split(",")
                    .map(
                        (header) =>
                            header
                                .trim()
                                .replace(
                                    /"/g,
                                    ""
                                )
                    );

            const shopIndex =
                headers.indexOf(
                    "shopId"
                );

            const codeIndex =
                headers.indexOf(
                    "voucherCode"
                );

            const discountIndex =
                headers.indexOf(
                    "discountPercentage"
                );

            const minimumIndex =
                headers.indexOf(
                    "minimumOrderAmount"
                );

            const startIndex =
                headers.indexOf(
                    "startDate"
                );

            const endIndex =
                headers.indexOf(
                    "endDate"
                );

            if (
                shopIndex === -1 ||
                codeIndex === -1 ||
                discountIndex === -1
            ) {

                setStatusMessage(
                    "Invalid CSV headers. Required: shopId, voucherCode, discountPercentage."
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

                    const row =
                        lines[i]
                            .split(",")
                            .map(
                                (value) =>
                                    value
                                        .trim()
                                        .replace(
                                            /^"|"$/g,
                                            ""
                                        )
                            );

                    if (
                        row.length <
                        3
                    ) {
                        continue;
                    }

                    const shopId =
                        Number(
                            row[
                                shopIndex
                            ]
                        );

                    const code =
                        row[
                            codeIndex
                        ];

                    const discount =
                        Number(
                            row[
                                discountIndex
                            ]
                        );

                    if (
                        !shopId ||
                        !code ||
                        discount <= 0 ||
                        discount > 100
                    ) {
                        continue;
                    }

                    const payload = {

                        ownerId:
                            Number(
                                retailerId
                            ),

                        shopId,

                        voucherCode:
                            code
                                .trim()
                                .toUpperCase(),

                        discountPercentage:
                            discount,

                        active: true,

                        minimumOrderAmount:
                            minimumIndex !==
                                -1 &&
                            row[
                                minimumIndex
                            ]
                                ? Number(
                                      row[
                                          minimumIndex
                                      ]
                                  )
                                : 0,

                        startDate:
                            startIndex !==
                                -1 &&
                            row[
                                startIndex
                            ]
                                ? row[
                                      startIndex
                                  ]
                                : null,

                        endDate:
                            endIndex !==
                                -1 &&
                            row[
                                endIndex
                            ]
                                ? row[
                                      endIndex
                                  ]
                                : null,
                    };

                    try {

                        const response =
                            await fetch(
                                VOUCHER_URL,
                                {
                                    method:
                                        "POST",

                                    headers:
                                        getHeaders(),

                                    body:
                                        JSON.stringify(
                                            payload
                                        ),
                                }
                            );

                        if (
                            response.ok
                        ) {

                            successCount++;
                        }

                    } catch (
                        error
                    ) {

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

                event.target.value =
                    "";
            }
        };

        reader.readAsText(file);
    };

    // =====================================================
    // REMAINING DAYS
    // =====================================================

    const getRemainingDays =
        (
            voucher: Voucher
        ): number | null => {

            if (
                !voucher.endDate
            ) {

                return null;
            }

            const expiryDate =
                new Date(
                    voucher.endDate
                );

            const today =
                new Date();

            today.setHours(
                0,
                0,
                0,
                0
            );

            expiryDate.setHours(
                0,
                0,
                0,
                0
            );

            const difference =
                expiryDate.getTime() -
                today.getTime();

            return Math.ceil(
                difference /
                    (
                        1000 *
                        60 *
                        60 *
                        24
                    )
            );
        };

    // =====================================================
    // FILTER
    // =====================================================

    const filteredVouchers =
        useMemo(() => {

            const search =
                searchTerm
                    .toLowerCase()
                    .trim();

            return retailerVouchers.filter(
                (voucher) => {

                    if (!search) {
                        return true;
                    }

                    return (
                        voucher.voucherCode
                            .toLowerCase()
                            .includes(
                                search
                            ) ||

                        String(
                            voucher.shopId
                        ).includes(
                            search
                        )
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

    const activeVoucherCount =
        filteredVouchers.filter(
            (voucher) =>
                voucher.active
        ).length;

    const totalDiscount =
        filteredVouchers.reduce(
            (
                total,
                voucher
            ) =>
                total +
                Number(
                    voucher.discountPercentage ||
                    0
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
                    remaining !==
                        null &&
                    remaining >= 0 &&
                    remaining <= 30
                );
            }
        ).length;

    const avgDiscount =
        filteredVouchers.length >
        0
            ? Math.round(
                  totalDiscount /
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
                        Manage promotional
                        vouchers for your
                        shops. Retailer ID:
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
                        type="button"
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
                                activeVoucherCount
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
                            Average Discount
                        </span>

                        <strong>
                            {avgDiscount}%
                        </strong>

                        <small>
                            average discount
                        </small>

                    </div>

                    <div className="stat-icon">
                        🏷️
                    </div>

                </div>


                <div className="voucher-stat-card">

                    <div>

                        <span>
                            Expiring Soon
                        </span>

                        <strong>
                            {
                                expiringSoonCount
                            }
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
                            Total Vouchers
                        </span>

                        <strong>
                            {
                                filteredVouchers.length
                            }
                        </strong>

                        <small>
                            retailer vouchers
                        </small>

                    </div>

                    <div className="stat-icon">
                        🎟️
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
                                    : "Add a promotional voucher for your customers."}
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


                        {/* SHOP */}

                        <div className="form-group">

                            <label>
                                Select Shop
                            </label>

                            <select
                                name="shopId"
                                value={
                                    formData.shopId
                                }
                                onChange={
                                    handleChange
                                }
                                required
                            >

                                <option value="">
                                    Select a shop
                                </option>

                                {shopsList.map(
                                    (shop) => (

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


                        {/* DISCOUNT */}

                        <div className="form-group">

                            <label>
                                Discount Percentage
                            </label>

                            <input
                                type="number"
                                name="discountPercentage"
                                value={
                                    formData.discountPercentage
                                }
                                onChange={
                                    handleChange
                                }
                                min="1"
                                max="100"
                                step="0.01"
                                required
                            />

                            <div className="quick-picks">

                                <span>
                                    Quick pick:
                                </span>

                                {[
                                    "5",
                                    "10",
                                    "15",
                                    "20",
                                    "25",
                                ].map(
                                    (
                                        percentage
                                    ) => (

                                        <button
                                            type="button"
                                            key={
                                                percentage
                                            }
                                            className={
                                                formData.discountPercentage ===
                                                percentage
                                                    ? "quick-btn active"
                                                    : "quick-btn"
                                            }
                                            onClick={() =>
                                                handleQuickDiscount(
                                                    percentage
                                                )
                                            }
                                        >
                                            {percentage}%
                                        </button>

                                    )
                                )}

                            </div>

                        </div>


                        {/* MINIMUM ORDER */}

                        <div className="form-group">

                            <label>
                                Minimum Order Amount
                            </label>

                            <input
                                type="number"
                                name="minimumOrderAmount"
                                value={
                                    formData.minimumOrderAmount
                                }
                                onChange={
                                    handleChange
                                }
                                min="0"
                                step="0.01"
                                placeholder="e.g. 500"
                                required
                            />

                        </div>


                        {/* START DATE */}

                        <div className="form-group">

                            <label>
                                Start Date
                            </label>

                            <input
                                type="date"
                                name="startDate"
                                value={
                                    formData.startDate
                                }
                                onChange={
                                    handleChange
                                }
                                required
                            />

                        </div>


                        {/* END DATE */}

                        <div className="form-group">

                            <label>
                                End Date
                            </label>

                            <input
                                type="date"
                                name="endDate"
                                value={
                                    formData.endDate
                                }
                                onChange={
                                    handleChange
                                }
                            />

                            <div className="quick-picks">

                                <span>
                                    Quick expiry:
                                </span>

                                {[
                                    {
                                        label: "30d",
                                        days: 30,
                                    },
                                    {
                                        label: "60d",
                                        days: 60,
                                    },
                                    {
                                        label: "90d",
                                        days: 90,
                                    },
                                    {
                                        label: "1 Year",
                                        days: 365,
                                    },
                                ].map(
                                    (
                                        item
                                    ) => (

                                        <button
                                            type="button"
                                            key={
                                                item.label
                                            }
                                            className="quick-btn"
                                            onClick={() =>
                                                handleQuickExpiry(
                                                    item.days
                                                )
                                            }
                                        >
                                            {
                                                item.label
                                            }
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
                                placeholder="Search code or Shop ID..."
                                value={
                                    searchTerm
                                }
                                onChange={(e) =>
                                    setSearchTerm(
                                        e.target.value
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
                                No retailer
                                vouchers found
                            </h3>

                            <p>
                                Create your first
                                promotional voucher
                                using the form.
                            </p>

                        </div>

                    ) : (

                        <div className="voucher-grid">

                            {filteredVouchers.map(
                                (voucher) => {

                                    const remaining =
                                        getRemainingDays(
                                            voucher
                                        );

                                    return (

                                        <div
                                            className="voucher-card"
                                            key={
                                                voucher.voucherId
                                            }
                                        >

                                            <div>

                                                <div className="voucher-card-top">

                                                    <h3>
                                                        {
                                                            voucher.voucherCode
                                                        }
                                                    </h3>

                                                    <span
                                                        className={
                                                            voucher.active
                                                                ? "active-badge"
                                                                : "active-badge inactive"
                                                        }
                                                    >
                                                        {voucher.active
                                                            ? "Active"
                                                            : "Inactive"}
                                                    </span>

                                                </div>


                                                <div className="voucher-info-row">

                                                    <span>
                                                        Shop
                                                    </span>

                                                    <strong>
                                                        #
                                                        {
                                                            voucher.shopId
                                                        }
                                                    </strong>

                                                </div>


                                                <div className="voucher-info-row">

                                                    <span>
                                                        Discount
                                                    </span>

                                                    <strong>
                                                        🏷️{" "}
                                                        {
                                                            voucher.discountPercentage
                                                        }
                                                        %
                                                    </strong>

                                                </div>


                                                <div className="voucher-info-row">

                                                    <span>
                                                        Minimum Order
                                                    </span>

                                                    <strong>
                                                        ₹
                                                        {
                                                            Number(
                                                                voucher.minimumOrderAmount ??
                                                                0
                                                            ).toLocaleString(
                                                                "en-IN"
                                                            )
                                                        }
                                                    </strong>

                                                </div>


                                                <div className="voucher-info-row">

                                                    <span>
                                                        Expires
                                                    </span>

                                                    <strong>
                                                        {
                                                            voucher.endDate
                                                                ? new Date(
                                                                      voucher.endDate
                                                                  ).toLocaleDateString(
                                                                      "en-IN"
                                                                  )
                                                                : "No expiry"
                                                        }
                                                    </strong>

                                                </div>


                                                {remaining !==
                                                    null && (

                                                    <div className="voucher-info-row">

                                                        <span>
                                                            Remaining
                                                        </span>

                                                        <strong>
                                                            {remaining < 0
                                                                ? "Expired"
                                                                : `${remaining} days`}
                                                        </strong>

                                                    </div>

                                                )}

                                            </div>


                                            <div className="voucher-card-footer">

                                                <button
                                                    className="copy-btn"
                                                    onClick={() =>
                                                        handleCopyCode(
                                                            voucher.voucherCode
                                                        )
                                                    }
                                                    type="button"
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
                                                        type="button"
                                                    >
                                                        ✏️
                                                    </button>

                                                    <button
                                                        onClick={() =>
                                                            handleDeleteClick(
                                                                voucher.voucherId
                                                            )
                                                        }
                                                        title="Delete"
                                                        type="button"
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