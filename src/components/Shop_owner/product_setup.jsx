import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
// import './product_setup.css'; // Make sure to include the appropriate styles

const categories = [
  "Women Clothing", "Beachwear", "Curve", "Kids", "Men Clothing", "Shoes",
  "Underwear & Sleepwear", "Jewelry & Accessories", "Baby & Maternity",
  "Beauty & Health", "Bags & Luggage", "Home & Kitchen", "Sports & Outdoors",
  "Electronics", "Home Textiles", "Tools & Home Improvement", "Appliances",
  "Office & School Supplies", "Pet Supplies", "Toys & Games", "Automotive"
];

const sizes = ["XS", "S", "M", "L", "XL", "XLL"];

// Added activeSizes to the initial product form
const initialProductForm = {
  product_name: '',
  category: '',
  default_color: '',
  default_picture: null,
  default_picture_preview: null,
  activeSizes: [], // Each item will have its own active sizes
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
  XLL_stock: ''
};

// Added activeSizes to the initial variant form
const initialVariantForm = {
  id: null, // Will be set when added
  color: '',
  activeSizes: [], // Each variant will have its own active sizes
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
  picture_preview: null
};

const ProductSetup = () => {
  // --- SHOP ID RETRIEVAL ---
  const { state } = useLocation();
  const shopId = state?.shop_id; // Retrieve shop_id from the navigation state

  // Log the received ID to confirm it's working
  useEffect(() => {
    if (shopId) {
      console.log("ProductSetup received Shop ID:", shopId);
    } else {
      console.warn("Shop ID not found in navigation state. Ensure navigation from ShopProfile is correct.");
    }
  }, [shopId]);
  // -------------------------

  const [productForm, setProductForm] = useState(initialProductForm);
  const [variants, setVariants] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  
  // NEW STATE for submission feedback
  const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);


  // Cleanup object URLs on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      if (productForm.default_picture_preview) {
        URL.revokeObjectURL(productForm.default_picture_preview);
      }
      variants.forEach(variant => {
        if (variant.picture_preview) {
          URL.revokeObjectURL(variant.picture_preview);
        }
      });
    };
  }, [productForm.default_picture_preview, variants]);

  const handleProductFormChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'default_picture') {
      const file = files[0];

      setProductForm((prev) => {
        // Revoke old URL if it exists
        if (prev.default_picture_preview) {
          URL.revokeObjectURL(prev.default_picture_preview);
        }
        return {
          ...prev,
          default_picture: file || null,
          default_picture_preview: file ? URL.createObjectURL(file) : null,
        }
      });
    } else {
      setProductForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  // Handles picture change for a *specific* variant by its index
  const handleVariantPictureChange = (e, index) => {
    const file = e.target.files[0];
    setVariants((prevVariants) => {
      const newVariants = [...prevVariants];
      const oldVariant = newVariants[index];

      // Revoke old URL to prevent memory leaks
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

  // Handles text/number changes for a *specific* variant
  const handleVariantChange = (e, index) => {
    const { name, value } = e.target;
    setVariants((prevVariants) => {
      const newVariants = [...prevVariants];
      newVariants[index] = {
        ...newVariants[index],
        [name]: value
      };
      return newVariants;
    });
  };

  // Toggles sizes *only* for the main product
  const toggleProductSize = (size) => {
    setProductForm((prev) => {
      const newActiveSizes = prev.activeSizes.includes(size)
        ? prev.activeSizes.filter((s) => s !== size)
        : [...prev.activeSizes, size];
      return { ...prev, activeSizes: newActiveSizes };
    });
  };

  // Toggles sizes *only* for a specific variant by its index
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
    // Adds a new, blank variant with a unique ID
    setVariants((prev) => [
      ...prev,
      { ...initialVariantForm, id: crypto.randomUUID() }
    ]);
  };

  const removeVariant = (index) => {
    // Before removing, revoke object URL to prevent memory leak
    const variantToRemove = variants[index];
    if (variantToRemove.picture_preview) {
      URL.revokeObjectURL(variantToRemove.picture_preview);
    }
    setVariants((prev) => prev.filter((_, i) => i !== index));
  };

  // --- SUBMISSION LOGIC ---

  const submitProduct = async () => {
    // 1. Convert data to FormData for multipart submission
    const formData = new FormData();
    
    // Append standard fields
    formData.append('product_name', productForm.product_name);
    formData.append('category', productForm.category);
    formData.append('default_color', productForm.default_color);
    formData.append('shop_id', shopId);
    formData.append('is_active', '1'); 

    // Append price/stock fields
    sizes.forEach(size => {
        // Appending all price/stock fields, even if empty/0
        formData.append(`${size}_price`, productForm[`${size}_price`]);
        formData.append(`${size}_stock`, productForm[`${size}_stock`]);
    });

    // 2. Append the default picture file
    if (productForm.default_picture) {
        formData.append('default_picture', productForm.default_picture);
    }
    
    // Send as FormData (multipart)
    try {
        const response = await fetch('http://localhost:5070/api/products', {
            method: 'POST',
            // IMPORTANT: DO NOT set Content-Type header when using FormData.
            body: formData, 
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || "Failed to create product.");
        }
        
        return result.product_id; // Return the ID needed for variants

    } catch (error) {
        throw new Error(`Product submission failed: ${error.message}`);
    }
};

  const submitVariant = async (product_id, variant) => {
    // 1. Convert data to FormData for multipart submission
    const formData = new FormData();
    
    // Append required fields (including the newly created product_id)
    formData.append('product_id', product_id);
    formData.append('shop_id', shopId);
    formData.append('color', variant.color);
    
    // Append price/stock fields
    sizes.forEach(size => {
        // Appending all price/stock fields, even if empty/0
        formData.append(`${size}_price`, variant[`${size}_price`]);
        formData.append(`${size}_stock`, variant[`${size}_stock`]);
    });
    
    // 2. Append the variant picture file
    if (variant.picture) {
        formData.append('picture', variant.picture); 
    }

    // Send as FormData (multipart)
    try {
        const response = await fetch('http://localhost:5070/api/variances', {
            method: 'POST',
            // IMPORTANT: DO NOT set Content-Type header when using FormData.
            body: formData, // Send FormData
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
        setStatusMessage({ type: 'error', text: 'Error: Shop ID is missing. Cannot submit product.' });
        return;
    }

    // Basic validation
    if (!productForm.product_name || !productForm.category || !productForm.default_color) {
        setStatusMessage({ type: 'error', text: 'Please fill in Product Name, Category, and Default Color.' });
        return;
    }

    setIsSubmitting(true);
    setStatusMessage({ type: 'info', text: 'Submitting product...' });
    let productId = null;
    
    try {
        // STEP 1: Submit main product
        productId = await submitProduct();
        setStatusMessage({ type: 'info', text: `Product created (ID: ${productId}). Submitting ${variants.length} variant(s)...` });

        // STEP 2: Submit all variants sequentially
        if (variants.length > 0) {
            for (const variant of variants) {
                // You might want to wrap this in a try/catch to log the failure but continue, 
                // but sequential submission with an early exit on error is often simpler.
                await submitVariant(productId, variant);
            }
        }

        // STEP 3: Final success and reset
        setStatusMessage({ type: 'success', text: 'Product and all variants successfully saved!' });
        
        // Reset forms:
        setProductForm(initialProductForm);
        setVariants([]);
        setSelectedCategory('');
        
    } catch (error) {
        console.error(error);
        setStatusMessage({ type: 'error', text: error.message || 'An unknown error occurred during submission.' });
        
    } finally {
        setIsSubmitting(false);
    }
  };
  
  // --- STYLE OBJECTS FOR REUSE AND HOVER EFFECTS ---

  // Category Button Styles (Minimal Gray, Smaller Font, Spacing)
  const ACTIVE_COLOR = '#e0e0e0'; // Light grey for hover/selected
  const DEFAULT_COLOR = '#f9f9f9'; // Off-white default

  const getCategoryButtonStyle = (category) => ({
    padding: '7px 13px',
    backgroundColor: category === selectedCategory ? ACTIVE_COLOR : DEFAULT_COLOR, 
    color: '#333333', 
    border: `1px solid #000000`,
    borderRadius: '35px', 
    fontSize: '9px', 
    fontWeight: '300',
    cursor: 'pointer',
    
  });

  const getCategoryHoverStyle = () => ({
    backgroundColor: ACTIVE_COLOR,
    color: '#333333',
    border: '1px solid #000000', // Changed to black as requested earlier
  });


  // Size Button Styles (Minimal, Rounded, BLACK Border/Text, slightly more padding)
  const getSizeButtonStyle = (isActive) => ({
    padding: '6px 12px',
    // Background is light gray (#f0f0f0) when active, transparent otherwise.
    backgroundColor: isActive ? '#f0f0f0' : 'transparent', 
    
    // Text color is always black, regardless of active state.
    color: '#000000', 
    
    // Border is consistently 2px solid black.
    border: `2px solid #000000`, 
    borderRadius: '8px', 
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    width: '100%', 
    transition: 'all 0.2s ease-in-out',
  });

  // Action Button Styles (Modern, Aesthetic)
  const submitButtonStyle = {
    padding: '12px 20px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '1rem',
    fontWeight: 'bold',
    width: '100%',
    marginTop: '2rem',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease',
  };

  const addVariantButtonStyle = {
    padding: '10px 15px',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    width: '100%',
    marginTop: '1rem',
    transition: 'background-color 0.2s ease',
  };

  const removeVariantButtonStyle = {
    padding: '8px 15px',
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease',
  };

  // --- RENDERING LOGIC ---

  // Component for rendering Price/Stock inputs vertically under the size button
 
const SizeInputs = ({ size, formState, handleChange, isVariant = false, variantIndex }) => {
  const handleInputChange = isVariant 
    ? (e) => handleChange(e, variantIndex) 
    : handleChange;

  // Define the keyPrefix variable
  const keyPrefix = isVariant ? `variant-${variantIndex}` : 'product';

  const handleFocus = (e) => e.target.select(); // Select all text when focused
  
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      gap: '0.5rem', 
      alignItems: 'center', // Center inputs under the button
      marginTop: '0.5rem' // Space below button
    }}>
      {/* Price Input (Middle) */}
      <input
        key={`${keyPrefix}-${size}-price`}  // Using the keyPrefix here
        type="text"
        name={`${size}_price`}
        value={formState[`${size}_price`]}
        onChange={handleInputChange}
        onFocus={handleFocus} // Select all text when the input is focused
        placeholder={`Price`}
        style={{ 
          width: 'calc(100% - 16px)', // Match button width roughly
          padding: '0.75rem 0.5rem', 
          border: '1px solid #ccc', 
          borderRadius: '4px', 
          fontSize: '0.9rem',
          textAlign: 'center'
        }}
      />
      {/* Stock Input (Lowest) */}
      <input
        key={`${keyPrefix}-${size}-stock`}  // Using the keyPrefix here
        type="text"
        name={`${size}_stock`}
        value={formState[`${size}_stock`]}
        onChange={handleInputChange}
        onFocus={handleFocus} // Select all text when the input is focused
        placeholder={`Stock`}
        style={{ 
          width: 'calc(100% - 16px)', 
          padding: '0.75rem 0.5rem', 
          border: '1px solid #ccc', 
          borderRadius: '4px', 
          fontSize: '0.9rem',
          textAlign: 'center'
        }}
      />
    </div>
  );
};



  // ----------------------------------------------------------------------


  return (
    <div className="productSetupContainer" style={{ maxWidth: '900px', margin: '2rem auto', fontFamily: 'Arial, sans-serif', padding: '2rem', backgroundColor: '#ffffff', borderRadius: '12px', boxShadow: '0 8px 25px rgba(0,0,0,0.1)' }}>
      <h2 style={{ textAlign: 'center', color: '#333' }}>Create New Product</h2>

      {/* Confirmation of received shopId */}
      {shopId && <p style={{ textAlign: 'center', color: '#007bff', fontWeight: 'bold', marginBottom: '2rem' }}>Product being created for Shop ID: {shopId}</p>}

      {/* Product Form */}
      <form onSubmit={(e) => e.preventDefault()} style={{ borderBottom: '1px solid #eee', paddingBottom: '2rem', marginBottom: '2rem' }}>

        {/* Product Name & Default Color */}
        <div style={{ display: 'flex', gap: '20px', marginBottom: '2rem' }}>
          
          {/* Product Name */}
          <div className="formGroup" style={{ flex: 1 }}>
            <label htmlFor="product_name" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Product Name</label>
            <input
              type="text"
              id="product_name"
              name="product_name"
              value={productForm.product_name}
              onChange={handleProductFormChange}
              required
              style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '6px', fontSize: '1rem' }}
            />
          </div>

          {/* Default Color */}
          <div className="formGroup" style={{ flex: 1 }}>
            <label htmlFor="default_color" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Default Color</label>
            <input
              type="text"
              id="default_color"
              name="default_color"
              value={productForm.default_color}
              onChange={handleProductFormChange}
              style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '6px', fontSize: '1rem' }}
            />
          </div>
        </div>

        {/* Category Buttons - REFINED SPACING IMPLEMENTATION */}
        <label style={{ display: 'block', marginBottom: '1rem', fontWeight: 'bold' }}>Product Category</label> {/* Increased bottom margin for space above buttons */}
        <div className="categoryButtons" style={{ marginBottom: '2rem', display: 'flex', flexWrap: 'wrap', gap: '1rem' }}> {/* Increased gap for space between rows */}
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              className={category === selectedCategory ? 'selected' : ''}
              onClick={() => handleCategorySelection(category)}
              style={getCategoryButtonStyle(category)}
              // Hover effect applies the same minimal gray style as the selected state
              onMouseOver={(e) => {
                const hoverStyle = getCategoryHoverStyle();
                e.currentTarget.style.backgroundColor = hoverStyle.backgroundColor;
                e.currentTarget.style.color = hoverStyle.color;
                e.currentTarget.style.border = hoverStyle.border;
              }}
              onMouseOut={(e) => {
                const style = getCategoryButtonStyle(category);
                e.currentTarget.style.backgroundColor = style.backgroundColor;
                e.currentTarget.style.color = style.color;
                e.currentTarget.style.border = style.border;
              }}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Default Price & Stock - NEW GRID LAYOUT & VERTICAL INPUTS */}
        <div className="sizeStockInputs" style={{ padding: '1.5rem', border: '1px solid #ddd', borderRadius: '8px', backgroundColor: '#fcfcfc' }}>
          <h4 style={{ marginTop: 0 }}>Default Price & Stock</h4>
          <br></br>
          
          {/* Main Grid Container for Size Buttons and Inputs */}
          <div 
            style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(6, 1fr)', // 6 equal columns
              gap: '15px 15px', // Vertical and horizontal gap between items
              marginBottom: '1rem' 
            }}
          >
            {sizes.map((size) => (
              // Each size column item
              <div 
                key={size} 
                className="sizeStockColumn" 
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
              >
                {/* Size Button */}
                <button
                  type="button"
                  onClick={() => toggleProductSize(size)}
                  style={getSizeButtonStyle(productForm.activeSizes.includes(size))}
                  // Removed redundant onMouseOver/Out for cleaner implementation
                >
                  {size}
                </button>
                
                {/* Inputs (Appears vertically below the button if active) */}
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

        {/* Product Image */}
        <div className="formGroup" style={{ marginTop: '2rem' }}>
          <label htmlFor="default_picture" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Default Picture</label>
          <input
            type="file"
            id="default_picture"
            name="default_picture"
            onChange={handleProductFormChange}
            style={{ display: 'block', marginBottom: '0.5rem' }}
          />
          {productForm.default_picture_preview && (
            <img
              src={productForm.default_picture_preview}
              alt="Preview"
              className="imagePreview"
              style={{
                width: '120px',
                height: '120px',
                objectFit: 'cover',
                marginTop: '1rem',
                borderRadius: '8px',
                border: '1px solid #ddd'
              }}
            />
          )}
        </div>
      </form>

      {/* Variants Section */}
      <div className="variantSection">
        <h3 style={{ textAlign: 'center', color: '#555', borderBottom: '1px solid #eee', paddingBottom: '1rem' }}>Product Variants</h3>
        {variants.map((variant, idx) => (
          <div key={variant.id || idx} className="variantItem" style={{ border: '1px solid #ddd', padding: '1.5rem', borderRadius: '10px', marginBottom: '1.5rem', backgroundColor: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h4 style={{ margin: 0, color: '#007bff' }}>Variant {idx + 1}</h4>
              {/* REMOVE VARIANT BUTTON */}
              <button
                type="button"
                onClick={() => removeVariant(idx)}
                style={removeVariantButtonStyle}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#c82333'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = removeVariantButtonStyle.backgroundColor}
              >
                Remove Variant
              </button>
            </div>

            <div className="formGroup" style={{ marginBottom: '1.5rem' }}>
              <label htmlFor={`color_${idx}`} style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Color</label>
              <input
                type="text"
                id={`color_${idx}`}
                name="color"
                value={variant.color}
                onChange={(e) => handleVariantChange(e, idx)} // Use variant-specific change handler
                style={{ width: 'calc(50% - 15px)', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '6px', fontSize: '1rem' }}
              />
            </div>

            {/* Size Buttons for *this* variant - NEW GRID LAYOUT & VERTICAL INPUTS */}
            <div className="sizeStockInputs" style={{ padding: '1rem', border: '1px solid #eee', borderRadius: '8px', backgroundColor: '#fcfcfc' }}>
              <h5 style={{ marginTop: 0 }}>Variant Price & Stock</h5>
              
              {/* Main Grid Container for Variant Size Buttons and Inputs */}
              <div 
                style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(6, 1fr)', // 6 equal columns
                  gap: '15px 15px', // Vertical and horizontal gap between items
                  marginBottom: '1rem' 
                }}
              >
                {sizes.map((size) => (
                  // Each size column item
                  <div 
                    key={size} 
                    className="sizeStockColumn" 
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
                  >
                    {/* Size Button */}
                    <button
                      type="button"
                      className={`sizeButton ${variant.activeSizes.includes(size) ? 'active' : ''}`}
                      onClick={() => toggleVariantSize(idx, size)} // Use variant-specific toggle
                      style={getSizeButtonStyle(variant.activeSizes.includes(size))}
                      // Removed redundant onMouseOver/Out for cleaner implementation
                    >
                      {size}
                    </button>
                    
                    {/* Inputs (Appears vertically below the button if active) */}
                    {variant.activeSizes.includes(size) && (
                      <SizeInputs 
                        size={size} 
                        formState={variant} 
                        handleChange={handleVariantChange} 
                        isVariant={true} 
                        variantIndex={idx}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Picture Upload for *this* variant */}
            <div className="formGroup" style={{ marginTop: '1.5rem' }}>
              <label htmlFor={`picture_${idx}`} style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Upload Picture</label>
              <input
                type="file"
                id={`picture_${idx}`}
                name="picture"
                onChange={(e) => handleVariantPictureChange(e, idx)} // Use variant-specific picture handler
                style={{ display: 'block', marginBottom: '0.5rem' }}
              />
              {variant.picture_preview && (
                <img
                  src={variant.picture_preview}
                  alt="Preview"
                  className="imagePreview"
                  style={{
                    width: '120px',
                    height: '120px',
                    objectFit: 'cover',
                    marginTop: '1rem',
                    borderRadius: '8px',
                    border: '1px solid #ddd'
                  }}
                />
              )}
            </div>

          </div>
        ))}

        {/* ADD VARIANT BUTTON */}
        <button
          type="button"
          onClick={addVariant}
          style={addVariantButtonStyle}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#218838'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = addVariantButtonStyle.backgroundColor}
        >
          + Add Variant
        </button>
      </div>

      {/* --- SUBMISSION FEEDBACK --- */}
      {statusMessage.text && (
        <div style={{
          marginTop: '1.5rem',
          padding: '1rem',
          borderRadius: '8px',
          textAlign: 'center',
          fontWeight: 'bold',
          backgroundColor: statusMessage.type === 'error' ? '#f8d7da' : 
                            statusMessage.type === 'success' ? '#d4edda' : '#cce5ff',
          color: statusMessage.type === 'error' ? '#721c24' : 
                 statusMessage.type === 'success' ? '#155724' : '#004085',
        }}>
          {statusMessage.text}
        </div>
      )}

      {/* SUBMIT BUTTON */}
      <button
        type="button"
        onClick={handleSubmit}
        className="submitBtn"
        disabled={isSubmitting}
        style={submitButtonStyle}
        onMouseOver={(e) => e.currentTarget.style.backgroundColor = isSubmitting ? submitButtonStyle.backgroundColor : '#0056b3'}
        onMouseOut={(e) => e.currentTarget.style.backgroundColor = submitButtonStyle.backgroundColor}
      >
        {isSubmitting ? 'Submitting...' : 'Submit Product'}
      </button>
    </div>
  );
};

export default ProductSetup;