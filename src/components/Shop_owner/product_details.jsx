// src/components/Shop_owner/product_details.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './product_details.css';

const sizeKeys = ['XS', 'S', 'M', 'L', 'XL', 'XLL'];
const BASE_URL = 'http://localhost:5070';

const ProductDetails = () => {
  const { productId } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [variants, setVariants] = useState([]);
  const [activeItem, setActiveItem] = useState(null); // { type: 'product' | 'variant', data: {...} }
  const [selectedSize, setSelectedSize] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 🔹 Edit mode states
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedProductName, setEditedProductName] = useState('');
  const [editedColor, setEditedColor] = useState('');
  const [editedImageFile, setEditedImageFile] = useState(null);
  const [previewImageUrl, setPreviewImageUrl] = useState(null);

  // sizeEdits: { XS: { enable, price, stock }, ... }  (for EDIT mode only)
  const [sizeEdits, setSizeEdits] = useState({});
  const [editSizeKey, setEditSizeKey] = useState(null); // which size is being edited in UI

  // 🔹 New variant mode states
  const [isNewVariantMode, setIsNewVariantMode] = useState(false);
  const [newVariantColor, setNewVariantColor] = useState('');
  const [newVariantImageFile, setNewVariantImageFile] = useState(null);
  const [newVariantPreviewUrl, setNewVariantPreviewUrl] = useState(null);
  // newVariantSizes: { XS: {enable, price, stock}, ... }
  const [newVariantSizes, setNewVariantSizes] = useState({});
  const [newVariantSizeKey, setNewVariantSizeKey] = useState(null);

  const buildImageUrl = (path) => {
    if (!path) return null;
    return `${BASE_URL}${path}`;
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

  // Merge original size data + any edits (EDIT mode only)
  const getEffectiveSizeState = (item, size) => {
    if (!item) return { flag: 0, price: null, stock: null };

    const baseFlag = item[size];
    const basePrice = item[`${size}_price`];
    const baseStock = item[`${size}_stock`];

    const override = sizeEdits[size];

    let flag = baseFlag;
    let price = basePrice;
    let stock = baseStock;

    if (override) {
      if (override.enable !== undefined) flag = override.enable ? 1 : 0;
      if (override.price !== undefined) price = override.price;
      if (override.stock !== undefined) stock = override.stock;
    }

    return { flag, price, stock };
  };

  const updateSizeEdit = (size, changes) => {
    setSizeEdits((prev) => ({
      ...prev,
      [size]: {
        ...(prev[size] || {}),
        ...changes,
      },
    }));
  };

  const resetEditModeState = () => {
    setIsEditMode(false);
    setEditedProductName('');
    setEditedColor('');
    setEditedImageFile(null);
    setPreviewImageUrl(null);
    setSizeEdits({});
    setEditSizeKey(null);
  };

  const resetNewVariantState = () => {
    setIsNewVariantMode(false);
    setNewVariantColor('');
    setNewVariantImageFile(null);
    setNewVariantPreviewUrl(null);
    setNewVariantSizes({});
    setNewVariantSizeKey(null);
  };

  const fetchDetails = async (id) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${BASE_URL}/api/shop_product_details/${id}`);
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

      // When new data arrives, exit both modes and clear local edits
      resetEditModeState();
      resetNewVariantState();
    } catch (err) {
      setError(err.message || 'Failed to load product details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!productId) {
      setError('Missing product ID');
      setLoading(false);
      return;
    }
    fetchDetails(productId);
  }, [productId]);

  const handleBackClick = () => {
    navigate(-1);
  };

  const handleExploreShop = () => {
    if (product?.shop_id) {
      navigate('/shop_profile', { state: { shop_id: product.shop_id } });
    }
  };

  // Old "Add to cart" action kept as-is
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

  // 🔹 Enter / exit edit mode
  const handleToggleEditMode = () => {
    if (!activeItem || !product) return;
    if (isNewVariantMode) return; // disabled in new-variant mode

    if (!isEditMode) {
      // Enter edit mode – initialize fields based on active item
      if (activeItem.type === 'product') {
        setEditedProductName(product.product_name || '');
        setEditedColor(product.default_color || '');
      } else {
        // editing a variant: product name is from product table, color from variant
        setEditedProductName(product.product_name || '');
        setEditedColor(activeItem.data.color || '');
      }
      setEditedImageFile(null);
      setPreviewImageUrl(null);
      setSizeEdits({});
      setEditSizeKey(null);
      setIsEditMode(true);
    } else {
      // Discard edits
      const baseItem = activeItem.type === 'product' ? product : activeItem.data;
      resetEditModeState();
      // Reset selected size to first available of current active item
      setSelectedSize(getFirstAvailableSize(baseItem));
    }
  };

  const handleThumbnailClick = (itemType, id) => {
    if (!product) return;

    // Leaving new-variant mode if user chooses any real thumbnail
    if (isNewVariantMode && itemType !== 'add') {
      resetNewVariantState();
    }

    if (itemType === 'product') {
      const newItem = { type: 'product', data: product };
      setActiveItem(newItem);

      const baseSize = getFirstAvailableSize(product);
      setSelectedSize(baseSize);

      if (isEditMode) {
        // sync edit fields to product
        setEditedProductName(product.product_name || '');
        setEditedColor(product.default_color || '');
        setEditedImageFile(null);
        setPreviewImageUrl(null);
        setSizeEdits({});
        setEditSizeKey(null);
      }
    } else if (itemType === 'variant') {
      const variant = variants.find((v) => v.variance_id === id);
      if (!variant) return;

      const newItem = { type: 'variant', data: variant };
      setActiveItem(newItem);

      const baseSize = getFirstAvailableSize(variant);
      setSelectedSize(baseSize);

      if (isEditMode) {
        // sync edit fields to this variant
        setEditedProductName(product.product_name || '');
        setEditedColor(variant.color || '');
        setEditedImageFile(null);
        setPreviewImageUrl(null);
        setSizeEdits({});
        setEditSizeKey(null);
      }
    }
  };

  // 🔹 Click on the "+" thumbnail to start new variant mode
  const handleAddVariantClick = () => {
    if (!product) return;

    resetEditModeState();
    resetNewVariantState();

    // Enter new variant mode
    setIsNewVariantMode(true);
    setNewVariantColor('');
    setNewVariantImageFile(null);
    setNewVariantPreviewUrl(null);
    setNewVariantSizes({});
    setNewVariantSizeKey(null);

    // Keep main product as active item (for name display)
    const newItem = { type: 'product', data: product };
    setActiveItem(newItem);
    setSelectedSize(null);
  };

  const handleSizeClick = (size) => {
    // New variant mode behavior
    if (isNewVariantMode) {
      setNewVariantSizeKey(size);
      setNewVariantSizes((prev) => {
        const prevSize = prev[size] || {};
        return {
          ...prev,
          [size]: {
            enable:
              prevSize.enable !== undefined ? prevSize.enable : true, // default: enabled once clicked
            price:
              prevSize.price !== undefined && prevSize.price !== null
                ? prevSize.price
                : '',
            stock:
              prevSize.stock !== undefined && prevSize.stock !== null
                ? prevSize.stock
                : '',
          },
        };
      });
      return;
    }

    if (!activeItem) return;

    const item = activeItem.data;

    if (!isEditMode) {
      // Normal behavior: just select size (if available)
      const { flag, price } = getEffectiveSizeState(item, size);
      if (!flag || price == null || price === '') return;
      setSelectedSize(size);
      return;
    }

    // Edit mode: clicking a size = choose that size for editing
    setEditSizeKey(size);

    const { flag, price, stock } = getEffectiveSizeState(item, size);
    updateSizeEdit(size, {
      enable: !!flag,
      price: price ?? '',
      stock: stock ?? '',
    });
  };

  const handleImageChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    // New variant mode uses its own file state
    if (isNewVariantMode) {
      setNewVariantImageFile(file);
      const previewUrl = URL.createObjectURL(file);
      setNewVariantPreviewUrl(previewUrl);
      return;
    }

    // Edit mode / main product image change
    setEditedImageFile(file);
    const previewUrl = URL.createObjectURL(file);
    setPreviewImageUrl(previewUrl);
  };

  const handleConfirmChanges = async () => {
    if (!activeItem || !product) return;

    try {
      const target = activeItem.type === 'product' ? 'product' : 'variant';
      const basePayload = {
        target,
        product_id: product.product_id,
      };

      if (target === 'product') {
        basePayload.product_name = editedProductName;
        basePayload.default_color = editedColor;
      } else {
        basePayload.variance_id = activeItem.data.variance_id;
        basePayload.color = editedColor;
      }

      // 🔹 We need the original item to know the original flags
      const baseItem =
        activeItem.type === 'product' ? product : activeItem.data;

      // Normalize sizes from sizeEdits
      const normalizedSizes = {};
      Object.entries(sizeEdits).forEach(([size, info]) => {
        const out = {};

        const hasPrice =
          info.price !== undefined && info.price !== '' && info.price !== null;
        const hasStock =
          info.stock !== undefined && info.stock !== '' && info.stock !== null;

        if (info.enable !== undefined) {
          out.enable = !!info.enable;
        }

        if (hasPrice) {
          out.price = Number(info.price);
        }
        if (hasStock) {
          out.stock = Number(info.stock);
        }

        // 👇 Auto-enable a size that was previously disabled
        // if user has given price/stock but didn't explicitly set enable.
        const baseFlag = baseItem[size]; // 0 or 1
        if (
          baseFlag === 0 &&
          (hasPrice || hasStock) &&
          out.enable === undefined
        ) {
          out.enable = true;
        }

        // Only include sizes that actually have something to update
        if (Object.keys(out).length > 0) {
          normalizedSizes[size] = out;
        }
      });

      let response;

      if (editedImageFile) {
        // multipart/form-data
        const formData = new FormData();
        formData.append('target', basePayload.target);
        formData.append('product_id', String(basePayload.product_id));

        if (target === 'product') {
          if (editedProductName !== undefined)
            formData.append('product_name', editedProductName);
          if (editedColor !== undefined)
            formData.append('default_color', editedColor);
        } else {
          formData.append('variance_id', String(basePayload.variance_id));
          if (editedColor !== undefined) formData.append('color', editedColor);
        }

        if (Object.keys(normalizedSizes).length > 0) {
          formData.append('sizes', JSON.stringify(normalizedSizes));
        }

        formData.append('image_file', editedImageFile);

        response = await fetch(`${BASE_URL}/api/product_edit_mode`, {
          method: 'POST',
          body: formData,
        });
      } else {
        // JSON only
        const jsonPayload = { ...basePayload };
        if (Object.keys(normalizedSizes).length > 0) {
          jsonPayload.sizes = normalizedSizes;
        }

        response = await fetch(`${BASE_URL}/api/product_edit_mode`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(jsonPayload),
        });
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update product');
      }

      alert('Changes saved successfully.');
      // Reload details from backend so UI reflects new data
      await fetchDetails(productId);
    } catch (err) {
      alert(`Error saving changes: ${err.message}`);
    }
  };

  // 🔹 CREATE NEW VARIANT
  const handleCreateVariant = async () => {
    if (!product) return;

    try {
      if (!newVariantColor.trim()) {
        alert('Please enter a color for the new variant.');
        return;
      }

      if (!newVariantImageFile) {
        alert('Please choose an image for the new variant.');
        return;
      }

      // Normalize sizes payload
      const normalizedSizes = {};
      Object.entries(newVariantSizes).forEach(([size, info]) => {
        const out = {};
        const hasPrice =
          info.price !== undefined && info.price !== '' && info.price !== null;
        const hasStock =
          info.stock !== undefined && info.stock !== '' && info.stock !== null;

        if (info.enable) out.enable = true;
        if (hasPrice) out.price = Number(info.price);
        if (hasStock) out.stock = Number(info.stock);

        if (Object.keys(out).length > 0) {
          normalizedSizes[size] = out;
        }
      });

      if (Object.keys(normalizedSizes).length === 0) {
        alert('Please define at least one size (with price & stock).');
        return;
      }

      const formData = new FormData();
      formData.append('product_id', String(product.product_id));
      formData.append('color', newVariantColor.trim());
      formData.append('image_file', newVariantImageFile);
      formData.append('sizes', JSON.stringify(normalizedSizes));

      const response = await fetch(`${BASE_URL}/api/add_variant`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create variant');
      }

      alert('Variant created successfully.');
      await fetchDetails(productId);

      // After reload, try to select the newest variant (if backend returns id you could use it).
      // For now, just stay on product; user can click the new thumbnail.
    } catch (err) {
      alert(`Error creating variant: ${err.message}`);
    }
  };

  // ---------- RENDER LOGIC ----------

  if (loading) return <p className="loadingMessage">Loading product details...</p>;
  if (error) return <p className="errorMessage">Error: {error}</p>;
  if (!product || !activeItem) return <p>Product not found.</p>;

  const currentItem = activeItem.data;

  // Determine which image to show as main
  const baseMainImageUrl =
    activeItem.type === 'product'
      ? buildImageUrl(product.default_picture)
      : buildImageUrl(currentItem.picture);

  const mainImageUrl = isNewVariantMode
    ? newVariantPreviewUrl || null
    : previewImageUrl || baseMainImageUrl;

  // Color depends on mode
  const currentColor =
    activeItem.type === 'product'
      ? product.default_color || '-'
      : currentItem.color || '-';

  // Price & stock display
  let currentPrice = null;
  let currentStock = null;

  if (isNewVariantMode) {
    if (newVariantSizeKey && newVariantSizes[newVariantSizeKey]) {
      const data = newVariantSizes[newVariantSizeKey];
      currentPrice =
        data.price !== undefined && data.price !== '' ? data.price : null;
      currentStock =
        data.stock !== undefined && data.stock !== '' ? data.stock : null;
    }
  } else if (selectedSize && currentItem) {
    const { price, stock } = getEffectiveSizeState(currentItem, selectedSize);
    currentPrice = price;
    currentStock = stock;
  }

  // Build thumbnails list (product + variants + PLUS)
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

  // Special "+" thumbnail for adding variant
  thumbnails.push({
    type: 'add',
    id: 'add',
    url: null,
    label: 'Add Variant',
  });

  const currentEditSizeData =
    editSizeKey && sizeEdits[editSizeKey] ? sizeEdits[editSizeKey] : null;

  const currentNewVariantSizeData =
    newVariantSizeKey && newVariantSizes[newVariantSizeKey]
      ? newVariantSizes[newVariantSizeKey]
      : null;

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
                if (thumb.type === 'add') {
                  const isActiveAdd = isNewVariantMode;
                  return (
                    <div className="thumbnailRow" key="add-variant">
                      <button
                        type="button"
                        onClick={handleAddVariantClick}
                        style={{
                          width: '60px',
                          height: '60px',
                          borderRadius: '8px',
                          border: isActiveAdd
                            ? '2px solid blue'
                            : '1px dashed gray',
                          background: '#fff',
                          cursor: 'pointer',
                          fontSize: '32px',
                          lineHeight: '56px',
                          textAlign: 'center',
                          padding: 0,
                        }}
                      >
                        +
                      </button>
                    </div>
                  );
                }

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

            <div className="mainImageWrapper">
              <img
                src={mainImageUrl ? mainImageUrl : '/default-product.png'}
                alt={product.product_name}
                className="mainProductImage"
                onError={(e) => {
                  e.currentTarget.src = '/default-product.png';
                }}
              />
              {(isEditMode || isNewVariantMode) && (
                <label className="changeImageLabel">
                  {isNewVariantMode ? 'Choose image' : 'Change image'}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    style={{ display: 'none' }}
                  />
                </label>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT: details */}
        <div className="detailsSection">
          {/* Product name (never edited in new variant mode) */}
          {isEditMode ? (
            <input
              className="editTextInput"
              type="text"
              value={editedProductName}
              onChange={(e) => setEditedProductName(e.target.value)}
            />
          ) : (
            <h2>{product.product_name}</h2>
          )}

          {/* Price */}
          <p className="price">
            {currentPrice != null ? `RM ${currentPrice}` : 'Select a size'}
          </p>

          {/* Stock */}
          <p>
            <strong>Stock:</strong>{' '}
            {currentStock != null ? currentStock : '-'}
          </p>

          {/* Color */}
          <p style={{ marginBottom: '1.5rem' }}>
            <strong>Color:</strong>{' '}
            {isEditMode ? (
              <input
                className="editTextInput inline"
                type="text"
                value={editedColor}
                onChange={(e) => setEditedColor(e.target.value)}
              />
            ) : isNewVariantMode ? (
              <input
                className="editTextInput inline"
                type="text"
                value={newVariantColor}
                onChange={(e) => setNewVariantColor(e.target.value)}
                placeholder="New variant color"
              />
            ) : (
              currentColor
            )}
          </p>

          {/* Sizes */}
          <p>
            <strong>Size:</strong>
          </p>
          <div className="sizeSelection">
            {sizeKeys.map((size) => {
              // New variant mode: different behavior & visuals
              if (isNewVariantMode) {
                const data = newVariantSizes[size] || {};
                const isSelectedNew = newVariantSizeKey === size;
                const isAvailableNew =
                  data.enable &&
                  data.price !== undefined &&
                  data.price !== '' &&
                  data.stock !== undefined &&
                  data.stock !== '';

                let className = 'sizeButton newVariant';
                if (isSelectedNew) className += ' selected';
                if (!isAvailableNew) className += ' disabled';

                return (
                  <button
                    key={size}
                    className={className}
                    onClick={() => handleSizeClick(size)}
                  >
                    {size}
                  </button>
                );
              }

              // Normal / edit mode:
              const { flag, price } = getEffectiveSizeState(currentItem, size);

              const isAvailable = flag && price != null && price !== '';
              const isSelected = selectedSize === size;

              let className = 'sizeButton';
              if (isSelected && !isEditMode) className += ' selected';
              if (!isAvailable) className += ' disabled';
              if (isEditMode && editSizeKey === size) className += ' editing';

              return (
                <button
                  key={size}
                  className={className}
                  onClick={() => handleSizeClick(size)}
                >
                  {size}
                </button>
              );
            })}
          </div>

          {/* Inline panel for editing currently chosen size (EDIT MODE) */}
          {isEditMode && editSizeKey && (
            <div className="sizeEditPanel">
              <p>
                Editing size: <strong>{editSizeKey}</strong>
              </p>
              <label className="sizeEditRow">
                <input
                  type="checkbox"
                  checked={!!(
                    currentEditSizeData && currentEditSizeData.enable
                  )}
                  onChange={(e) =>
                    updateSizeEdit(editSizeKey, {
                      enable: e.target.checked,
                    })
                  }
                />
                <span>Available</span>
              </label>

              <label className="sizeEditRow">
                <span>Price (RM):</span>
                <input
                  type="number"
                  value={
                    currentEditSizeData &&
                    currentEditSizeData.price !== undefined
                      ? currentEditSizeData.price
                      : ''
                  }
                  onChange={(e) =>
                    updateSizeEdit(editSizeKey, {
                      price: e.target.value,
                    })
                  }
                />
              </label>

              <label className="sizeEditRow">
                <span>Stock:</span>
                <input
                  type="number"
                  value={
                    currentEditSizeData &&
                    currentEditSizeData.stock !== undefined
                      ? currentEditSizeData.stock
                      : ''
                  }
                  onChange={(e) =>
                    updateSizeEdit(editSizeKey, {
                      stock: e.target.value,
                    })
                  }
                />
              </label>
            </div>
          )}

          {/* Inline panel for defining size (NEW VARIANT MODE) */}
          {isNewVariantMode && newVariantSizeKey && (
            <div className="sizeEditPanel">
              <p>
                Defining size: <strong>{newVariantSizeKey}</strong>
              </p>
              <label className="sizeEditRow">
                <input
                  type="checkbox"
                  checked={!!(
                    currentNewVariantSizeData &&
                    currentNewVariantSizeData.enable
                  )}
                  onChange={(e) =>
                    setNewVariantSizes((prev) => ({
                      ...prev,
                      [newVariantSizeKey]: {
                        ...(prev[newVariantSizeKey] || {}),
                        enable: e.target.checked,
                      },
                    }))
                  }
                />
                <span>Available</span>
              </label>

              <label className="sizeEditRow">
                <span>Price (RM):</span>
                <input
                  type="number"
                  value={
                    currentNewVariantSizeData &&
                    currentNewVariantSizeData.price !== undefined
                      ? currentNewVariantSizeData.price
                      : ''
                  }
                  onChange={(e) =>
                    setNewVariantSizes((prev) => ({
                      ...prev,
                      [newVariantSizeKey]: {
                        ...(prev[newVariantSizeKey] || {}),
                        price: e.target.value,
                      },
                    }))
                  }
                />
              </label>

              <label className="sizeEditRow">
                <span>Stock:</span>
                <input
                  type="number"
                  value={
                    currentNewVariantSizeData &&
                    currentNewVariantSizeData.stock !== undefined
                      ? currentNewVariantSizeData.stock
                      : ''
                  }
                  onChange={(e) =>
                    setNewVariantSizes((prev) => ({
                      ...prev,
                      [newVariantSizeKey]: {
                        ...(prev[newVariantSizeKey] || {}),
                        stock: e.target.value,
                      },
                    }))
                  }
                />
              </label>
            </div>
          )}

          {/* Buttons */}
          <div className="buttonRow">
            {/* Existing Add to Cart button */}
            <button
              onClick={handleAddToCart}
              className="addToCartButton"
              disabled={isEditMode || isNewVariantMode}
            >
              ADD TO CART
            </button>

            {/* Edit mode / New variant / Confirm buttons */}
            <div className="editButtonsGroup">
              <button
                className={`editModeButton ${isEditMode ? 'cancel' : ''}`}
                onClick={handleToggleEditMode}
                disabled={isNewVariantMode}
              >
                {isEditMode ? 'DISCARD EDIT' : 'OPEN EDIT MODE'}
              </button>

              {isEditMode && (
                <button
                  className="confirmChangesButton"
                  onClick={handleConfirmChanges}
                >
                  CONFIRM CHANGES
                </button>
              )}

              {isNewVariantMode && (
                <button
                  className="confirmChangesButton"
                  onClick={handleCreateVariant}
                >
                  CREATE VARIANT
                </button>
              )}
            </div>
          </div>

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
