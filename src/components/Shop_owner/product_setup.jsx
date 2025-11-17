// src/components/Shop_owner/product_setup.jsx
import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import './product_setup.css';

const categories = [
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

const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XLL'];

// Main product state
const initialProductForm = {
  product_name: '',
  category: '',
  default_color: '',
  default_picture: null,
  default_picture_preview: null,
  activeSizes: [],
  XS_price: '',
  S_price: '',
  M_price: '',
  L_price: '',
  XL_price: '',
  XLL_price: '',
  XS_stock: '',
  S_stock: '',
  M_stock: '',
  L_stock: '',
  XL_stock: '',
  XLL_stock: '',
};

// Variant state
const initialVariantForm = {
  id: null,
  color: '',
  activeSizes: [],
  XS_stock: '',
  S_stock: '',
  M_stock: '',
  L_stock: '',
  XL_stock: '',
  XLL_stock: '',
  XS_price: '',
  S_price: '',
  M_price: '',
  L_price: '',
  XL_price: '',
  XLL_price: '',
  picture: null,
  picture_preview: null,
};

// Re-usable size inputs under each size button
const SizeInputs = ({ size, formState, handleChange, isVariant = false, variantIndex }) => {
  const handleInputChange = isVariant
    ? (e) => handleChange(e, variantIndex)
    : handleChange;

  const keyPrefix = isVariant ? `variant-${variantIndex}` : 'product';

  const handleFocus = (e) => e.target.select();

  return (
    <div className="sizeInputsWrapper">
      <input
        key={`${keyPrefix}-${size}-price`}
        type="text"
        name={`${size}_price`}
        value={formState[`${size}_price`]}
        onChange={handleInputChange}
        onFocus={handleFocus}
        placeholder="Price"
        className="sizeInput"
      />
      <input
        key={`${keyPrefix}-${size}-stock`}
        type="text"
        name={`${size}_stock`}
        value={formState[`${size}_stock`]}
        onChange={handleInputChange}
        onFocus={handleFocus}
        placeholder="Stock"
        className="sizeInput"
      />
    </div>
  );
};

const ProductSetup = () => {
  // --- SHOP ID FROM NAVIGATION ---
  const { state } = useLocation();
  const shopId = state?.shop_id;

  useEffect(() => {
    if (shopId) {
      console.log('ProductSetup received Shop ID:', shopId);
    } else {
      console.warn(
        'Shop ID not found in navigation state. Ensure navigation from ShopProfile is correct.'
      );
    }
  }, [shopId]);

  // --- STATE ---
  const [productForm, setProductForm] = useState(initialProductForm);
  const [variants, setVariants] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Which "card" is active on the right: null = main product, 0+ = variant index
  const [activeVariantIndex, setActiveVariantIndex] = useState(null);

  // Cleanup image object URLs
  useEffect(() => {
    return () => {
      if (productForm.default_picture_preview) {
        URL.revokeObjectURL(productForm.default_picture_preview);
      }
      variants.forEach((variant) => {
        if (variant.picture_preview) {
          URL.revokeObjectURL(variant.picture_preview);
        }
      });
    };
  }, [productForm.default_picture_preview, variants]);

  // --- UI HELPERS FOR STYLING (same behaviour, just used for buttons) ---
  const ACTIVE_COLOR = '#f5f5f5';
  const DEFAULT_COLOR = '#ffffff';

  const getCategoryButtonStyle = (category) => ({
    backgroundColor: category === selectedCategory ? ACTIVE_COLOR : DEFAULT_COLOR,
  });

  const getSizeButtonStyle = (isActive) => ({
    backgroundColor: isActive ? '#000' : '#fff',
    color: isActive ? '#fff' : '#000',
  });

  // --- FORM HANDLERS ---

  const handleProductFormChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'default_picture') {
      const file = files[0];

      setProductForm((prev) => {
        if (prev.default_picture_preview) {
          URL.revokeObjectURL(prev.default_picture_preview);
        }
        return {
          ...prev,
          default_picture: file || null,
          default_picture_preview: file ? URL.createObjectURL(file) : null,
        };
      });
    } else {
      setProductForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleVariantPictureChange = (e, index) => {
    const file = e.target.files[0];
    setVariants((prevVariants) => {
      const newVariants = [...prevVariants];
      const oldVariant = newVariants[index];

      if (oldVariant.picture_preview) {
        URL.revokeObjectURL(oldVariant.picture_preview);
      }

      newVariants[index] = {
        ...oldVariant,
        picture: file || null,
        picture_preview: file ? URL.createObjectURL(file) : null,
      };
      return newVariants;
    });
  };

  const handleVariantChange = (e, index) => {
    const { name, value } = e.target;
    setVariants((prevVariants) => {
      const newVariants = [...prevVariants];
      newVariants[index] = {
        ...newVariants[index],
        [name]: value,
      };
      return newVariants;
    });
  };

  const toggleProductSize = (size) => {
    setProductForm((prev) => {
      const newActiveSizes = prev.activeSizes.includes(size)
        ? prev.activeSizes.filter((s) => s !== size)
        : [...prev.activeSizes, size];
      return { ...prev, activeSizes: newActiveSizes };
    });
  };

  const toggleVariantSize = (index, size) => {
    setVariants((prevVariants) => {
      const newVariants = [...prevVariants];
      const variant = newVariants[index];

      const newActiveSizes = variant.activeSizes.includes(size)
        ? variant.activeSizes.filter((s) => s !== size)
        : [...variant.activeSizes, size];

      newVariants[index] = { ...variant, activeSizes: newActiveSizes };
      return newVariants;
    });
  };

  const handleCategorySelection = (category) => {
    setSelectedCategory(category);
    setProductForm((prev) => ({ ...prev, category }));
  };

  const addVariant = () => {
    setVariants((prev) => [...prev, { ...initialVariantForm, id: crypto.randomUUID() }]);
    setActiveVariantIndex(variants.length); // focus the new variant
  };

  const removeVariant = (index) => {
    const variantToRemove = variants[index];
    if (variantToRemove?.picture_preview) {
      URL.revokeObjectURL(variantToRemove.picture_preview);
    }
    setVariants((prev) => prev.filter((_, i) => i !== index));
    setActiveVariantIndex(null);
  };

  // --- SUBMISSION LOGIC (unchanged behaviour) ---

  const submitProduct = async () => {
    const formData = new FormData();

    formData.append('product_name', productForm.product_name);
    formData.append('category', productForm.category);
    formData.append('default_color', productForm.default_color);
    formData.append('shop_id', shopId);
    formData.append('is_active', '1');

    sizes.forEach((size) => {
      formData.append(`${size}_price`, productForm[`${size}_price`]);
      formData.append(`${size}_stock`, productForm[`${size}_stock`]);
    });

    if (productForm.default_picture) {
      formData.append('default_picture', productForm.default_picture);
    }

    try {
      const response = await fetch('http://localhost:5070/api/products', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to create product.');
      }

      return result.product_id;
    } catch (error) {
      throw new Error(`Product submission failed: ${error.message}`);
    }
  };

  const submitVariant = async (product_id, variant) => {
    const formData = new FormData();

    formData.append('product_id', product_id);
    formData.append('shop_id', shopId);
    formData.append('color', variant.color);

    sizes.forEach((size) => {
      formData.append(`${size}_price`, variant[`${size}_price`]);
      formData.append(`${size}_stock`, variant[`${size}_stock`]);
    });

    if (variant.picture) {
      formData.append('picture', variant.picture);
    }

    try {
      const response = await fetch('http://localhost:5070/api/variances', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || `Failed to create variant ${variant.color}.`);
      }

      console.log(`Variant ${variant.color} submitted successfully.`);
    } catch (error) {
      throw new Error(`Variant ${variant.color} submission failed: ${error.message}`);
    }
  };

  const handleSubmit = async () => {
    if (!shopId) {
      setStatusMessage({
        type: 'error',
        text: 'Error: Shop ID is missing. Cannot submit product.',
      });
      return;
    }

    if (!productForm.product_name || !productForm.category || !productForm.default_color) {
      setStatusMessage({
        type: 'error',
        text: 'Please fill in Product Name, Category, and Default Color.',
      });
      return;
    }

    setIsSubmitting(true);
    setStatusMessage({ type: 'info', text: 'Submitting product...' });

    try {
      const productId = await submitProduct();
      setStatusMessage({
        type: 'info',
        text: `Product created (ID: ${productId}). Submitting ${variants.length} variant(s)...`,
      });

      if (variants.length > 0) {
        for (const variant of variants) {
          await submitVariant(productId, variant);
        }
      }

      setStatusMessage({
        type: 'success',
        text: 'Product and all variants successfully saved!',
      });

      setProductForm(initialProductForm);
      setVariants([]);
      setSelectedCategory('');
      setActiveVariantIndex(null);
    } catch (error) {
      console.error(error);
      setStatusMessage({
        type: 'error',
        text: error.message || 'An unknown error occurred during submission.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- DERIVED VALUES FOR UI ---

  const activeVariant = activeVariantIndex === null ? null : variants[activeVariantIndex];

  const mainPreviewSrc =
    activeVariant?.picture_preview ||
    productForm.default_picture_preview ||
    '/default-product.png';

  return (
    <div className="productSetupPage">
      <h2 className="setupTitle">Create New Product</h2>
      {shopId && (
        <p className="shopInfo">Product being created for Shop ID: {shopId}</p>
      )}

      <div className="setupMainLayout">
        {/* LEFT: main image + thumbnails */}
        <div className="setupImageColumn">
          <div className="setupMainImageBox">
            <img
              src={mainPreviewSrc}
              alt="Product preview"
              className="setupMainImage"
              onError={(e) => {
                e.currentTarget.src = '/default-product.png';
              }}
            />
          </div>

          <div className="setupThumbnailsColumn">
            {/* Main product thumbnail */}
            <button
              type="button"
              className={`setupThumb ${activeVariantIndex === null ? 'active' : ''}`}
              onClick={() => setActiveVariantIndex(null)}
            >
              <div className="thumbImageWrapper">
                <img
                  src={
                    productForm.default_picture_preview || '/default-product.png'
                  }
                  alt="Main product"
                />
              </div>
              <span className="thumbLabel">Main</span>
            </button>

            {/* Variant thumbnails */}
            {variants.map((variant, idx) => (
              <button
                key={variant.id || idx}
                type="button"
                className={`setupThumb ${
                  activeVariantIndex === idx ? 'active' : ''
                }`}
                onClick={() => setActiveVariantIndex(idx)}
              >
                <div className="thumbImageWrapper">
                  <img
                    src={
                      variant.picture_preview ||
                      productForm.default_picture_preview ||
                      '/default-product.png'
                    }
                    alt={`Variant ${idx + 1}`}
                  />
                </div>
                <span className="thumbLabel">
                  {variant.color || `Variant ${idx + 1}`}
                </span>
              </button>
            ))}

            {/* Add variant tile */}
            <button
              type="button"
              className="setupThumb addThumb"
              onClick={addVariant}
            >
              <span className="plusSign">+</span>
              <span className="thumbLabel">Add variant</span>
            </button>
          </div>

          <div className="imageControls">
            {activeVariantIndex === null ? (
              <label className="imageButton">
                Choose main image
                <input
                  type="file"
                  name="default_picture"
                  id="default_picture"
                  onChange={handleProductFormChange}
                  hidden
                />
              </label>
            ) : (
              <>
                <label className="imageButton">
                  Choose variant image
                  <input
                    type="file"
                    onChange={(e) => handleVariantPictureChange(e, activeVariantIndex)}
                    hidden
                  />
                </label>
                <button
                  type="button"
                  className="removeVariantButton"
                  onClick={() => removeVariant(activeVariantIndex)}
                >
                  Remove this variant
                </button>
              </>
            )}
          </div>
        </div>

        {/* RIGHT: form panel */}
        <div className="setupFormColumn">
          {activeVariantIndex === null ? (
            <>
              {/* MAIN PRODUCT PANEL */}
              <div className="panel">
                <div className="fieldRow">
                  <div className="field">
                    <label htmlFor="product_name" className="fieldLabel">
                      Product name
                    </label>
                    <input
                      type="text"
                      id="product_name"
                      name="product_name"
                      value={productForm.product_name}
                      onChange={handleProductFormChange}
                      className="textInput"
                    />
                  </div>
                  <div className="field">
                    <label htmlFor="default_color" className="fieldLabel">
                      Default color
                    </label>
                    <input
                      type="text"
                      id="default_color"
                      name="default_color"
                      value={productForm.default_color}
                      onChange={handleProductFormChange}
                      className="textInput"
                    />
                  </div>
                </div>

                <div className="field">
                  <span className="fieldLabel">Category</span>
                  <div className="categoryPillRow">
                    {categories.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        className={`categoryPill ${
                          selectedCategory === cat ? 'selected' : ''
                        }`}
                        style={getCategoryButtonStyle(cat)}
                        onClick={() => handleCategorySelection(cat)}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="field">
                  <span className="fieldLabel">Default price & stock</span>
                  <div className="sizeGrid">
                    {sizes.map((size) => (
                      <div key={size} className="sizeGridItem">
                        <button
                          type="button"
                          className="sizeButton"
                          style={getSizeButtonStyle(
                            productForm.activeSizes.includes(size)
                          )}
                          onClick={() => toggleProductSize(size)}
                        >
                          {size}
                        </button>
                        {productForm.activeSizes.includes(size) && (
                          <SizeInputs
                            size={size}
                            formState={productForm}
                            handleChange={handleProductFormChange}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* VARIANT PANEL */}
              <div className="panel">
                <h3 className="panelTitle">
                  Variant {activeVariantIndex + 1}
                </h3>

                <div className="field">
                  <label className="fieldLabel">Variant color</label>
                  <input
                    type="text"
                    name="color"
                    value={activeVariant?.color || ''}
                    onChange={(e) => handleVariantChange(e, activeVariantIndex)}
                    className="textInput"
                  />
                </div>

                <div className="field">
                  <span className="fieldLabel">Price & stock</span>
                  <div className="sizeGrid">
                    {sizes.map((size) => (
                      <div key={size} className="sizeGridItem">
                        <button
                          type="button"
                          className="sizeButton"
                          style={getSizeButtonStyle(
                            activeVariant?.activeSizes.includes(size)
                          )}
                          onClick={() => toggleVariantSize(activeVariantIndex, size)}
                        >
                          {size}
                        </button>
                        {activeVariant?.activeSizes.includes(size) && (
                          <SizeInputs
                            size={size}
                            formState={activeVariant}
                            handleChange={handleVariantChange}
                            isVariant
                            variantIndex={activeVariantIndex}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* STATUS + SUBMIT BUTTON */}
          {statusMessage.text && (
            <div
              className={`statusBanner ${
                statusMessage.type === 'error'
                  ? 'error'
                  : statusMessage.type === 'success'
                  ? 'success'
                  : 'info'
              }`}
            >
              {statusMessage.text}
            </div>
          )}

          <button
            type="button"
            className="submitBtn"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Submit product'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductSetup;
