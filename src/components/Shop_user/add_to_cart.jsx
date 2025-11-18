import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import './add_to_cart.css';

const AddToCart = () => {
  const { productId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [product, setProduct] = useState(null);
  const [variants, setVariants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // State for selected options
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [selectedSize, setSelectedSize] = useState('');
  
  // Get user_id from navigation state
  const userId = location.state?.user_id || null;

  useEffect(() => {
    const fetchProductDetails = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `http://localhost:5070/api/add_to_cart_product_details/${productId}`
        );
        
        if (!response.ok) {
          throw new Error('Failed to fetch product details');
        }
        
        const data = await response.json();
        setProduct(data.product);
        setVariants(data.variants);
        
        // Set default selected variant to main product
        setSelectedVariant({
          type: 'main',
          color: data.product.default_color,
          picture: data.product.default_picture,
          productData: data.product
        });
        
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (productId) {
      fetchProductDetails();
    }
  }, [productId]);

  // Get all available images (main product + variants)
  const getAvailableImages = () => {
    const images = [];
    
    // Always include main product image
    if (product?.default_picture) {
      images.push({
        type: 'main',
        color: product.default_color,
        picture: product.default_picture,
        productData: product
      });
    }
    
    // Add variant images
    variants.forEach(variant => {
      if (variant.picture) {
        images.push({
          type: 'variant',
          color: variant.color,
          picture: variant.picture,
          variantData: variant
        });
      }
    });
    
    return images;
  };

  // Handle thumbnail click
  const handleThumbnailClick = (image) => {
    setSelectedVariant(image);
    setSelectedSize(''); // Reset size selection when variant changes
  };

  // Check if a size is available for selected variant
  const isSizeAvailable = (size) => {
    if (!size || !selectedVariant) return false;

    if (selectedVariant.type === 'variant') {
      return selectedVariant.variantData[size] && 
             (selectedVariant.variantData[`${size}_stock`] > 0);
    } else {
      // Main product
      return selectedVariant.productData[size] && 
             (selectedVariant.productData[`${size}_stock`] > 0);
    }
  };

  // Get price for selected size
  const getPriceForSize = (size) => {
    if (!size || !selectedVariant) return null;

    if (selectedVariant.type === 'variant') {
      return selectedVariant.variantData[`${size}_price`];
    } else {
      return selectedVariant.productData[`${size}_price`];
    }
  };

  // Get stock for selected size
  const getStockForSize = (size) => {
    if (!size || !selectedVariant) return 0;

    if (selectedVariant.type === 'variant') {
      return selectedVariant.variantData[`${size}_stock`] || 0;
    } else {
      return selectedVariant.productData[`${size}_stock`] || 0;
    }
  };

  // Format price safely
  const formatPrice = (price) => {
    if (price === null || price === undefined) return '0.00';
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    if (isNaN(numPrice)) return '0.00';
    return numPrice.toFixed(2);
  };

  const handleAddToCart = () => {
    if (!selectedSize) {
      alert('Please select a size');
      return;
    }

    if (!isSizeAvailable(selectedSize)) {
      alert('Selected size is not available');
      return;
    }

    console.log('Adding to cart:', {
      userId,
      productId,
      color: selectedVariant.color,
      size: selectedSize,
      quantity: 1,
      price: getPriceForSize(selectedSize)
    });

    alert('Product added to cart successfully!');
  };

  if (loading) {
    return (
      <div className="add-to-cart-container">
        <div className="loading-container">
          <p>Loading product details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="add-to-cart-container">
        <div className="error-container">
          <p>Error: {error}</p>
          <button onClick={() => navigate(-1)}>Go Back</button>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="add-to-cart-container">
        <div className="error-container">
          <p>Product not found</p>
          <button onClick={() => navigate(-1)}>Go Back</button>
        </div>
      </div>
    );
  }

  const availableImages = getAvailableImages();
  const allSizes = ['XS', 'S', 'M', 'L', 'XL', 'XLL'];
  const currentPrice = selectedSize ? getPriceForSize(selectedSize) : 
    (selectedVariant?.type === 'variant' ? 
      selectedVariant.variantData?.XS_price || 
      selectedVariant.variantData?.S_price || 
      selectedVariant.variantData?.M_price || 
      selectedVariant.variantData?.L_price || 
      selectedVariant.variantData?.XL_price || 
      selectedVariant.variantData?.XLL_price : 
      product?.XS_price || 
      product?.S_price || 
      product?.M_price || 
      product?.L_price || 
      product?.XL_price || 
      product?.XLL_price
    );

  const currentStock = selectedSize ? getStockForSize(selectedSize) : 0;

  return (
    <div className="add-to-cart-container">
      <div className="product-details-wrapper">
        
        {/* Left Side - Product Images */}
        <div className="product-images-section">
          {/* Main Large Image */}
          <div className="main-image">
            <img 
              src={selectedVariant ? `http://localhost:5070${selectedVariant.picture}` : `http://localhost:5070${product.default_picture}`} 
              alt={product.product_name}
              onError={(e) => {
                e.target.src = '/placeholder-image.jpg';
              }}
            />
          </div>
          
          {/* Thumbnail Images - Vertical on the right */}
          <div className="thumbnail-container">
            {availableImages.map((image, index) => (
              <div 
                key={index}
                className={`thumbnail ${selectedVariant?.picture === image.picture ? 'active' : ''}`}
                onClick={() => handleThumbnailClick(image)}
              >
                <img 
                  src={`http://localhost:5070${image.picture}`} 
                  alt={`${product.product_name} - ${image.color}`}
                  onError={(e) => {
                    e.target.src = '/placeholder-image.jpg';
                  }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Right Side - Product Info */}
        <div className="product-info-section">
          <h1 className="product-title">{product.product_name}</h1>
          
          {/* Price Display */}
          <div className="price-section">
            <span className="current-price">RM {formatPrice(currentPrice)}</span>
            {selectedSize && (
              <div className="stock-info">
                {currentStock} LEFT
              </div>
            )}
          </div>

          {/* Color Display */}
          <div className="selection-section">
            <h3 className="section-title">COLOR: {selectedVariant?.color?.toUpperCase() || product.default_color?.toUpperCase()}</h3>
          </div>

          {/* Size Selection - Pure size buttons only */}
          <div className="selection-section">
            <h3 className="section-title">SIZE:</h3>
            <div className="size-options">
              {allSizes.map((size) => {
                const isAvailable = isSizeAvailable(size);
                
                return (
                  <button
                    key={size}
                    className={`size-option ${selectedSize === size ? 'selected' : ''} ${
                      !isAvailable ? 'unavailable' : ''
                    }`}
                    onClick={() => isAvailable && setSelectedSize(size)}
                    disabled={!isAvailable}
                  >
                    {size}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Add to Cart Button */}
          <div className="action-section">
            <button 
              className="add-to-cart-btn"
              onClick={handleAddToCart}
              disabled={!selectedSize || !isSizeAvailable(selectedSize)}
            >
              ADD TO CART
            </button>
          </div>

          {/* Explore Shop Button */}
          <div className="explore-shop-section">
            <button className="explore-shop-btn">
              EXPLORE SHOP
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddToCart;