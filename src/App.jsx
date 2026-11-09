import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import ShopRegistrationForm from "./components/Shop_owner/shop_register";
import ShopLogin from "./components/Shop_owner/shop_login";
import ShopProfile from "./components/Shop_owner/shop_profile"; // Import the ShopProfile component
import ProductSetup from "./components/Shop_owner/product_setup"; // Import ProductSetup component
import ProductDetails from "./components/Shop_owner/product_details"; // ✅ Import ProductDetails
import UserRegister from "./components/Shop_user/user_register";
import Homepage from "./components/Shop_user/homepage";
import UserLogin from "./components/Shop_user/user_login";
import UserProfile from "./components/Shop_user/user_profile";
import AddToCart from './components/Shop_user/add_to_cart';
import UserVisitingShopProfile from './components/Shop_user/user_visiting_shop_profile';
import UserChats from './components/Shop_user/user_chats';




const App = () => {
  const [ownerName, setOwnerName] = useState(null);
  const [user, setUser] = useState(null); // Track the full logged-in user details

  return (
    <Router>
      <Routes>
        {/* Shop Owner routes */}
        <Route path="/shop_register" element={<ShopRegistrationForm />} />
        <Route path="/shop_login" element={<ShopLogin />} />

        {/* Shop Profile route */}
        <Route path="/shop_profile" element={<ShopProfile />} />

        {/* Product Setup route */}
        <Route path="/product_setup" element={<ProductSetup />} />

        {/* Product Details route */}
        <Route path="/product_details/:productId" element={<ProductDetails />} />
        <Route path="/user_profile" element={<UserProfile />} />
        

        <Route path="/user_register" element={<UserRegister />} />
        <Route path="/home" element={<Homepage user={user} />} /> 
        <Route
          path="/user_login"
          element={<UserLogin onLoginSuccess={(userDetails) => setUser(userDetails)} />} /> 
        

         <Route path="/add_to_cart/:productId" element={<AddToCart />} /> {/* Route for AddToCart page */}
         <Route path="/user_visiting_shop_profile" element={<UserVisitingShopProfile />} />
         <Route path="/user_chats" element={<UserChats />} />

        {/* Redirect default route */}
        <Route path="/" element={<Navigate to="/home" />} />

      </Routes>
    </Router>
  );
};

export default App;
