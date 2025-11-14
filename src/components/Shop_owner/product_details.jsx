import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './product_details.css';

const sizeKeys = ['XS', 'S', 'M', 'L', 'XL', 'XLL'];

const ProductDetails = () => {
  const { productId } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [variants, setVariants] = useState([]);
  const [activeItem, setActiveItem] = useState(null); // { type: 'product' | 'variant', data: {...} }
  const [selectedSize, setSelectedSize] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const buildImageUrl = (path) => {
    if (!path) return null;
    return `http://localhost:5070${path}`;
  };

  const getFirstAvailableSize = (item) => {
    if (!item) return null;
    for (const size of sizeKeys) {
      const flag = item[size];
      const price = item[`${size}_price`];
      if (flag && price != null) {
        return size;
      }
    }
    return null;
  };

  useEffect(() => {
    if (!productId) {
      setError('Missing product ID');
      setLoading(false);
      return;
    }

    const fetchDetails = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          `http://localhost:5070/api/shop_product_details/${productId}`
        );
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Error fetching product details');
        }

        const productData = data.product;
        const variantsData = data.variants || [];

        setProduct(productData);
        setVariants(variantsData);

        // Default active item: main product
        const initialItem = { type: 'product', data: productData };
        setActiveItem(initialItem);

        // Default size: first available size of main product
        setSelectedSize(getFirstAvailableSize(productData));
      } catch (err) {
        setError(err.message || 'Failed to load product details');
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [productId]);

  const handleBackClick = () => {
    navigate(-1);
  };

  const handleExploreShop = () => {
    if (product?.shop_id) {
      navigate('/shop_profile', { state: { shop_id: product.shop_id } });
    }
  };

  const handleAddToCart = () => {
    if (!activeItem || !selectedSize) {
      alert('Please select a size first.');
      return;
    }
    alert(
      `Add to cart:\n` +
        `Item: ${
          activeItem.type === 'product'
            ? product.product_name
            : `${product.product_name} (${activeItem.data.color})`
        }\n` +
        `Size: ${selectedSize}`
    );
  };

  const handleThumbnailClick = (itemType, id) => {
    if (itemType === 'product' && product) {
      const newItem = { type: 'product', data: product };
      setActiveItem(newItem);
      setSelectedSize(getFirstAvailableSize(product));
    } else if (itemType === 'variant') {
      const variant = variants.find((v) => v.variance_id === id);
      if (variant) {
        const newItem = { type: 'variant', data: variant };
        setActiveItem(newItem);
        setSelectedSize(getFirstAvailableSize(variant));
      }
    }
  };

  const handleSizeClick = (size) => {
    if (!activeItem) return;

    const item = activeItem.data;
    const flag = item[size];
    const price = item[`${size}_price`];

    // Only allow selecting if size is active & has price
    if (!flag || price == null) return;

    setSelectedSize(size);
  };

  if (loading) return <p className="loadingMessage">Loading product details...</p>;
  if (error) return <p className="errorMessage">Error: {error}</p>;
  if (!product || !activeItem) return <p>Product not found.</p>;

  const currentItem = activeItem.data;

  const mainImageUrl =
    activeItem.type === 'product'
      ? buildImageUrl(product.default_picture)
      : buildImageUrl(currentItem.picture);

  const currentColor =
    activeItem.type === 'product'
      ? product.default_color || '-'
      : currentItem.color || '-';

  let currentPrice = null;
  let currentStock = null;
  if (selectedSize && currentItem) {
    currentPrice = currentItem[`${selectedSize}_price`];
    currentStock = currentItem[`${selectedSize}_stock`];
  }

  // Build thumbnails: main product + each variant (if has picture)
  const thumbnails = [];
  const productThumbUrl = buildImageUrl(product.default_picture);
  if (productThumbUrl) {
    thumbnails.push({
      type: 'product',
      id: 'product',
      url: productThumbUrl,
      label: product.default_color || 'Default',
    });
  }

  variants.forEach((variant) => {
    const vUrl = buildImageUrl(variant.picture);
    if (vUrl) {
      thumbnails.push({
        type: 'variant',
        id: variant.variance_id,
        url: vUrl,
        label: variant.color || 'Variant',
      });
    }
  });

  return (
    <div className="addToCartContainer">
      {/* Back button */}
      <button className="backButton" onClick={handleBackClick}>
        ← BACK
      </button>

      {/* Top section: images + details */}
      <div className="productTopSection">
        {/* LEFT: main image + thumbnails */}
        <div className="imageSection">
          <div className="mainImageAndThumbnails">
            <div className="thumbnailColumn">
              {thumbnails.map((thumb) => {
                const isActive =
                  (thumb.type === 'product' && activeItem.type === 'product') ||
                  (thumb.type === 'variant' &&
                    activeItem.type === 'variant' &&
                    activeItem.data.variance_id === thumb.id);

                return (
                  <div
                    className="thumbnailRow"
                    key={`${thumb.type}-${thumb.id}`}
                  >
                    <img
                      src={thumb.url}
                      alt={thumb.label}
                      onClick={() =>
                        handleThumbnailClick(thumb.type, thumb.id)
                      }
                      className={isActive ? 'selected' : ''}
                    />
                  </div>
                );
              })}
            </div>

            <img
              src={
                mainImageUrl
                  ? mainImageUrl
                  : '/default-product.png'
              }
              alt={product.product_name}
              className="mainProductImage"
              onError={(e) => {
                e.currentTarget.src = '/default-product.png';
              }}
            />
          </div>
        </div>

        {/* RIGHT: details */}
        <div className="detailsSection">
          <h2>{product.product_name}</h2>

          <p className="price">
            {currentPrice != null ? `RM ${currentPrice}` : 'Select a size'}
          </p>

          <p>
            <strong>Stock:</strong>{' '}
            {currentStock != null ? currentStock : '-'}
          </p>

          <p style={{ marginBottom: '1.5rem' }}>
            <strong>Color:</strong> {currentColor}
          </p>

          <p>
            <strong>Size:</strong>
          </p>
          <div className="sizeSelection">
            {sizeKeys.map((size) => {
              const flag = currentItem[size];
              const price = currentItem[`${size}_price`];

              const isAvailable = flag && price != null;
              const isSelected = selectedSize === size;

              let className = 'sizeButton';
              if (isSelected) className += ' selected';
              if (!isAvailable) className += ' disabled';

              return (
                <button
                  key={size}
                  className={className}
                  onClick={() => handleSizeClick(size)}
                  disabled={!isAvailable}
                >
                  {size}
                </button>
              );
            })}
          </div>

          <button
            onClick={handleAddToCart}
            className="addToCartButton"
          >
            ADD TO CART
          </button>

          {product.shop_id && (
            <button
              className="exploreShopButton"
              onClick={handleExploreShop}
            >
              EXPLORE SHOP
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;
