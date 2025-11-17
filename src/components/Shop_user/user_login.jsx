import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../Shop_owner/login_register.css';  // Navigate one level up and then down into Shop_owner

const slides = [
  {
    id: 1,
    title: 'WELCOME\nBACK',
    description: 'Log in to access your account and start shopping.',
    bgClass: 'login-slide1-bg', // background image class
  },
  {
    id: 2,
    title: 'EASY\nSHOPPING',
    description: 'Find your favorite products easily with our new features.',
    bgClass: 'login-slide2-bg', // background image class
  },
  {
    id: 3,
    title: 'SECURE\nPAYMENT',
    description: 'Shop with confidence knowing your payments are secure.',
    bgClass: 'login-slide3-bg', // background image class
  },
];

const UserLogin = ({ onLoginSuccess }) => {
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % slides.length); // Cycle through slides every 2.5 seconds
    }, 2500);
    return () => clearInterval(interval); // Cleanup interval on component unmount
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: null }));
    setStatus(null);
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.username.trim()) newErrors.username = 'Please enter your username';
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
      const response = await fetch('http://localhost:5070/api/user_login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await response.json();

      if (response.ok) {
        // Backend now only sends { user_id, username }
        const { user } = data || {};
        const { username, user_id } = user || {};

        if (username && user_id) {
          // Only pass minimal info to the app
          if (typeof onLoginSuccess === 'function') {
            onLoginSuccess({ username, user_id });
          }
          setStatus({ type: 'success', message: 'Login successful!' });
          navigate('/home');
        } else {
          setStatus({ type: 'error', message: 'Invalid response from server' });
        }
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
        <h3 className="login-formSubtitle">USER LOGIN</h3>

        <div className="login-formArea">
          {status && (
            <p className={`login-statusMessage ${status.type}`} role="alert" tabIndex={-1}>
              {status.message}
            </p>
          )}

          <form onSubmit={handleSubmit} noValidate aria-live="polite">
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
                <p id="username-error" className="login-errorMessage" role="alert">
                  {errors.username}
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

export default UserLogin;
