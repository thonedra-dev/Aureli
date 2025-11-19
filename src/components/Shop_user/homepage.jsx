import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './homepage.css';

const categories = [
  'Home', 'Women Clothing', 'Beachwear', 'Curve', 'Kids', 'Men Clothing',
  'Shoes', 'Underwear & Sleepwear', 'Jewelry & Accessories', 'Baby & Maternity',
  'Beauty & Health', 'Bags & Luggage', 'Home & Kitchen', 'Sports & Outdoors',
  'Electronics', 'Home Textiles', 'Tools & Home Improvement', 'Appliances',
  'Office & School Supplies', 'Pet Supplies', 'Toys & Games', 'Automotive',
];

const Homepage = ({ user }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('Home');
  const categoriesRef = useRef(null);
  const [scrollState, setScrollState] = useState('start');
  const [showDropdown, setShowDropdown] = useState(false);

  // --- Modal State ---
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState(null); // <--- NEW STATE FOR ID
  const [step, setStep] = useState(1);
  const [commentData, setCommentData] = useState({
    comment: '',
    file: null,
    size: '',
    weight: '',
    height: '',
    stars: 0,
    fit: '',
  });

  const navigate = useNavigate();
  const userId = user?.user_id || null;

  // --- Fetch Products ---
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const categoryParam = selectedCategory === 'Home' ? '' : `?category=${encodeURIComponent(selectedCategory)}`;
        const res = await fetch(`http://localhost:5070/api/products/latest${categoryParam}`);
        if (!res.ok) throw new Error('Failed to fetch products');
        const data = await res.json();
        setProducts(data);
        setError(data.length === 0 ? `No products available in ${selectedCategory} category.` : null);
      } catch (err) {
        setError(err.message);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [selectedCategory]);

  // --- Scroll Logic ---
  const scrollAmount = () => (categoriesRef.current ? Math.floor(categoriesRef.current.offsetWidth / 2) : 0);
  const scrollRight = () => {
    if (!categoriesRef.current) return;
    categoriesRef.current.scrollBy({ left: scrollAmount(), behavior: 'smooth' });
    setScrollState('end');
  };
  const scrollLeft = () => {
    if (!categoriesRef.current) return;
    categoriesRef.current.scrollBy({ left: -scrollAmount(), behavior: 'smooth' });
    setScrollState('start');
  };

  // --- Handlers ---
  const handleCategoryClick = (category) => setSelectedCategory(category);
  
  const handleProductClick = (productId) => {
    navigate(`/add_to_cart/${productId}`, { state: { user_id: userId || null } });
  };

  const toggleDropdown = () => setShowDropdown((prev) => !prev);
  const navigateToLogin = () => navigate('/user_login');
  const navigateToRegister = () => navigate('/user_register');
  
  const navigateToProfile = () => {
    if (!userId) {
      alert('Please log in first to access the profile.');
      navigate('/user_login');
      return;
    }
    navigate('/user_profile', { state: { user_id: userId } });
  };

  // --- Modal Handlers ---
  
  // Updated: Accepts productId now
  const openCommentModal = (productId) => {
    if (!userId) {
      alert('Please log in first to leave a comment.');
      navigate('/user_login');
      return;
    }
    setSelectedProductId(productId); // <--- Save the ID
    setStep(1);
    setShowCommentModal(true);
  };

  const closeCommentModal = () => {
    setShowCommentModal(false);
    setSelectedProductId(null);
  };

  const handleNextStep = () => {
    if (step < 2) setStep(step + 1);
  };

  const handlePrevStep = () => {
    if (step > 1) setStep(step - 1);
  };

const handleSubmitComment = async () => {
  if (!selectedProductId) {
    alert("Error: No product selected.");
    return;
  }

  try {
    const formData = new FormData();
    formData.append('user_id', userId);
    formData.append('product_id', selectedProductId);
    formData.append('text', commentData.comment);
    formData.append('weight', commentData.weight);
    formData.append('height', commentData.height);
    formData.append('rating', commentData.stars);
    
    // Add file if exists
    if (commentData.file) {
      formData.append('comment_pic', commentData.file);
    }

    const response = await fetch('http://localhost:5070/api/submit_comment', {
      method: 'POST',
      body: formData, // Remove Content-Type header - browser will set it automatically
    });

    if (!response.ok) throw new Error('Failed to submit comment');
    alert('Your comment has been submitted successfully!');
    closeCommentModal();
  } catch (err) {
    alert('There was an error submitting your comment');
  }
};

  if (loading) return <p className="loading-text">Loading products...</p>;
  if (error) return <p className="error-text">{error}</p>;

  return (
    <>
      {/* Navbar */}
      <nav className="navbar">
        <div className="navbar-left">
          <h1 className="sheinTitle">SHEIN</h1>
        </div>
        <div className="navbar-middle">
          <div className="search-wrapper">
            <input type="text" placeholder="Search products" className="search-input" aria-label="Search products" />
            <button className="search-btn" aria-label="Search">
              <svg xmlns="http://www.w3.org/2000/svg" className="search-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <circle cx="11" cy="11" r="7" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </button>
          </div>
        </div>
        <div className="navbar-right">
          <div className="nav-icon" onClick={toggleDropdown}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path d="M12 12c2.2 0 4-1.8 4-4s-1.8-4-4-4-4 1.8-4 4 1.8 4 4 4zm0 2c-2.2 0-6 1.3-6 3.8V21h12v-3.2c0-2.5-3.8-3.8-6-3.8z" />
            </svg>
            {showDropdown && (
              <div className="dropdown-menu">
                <p>{user?.username || 'Guest'}</p>
                <button onClick={navigateToProfile}>Profile</button>
                <button onClick={navigateToLogin}>Login</button>
                <button onClick={navigateToRegister}>Register</button>
              </div>
            )}
          </div>
          <button className="nav-icon"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M3 3h18M6 6l1 13h10l1-13H6z" /></svg></button>
          <button className="nav-icon" onClick={() => navigate('/favourites')}><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M12 21c-1.3 0-2.6-.5-3.6-1.5l-.9-.9-4.4-4.5c-1.8-1.9-1.8-4.9 0-6.8 1.8-1.9 4.8-1.9 6.7 0l1.2 1.2 1.2-1.2c1.9-1.9 4.9-1.9 6.7 0 1.9 1.9 1.9 4.9 0 6.8l-4.4 4.5-.9.9c-1 1-2.3 1.5-3.6 1.5z" /></svg></button>
        </div>
      </nav>

      {/* Categories Bar */}
      <div className="categories-bar-container">
        <div className="categories-bar" ref={categoriesRef}>
          <div className="category-item fixed-category" onClick={() => handleCategoryClick('Home')}>Home</div>
          {categories.slice(1).map((cat, i) => (
            <div key={i} className="category-item" onClick={() => handleCategoryClick(cat)}>{cat}</div>
          ))}
        </div>
        <div className="arrows-container">
          <button className={`arrow-btn ${scrollState === 'start' ? 'active' : ''}`} onClick={scrollLeft} disabled={scrollState === 'start'}>&#x276E;</button>
          <button className={`arrow-btn ${scrollState === 'end' ? 'active' : ''}`} onClick={scrollRight} disabled={scrollState === 'end'}>&#x276F;</button>
        </div>
      </div>

      {/* Main Content */}
      <main className="products-main">
        <div className="products-container">
          <div className="products-grid">
            {products.map((product) => (
              <div key={product.product_id} className="product-card">
                <div className="product-image-wrapper" onClick={() => handleProductClick(product.product_id)}>
                  <img src={`http://localhost:5070${product.default_picture}`} alt={product.product_name} className="product-image" />
                </div>
                <h3 className="product-name">{product.product_name}</h3>
                <p className="product-price">
                  RM {Math.min(...[product.XS_price, product.S_price, product.M_price, product.L_price, product.XL_price, product.XLL_price].filter((price) => price !== null))}
                </p>
                
                {/* Updated: Pass product.product_id to openCommentModal */}
                <div className="heart-icon-container" onClick={() => navigate('/favourites')}></div>
                <div className="comment-icon-container" onClick={() => openCommentModal(product.product_id)}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path d="M21 2H3c-1.1 0-1.99.9-1.99 2L1 18c0 1.1.89 2 1.99 2H5v4l4-4h10c1.1 0 1.99-.9 1.99-2V4c0-1.1-.89-2-1.99-2z"/>
                  </svg>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* --- REFACTORED COMMENT MODAL --- */}
      {showCommentModal && (
        <div className="review-modal-overlay">
          <div className="review-modal-content">
            <div className="review-modal-header">
              <h2>Write a Review</h2>
              <span className="step-indicator">Step {step} of 2</span>
            </div>

            <div className="review-modal-body">
              {/* STEP 1: Ratings & Comment */}
              {step === 1 && (
                <div className="review-step-container">
                  <div className="review-group">
                    <label>Overall Rating</label>
                    <div className="star-rating-container">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span
                          key={star}
                          className={`review-star ${star <= commentData.stars ? 'filled' : ''}`}
                          onClick={() => setCommentData({ ...commentData, stars: star })}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="review-group">
                    <label>How was the fit?</label>
                    <div className="fit-options">
                      {['Small', 'True to Size', 'Large'].map((fitOption) => (
                        <button
                          key={fitOption}
                          className={`option-btn ${commentData.fit === fitOption ? 'active' : ''}`}
                          onClick={() => setCommentData({ ...commentData, fit: fitOption })}
                        >
                          {fitOption}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="review-group">
                    <label>Your Review</label>
                    <textarea
                      className="review-textarea"
                      placeholder="Tell us what you think about this item..."
                      value={commentData.comment}
                      onChange={(e) => setCommentData({ ...commentData, comment: e.target.value })}
                    />
                  </div>
                </div>
              )}

              {/* STEP 2: Personal Details & Photo */}
              {step === 2 && (
                <div className="review-step-container">
                  <div className="review-group">
                    <label>Your Size</label>
                    <div className="size-options">
                      {['XS', 'S', 'M', 'L', 'XL', 'XLL'].map((sizeOption) => (
                        <button
                          key={sizeOption}
                          className={`option-btn small-btn ${commentData.size === sizeOption ? 'active' : ''}`}
                          onClick={() => setCommentData({ ...commentData, size: sizeOption })}
                        >
                          {sizeOption}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="review-split-group">
                    <div className="review-group half">
                      <label>Height (cm)</label>
                      <input
                        type="number"
                        className="review-input"
                        placeholder="e.g. 165"
                        value={commentData.height}
                        onChange={(e) => setCommentData({ ...commentData, height: e.target.value })}
                      />
                    </div>
                    <div className="review-group half">
                      <label>Weight (kg)</label>
                      <input
                        type="number"
                        className="review-input"
                        placeholder="e.g. 55"
                        value={commentData.weight}
                        onChange={(e) => setCommentData({ ...commentData, weight: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="review-group">
                    <label>Add a Photo (Optional)</label>
                    <input
                      type="file"
                      className="review-file-input"
                      onChange={(e) => setCommentData({ ...commentData, file: e.target.files[0] })}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="review-modal-footer">
              {step === 1 ? (
                <button className="modal-btn secondary" onClick={closeCommentModal}>Cancel</button>
              ) : (
                <button className="modal-btn secondary" onClick={handlePrevStep}>Previous</button>
              )}

              {step === 1 ? (
                <button className="modal-btn primary" onClick={handleNextStep}>Next</button>
              ) : (
                <button className="modal-btn primary submit-btn" onClick={handleSubmitComment}>Submit Review</button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Homepage;