import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import ShopRegistrationForm from "./components/Shop_owner/shop_register";

const App = () => {
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
