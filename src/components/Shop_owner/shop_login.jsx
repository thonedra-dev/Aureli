// src/components/Shop_owner/shop_login.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './login_register.css';

const slides = [
  {
    id: 1,
    title: 'TRENDY\nFASHION',
    description: 'Stay ahead with the latest styles and collections.',
    bgClass: 'login-slide1-bg',
  },
  {
    id: 2,
    title: 'AFFORDABLE\nPRICES',
    description: 'Shop your favorites without breaking the bank.',
    bgClass: 'login-slide2-bg',
  },
  {
    id: 3,
    title: 'FAST\nDELIVERY',
    description: 'Get your orders delivered swiftly at your doorstep.',
    bgClass: 'login-slide3-bg',
  },
];

const ShopLogin = ({ onLoginSuccess }) => {
  const [formData, setFormData] = useState({ owner_name: '', password: '' });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % slides.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: null }));
    setStatus(null);
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.owner_name.trim()) newErrors.owner_name = 'Please enter your username';
    if (!formData.password) newErrors.password = 'Please enter your password';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setStatus(null);

    try {
      const response = await fetch('http://localhost:5070/api/shop_login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await response.json();

      if (response.ok) {
        setStatus({ type: 'success', message: 'Login successful!' });
        if (onLoginSuccess) onLoginSuccess(data);
        navigate('/profile');
      } else {
        setStatus({ type: 'error', message: data.message || 'Login failed' });
      }
    } catch (error) {
      setStatus({ type: 'error', message: 'Network error: ' + error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-appContainer" role="main" aria-labelledby="loginTitle">
      {/* Left side slideshow */}
      <div className="login-leftSide" aria-hidden="true">
        
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className={`login-slide ${slide.bgClass} ${index === currentSlide ? 'active' : ''}`}
            aria-hidden={index !== currentSlide}
          >
            <h1>
              {slide.title.split('\n').map((line, i) => (
                <React.Fragment key={i}>{line}<br /></React.Fragment>
              ))}
            </h1>
            <p>
              {slide.description.split('\n').map((line, i) => (
                <React.Fragment key={i}>{line}<br /></React.Fragment>
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
        <h3 className="login-formSubtitle">SHOP OWNER LOGIN</h3>

        <div className="login-formArea">
          {status && (
            <p className={`login-statusMessage ${status.type}`} role="alert" tabIndex={-1}>
              {status.message}
            </p>
          )}

          <form onSubmit={handleSubmit} noValidate aria-live="polite">
            <div className="login-formField">
              <label htmlFor="owner_name">Username:</label>
              <input
                id="owner_name"
                name="owner_name"
                type="text"
                value={formData.owner_name}
                onChange={handleChange}
                aria-invalid={!!errors.owner_name}
                aria-describedby="owner_name-error"
                autoComplete="username"
                autoFocus
              />
              {errors.owner_name && (
                <p id="owner_name-error" className="login-errorMessage" role="alert">
                  {errors.owner_name}
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
                autoComplete="current-password"
              />
              {errors.password && (
                <p id="password-error" className="login-errorMessage" role="alert">
                  {errors.password}
                </p>
              )}
            </div>

            <button
              type="submit"
              className="login-submitButton"
              disabled={loading}
              aria-label="Submit login form"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ShopLogin;
