import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './user_register.css'; // Navigate one level up and then down into Shop_owner

const slides = [
  {
    id: 1,
    title: 'TRENDY\nFASHION',
    description: 'Stay ahead with the latest styles and collections.',
    bgClass: 'login-slide1-bg', // background image class
  },
  {
    id: 2,
    title: 'AFFORDABLE\nPRICES',
    description: 'Shop your favorites without breaking the bank.',
    bgClass: 'login-slide2-bg', // background image class
  },
  {
    id: 3,
    title: 'FAST\nDELIVERY',
    description: 'Get your orders delivered swiftly at your doorstep.',
    bgClass: 'login-slide3-bg', // background image class
  },
];

const genderOptions = [
  { value: 'Male', label: 'Male', icon: '♂' },
  { value: 'Female', label: 'Female', icon: '♀' },
  { value: 'Other', label: 'Other', icon: '?' },
];

const UserRegister = () => {
  const [formData, setFormData] = useState({
    username: '',
    email_address: '',
    contact_number: '',
    age: '',
    gender: '',
    nationality: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [step, setStep] = useState(1); // 1 = first section, 2 = second section
  const navigate = useNavigate();

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length); // Cycle through slides every 2.5 seconds
    }, 2500);
    return () => clearInterval(interval); // Cleanup interval on component unmount
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: null }));
    setStatus(null);
  };

  const handleGenderSelect = (value) => {
    setFormData((prev) => ({ ...prev, gender: value }));
    setErrors((prev) => ({ ...prev, gender: null }));
    setStatus(null);
  };

  // Validation for step 1 only
  const validateStep1 = () => {
    const newErrors = {};

    if (!formData.username.trim())
      newErrors.username = 'Please enter your username';

    if (!formData.email_address)
      newErrors.email_address = 'Please enter your email';

    if (!formData.contact_number)
      newErrors.contact_number = 'Please enter your contact number';

    if (formData.age) {
      const ageNum = Number(formData.age);
      if (!Number.isInteger(ageNum) || ageNum < 0) {
        newErrors.age = 'Age must be a non-negative integer';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Full validation for final submit (both steps)
  const validateForm = () => {
    const newErrors = {};

    // Step 1 fields
    if (!formData.username.trim())
      newErrors.username = 'Please enter your username';

    if (!formData.email_address)
      newErrors.email_address = 'Please enter your email';

    if (!formData.contact_number)
      newErrors.contact_number = 'Please enter your contact number';

    if (formData.age) {
      const ageNum = Number(formData.age);
      if (!Number.isInteger(ageNum) || ageNum < 0) {
        newErrors.age = 'Age must be a non-negative integer';
      }
    }

    // Step 2 fields
    if (!formData.password)
      newErrors.password = 'Please enter your password';

    if (!formData.confirmPassword)
      newErrors.confirmPassword = 'Please confirm your password';

    if (formData.password && formData.confirmPassword &&
        formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (!validateStep1()) return;
    setStep(2);
  };

  const handlePrevious = () => {
    setStep(1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setStatus(null);

    try {
      // Exclude confirmPassword from the payload sent to backend
      const { confirmPassword, ...payload } = formData;

      const response = await fetch('http://localhost:5070/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json();

      if (response.ok) {
        setStatus({ type: 'success', message: 'Registration successful!' });
        navigate('/user_login'); // Redirect to login page after successful registration
      } else {
        setStatus({
          type: 'error',
          message: data.message || 'Registration failed',
        });
      }
    } catch (error) {
      setStatus({
        type: 'error',
        message: 'Network error: ' + error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="login-appContainer"
      role="main"
      aria-labelledby="registerTitle"
    >
      {/* Left side slideshow */}
      <div className="login-leftSide" aria-hidden="true">
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className={`login-slide ${slide.bgClass} ${
              index === currentSlide ? 'active' : ''
            }`}
            aria-hidden={index !== currentSlide}
          >
            <h1>
              {slide.title.split('\n').map((line, i) => (
                <React.Fragment key={i}>
                  {line}
                  <br />
                </React.Fragment>
              ))}
            </h1>
            <p>
              {slide.description.split('\n').map((line, i) => (
                <React.Fragment key={i}>
                  {line}
                  <br />
                </React.Fragment>
              ))}
            </p>
          </div>
        ))}

        <div className="login-slideDots" aria-label="Slide navigation dots">
          {slides.map((_, idx) => (
            <span
              key={idx}
              className={idx === currentSlide ? 'active' : ''}
              aria-current={idx === currentSlide ? 'true' : 'false'}
              aria-label={`Slide ${idx + 1}`}
              role="button"
              tabIndex={0}
              onClick={() => setCurrentSlide(idx)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') setCurrentSlide(idx);
              }}
            />
          ))}
        </div>
      </div>

      {/* Right side form */}
      <div className="login-rightSide">
        <h1 className="login-formTitle">SHEIN</h1>
        <h3 className="login-formSubtitle">USER REGISTRATION</h3>

        <div className="login-formArea">
          {status && (
            <p
              className={`login-statusMessage ${status.type}`}
              role="alert"
              tabIndex={-1}
            >
              {status.message}
            </p>
          )}

          <form onSubmit={handleSubmit} noValidate aria-live="polite">
            {/* STEP 1: username, email, contact number, age */}
            {step === 1 && (
              <>
                <div className="login-formField">
                  <label htmlFor="username">Username:</label>
                  <input
                    id="username"
                    name="username"
                    type="text"
                    value={formData.username}
                    onChange={handleChange}
                    aria-invalid={!!errors.username}
                    aria-describedby="username-error"
                    autoComplete="username"
                    autoFocus
                  />
                  {errors.username && (
                    <p
                      id="username-error"
                      className="login-errorMessage"
                      role="alert"
                    >
                      {errors.username}
                    </p>
                  )}
                </div>

                <div className="login-formField">
                  <label htmlFor="email_address">Email Address:</label>
                  <input
                    id="email_address"
                    name="email_address"
                    type="email"
                    value={formData.email_address}
                    onChange={handleChange}
                    aria-invalid={!!errors.email_address}
                    aria-describedby="email_address-error"
                    autoComplete="email"
                  />
                  {errors.email_address && (
                    <p
                      id="email_address-error"
                      className="login-errorMessage"
                      role="alert"
                    >
                      {errors.email_address}
                    </p>
                  )}
                </div>

                <div className="login-formField">
                  <label htmlFor="contact_number">Contact Number:</label>
                  <input
                    id="contact_number"
                    name="contact_number"
                    type="text"
                    value={formData.contact_number}
                    onChange={handleChange}
                    aria-invalid={!!errors.contact_number}
                    aria-describedby="contact_number-error"
                  />
                {errors.contact_number && (
                    <p
                      id="contact_number-error"
                      className="login-errorMessage"
                      role="alert"
                    >
                      {errors.contact_number}
                    </p>
                  )}
                </div>

                <div className="login-formField">
                  <label htmlFor="age">Age:</label>
                  <input
                    id="age"
                    name="age"
                    type="number"
                    value={formData.age}
                    onChange={handleChange}
                    aria-invalid={!!errors.age}
                    aria-describedby="age-error"
                    min="0"
                  />
                  {errors.age && (
                    <p
                      id="age-error"
                      className="login-errorMessage"
                      role="alert"
                    >
                      {errors.age}
                    </p>
                  )}
                </div>
              </>
            )}

            {/* STEP 2: gender, nationality, password, confirm password */}
            {step === 2 && (
              <>
                {/* Gender as three buttons */}
                <div className="login-formField">
                  <label>Gender:</label>
                  <div
                    className="genderButtonGroup"
                    style={{ display: 'flex', gap: '0.5rem' }}
                  >
                    {genderOptions.map((option) => {
                      const isSelected = formData.gender === option.value;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => handleGenderSelect(option.value)}
                          className={`genderButton ${
                            isSelected ? 'selected' : ''
                          }`}
                          aria-pressed={isSelected}
                          style={{
                            position: 'relative',
                            flex: 1,
                            padding: '0.5rem 0.75rem',
                            borderRadius: '6px',
                            border: isSelected
                              ? '2px solid #00aa00'
                              : '1px solid #ccc',
                            backgroundColor: '#fff',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.35rem',
                          }}
                        >
                          <span style={{ fontSize: '1rem' }}>
                            {option.icon}
                          </span>
                          <span>{option.label}</span>
                          {isSelected && (
                            <span
                              style={{
                                position: 'absolute',
                                top: '2px',
                                right: '4px',
                                fontSize: '0.8rem',
                                color: '#00aa00',
                                fontWeight: 'bold',
                              }}
                            >
                              ✓
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  {errors.gender && (
                    <p
                      id="gender-error"
                      className="login-errorMessage"
                      role="alert"
                    >
                      {errors.gender}
                    </p>
                  )}
                </div>

                <div className="login-formField">
                  <label htmlFor="nationality">Nationality:</label>
                  <input
                    id="nationality"
                    name="nationality"
                    type="text"
                    value={formData.nationality}
                    onChange={handleChange}
                    aria-invalid={!!errors.nationality}
                    aria-describedby="nationality-error"
                  />
                  {errors.nationality && (
                    <p
                      id="nationality-error"
                      className="login-errorMessage"
                      role="alert"
                    >
                      {errors.nationality}
                    </p>
                  )}
                </div>

                <div className="login-formField">
                  <label htmlFor="password">Password:</label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                    aria-invalid={!!errors.password}
                    aria-describedby="password-error"
                    autoComplete="new-password"
                  />
                  {errors.password && (
                    <p
                      id="password-error"
                      className="login-errorMessage"
                      role="alert"
                    >
                      {errors.password}
                    </p>
                  )}
                </div>

                <div className="login-formField">
                  <label htmlFor="confirmPassword">Confirm Password:</label>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    aria-invalid={!!errors.confirmPassword}
                    aria-describedby="confirmPassword-error"
                    autoComplete="new-password"
                  />
                  {errors.confirmPassword && (
                    <p
                      id="confirmPassword-error"
                      className="login-errorMessage"
                      role="alert"
                    >
                      {errors.confirmPassword}
                    </p>
                  )}
                </div>
              </>
            )}

            {/* Navigation buttons */}
            <div
              style={{
                display: 'flex',
                justifyContent: step === 1 ? 'flex-end' : 'space-between',
                marginTop: '1rem',
              }}
            >
              {step === 2 && (
                <button
                  type="button"
                  className="login-submitButton"
                  onClick={handlePrevious}
                  style={{ width: '48%' }}
                >
                  Previous
                </button>
              )}

              {step === 1 && (
                <button
                  type="button"
                  className="login-submitButton"
                  onClick={handleNext}
                  style={{ width: '40%' }}
                >
                  Next
                </button>
              )}

              {step === 2 && (
                <button
                  type="submit"
                  className="login-submitButton"
                  disabled={loading}
                  aria-label="Submit registration form"
                  style={{ width: '48%' }}
                >
                  {loading ? 'Registering...' : 'Register'}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UserRegister;
