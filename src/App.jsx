import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import ShopRegistrationForm from "./components/Shop_owner/shop_register";

const App = () => {
  const [ownerName, setOwnerName] = useState(null);
  const [user, setUser] = useState(null); // Track the full logged-in user details
  
  return (
    <Router>
      <Routes>
        {/* Shop Owner route */}
        <Route path="/shop_register" element={<ShopRegistrationForm />} />
      </Routes>
    </Router>
  );
};

export default App;
