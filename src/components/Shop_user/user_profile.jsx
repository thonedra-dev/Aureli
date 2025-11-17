import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import './user_profile.css';

const API_BASE = 'http://localhost:5070';

const UserProfile = () => {
  const { state } = useLocation();
  const userId = state?.user_id;

  const [userDetails, setUserDetails] = useState(null);
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

  useEffect(() => {
    if (userId) {
      fetchUserDetails();
    }
  }, [userId]);

  if (loading) return <p className="loading-text">Loading user details...</p>;
  if (error) return <p className="error-text">{error}</p>;

  const imgSrc = `${API_BASE}${profilePic || '/static/uploads/default.jpeg'}`;

  return (
    <div className="main-container">
      <div className="cart-container">
        <div className="all-items">All Items</div>
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
                {/* User ID row removed as requested */}
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