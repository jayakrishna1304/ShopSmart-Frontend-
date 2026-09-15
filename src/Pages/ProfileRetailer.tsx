import {
    type ChangeEvent,
    type FormEvent,
    useEffect,
    useRef,
    useState,
} from "react";
import "../ProfileRetailer.css";

interface Shop {
    shopId: number;
    shopName: string;
    address?: string;
    status?: string;
}

interface Retailer {
    ownerId?: number;
    id?: number;
    ownerName?: string;
    name?: string;
    ownerEmail?: string;
    email?: string;
    associatedRetailEntity?: string;
    contactNumber?: string;
    profileImage?: string | null;
}

interface ProfileData {
    ownerId: number;
    ownerName: string;
    ownerEmail: string;
    associatedRetailEntity: string;
    contactNumber: string;
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
    profileImage: string | null;
    twoFactorAuth: boolean;
}

interface ProfileRetailerProps {
    retailerId: number;
}

const RETAILER_URL =
    "http://localhost:8084/shopsmart/retailer";

const SHOP_URL =
    "http://localhost:8082/shopsmart/shop";

const VOUCHER_URL =
    "http://localhost:8089/shopsmart/loyaltyTransaction/retailer/vouchers";

export default function ProfileRetailer({
    retailerId,
}: ProfileRetailerProps) {
    const [profileData, setProfileData] =
        useState<ProfileData>({
            ownerId: retailerId,
            ownerName: "Loading...",
            ownerEmail: "Loading...",
            associatedRetailEntity:
                "ShopSmart Retail",
            contactNumber: "",
            currentPassword: "",
            newPassword: "",
            confirmPassword: "",
            profileImage: null,
            twoFactorAuth: true,
        });

    const [shops, setShops] = useState<Shop[]>(
        []
    );

    const [activeVouchersCount, setActiveVouchersCount] =
        useState(0);

    const [statusMessage, setStatusMessage] =
        useState("");

    const [loading, setLoading] =
        useState(false);

    const [shopsLoading, setShopsLoading] =
        useState(true);

    const fileInputRef =
        useRef<HTMLInputElement | null>(null);

    // =====================================================
    // AUTH HEADERS
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
    // FETCH PROFILE DATA
    // =====================================================

    useEffect(() => {
        const fetchRetailerData =
            async () => {
                setShopsLoading(true);

                try {
                    // Retailer profile
                    const profileResponse =
                        await fetch(
                            `${RETAILER_URL}/${retailerId}`,
                            {
                                headers:
                                    getHeaders(),
                            }
                        );

                    if (
                        profileResponse.ok
                    ) {
                        const data: Retailer =
                            await profileResponse.json();

                        setProfileData(
                            (previous) => ({
                                ...previous,
                                ownerId:
                                    data.ownerId ??
                                    data.id ??
                                    retailerId,

                                ownerName:
                                    data.ownerName ??
                                    data.name ??
                                    previous.ownerName,

                                ownerEmail:
                                    data.ownerEmail ??
                                    data.email ??
                                    previous.ownerEmail,

                                associatedRetailEntity:
                                    data.associatedRetailEntity ??
                                    previous.associatedRetailEntity,

                                contactNumber:
                                    data.contactNumber ??
                                    previous.contactNumber,

                                profileImage:
                                    data.profileImage ??
                                    previous.profileImage,
                            })
                        );
                    }

                    // Retailer's shops
                    const shopResponse =
                        await fetch(
                            `${SHOP_URL}/retailer/${retailerId}`,
                            {
                                headers:
                                    getHeaders(),
                            }
                        );

                    if (
                        shopResponse.ok
                    ) {
                        const shopData =
                            await shopResponse.json();

                        if (
                            Array.isArray(
                                shopData
                            )
                        ) {
                            setShops(
                                shopData
                            );
                        } else if (
                            Array.isArray(
                                shopData?.shops
                            )
                        ) {
                            setShops(
                                shopData.shops
                            );
                        } else if (
                            Array.isArray(
                                shopData?.data
                            )
                        ) {
                            setShops(
                                shopData.data
                            );
                        }
                    }

                    // Vouchers
                    const voucherResponse =
                        await fetch(
                            VOUCHER_URL,
                            {
                                headers:
                                    getHeaders(),
                            }
                        );

                    if (
                        voucherResponse.ok
                    ) {
                        const voucherData =
                            await voucherResponse.json();

                        if (
                            Array.isArray(
                                voucherData
                            )
                        ) {
                            const ownVouchers =
                                voucherData.filter(
                                    (
                                        voucher: {
                                            ownerId?: number;
                                        }
                                    ) =>
                                        Number(
                                            voucher.ownerId
                                        ) ===
                                        Number(
                                            retailerId
                                        )
                                );

                            setActiveVouchersCount(
                                ownVouchers.length
                            );
                        }
                    }
                } catch (error) {
                    console.error(
                        "Error fetching retailer data:",
                        error
                    );
                } finally {
                    setShopsLoading(false);
                }
            };

        fetchRetailerData();
    }, [retailerId]);

    // =====================================================
    // INPUT CHANGE
    // =====================================================

    const handleChange = (
        event: ChangeEvent<
            HTMLInputElement
        >
    ) => {
        const {
            name,
            value,
            type,
            checked,
        } = event.target;

        setProfileData(
            (previous) => ({
                ...previous,
                [name]:
                    type === "checkbox"
                        ? checked
                        : value,
            })
        );
    };

    // =====================================================
    // PROFILE IMAGE
    // =====================================================

    const handleImageChange = (
        event: ChangeEvent<HTMLInputElement>
    ) => {
        const file =
            event.target.files?.[0];

        if (!file) {
            return;
        }

        if (!file.type.startsWith("image/")) {
            setStatusMessage(
                "Please select a valid image."
            );
            return;
        }

        if (file.size > 2 * 1024 * 1024) {
            setStatusMessage(
                "Image must be smaller than 2 MB."
            );
            return;
        }

        const reader =
            new FileReader();

        reader.onload = () => {
            const result = reader.result;

            if (typeof result === "string") {
                setProfileData(
                    (previous) => ({
                        ...previous,
                        profileImage:
                            result,
                    })
                );

                setStatusMessage(
                    "Profile image selected."
                );
            }
        };

        reader.readAsDataURL(file);
    };

    // =====================================================
    // UPDATE PROFILE
    // =====================================================

    const handleProfileSubmit = async (
        event: FormEvent<HTMLFormElement>
    ) => {
        event.preventDefault();

        setLoading(true);
        setStatusMessage("");

        try {
            const response =
                await fetch(
                    `${RETAILER_URL}/${retailerId}`,
                    {
                        method: "PUT",
                        headers: getHeaders(),
                        body: JSON.stringify({
                            ownerId: retailerId,
                            ownerName:
                                profileData.ownerName,
                            ownerEmail:
                                profileData.ownerEmail,
                            associatedRetailEntity:
                                profileData.associatedRetailEntity,
                            contactNumber:
                                profileData.contactNumber,
                            profileImage:
                                profileData.profileImage,
                        }),
                    }
                );

            if (!response.ok) {
                throw new Error(
                    `Profile update failed: ${response.status}`
                );
            }

            setStatusMessage(
                "Profile updated successfully!"
            );
        } catch (error) {
            console.error(error);

            setStatusMessage(
                "Unable to update profile."
            );
        } finally {
            setLoading(false);
        }
    };

    // =====================================================
    // PASSWORD
    // =====================================================

    const handlePasswordSubmit = async (
        event: FormEvent<HTMLFormElement>
    ) => {
        event.preventDefault();

        if (
            !profileData.currentPassword ||
            !profileData.newPassword
        ) {
            setStatusMessage(
                "Please enter your password details."
            );
            return;
        }

        if (
            profileData.newPassword !==
            profileData.confirmPassword
        ) {
            setStatusMessage(
                "New passwords do not match."
            );
            return;
        }

        /*
         * Your current retailer backend does not expose
         * a confirmed password-change endpoint in the
         * code we have. So we validate the fields here
         * instead of inventing an API endpoint.
         */

        setStatusMessage(
            "Password details validated. Connect this form to the retailer password endpoint when available."
        );

        setProfileData(
            (previous) => ({
                ...previous,
                currentPassword: "",
                newPassword: "",
                confirmPassword: "",
            })
        );
    };

    // =====================================================
    // REMOVE IMAGE
    // =====================================================

    const handleRemoveImage = () => {
        setProfileData(
            (previous) => ({
                ...previous,
                profileImage: null,
            })
        );

        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }

        setStatusMessage(
            "Profile image removed."
        );
    };

    // =====================================================
    // UI
    // =====================================================

    return (
        <div className="retailer-profile-page">

            {/* HEADER */}

            <div className="profile-page-header">
                <div>
                    <div className="profile-label">
                        RETAILER ACCOUNT
                    </div>

                    <h1>
                        Profile Settings
                    </h1>

                    <p>
                        Manage your ShopSmart
                        retailer profile and
                        account information.
                    </p>
                </div>

                <div className="profile-id-badge">
                    Retailer #{retailerId}
                </div>
            </div>

            {statusMessage && (
                <div className="profile-message">
                    {statusMessage}
                </div>
            )}

            {/* PROFILE TOP */}

            <div className="profile-main-grid">

                {/* PERSONAL INFORMATION */}

                <div className="profile-card">

                    <div className="profile-card-heading">
                        <div className="heading-icon">
                            👤
                        </div>

                        <div>
                            <h2>
                                Personal Information
                            </h2>

                            <p>
                                Your retailer
                                account details
                            </p>
                        </div>
                    </div>

                    <form
                        onSubmit={
                            handleProfileSubmit
                        }
                    >

                        {/* IMAGE */}

                        <div className="profile-image-section">

                            <div className="profile-avatar">

                                {profileData.profileImage ? (
                                    <img
                                        src={
                                            profileData.profileImage
                                        }
                                        alt="Profile"
                                    />
                                ) : (
                                    <span>
                                        {profileData.ownerName
                                            ?.charAt(
                                                0
                                            )
                                            .toUpperCase() ||
                                            "R"}
                                    </span>
                                )}

                            </div>

                            <div className="image-actions">

                                <strong>
                                    Profile Photo
                                </strong>

                                <p>
                                    JPG, PNG up to
                                    2MB
                                </p>

                                <div>
                                    <button
                                        type="button"
                                        className="outline-btn"
                                        onClick={() =>
                                            fileInputRef.current?.click()
                                        }
                                    >
                                        Change Photo
                                    </button>

                                    {profileData.profileImage && (
                                        <button
                                            type="button"
                                            className="text-danger-btn"
                                            onClick={
                                                handleRemoveImage
                                            }
                                        >
                                            Remove
                                        </button>
                                    )}
                                </div>

                                <input
                                    ref={
                                        fileInputRef
                                    }
                                    type="file"
                                    accept="image/*"
                                    hidden
                                    onChange={
                                        handleImageChange
                                    }
                                />
                            </div>

                        </div>

                        {/* FIELDS */}

                        <div className="profile-fields">

                            <div className="profile-field">
                                <label>
                                    Retailer ID
                                </label>

                                <input
                                    value={
                                        profileData.ownerId
                                    }
                                    readOnly
                                    className="readonly"
                                />
                            </div>

                            <div className="profile-field">
                                <label>
                                    Retailer Name
                                </label>

                                <input
                                    name="ownerName"
                                    value={
                                        profileData.ownerName
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    required
                                />
                            </div>

                            <div className="profile-field">
                                <label>
                                    Email
                                </label>

                                <input
                                    type="email"
                                    name="ownerEmail"
                                    value={
                                        profileData.ownerEmail
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    required
                                />
                            </div>

                            <div className="profile-field">
                                <label>
                                    Contact Number
                                </label>

                                <input
                                    name="contactNumber"
                                    value={
                                        profileData.contactNumber
                                    }
                                    onChange={
                                        handleChange
                                    }
                                />
                            </div>

                            <div className="profile-field full-width">
                                <label>
                                    Retail Entity
                                </label>

                                <input
                                    name="associatedRetailEntity"
                                    value={
                                        profileData.associatedRetailEntity
                                    }
                                    onChange={
                                        handleChange
                                    }
                                />
                            </div>

                        </div>

                        <div className="profile-form-footer">

                            <button
                                type="submit"
                                className="primary-profile-btn"
                                disabled={
                                    loading
                                }
                            >
                                {loading
                                    ? "Saving..."
                                    : "Save Profile"}
                            </button>

                        </div>

                    </form>
                </div>

                {/* ACCOUNT OVERVIEW */}

                <div className="profile-card overview-card">

                    <div className="profile-card-heading">
                        <div className="heading-icon">
                            📊
                        </div>

                        <div>
                            <h2>
                                Account Overview
                            </h2>

                            <p>
                                Your retailer
                                activity
                            </p>
                        </div>
                    </div>

                    <div className="overview-stat">
                        <span>
                            🏪
                        </span>

                        <div>
                            <strong>
                                {shopsLoading
                                    ? "..."
                                    : shops.length}
                            </strong>

                            <small>
                                My Shops
                            </small>
                        </div>
                    </div>

                    <div className="overview-stat">
                        <span>
                            🎟️
                        </span>

                        <div>
                            <strong>
                                {
                                    activeVouchersCount
                                }
                            </strong>

                            <small>
                                Vouchers
                            </small>
                        </div>
                    </div>

                    <div className="overview-stat">
                        <span>
                            🛡️
                        </span>

                        <div>
                            <strong>
                                Active
                            </strong>

                            <small>
                                Account Status
                            </small>
                        </div>
                    </div>

                    {/* SHOP LIST */}

                    <div className="profile-shop-list">

                        <h3>
                            Your Shops
                        </h3>

                        {shopsLoading ? (
                            <p className="muted">
                                Loading shops...
                            </p>
                        ) : shops.length ===
                          0 ? (
                            <p className="muted">
                                No shops found.
                            </p>
                        ) : (
                            shops
                                .slice(0, 4)
                                .map(
                                    (
                                        shop
                                    ) => (
                                        <div
                                            className="mini-shop"
                                            key={
                                                shop.shopId
                                            }
                                        >
                                            <div>
                                                <strong>
                                                    {
                                                        shop.shopName
                                                    }
                                                </strong>

                                                <small>
                                                    Shop #
                                                    {
                                                        shop.shopId
                                                    }
                                                </small>
                                            </div>

                                            <span>
                                                {
                                                    shop.status ??
                                                    "ACTIVE"
                                                }
                                            </span>
                                        </div>
                                    )
                                )
                        )}

                    </div>

                </div>

            </div>

            {/* SECURITY */}

            <div className="profile-card security-card">

                <div className="profile-card-heading">
                    <div className="heading-icon">
                        🔐
                    </div>

                    <div>
                        <h2>
                            Security
                        </h2>

                        <p>
                            Manage your account
                            security settings
                        </p>
                    </div>
                </div>

                <div className="security-grid">

                    {/* PASSWORD */}

                    <form
                        className="password-section"
                        onSubmit={
                            handlePasswordSubmit
                        }
                    >

                        <h3>
                            Change Password
                        </h3>

                        <div className="password-fields">

                            <div className="profile-field">
                                <label>
                                    Current Password
                                </label>

                                <input
                                    type="password"
                                    name="currentPassword"
                                    value={
                                        profileData.currentPassword
                                    }
                                    onChange={
                                        handleChange
                                    }
                                />
                            </div>

                            <div className="profile-field">
                                <label>
                                    New Password
                                </label>

                                <input
                                    type="password"
                                    name="newPassword"
                                    value={
                                        profileData.newPassword
                                    }
                                    onChange={
                                        handleChange
                                    }
                                />
                            </div>

                            <div className="profile-field">
                                <label>
                                    Confirm Password
                                </label>

                                <input
                                    type="password"
                                    name="confirmPassword"
                                    value={
                                        profileData.confirmPassword
                                    }
                                    onChange={
                                        handleChange
                                    }
                                />
                            </div>

                        </div>

                        <button
                            type="submit"
                            className="outline-primary-btn"
                        >
                            Update Password
                        </button>

                    </form>

                    {/* 2FA */}

                    <div className="two-factor-section">

                        <div className="two-factor-top">

                            <div>
                                <h3>
                                    Two-Factor
                                    Authentication
                                </h3>

                                <p>
                                    Add an extra layer
                                    of security to your
                                    account.
                                </p>
                            </div>

                            <label className="switch">

                                <input
                                    type="checkbox"
                                    name="twoFactorAuth"
                                    checked={
                                        profileData.twoFactorAuth
                                    }
                                    onChange={
                                        handleChange
                                    }
                                />

                                <span className="slider" />

                            </label>

                        </div>

                        <div
                            className={
                                profileData.twoFactorAuth
                                    ? "security-status enabled"
                                    : "security-status"
                            }
                        >
                            <span>
                                ●
                            </span>

                            {profileData.twoFactorAuth
                                ? "Two-factor authentication is enabled."
                                : "Two-factor authentication is disabled."}
                        </div>

                    </div>

                </div>
            </div>

        </div>
    );
}