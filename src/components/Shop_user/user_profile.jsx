import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import './user_profile.css';

const API_BASE = 'http://localhost:5070';

const UserProfile = () => {
  const { state } = useLocation();
  const userId = state?.user_id;

  const [userDetails, setUserDetails] = useState(null);
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [profilePic, setProfilePic] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchUserDetails = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/user_profile?user_id=${userId}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch user details');
      }

      setUserDetails(data);
      setProfilePic(data.profile_pic || '/static/uploads/default.jpeg');
    } catch (err) {
      console.error(err);
      setError('Failed to fetch user details');
    } finally {
      setLoading(false);
    }
  };

  const fetchCartItems = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/user_cart?user_id=${userId}`);
      const data = await res.json();
      console.log('Cart items response:', data);  // Check this in console!

      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch cart items');
      }

      setCartItems(data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch cart items');
    }
  };

  const getItemPrice = (item) => {
  if (item.XS) return item.var_XS_price || item.XS_price || '0.00';
  if (item.S) return item.var_S_price || item.S_price || '0.00';
  if (item.M) return item.var_M_price || item.M_price || '0.00';
  if (item.L) return item.var_L_price || item.L_price || '0.00';
  if (item.XL) return item.var_XL_price || item.XL_price || '0.00';
  if (item.XLL) return item.var_XLL_price || item.XLL_price || '0.00';
  return '0.00';
};

  const handleProfilePicChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('user_id', userId);
    formData.append('profile_pic', file);

    try {
      const response = await fetch(`${API_BASE}/api/update_profile_pic`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || 'Error updating profile picture');
        return;
      }

      if (data.profile_pic) {
        setProfilePic(data.profile_pic);
        setIsUpdating(false);
        alert('Profile picture updated successfully');
      } else {
        alert('Error updating profile picture');
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Error uploading profile picture');
    }
  };

  const getSelectedSize = (item) => {
    if (item.XS) return 'XS';
    if (item.S) return 'S';
    if (item.M) return 'M';
    if (item.L) return 'L';
    if (item.XL) return 'XL';
    if (item.XLL) return 'XLL';
    return 'Unknown';
  };

  useEffect(() => {
    if (userId) {
      fetchUserDetails();
      fetchCartItems();
    }
  }, [userId]);

  if (loading) return <p className="loading-text">Loading user details...</p>;
  if (error) return <p className="error-text">{error}</p>;

  const imgSrc = `${API_BASE}${profilePic || '/static/uploads/default.jpeg'}`;

  return (
    <div className="main-container">
      <div className="cart-container">
        <div className="all-items">All Items</div>
        <div className="cart-items">
          {cartItems.length > 0 ? (
            cartItems.map((item, index) => (
              <div className="cart-item" key={index}>
                <div className="cart-item-image">
                  <img
                    src={`${API_BASE}${item.variant_picture || item.default_picture}`}
                    alt={item.product_name}
                    className="cart-item-img"
                    onError={(e) => {
                      e.target.src = `${API_BASE}/static/uploads/default.jpeg`;
                    }}
                  />
                </div>
                <div className="cart-item-details">
                  <p>{item.product_name} / {getSelectedSize(item)}</p>
                  <p>{item.category}</p>
                  <p>Lowest Price in 30 Days</p>
                  <p className="price">RM {getItemPrice(item)}</p>
                </div>
              </div>
            ))
          ) : (
            <p>No items in your cart</p>
          )}
        </div>
      </div>

      <div className="user-summary-container">
        <div className="user-info">
          <div className="user-pic-container">
            <div
              className="profile-pic-frame"
              onClick={() => setIsUpdating(true)}
            >
              <img
                src={imgSrc}
                alt="Profile"
                className="profile-pic"
              />
            </div>

            {isUpdating && (
              <div className="update-btn">
                <button
                  type="button"
                  onClick={() =>
                    document.getElementById('profile-pic-input').click()
                  }
                >
                  Update Profile Picture
                </button>
              </div>
            )}

            <input
              type="file"
              id="profile-pic-input"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleProfilePicChange}
            />
          </div>
        </div>

        <div className="user-table">
          {userDetails && (
            <table>
              <tbody>
                <tr>
                  <td><strong>Username:</strong></td>
                  <td>{userDetails.username}</td>
                </tr>
                <tr>
                  <td><strong>Email Address:</strong></td>
                  <td>{userDetails.email_address}</td>
                </tr>
                <tr>
                  <td><strong>Contact Number:</strong></td>
                  <td>{userDetails.contact_number}</td>
                </tr>
                <tr>
                  <td><strong>Account Created At:</strong></td>
                  <td>{userDetails.created_at}</td>
                </tr>
              </tbody>
            </table>
          )}
        </div>

        <div className="order-summary">
          <h3>Order Summary</h3>
          <div className="summary-details">
            <p>Estimated Price: RM 0.00</p>
            <button type="button">Checkout Now</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;