import { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import "../Profile.css";
import { useNavigate } from "react-router-dom";

const API_URL = "http://localhost:8086/customers";

type JwtPayload = {
    sub?: string;
    role?: string;
    userId?: number;
    customerId?: number;
};

type Customer = {
    customerId?: number;
    customerName?: string;
    customerEmail?: string;
    customerPhoneNo?: string;
    phone?: string;
    address?: string;
    city?: string;
    pincode?: string;
    state?: string;
    country?: string;
    createdAt?: string;
    updatedAt?: string;
};

export function Profile() {

    const navigate = useNavigate();

    const [customer, setCustomer] = useState<Customer | null>(null);

    const [jwtUser, setJwtUser] =
        useState<JwtPayload | null>(null);

    const [loading, setLoading] =
        useState(true);

    const [saving, setSaving] =
        useState(false);

    const [editOpen, setEditOpen] =
        useState(false);

    const [toast, setToast] =
        useState("");

    const [formData, setFormData] = useState({
        customer_name: "",
        phone: "",
        address: "",
        city: "",
        pincode: ""
    });


    /* =====================================================
       READ JWT
    ===================================================== */

    useEffect(() => {

        const token =
            localStorage.getItem("shopsmart_token");

        if (!token) {
            setLoading(false);
            return;
        }

        try {

            const decoded =
                jwtDecode<JwtPayload>(token);

            console.log(
                "JWT DATA:",
                decoded
            );

            setJwtUser({
                userId: decoded.userId,
                customerId: decoded.customerId,
                role: decoded.role,
                sub: decoded.sub
            });

        } catch (error) {

            console.error(
                "Invalid JWT token:",
                error
            );

            setLoading(false);
        }

    }, []);


    /* =====================================================
       GET CUSTOMER
    ===================================================== */

    useEffect(() => {

        if (!jwtUser) {
            return;
        }

        /*
         * Your customer ID is assigned from user ID.
         *
         * Use customerId first.
         */

        const id =
            jwtUser.customerId ??
            jwtUser.userId;

        if (!id) {

            console.error(
                "Customer ID not found in JWT"
            );

            setLoading(false);
            return;
        }

        fetchCustomer(id);

    }, [jwtUser]);


    const fetchCustomer = async (
        id: number
    ) => {

        try {

            setLoading(true);

            const token =
                localStorage.getItem(
                    "shopsmart_token"
                );

            const response =
                await fetch(
                    `${API_URL}/${id}`,
                    {
                        method: "GET",

                        headers: {
                            "Authorization":
                                `Bearer ${token}`,

                            "Content-Type":
                                "application/json"
                        }
                    }
                );

            if (!response.ok) {

                throw new Error(
                    `Failed to fetch customer: ${response.status}`
                );
            }

            const data: Customer =
                await response.json();

            console.log(
                "CUSTOMER FROM BACKEND:",
                data
            );

            /*
             * IMPORTANT:
             *
             * Backend sends:
             *
             * customerName
             * phone
             * address
             * city
             * pincode
             *
             * NOT customer_name.
             */

            setCustomer(data);

            setFormData({
                customer_name:
                    data.customerName ?? "",

                phone:
                    data.phone ??
                    data.customerPhoneNo ??
                    "",

                address:
                    data.address ?? "",

                city:
                    data.city ?? "",

                pincode:
                    data.pincode ?? ""
            });

        } catch (error) {

            console.error(
                "Profile fetch error:",
                error
            );

        } finally {

            setLoading(false);
        }

    };


    /* =====================================================
       FORM CHANGE
    ===================================================== */

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {

        const {
            name,
            value
        } = e.target;

        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

    };


    /* =====================================================
       SAVE PROFILE
    ===================================================== */

    const handleSave = async (
        e: React.FormEvent<HTMLFormElement>
    ) => {

        e.preventDefault();

        if (!jwtUser) {
            return;
        }

        const id =
            jwtUser.customerId ??
            jwtUser.userId;

        if (!id) {

            alert(
                "Customer ID not found."
            );

            return;
        }

        try {

            setSaving(true);

            const token =
                localStorage.getItem(
                    "shopsmart_token"
                );

            /*
             * Your PUT DTO expects:
             *
             * customer_name
             * phone
             * address
             * city
             * pincode
             */

            const requestBody = {

                customer_name:
                    formData.customer_name.trim(),

                phone:
                    formData.phone.trim(),

                address:
                    formData.address.trim(),

                city:
                    formData.city.trim(),

                pincode:
                    formData.pincode.trim()
            };


            console.log(
                "PUT CUSTOMER ID:",
                id
            );

            console.log(
                "PUT REQUEST:",
                requestBody
            );


            const response =
                await fetch(
                    `${API_URL}/${id}`,
                    {
                        method: "PUT",

                        headers: {

                            "Authorization":
                                `Bearer ${token}`,

                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify(
                                requestBody
                            )
                    }
                );


            if (!response.ok) {

                const errorText =
                    await response.text();

                console.error(
                    "UPDATE ERROR:",
                    errorText
                );

                throw new Error(
                    `Update failed: ${response.status}`
                );
            }


            /*
             * Your backend currently returns String,
             * so don't try to parse the PUT response
             * as CustomerEntity.
             */

            const result =
                await response.text();

            console.log(
                "UPDATE RESPONSE:",
                result
            );


            /*
             * VERY IMPORTANT:
             *
             * PUT succeeded.
             *
             * Now GET the customer again.
             *
             * This gives us the actual object from
             * your backend with camelCase properties.
             */

            await fetchCustomer(id);


            /*
             * Close modal.
             */

            setEditOpen(false);


            /*
             * Success message.
             */

            setToast(
                "Profile updated successfully!"
            );


            setTimeout(() => {
                setToast("");
            }, 3000);


        } catch (error) {

            console.error(
                "Profile update error:",
                error
            );

            setToast(
                "Unable to update profile. Please try again."
            );

            setTimeout(() => {
                setToast("");
            }, 3000);

        } finally {

            setSaving(false);
        }

    };


    /* =====================================================
       PROFILE COMPLETION
    ===================================================== */

    const getCompletion = () => {

        if (!customer) {
            return 0;
        }

        const fields = [

            customer.customerName,

            customer.phone ||
            customer.customerPhoneNo,

            customer.address,

            customer.city,

            customer.pincode
        ];


        const completed =
            fields.filter(
                field =>
                    field !== null &&
                    field !== undefined &&
                    field.toString().trim() !== ""
            ).length;


        return Math.round(
            (completed / fields.length) * 100
        );

    };


    const completion =
        getCompletion();


    /* =====================================================
       LOADING
    ===================================================== */

    if (loading) {

        return (
            <div className="profile-loading">

                <div className="profile-spinner"></div>

                <p>
                    Loading your profile...
                </p>

            </div>
        );

    }


    /* =====================================================
       NO JWT
    ===================================================== */

    if (!jwtUser) {

        return (
            <div className="profile-error">

                <i className="fas fa-user-lock"></i>

                <h2>
                    Session expired
                </h2>

                <p>
                    Please login again to view
                    your profile.
                </p>

            </div>
        );

    }


    /* =====================================================
       MAIN
    ===================================================== */

    return (

<>

        <div className="shopsmart-profile">
            <div className="profile-back-container ms-3 mt-3 m-3">
    <button
        onClick={() => navigate(-1)}
        className="btn btn-outline-secondary btn-sm rounded-pill"
    >
        <i className="fas fa-arrow-left "></i>
        Back
    </button>
</div>

            
            {toast && (

                <div className="profile-toast">

                    <div className="toast-icon">

                        <i className="fas fa-check"></i>

                    </div>


                    <div>

                        <strong>

                            {completion === 100
                                ? "Profile Complete!"
                                : "Profile Updated!"}

                        </strong>

                        <span>
                            {completion === 100
                                ? "All your profile details are complete. Thank you!"
                                : toast}
                        </span>

                    </div>


                    <button
                        onClick={() =>
                            setToast("")
                        }
                    >

                        <i className="fas fa-xmark"></i>

                    </button>

                </div>

            )}


            {/* =================================================
                HEADER
            ================================================= */}

            <section className="profile-header">

                <div>

                    <span className="profile-label">
                        MY ACCOUNT
                    </span>

                    <h1>
                        Your <span>Profile</span>
                    </h1>

                    <p>
                        Manage your personal information
                        and shopping preferences.
                    </p>

                </div>

            </section>


            {/* =================================================
                PROFILE MAIN
            ================================================= */}

            <section className="profile-container">


                {/* =================================================
                    PROFILE CARD
                ================================================= */}

                <div className="profile-card">


                    {/* =================================================
                        CARD TOP
                    ================================================= */}

                    <div className="profile-card-top">


                        {/* =================================================
                            ANIMATED PROFILE
                        ================================================= */}

                        <div className="profile-avatar">

                            <div className="avatar-glow"></div>

                            <div className="avatar-face">

                                <div className="avatar-hair"></div>

                                <div className="avatar-eyes">

                                    <span></span>
                                    <span></span>

                                </div>

                                <div className="avatar-smile"></div>

                            </div>

                        </div>


                        {/* =================================================
                            USER INFO
                        ================================================= */}

                        <div className="profile-main-info">

                            <span className="profile-role">

                                {jwtUser.role ||
                                    "CUSTOMER"}

                            </span>


                            <h2>

                                {customer?.customerName ||
                                    "Complete your profile"}

                            </h2>


                            <p>

                                <i className="fas fa-envelope"></i>

                                {customer?.customerEmail ||
                                    jwtUser.sub ||
                                    "No email"}

                            </p>

                        </div>


                        {/* =================================================
                            EDIT
                        ================================================= */}

                        <button
                            className="profile-edit-button"
                            onClick={() => {

                                setFormData({

                                    customer_name:
                                        customer?.customerName ??
                                        "",

                                    phone:
                                        customer?.phone ??
                                        customer?.customerPhoneNo ??
                                        "",

                                    address:
                                        customer?.address ??
                                        "",

                                    city:
                                        customer?.city ??
                                        "",

                                    pincode:
                                        customer?.pincode ??
                                        ""
                                });

                                setEditOpen(true);

                            }}
                        >

                            <i className="fas fa-pen"></i>

                            Edit Profile

                        </button>

                    </div>


                    {/* =================================================
                        COMPLETION
                    ================================================= */}

                    <div className="profile-completion">

                        <div className="completion-header">

                            <div>

                                <strong>
                                    Profile completion
                                </strong>

                                <span>

                                    {completion === 100

                                        ? "Your profile is complete!"

                                        : "Complete your profile for a better experience"}

                                </span>

                            </div>


                            <b>
                                {completion}%
                            </b>

                        </div>


                        <div className="completion-bar">

                            <div
                                className="completion-progress"
                                style={{
                                    width:
                                        `${completion}%`
                                }}
                            ></div>

                        </div>

                    </div>


                    {/* =================================================
                        PROFILE DETAILS
                    ================================================= */}

                    <div className="profile-details">


                        <div className="details-heading">

                            <div>

                                <span>
                                    PERSONAL INFORMATION
                                </span>

                                <h3>
                                    Profile Details
                                </h3>

                            </div>

                        </div>


                        <div className="details-grid">


                            {/* FULL NAME */}

                            <div className="profile-field">

                                <div className="field-icon">

                                    <i className="fas fa-user"></i>

                                </div>

                                <div>

                                    <span>
                                        Full Name
                                    </span>

                                    <strong>

                                        {customer?.customerName ||
                                            "Not added"}

                                    </strong>

                                </div>

                            </div>


                            {/* PHONE */}

                            <div className="profile-field">

                                <div className="field-icon">

                                    <i className="fas fa-phone"></i>

                                </div>

                                <div>

                                    <span>
                                        Phone Number
                                    </span>

                                    <strong>

                                        {customer?.phone ||
                                            customer?.customerPhoneNo ||
                                            "Not added"}

                                    </strong>

                                </div>

                            </div>


                            {/* EMAIL */}

                            <div className="profile-field">

                                <div className="field-icon">

                                    <i className="fas fa-envelope"></i>

                                </div>

                                <div>

                                    <span>
                                        Email
                                    </span>

                                    <strong>

                                        {customer?.customerEmail ||
                                            jwtUser.sub ||
                                            "Not available"}

                                    </strong>

                                </div>

                            </div>


                            {/* CUSTOMER ID */}

                            <div className="profile-field">

                                <div className="field-icon">

                                    <i className="fas fa-id-card"></i>

                                </div>

                                <div>

                                    <span>
                                        Customer ID
                                    </span>

                                    <strong>

                                        {customer?.customerId ??
                                            jwtUser.customerId ??
                                            jwtUser.userId ??
                                            "Not available"}

                                    </strong>

                                </div>

                            </div>


                            {/* ADDRESS */}

                            <div className="profile-field wide">

                                <div className="field-icon">

                                    <i className="fas fa-location-dot"></i>

                                </div>

                                <div>

                                    <span>
                                        Address
                                    </span>

                                    <strong>

                                        {customer?.address ||
                                            "Not added"}

                                    </strong>

                                </div>

                            </div>


                            {/* CITY */}

                            <div className="profile-field">

                                <div className="field-icon">

                                    <i className="fas fa-city"></i>

                                </div>

                                <div>

                                    <span>
                                        City
                                    </span>

                                    <strong>

                                        {customer?.city ||
                                            "Not added"}

                                    </strong>

                                </div>

                            </div>


                            {/* PINCODE */}

                            <div className="profile-field">

                                <div className="field-icon">

                                    <i className="fas fa-map-pin"></i>

                                </div>

                                <div>

                                    <span>
                                        Pincode
                                    </span>

                                    <strong>

                                        {customer?.pincode ||
                                            "Not added"}

                                    </strong>

                                </div>

                            </div>

                        </div>

                    </div>

                </div>


                {/* =================================================
                    SECURITY CARD
                ================================================= */}

                <div className="account-side-card">

                    <div className="side-icon">

                        <i className="fas fa-shield-halved"></i>

                    </div>

                    <h3>
                        Account Security
                    </h3>

                    <p>
                        Your account information is protected
                        and connected to your ShopSmart account.
                    </p>


                    <div className="security-item">

                        <i className="fas fa-circle-check"></i>

                        <span>
                            Email verified
                        </span>

                    </div>


                    <div className="security-item">

                        <i className="fas fa-lock"></i>

                        <span>
                            Secure authentication
                        </span>

                    </div>

                </div>

            </section>


            {/* =================================================
                EDIT MODAL
            ================================================= */}

            {editOpen && (

                <div
                    className="profile-modal-overlay"
                    onClick={() =>
                        setEditOpen(false)
                    }
                >

                    <div
                        className="profile-modal"
                        onClick={(e) =>
                            e.stopPropagation()
                        }
                    >


                        {/* MODAL HEADER */}

                        <div className="modal-header">

                            <div>

                                <span>
                                    ACCOUNT
                                </span>

                                <h2>
                                    Edit Profile
                                </h2>

                            </div>


                            <button
                                className="modal-close"
                                onClick={() =>
                                    setEditOpen(false)
                                }
                            >

                                <i className="fas fa-xmark"></i>

                            </button>

                        </div>


                        {/* FORM */}

                        <form
                            onSubmit={handleSave}
                        >

                            <div className="form-grid">


                                {/* FULL NAME */}

                                <div className="form-group">

                                    <label>
                                        Full Name
                                    </label>

                                    <div className="input-wrapper">

                                        <i className="fas fa-user"></i>

                                        <input
                                            type="text"
                                            name="customer_name"
                                            value={
                                                formData.customer_name
                                            }
                                            onChange={
                                                handleChange
                                            }
                                            placeholder="Enter your name"
                                        />

                                    </div>

                                </div>


                                {/* PHONE */}

                                <div className="form-group">

                                    <label>
                                        Phone Number
                                    </label>

                                    <div className="input-wrapper">

                                        <i className="fas fa-phone"></i>

                                        <input
                                            type="tel"
                                            name="phone"
                                            value={
                                                formData.phone
                                            }
                                            onChange={
                                                handleChange
                                            }
                                            placeholder="Enter phone number"
                                        />

                                    </div>

                                </div>


                                {/* ADDRESS */}

                                <div className="form-group full">

                                    <label>
                                        Address
                                    </label>

                                    <div className="input-wrapper">

                                        <i className="fas fa-location-dot"></i>

                                        <input
                                            type="text"
                                            name="address"
                                            value={
                                                formData.address
                                            }
                                            onChange={
                                                handleChange
                                            }
                                            placeholder="Enter your address"
                                        />

                                    </div>

                                </div>


                                {/* CITY */}

                                <div className="form-group">

                                    <label>
                                        City
                                    </label>

                                    <div className="input-wrapper">

                                        <i className="fas fa-city"></i>

                                        <input
                                            type="text"
                                            name="city"
                                            value={
                                                formData.city
                                            }
                                            onChange={
                                                handleChange
                                            }
                                            placeholder="Enter city"
                                        />

                                    </div>

                                </div>


                                {/* PINCODE */}

                                <div className="form-group">

                                    <label>
                                        Pincode
                                    </label>

                                    <div className="input-wrapper">

                                        <i className="fas fa-map-pin"></i>

                                        <input
                                            type="text"
                                            name="pincode"
                                            value={
                                                formData.pincode
                                            }
                                            onChange={
                                                handleChange
                                            }
                                            placeholder="Enter pincode"
                                        />

                                    </div>

                                </div>

                            </div>


                            {/* BUTTONS */}

                            <div className="modal-actions">

                                <button
                                    type="button"
                                    className="cancel-button"
                                    onClick={() =>
                                        setEditOpen(false)
                                    }
                                >
                                    Cancel
                                </button>


                                <button
                                    type="submit"
                                    className="save-profile-button"
                                    disabled={saving}
                                >

                                    {saving ? (

                                        <>
                                            <i className="fas fa-spinner fa-spin"></i>
                                            Saving...
                                        </>

                                    ) : (

                                        <>
                                            <i className="fas fa-check"></i>
                                            Save Changes
                                        </>

                                    )}

                                </button>

                            </div>

                        </form>

                    </div>

                </div>

            )}

        </div>
        </>

    );

}