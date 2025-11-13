import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom'; // Import useNavigate
import './shop_profile.css';

const fieldLabels = {
  category: 'Category',
  country: 'Country',
  state: 'State',
  shop_email: 'Shop Email',
  description: 'Description',
  contact_number: 'Contact Number',
};

const ShopProfile = () => {
  // Retrieve shop_id and products from the navigation state
  const { state } = useLocation();
  const { shop_id: shopId, products } = state; // Get shop_id and products passed from the login page

  const navigate = useNavigate(); // Initialize the navigate function

  const [shop, setShop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch shop profile based on shop_id (if not already provided by login page)
  useEffect(() => {
    if (!shopId) {
      setError('Missing shop ID');
      setLoading(false);
      return;
    }
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:5070/api/shop_profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ shop_id: shopId }), // Send shop_id in POST body
        });
        if (!response.ok) throw new Error(`Error fetching profile: ${response.statusText}`);
        const data = await response.json();
        setShop(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [shopId]);

  const profilePicUrl = shop?.profile_pic ? `http://localhost:5070${shop.profile_pic}` : '/default-profile.png';

  if (loading) return <p>Loading shop profile...</p>;
  if (error) return <p style={{ color: 'red' }}>Error: {error}</p>;
  if (!shop) return <p>No shop profile found.</p>;

  const handleAddProductClick = () => {
    // On click of the add product button, navigate to product setup page
    navigate('/product_setup', { state: { shop_id: shopId } }); // Pass shop_id to product setup page
  };

  return (
    <main className="shopProfileContainer" aria-labelledby="profileTitle">
      <section className="profileAndProductsWrapper">
        {/* Profile section: sticky */}
        <section className="profileSection">
          <section className="profileHeader">
            <img src={profilePicUrl} alt={`${shop.shop_name} profile`} className="profilePic" />
            <h2 id="profileTitle">{shop.shop_name}</h2>
          </section>

          <section className="profileDetails" aria-label="Shop details">
            <table>
              <tbody>
                {Object.entries(fieldLabels).map(([field, label]) => (
                  <tr key={field}>
                    <th scope="row">{label}</th>
                    <td>{shop[field] || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          {/* Action buttons */}
          <section className="iconButtonRow" aria-label="Profile actions">
            <button className="iconButton" aria-label="Logout">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16 13v-2H7v-3l-5 4 5 4v-3zM20 3h-8v2h8v14h-8v2h8c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z" /></svg>
            </button>
            <button className="iconButton" aria-label="Add Product" onClick={handleAddProductClick}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 11h-6V5h-2v6H5v2h6v6h2v-6h6v-2z" /></svg>
            </button>
            <button className="iconButton" aria-label="Edit Profile">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 17.25V21h3.75l11.06-11.06-3.75-3.75L3 17.25zM20.71 7.04a1.003 1.003 0 000-1.42l-2.34-2.34a1.003 1.003 0 00-1.42 0l-1.83 1.83 3.75 3.75 1.84-1.82z" /></svg>
            </button>
            <button className="iconButton" aria-label="Settings">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19.14 12.94c.04-.31.07-.63.07-.94s-.03-.63-.07-.94l2.03-1.58-1.92-3.32-2.39 1a7.007 7.007 0 00-1.6-.93L14 5h-4l-.25 2.23c-.58.23-1.12.57-1.6.93l-2.39-1-1.92 3.32 2.03 1.58c-.04.31-.07.63-.07.94s.03.63.07.94l-2.03 1.58 1.92 3.32 2.39-1c.48.36 1.02.7 1.6.93L10 19h4l.25-2.23c.58-.23 1.12-.57 1.6-.93l2.39 1 1.92-3.32-2.03-1.58zM12 15.5a3.5 3.5 0 110-7 3.5 3.5 0 010 7z" /></svg>
            </button>
          </section>
        </section>

       
      </section>
    </main>
  );
};

export default ShopProfile;
