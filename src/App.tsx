import {
    Routes,
    Route,
    Navigate,
    useOutletContext,
} from "react-router-dom";
import { useState } from "react";

import Register from "./Pages/Register";
import Login from "./Pages/Login";

import AuthGuard from "./guards/AuthGuard";

import { CustomerLayout } from "./Components/CustomerLayout";

import {
    RetailerLayout,
    type RetailerOutletContext,
} from "./Components/RetailerLayout";

import { Myorders } from "./Pages/Myorders";
import { CustomerHome } from "./Pages/CustomerHome";
import { Profile } from "./Pages/Profile";
import { Cart } from "./Pages/Cart";
import OrderPage from "./Pages/OrderPage";



import ShopView from "./Pages/ShopView";
import ProductContent from "./Pages/ProductContent";
import RetailerHome from "./Pages/RetailerHome";
import OrdersContent from "./Pages/OrderContent";
import OrderHistory from "./Pages/OrderHistory";
import AddVoucherPage from "./Pages/AddVoucherPage";
import ProfileRetailer from "./Pages/ProfileRetailer";
import LoyaltyPage from "./Pages/LoyaltyPage";

type Shop = Parameters<
    NonNullable<React.ComponentProps<typeof ShopView>["onSelectShop"]>
>[0];


function RetailerDashboard(): React.JSX.Element {
    const { retailerId } =
        useOutletContext<RetailerOutletContext>();

    return (
        <RetailerHome
            retailerId={retailerId}
        />
    );
}


function RetailerShopPage(): React.JSX.Element {
    const { retailerId } =
        useOutletContext<RetailerOutletContext>();

    const [selectedShop, setSelectedShop] =
        useState<Shop | null>(null);

    

    if (selectedShop) {
        return (
            <ProductContent
                selectedShop={selectedShop}
                onBackToShops={() => setSelectedShop(null)}
            />
        );
    }

    

    return (
        <ShopView
            retailerId={retailerId}
            onSelectShop={setSelectedShop}
        />
    );
}



function RetailerOrdersPage(): React.JSX.Element {
    const { retailerId } =
        useOutletContext<RetailerOutletContext>();

    return (
        <OrdersContent
            retailerId={retailerId}
        />
    );
}




function RetailerOrderHistoryPage(): React.JSX.Element {
    const { retailerId } =
        useOutletContext<RetailerOutletContext>();

    return (
        <OrderHistory
            retailerId={retailerId}
        />
    );
}




function RetailerVoucherPage(): React.JSX.Element {
    const { retailerId } =
        useOutletContext<RetailerOutletContext>();

    return (
        <AddVoucherPage
            retailerId={retailerId}
        />
    );
}




function RetailerProfilePage(): React.JSX.Element {
    const { retailerId } =
        useOutletContext<RetailerOutletContext>();

    return (
        <ProfileRetailer
            retailerId={retailerId}
        />
    );
}



function App(): React.JSX.Element {
    return (
        <Routes>

            
            <Route
                path="/register"
                element={<Register />}
            />

            <Route
                path="/login"
                element={<Login />}
            />



            <Route
                element={
                    <AuthGuard
                        allowedRoles={["CUSTOMER"]}
                    />
                }
            >
                <Route
                    path="/"
                    element={<CustomerLayout />}
                >
                    <Route
                        index
                        element={<CustomerHome />}
                    />
                    <Route path="loyaltypage" element={<LoyaltyPage/>}/>


                    <Route
                        path="order"
                        element={<OrderPage />}
                    />

                    <Route
                        path="myorders"
                        element={<Myorders />}
                    />

                    <Route
                        path="profile"
                        element={<Profile />}
                    />

                    <Route
                        path="cart"
                        element={<Cart />}
                    />
                </Route>
            </Route>


           
            <Route
                element={
                    <AuthGuard
                        allowedRoles={["RETAILER"]}
                    />
                }
            >
                <Route
                    path="/retailer"
                    element={<RetailerLayout />}
                >


                    <Route
                        index
                        element={<RetailerDashboard />}
                    />

                    <Route
                        path="home"
                        element={<RetailerDashboard />}
                    />


                   

                    <Route
                        path="shop"
                        element={<RetailerShopPage />}
                    />


                  

                    <Route
                        path="orders"
                        element={<RetailerOrdersPage />}
                    />



                    <Route
                        path="order-history"
                        element={<RetailerOrderHistoryPage />}
                    />


                    <Route
                        path="add-voucher"
                        element={<RetailerVoucherPage />}
                    />


                   
                    <Route
                        path="profile"
                        element={<RetailerProfilePage />}
                    />

                </Route>
            </Route>



            <Route
                path="/unauthorized"
                element={
                    <div
                        style={{
                            padding: "40px",
                            textAlign: "center",
                        }}
                    >
                        <h1>Unauthorized</h1>

                        <p>
                            You do not have permission to
                            access this page.
                        </p>

                        <button
                            onClick={() =>
                                window.history.back()
                            }
                            style={{
                                padding: "10px 20px",
                                cursor: "pointer",
                            }}
                        >
                            Go Back
                        </button>
                    </div>
                }
            />


          
            <Route
                path="*"
                element={
                    <Navigate
                        to="/login"
                        replace
                    />
                }
            />

        </Routes>
    );
}

export default App;