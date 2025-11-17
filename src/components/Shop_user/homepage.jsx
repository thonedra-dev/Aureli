import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './homepage.css';

const categories = [
  'Home',
  'Women Clothing',
  'Beachwear',
  'Curve',
  'Kids',
  'Men Clothing',
  'Shoes',
  'Underwear & Sleepwear',
  'Jewelry & Accessories',
  'Baby & Maternity',
  'Beauty & Health',
  'Bags & Luggage',
  'Home & Kitchen',
  'Sports & Outdoors',
  'Electronics',
  'Home Textiles',
  'Tools & Home Improvement',
  'Appliances',
  'Office & School Supplies',
  'Pet Supplies',
  'Toys & Games',
  'Automotive',
];

const Homepage = ({ user }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('Home');
  const categoriesRef = useRef(null);
  const [scrollState, setScrollState] = useState('start');
  const [showDropdown, setShowDropdown] = useState(false);

  const navigate = useNavigate();

  // 👤 minimal user info coming from parent (set in UserLogin)
  const userId = user?.user_id || null;

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const categoryParam =
          selectedCategory === 'Home'
            ? ''
            : `?category=${encodeURIComponent(selectedCategory)}`;
        const res = await fetch(
          `http://localhost:5070/api/products/latest${categoryParam}`
        );
        if (!res.ok) throw new Error('Failed to fetch products');
        const data = await res.json();
        setProducts(data);
        setError(
          data.length === 0
            ? `No products available in ${selectedCategory} category.`
            : null
        );
      } catch (err) {
        setError(err.message);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [selectedCategory]);

  const scrollAmount = () =>
    categoriesRef.current
      ? Math.floor(categoriesRef.current.offsetWidth / 2)
      : 0;

  const scrollRight = () => {
    if (!categoriesRef.current) return;
    categoriesRef.current.scrollBy({
      left: scrollAmount(),
      behavior: 'smooth',
    });
    setScrollState('end');
  };

  const scrollLeft = () => {
    if (!categoriesRef.current) return;
    categoriesRef.current.scrollBy({
      left: -scrollAmount(),
      behavior: 'smooth',
    });
    setScrollState('start');
  };

  const handleCategoryClick = (category) => {
    setSelectedCategory(category);
  };

  const handleProductClick = (productId) => {
    navigate(`/add-to-cart/${productId}`);
  };

  const toggleDropdown = () => {
    setShowDropdown((prev) => !prev);
  };

  const navigateToLogin = () => {
    navigate('/user_login');
  };

  const navigateToRegister = () => {
    navigate('/user_register');
  };

  const navigateToProfile = () => {
    // If there is no user info here, force login first
    if (!userId) {
      alert('Please log in first to access the profile.');
      navigate('/user_login');
      return;
    }

    // Only send user_id forward to profile
    navigate('/user_profile', {
      state: { user_id: userId },
    });
  };

  if (loading) return <p className="loading-text">Loading products...</p>;
  if (error) return <p className="error-text">{error}</p>;
  if (products.length === 0)
    return <p className="no-products-text">No products available.</p>;

  return (
    <>
      <nav className="navbar">
        <div className="navbar-left">
          <h1 className="sheinTitle">SHEIN</h1>
        </div>

        <div className="navbar-middle">
          <div className="search-wrapper">
            <input
              type="text"
              placeholder="Search products"
              className="search-input"
              aria-label="Search products"
            />
            <button className="search-btn" aria-label="Search">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="search-icon"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <circle cx="11" cy="11" r="7" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </button>
          </div>
        </div>

        <div className="navbar-right">
          {/* User icon + dropdown */}
          <div
            className="nav-icon"
            aria-label="User profile"
            onClick={toggleDropdown}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path d="M12 12c2.2 0 4-1.8 4-4s-1.8-4-4-4-4 1.8-4 4 1.8 4 4 4zm0 2c-2.2 0-6 1.3-6 3.8V21h12v-3.2c0-2.5-3.8-3.8-6-3.8z" />
            </svg>

            {showDropdown && (
              <div className="dropdown-menu">
                {/* username shown like your screenshot; Guest when not logged in */}
                <p>{user?.username || 'Guest'}</p>
                <button onClick={navigateToProfile}>Profile</button>
                <button onClick={navigateToLogin}>Login</button>
                <button onClick={navigateToRegister}>Register</button>
              </div>
            )}
          </div>

          {/* Cart icon (static for now) */}
          <button className="nav-icon" aria-label="Cart" title="Cart">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path d="M3 3h18M6 6l1 13h10l1-13H6z" />
            </svg>
          </button>

          {/* Wishlist icon (still just navigation / static as you said) */}
          <button
            className="nav-icon"
            aria-label="Wishlist"
            title="Wishlist"
            onClick={() => navigate('/favourites')}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path d="M12 21c-1.3 0-2.6-.5-3.6-1.5l-.9-.9-4.4-4.5c-1.8-1.9-1.8-4.9 0-6.8 1.8-1.9 4.8-1.9 6.7 0l1.2 1.2 1.2-1.2c1.9-1.9 4.9-1.9 6.7 0 1.9 1.9 1.9 4.9 0 6.8l-4.4 4.5-.9.9c-1 1-2.3 1.5-3.6 1.5z" />
            </svg>
          </button>
        </div>
      </nav>

      <div className="categories-bar-container">
        <div className="categories-bar" ref={categoriesRef}>
          <div
            className="category-item fixed-category"
            onClick={() => handleCategoryClick('Home')}
          >
            Home
          </div>
          {categories.slice(1).map((cat, i) => (
            <div
              key={i}
              className="category-item"
              onClick={() => handleCategoryClick(cat)}
            >
              {cat}
            </div>
          ))}
        </div>
        <div className="arrows-container">
          <button
            className={`arrow-btn ${
              scrollState === 'start' ? 'active' : ''
            }`}
            onClick={scrollLeft}
            aria-label="Scroll left"
            disabled={scrollState === 'start'}
          >
            &#x276E;
          </button>
          <button
            className={`arrow-btn ${scrollState === 'end' ? 'active' : ''}`}
            onClick={scrollRight}
            aria-label="Scroll right"
            disabled={scrollState === 'end'}
          >
            &#x276F;
          </button>
        </div>
      </div>

      <main className="products-main">
        <div className="products-container">
          <div className="products-grid">
            {products.map((product) => (
              <div key={product.product_id} className="product-card">
                <div
                  className="product-image-wrapper"
                  onClick={() => handleProductClick(product.product_id)}
                >
                  <img
                    src={`http://localhost:5070${product.default_picture}`}
                    alt={product.product_name}
                    className="product-image"
                  />
                </div>
                <h3 className="product-name">{product.product_name}</h3>
                <p className="product-price">
                  RM
                  {Math.min(
                    ...[
                      product.XS_price,
                      product.S_price,
                      product.M_price,
                      product.L_price,
                      product.XL_price,
                      product.XLL_price,
                    ].filter((price) => price !== null)
                  )}
                </p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </>
  );
};

export default Homepage;
