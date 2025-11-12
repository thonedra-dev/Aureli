import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import ShopRegistrationForm from "./components/Shop_owner/shop_register";
import ShopLogin from "./components/Shop_owner/shop_login";
import ShopProfile from "./components/Shop_owner/shop_profile"; // Import the ShopProfile component
import ProductSetup from "./components/Shop_owner/product_setup"; // Import ProductSetup component

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
        <Route path="/product_setup" element={<ProductSetup />} /> {/* Added product_setup route */}

        {/* Redirect default route */}
        <Route path="/" element={<Navigate to="/shop_login" />} />
      </Routes>
    </Router>
  );
};

export default App;
