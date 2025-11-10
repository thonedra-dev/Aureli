import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import ShopRegistrationForm from "./components/Shop_owner/shop_register";
import ShopLogin from "./components/Shop_owner/shop_login"; // Make sure you import this


const App = () => {
  const [ownerName, setOwnerName] = useState(null);
  const [user, setUser] = useState(null); // Track the full logged-in user details

  return (
    <Router>
      <Routes>
        {/* Shop Owner routes */}
        <Route path="/shop_register" element={<ShopRegistrationForm />} />

        {/* Shop Login route */}
        <Route
          path="/shop_login"
          element={<ShopLogin onLoginSuccess={(data) => setOwnerName(data.owner_name)} />}
        />

      </Routes>
    </Router>
  );
};

export default App;
