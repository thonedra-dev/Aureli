import React, { useState, useEffect, useRef } from 'react';
import { allCountries } from 'country-region-data/dist/data';
import { useNavigate } from 'react-router-dom';
import './shop_register.css';

const fieldMaxLengths = {
  shop_name: 50,
  category: 30,
  country: 50,
  state: 50,
  shop_email: 50,
  description: 300,
  owner_name: 40,
  password: 50,
  contact_number: 15,
};

const labels = {
  shop_name: 'Shop Name',
  category: 'Category',
  country: 'Country',
  state: 'State',
  shop_email: 'Shop Email',
  description: 'Description',
  owner_name: 'Owner Name',
  password: 'Password',
  contact_number: 'Contact Number',
  profile_pic: 'Profile Picture',
};

const categoryOptions = [
  'Fashion',
  'Electronics',
  'Beauty',
  'Accessories',
  'Home & Living',
  'Toys',
  'Sports',
  'Other',
];

const steps = [
  ['shop_name', 'category', 'country', 'state'],
  ['shop_email', 'description'],
  ['owner_name', 'password', 'contact_number'],
  ['profile_pic'], // New step for image upload
];

const FormField = ({
  id,
  type,
  label,
  value,
  onChange,
  error,
  maxLength,
  textarea = false,
  autoFocus = false,
}) => (
  <div className="formField">
    <label htmlFor={id}>{label}:</label>
    {textarea ? (
      <textarea
        id={id}
        name={id}
        value={value}
        onChange={onChange}
        rows={4}
        maxLength={maxLength}
        aria-invalid={!!error}
        aria-describedby={`${id}-error`}
        autoFocus={autoFocus}
      />
    ) : (
      <input
        id={id}
        type={type}
        name={id}
        value={value}
        onChange={onChange}
        maxLength={maxLength}
        aria-invalid={!!error}
        aria-describedby={`${id}-error`}
        autoFocus={autoFocus}
        autoComplete={id === 'password' ? 'new-password' : 'off'}
      />
    )}
    {error && (
      <p id={`${id}-error`} className="errorMessage" role="alert">
        {error}
      </p>
    )}
  </div>
);

const SelectField = ({
  id,
  label,
  value,
  onChange,
  error,
  options,
  autoFocus = false,
}) => (
  <div className="formField">
    <label htmlFor={id}>{label}:</label>
    <select
      id={id}
      name={id}
      value={value}
      onChange={onChange}
      aria-invalid={!!error}
      aria-describedby={`${id}-error`}
      autoFocus={autoFocus}
    >
      <option value="">-- Select {label} --</option>
      {options.map((opt) => (
        <option key={opt} value={opt}>
          {opt}
        </option>
      ))}
    </select>
    {error && (
      <p id={`${id}-error`} className="errorMessage" role="alert">
        {error}
      </p>
    )}
  </div>
);

const ShopRegistrationForm = () => {
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState({
    shop_name: '',
    category: '',
    country: '',
    state: '',
    shop_email: '',
    description: '',
    owner_name: '',
    password: '',
    contact_number: '',
    profile_pic: null, // for storing the file object
  });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  const firstFieldRef = useRef(null);
  const navigate = useNavigate();

  const countriesWithStates = allCountries.map(([countryName, , regions]) => ({
    country: countryName,
    states: Array.isArray(regions) ? regions : (regions ? regions.split('|') : []),
  }));

  useEffect(() => {
    if (firstFieldRef.current) {
      firstFieldRef.current.focus();
    }
  }, [step]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'profile_pic') {
      setFormData((prev) => ({ ...prev, profile_pic: files[0] || null }));
      setErrors((prev) => ({ ...prev, profile_pic: null }));
      setStatus(null);
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
        ...(name === 'country' ? { state: '' } : {}),
      }));
      setErrors((prev) => ({ ...prev, [name]: null }));
      setStatus(null);
    }
  };

  const validateStep = () => {
    const fields = steps[step];
    const newErrors = {};

    fields.forEach((key) => {
      if (key === 'profile_pic') {
        // optional, no validation needed here
        return;
      }
      const val = formData[key].trim();
      if (!val) {
        newErrors[key] = `Please fill in the ${labels[key]}`;
      } else if (val.length > fieldMaxLengths[key]) {
        newErrors[key] = `${labels[key]} must be at most ${fieldMaxLengths[key]} characters`;
      } else {
        if (key === 'shop_email') {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(val)) newErrors[key] = 'Please enter a valid email address';
        }
        if (key === 'contact_number') {
          const phoneRegex = /^[0-9+\-()\s]+$/;
          if (!phoneRegex.test(val)) newErrors[key] = 'Please enter a valid contact number';
        }
        if (key === 'password') {
          if (val.length < 6) newErrors[key] = 'Password must be at least 6 characters';
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateForm = () => {
    const newErrors = {};
    Object.keys(formData).forEach((key) => {
      if (key === 'profile_pic') return; // skip profile_pic validation here
      const val = formData[key].trim();
      if (!val) {
        newErrors[key] = `Please fill in the ${labels[key]}`;
      } else if (val.length > fieldMaxLengths[key]) {
        newErrors[key] = `${labels[key]} must be at most ${fieldMaxLengths[key]} characters`;
      } else {
        if (key === 'shop_email') {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(val)) newErrors[key] = 'Please enter a valid email address';
        }
        if (key === 'contact_number') {
          const phoneRegex = /^[0-9+\-()\s]+$/;
          if (!phoneRegex.test(val)) newErrors[key] = 'Please enter a valid contact number';
        }
        if (key === 'password') {
          if (val.length < 6) newErrors[key] = 'Password must be at least 6 characters';
        }
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      setStatus({ type: 'error', message: 'Please fix the errors above before submitting.' });
      return;
    }

    setLoading(true);
    setStatus(null);

    // Build FormData for multipart upload (including file)
    const formPayload = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        formPayload.append(key, value);
      }
    });

    try {
      const response = await fetch('http://localhost:5070/api/register_shop', {
        method: 'POST',
        body: formPayload, // no Content-Type header! browser sets multipart/form-data
      });
      const data = await response.json();
      if (response.ok) {
        setStatus({ type: 'success', message: data.message || 'Registration successful!' });
        setStep(0);
        setErrors({});
        setFormData({
          shop_name: '',
          category: '',
          country: '',
          state: '',
          shop_email: '',
          description: '',
          owner_name: '',
          password: '',
          contact_number: '',
          profile_pic: null,
        });
        navigate('/shop_login');
      } else {
        setStatus({ type: 'error', message: data.message || 'Registration failed' });
      }
    } catch (error) {
      setStatus({ type: 'error', message: 'Network error: ' + error.message });
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (!validateStep()) return;
    setStep((prev) => Math.min(prev + 1, steps.length - 1));
  };

  const prevStep = () => {
    setStatus(null);
    setErrors({});
    setStep((prev) => Math.max(prev - 1, 0));
  };

  return (
    <div className="appContainer" role="main" aria-labelledby="formTitle">
      <div className="formArea">
       <div className="titleContainer">
  <h1 id="formTitle" className="sheinTitle">
    SHEIN
  </h1><br></br>
  <h2 className="shopTitle">Register Your Shop</h2>
</div>

        {status && (
          <p className={`statusMessage ${status.type}`} role="alert" tabIndex={-1}>
            {status.message}
          </p>
        )}

        <form className="formStep" onSubmit={handleSubmit} noValidate aria-live="polite">
          {step === 0 ? (
            <>
              <FormField
                key="shop_name"
                id="shop_name"
                label={labels.shop_name}
                value={formData.shop_name}
                onChange={handleChange}
                error={errors.shop_name}
                maxLength={fieldMaxLengths.shop_name}
                autoFocus={true}
                ref={firstFieldRef}
              />
              <SelectField
                key="category"
                id="category"
                label={labels.category}
                value={formData.category}
                onChange={handleChange}
                error={errors.category}
                options={categoryOptions}
              />
              <div className="countryStateRow">
                <SelectField
                  key="country"
                  id="country"
                  label={labels.country}
                  value={formData.country}
                  onChange={handleChange}
                  error={errors.country}
                  options={countriesWithStates.map((c) => c.country)}
                />
                <SelectField
                  key="state"
                  id="state"
                  label={labels.state}
                  value={formData.state}
                  onChange={handleChange}
                  error={errors.state}
                  options={
                    countriesWithStates.find((c) => c.country === formData.country)
                      ?.states || []
                  }
                />
              </div>
            </>
          ) : step === 1 ? (
            steps[step].map((field, idx) => (
              <FormField
                key={field}
                id={field}
                label={labels[field]}
                value={formData[field]}
                onChange={handleChange}
                error={errors[field]}
                maxLength={fieldMaxLengths[field]}
                textarea={field === 'description'}
                type={field === 'shop_email' ? 'email' : 'text'}
                autoFocus={idx === 0}
                ref={idx === 0 ? firstFieldRef : null}
              />
            ))
          ) : step === 2 ? (
            steps[step].map((field, idx) => (
              <FormField
                key={field}
                id={field}
                label={labels[field]}
                value={formData[field]}
                onChange={handleChange}
                error={errors[field]}
                maxLength={fieldMaxLengths[field]}
                type={field === 'password' ? 'password' : 'text'}
                autoFocus={idx === 0}
                ref={idx === 0 ? firstFieldRef : null}
              />
            ))
          ) : (
            // Step 3: profile_pic upload
            <div className="formField">
              <label htmlFor="profile_pic">{labels.profile_pic}:</label>
              <input
                type="file"
                id="profile_pic"
                name="profile_pic"
                accept="image/*"
                onChange={handleChange}
                aria-invalid={!!errors.profile_pic}
                aria-describedby="profile_pic-error"
                autoFocus
              />
              {errors.profile_pic && (
                <p id="profile_pic-error" className="errorMessage" role="alert">
                  {errors.profile_pic}
                </p>
              )}
              <p className="infoText">(Optional) Upload a profile picture for your shop.</p>
            </div>
          )}

          <div className="formButtons">
            {step > 0 && (
              <button
                type="button"
                className="previousButton"
                onClick={prevStep}
                disabled={loading}
                aria-label="Go to previous step"
              >
                Previous
              </button>
            )}
            {step < steps.length - 1 && (
              <button
                type="button"
                className="nextButton"
                onClick={nextStep}
                disabled={loading}
                aria-label="Go to next step"
              >
                Next
              </button>
            )}
            {step === steps.length - 1 && (
              <button
                type="submit"
                className="submitButton"
                disabled={loading}
                aria-label="Submit shop registration form"
              >
                {loading ? 'Registering...' : 'Register Shop'}
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="animationArea" aria-hidden="true" />
    </div>
  );
};

export default ShopRegistrationForm;
