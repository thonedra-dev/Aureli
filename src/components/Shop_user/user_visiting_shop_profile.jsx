import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './user_visiting_shop_profile.css';

const UserVisitingShopProfile = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const shopId = location.state?.shop_id;
  const userId = location.state?.user_id;

  const [shop, setShop] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('products');

  useEffect(() => {
    if (!shopId) {
      setError('Missing shop ID');
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [profileResponse, productsResponse] = await Promise.all([
          fetch('http://localhost:5070/api/user_visiting_shop_profile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ shop_id: shopId }),
          }),
          fetch('http://localhost:5070/api/user_visiting_shop_profile_cards', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ shop_id: shopId }),
          }),
        ]);

        if (!profileResponse.ok) throw new Error('Error fetching profile');
        if (!productsResponse.ok) throw new Error('Error fetching products');

        const profileData = await profileResponse.json();
        const productsData = await productsResponse.json();

        setShop(profileData);
        setProducts(productsData || []);
      } catch (err) {
        setError(err.message || 'Failed to load shop data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [shopId]);

  const handleProductClick = (productId) => {
    navigate(`/add_to_cart/${productId}`, { state: { user_id: userId } });
  };

  const handleMessageUsClick = async () => {
    if (!userId || !shopId) {
      alert('Missing user or shop information.');
      return;
    }

    try {
      const response = await fetch('http://localhost:5070/api/open_chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user_id: userId, shop_id: shopId }),
      });

      const data = await response.json();

      if (data.chat_id) {
        // Navigate to the user_chats page and pass all three IDs
        navigate('/user_chats', { state: { chat_id: data.chat_id, user_id: userId, shop_id: shopId } });
      } else {
        alert('Error opening chat.');
      }
    } catch (error) {
      console.error('Error opening chat:', error);
      alert('Something went wrong. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="vs-loading">
        <div className="vs-loading-spinner"></div>
        <p>Discovering amazing products...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="vs-error">
        <div className="vs-error-icon">⚠️</div>
        <h3>Oops! Something went wrong</h3>
        <p>{error}</p>
        <button className="vs-back-btn" onClick={() => navigate(-1)}>
          Go Back
        </button>
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="vs-error">
        <div className="vs-error-icon">🏪</div>
        <h3>Shop Not Found</h3>
        <p>This shop doesn't exist or has been removed.</p>
        <button className="vs-back-btn" onClick={() => navigate(-1)}>
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="vs-container">
      {/* Hero Header */}
      <div className="vs-hero">
        <div className="vs-hero-background"></div>
        <div className="vs-hero-content">
          <div className="vs-shop-avatar">
            <img
              src={shop.profile_pic ? `http://localhost:5070${shop.profile_pic}` : '/default-shop.png'}
              alt={shop.shop_name}
            />
          </div>
          <div className="vs-shop-info">
            <h1 className="vs-shop-name">{shop.shop_name}</h1>
            <div className="vs-shop-stats">
              <span className="vs-stat">
                <strong>{products.length}</strong> Products
              </span>
              <span className="vs-stat">
                <strong>{shop.country}</strong> Location
              </span>
              <span className="vs-stat">
                <strong>{shop.category}</strong> Category
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="vs-tabs">
        <button
          className={`vs-tab ${activeTab === 'products' ? 'active' : ''}`}
          onClick={() => setActiveTab('products')}
        >
          PRODUCTS
        </button>
        <button
          className={`vs-tab ${activeTab === 'contact' ? 'active' : ''}`}
          onClick={() => setActiveTab('contact')}
        >
          CONTACT
        </button>
      </div>

      {/* Content Area */}
      <div className="vs-content">
        {activeTab === 'products' && (
          <div className="vs-products-section">
            <h2 className="vs-section-title">Featured Products</h2>
            {products.length > 0 ? (
              <div className="vs-products-grid">
                {products.map((product) => (
                  <div
                    key={product.product_id}
                    className="vs-product-card"
                    onClick={() => handleProductClick(product.product_id)}
                  >
                    <div className="vs-product-image">
                      <img
                        src={product.default_picture ? `http://localhost:5070${product.default_picture}` : '/default-product.png'}
                        alt={product.product_name}
                      />
                      <div className="vs-product-overlay">
                        <button className="vs-quick-view">QUICK VIEW</button>
                      </div>
                    </div>
                    <div className="vs-product-info">
                      <h3 className="vs-product-name">{product.product_name}</h3>
                      <p className="vs-product-price">RM {product.default_price || '0.00'}</p>
                      <div className="vs-product-meta">
                        <span className="vs-sizes">Sizes: XS-XXL</span>
                        <span className="vs-stock">In Stock</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="vs-empty-state">
                <div className="vs-empty-icon">📦</div>
                <h3>No Products Yet</h3>
                <p>This shop hasn't added any products yet.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'contact' && (
          <div className="vs-contact-section">
            <h2 className="vs-section-title">Get in Touch</h2>
            <div className="vs-contact-info">
              <div className="vs-contact-card">
                <div className="vs-contact-icon">📧</div>
                <div className="vs-contact-details">
                  <strong>Email</strong>
                  <p>{shop.shop_email}</p>
                </div>
              </div>
              <div className="vs-contact-card">
                <div className="vs-contact-icon">📞</div>
                <div className="vs-contact-details">
                  <strong>Phone</strong>
                  <p>{shop.contact_number || 'Not provided'}</p>
                </div>
              </div>
              <div 
                className="vs-contact-card" 
                onClick={handleMessageUsClick} // Make entire card clickable
              >
                <div className="vs-contact-icon">💬</div>
                <div className="vs-contact-details">
                  <strong>Message</strong>
                  <p>Send a Direct Message</p> {/* Updated content inside the card */}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserVisitingShopProfile;
