import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import type { SubmitHandler } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

// Imports for Theme and Language components
import { ThemeToggle, useTheme } from "../Components/modecontext/modes";
import { TranslateDropdown } from "../Components/language/TranslateDropdown";
import { useLanguage } from '../Components/language/LanguageContext'; 
function Register(): React.JSX.Element {
  // Access theme state from context
  const { isDarkMode } = useTheme();
  const { language, translateCurrentPage } = useLanguage();
  useEffect(() => {
    if (language !== 'en') {
      translateCurrentPage(language);
    }
  }, []);

  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [showSnackbar, setShowSnackbar] = useState<boolean>(false);
  const [snackbarMsg, setSnackbarMsg] = useState<string>('');

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isValid }
  } = useForm<any>({ mode: 'onChange' });

  const passwordValue = watch('userPassword');

  const onSubmit: SubmitHandler<any> = async (data) => {
    setLoading(true);
    setApiError(null);
    console.log('Dispatching user payload metrics onto auth node:', data);

    try {
      const response = await axios.post("http://localhost:8081/auth/register", data);

      const successMessage = typeof response.data === 'string' 
        ? response.data 
        : (response.data?.message || "Registration completed successfully!");
      
      setSnackbarMsg(successMessage);
      setShowSnackbar(true);

      setTimeout(() => {
        setShowSnackbar(false);
        navigate('/login');
      }, 3000);
    } catch (error: any) {
      console.error('Registration processing exception caught:', error);
      const fallbackMsg = "Connection to backend authority node failed. Please confirm server state updates.";
      setApiError(error.response?.data?.message || error.message || fallbackMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="d-flex align-items-center justify-content-center min-vh-100 position-relative py-5 box-shadow-light"
      style={{
        backgroundColor: isDarkMode ? "#0a0f0d" : "#f4f6f8",
        // backgroundImage: `url("/logo.png")`,
        backgroundSize: "contain",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        backgroundAttachment: "fixed",
        
        transition: "all 0.3s ease"
      }}
    >
      <style>{`
        @keyframes marquee-continuous {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
        .scroll-container {
          display: flex;
          width: max-content;
          animation: marquee-continuous 25s linear infinite;
        }
        .scroll-container:hover {
          animation-play-state: paused;
        }
      `}</style>

      <div 
        className="position-fixed top-0 start-0 end-0 p-3 d-flex align-items-center justify-content-between gap-3"
        style={{ zIndex: 1040 }}
      >
        {/* Banner Expanded Across Left Side with Exact Height Matching Controls */}
        <div 
          className="flex-grow-1 overflow-hidden rounded shadow-sm d-flex align-items-center"
          style={{
            height: "48px",
            borderTop: "2px solid #10b981",
            borderBottom: "2px solid #10b981",
            background: 'linear-gradient(to bottom, rgba(16, 185, 129, 0.25) 0%, rgba(16, 185, 129, 0.02) 100%)',
            color: isDarkMode ? "#a7f3d0" : "#065f46",
            padding: "0 12px"
          }}
        >
          <div className="scroll-container font-medium" style={{ fontSize: "0.875rem" }}>
            <span className="pe-4 text-nowrap">
              ⚠️ WARNING: Language selection and mode selection need to be selected now as they cannot be changed later!
            </span>
            <span className="pe-4 text-nowrap">
              ⚠️ WARNING: Language selection and mode selection need to be selected now as they cannot be changed later!
            </span>
            <span className="pe-4 text-nowrap">
              ⚠️ WARNING: Language selection and mode selection need to be selected now as they cannot be changed later!
            </span>
            <span className="pe-4 text-nowrap">
              ⚠️ WARNING: Language selection and mode selection need to be selected now as they cannot be changed later!
            </span>
          </div>
        </div>

        <div 
          className={`rounded-3 backdrop-blur border shadow d-flex align-items-center gap-2 flex-shrink-0 px-3 ${
            isDarkMode 
              ? "bg-dark bg-opacity-50 border-secondary border-opacity-25" 
              : "bg-white bg-opacity-75 border-light-subtle"
          }`}
          style={{ height: "48px" }}
        >
          <TranslateDropdown />
          <ThemeToggle />
        </div>
      </div>

      {/* ==========================================
          SNACKBAR TOAST
      ========================================== */}
      <div 
        className="toast-container position-fixed top-0 start-0 p-3" 
        style={{ 
          zIndex: 1050, 
          transform: showSnackbar ? 'translateY(0)' : 'translateY(-20px)', 
          opacity: showSnackbar ? 1 : 0, 
          transition: 'all 0.4s ease' 
        }}
      >
        <div 
          className="toast show align-items-center text-white border-0 shadow-lg" 
          style={{ backgroundColor: '#00C853', borderRadius: '12px', boxShadow: "0 4px 20px rgba(0, 200, 83, 0.4)" }} 
          role="alert"
        >
          <div className="d-flex p-3">
            <div className="toast-body d-flex align-items-center gap-2 fw-semibold">
              <i className="bi bi-check-circle-fill fs-5"></i>
              {snackbarMsg}
            </div>
          </div>
        </div>
      </div>

      {/* ==========================================
          REGISTER CARD
      ========================================== */}
      <div 
        className="card p-4 border-0 m-3 my-5" 
        style={{ 
          width: '100%', 
          maxWidth: '480px', 
          borderRadius: '20px',
          background: isDarkMode 
            ? "rgba(18, 26, 22, 0.65)" 
            : "rgba(255, 255, 255, 0.85)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
         boxShadow: isDarkMode
  ? "0 8px 25px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(0, 230, 118, 0.15)"
  : "0 8px 25px rgba(0, 0, 0, 0.05), inset 0 1px 0 rgba(249, 244, 244, 0.93)",
          border: isDarkMode 
            ? "1px solid rgba(0, 230, 118, 0.2)" 
            : "1px solid rgba(0, 200, 83, 0.2)",
          transition: "all 0.3s ease"
        }}
      >
        <div className="text-center mb-4">
          <div 
            className="d-inline-flex align-items-center justify-content-center rounded-circle text-white mb-3 shadow" 
            style={{ 
              background: "linear-gradient(135deg, #00E676 0%, #007E33 100%)",
              boxShadow: "0 0 20px rgba(0, 230, 118, 0.5)",
              width: '60px', 
              height: '60px',
              border: "2px solid #AEEA00"
            }}
          >
            <i className="bi bi-person-plus-fill fs-3 text-white"></i>
          </div>
          <h3 
            className="fw-bold" 
            style={{ 
              color: isDarkMode ? "#ffffff" : "#111111", 
              letterSpacing: "0.5px" 
            }}
          >
            Register Portal Node
          </h3>
          <p 
            style={{ color: isDarkMode ? "#AEEA00" : "#2e7d32" }} 
            className="small fw-semibold mb-0"
          >
            Deploy credentials across the distributed cluster mesh
          </p>
        </div>

        {apiError && (
          <div 
            className="alert alert-danger d-flex align-items-center gap-2 small fw-semibold border-0 py-2 shadow-sm" 
            style={{ backgroundColor: "rgba(220, 53, 69, 0.85)", color: "#fff" }}
            role="alert"
          >
            <i className="bi bi-exclamation-triangle-fill"></i>
            <div>{apiError}</div>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          {/* Operator Name */}
          <div className="mb-3">
            <label 
              className="form-label fw-semibold small"
              style={{ color: isDarkMode ? "#ffffff" : "#212529" }}
            >
              Operator Name
            </label>
            <div className="input-group">
              <span 
                className="input-group-text border-end-0"
                style={{ 
                  backgroundColor: isDarkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.05)", 
                  color: isDarkMode ? "#00E676" : "#00A846", 
                  borderColor: isDarkMode ? "rgba(0, 230, 118, 0.3)" : "rgba(0, 0, 0, 0.15)" 
                }}
              >
                <i className="bi bi-person"></i>
              </span>
              <input 
                type="text" 
                className={`form-control border-start-0 ${errors.userName ? 'is-invalid' : ''}`} 
                style={{
                  backgroundColor: isDarkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.05)",
                  borderColor: isDarkMode ? "rgba(0, 230, 118, 0.3)" : "rgba(0, 0, 0, 0.15)",
                  color: isDarkMode ? "#ffffff" : "#212529",
                  fontWeight: "500"
                }}
                placeholder="Jane Doe" 
                {...register('userName', { required: 'Operator name is a mandatory field for registration' })} 
              />
              {errors.userName && <div className="invalid-feedback fw-bold text-danger">{errors.userName.message as string}</div>}
            </div>
          </div>

          {/* Corporate Email Address */}
          <div className="mb-3">
            <label 
              className="form-label fw-semibold small"
              style={{ color: isDarkMode ? "#ffffff" : "#212529" }}
            >
              Corporate Email Address
            </label>
            <div className="input-group">
              <span 
                className="input-group-text border-end-0"
                style={{ 
                  backgroundColor: isDarkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.05)", 
                  color: isDarkMode ? "#00E676" : "#00A846", 
                  borderColor: isDarkMode ? "rgba(0, 230, 118, 0.3)" : "rgba(0, 0, 0, 0.15)" 
                }}
              >
                <i className="bi bi-envelope"></i>
              </span>
              <input
                type="email"
                className={`form-control border-start-0 ${errors.userEmail ? 'is-invalid' : ''}`}
                style={{
                  backgroundColor: isDarkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.05)",
                  borderColor: isDarkMode ? "rgba(0, 230, 118, 0.3)" : "rgba(0, 0, 0, 0.15)",
                  color: isDarkMode ? "#ffffff" : "#212529",
                  fontWeight: "500"
                }}
                placeholder="jane@shopsmart.com"
                {...register('userEmail', {
                  required: 'Email routes are mandatory parameters',
                  pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Incorrect layout formatting match for emails' }
                })}
              />
              {errors.userEmail && <div className="invalid-feedback fw-bold text-danger">{errors.userEmail.message as string}</div>}
            </div>
          </div>

          {/* Enter Password */}
          <div className="mb-3">
            <label 
              className="form-label fw-semibold small"
              style={{ color: isDarkMode ? "#ffffff" : "#212529" }}
            >
              Enter Password
            </label>
            <div className="input-group">
              <span 
                className="input-group-text border-end-0"
                style={{ 
                  backgroundColor: isDarkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.05)", 
                  color: isDarkMode ? "#00E676" : "#00A846", 
                  borderColor: isDarkMode ? "rgba(0, 230, 118, 0.3)" : "rgba(0, 0, 0, 0.15)" 
                }}
              >
                <i className="bi bi-key"></i>
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                className={`form-control border-start-0 border-end-0 ${errors.userPassword ? 'is-invalid' : ''}`}
                style={{
                  backgroundColor: isDarkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.05)",
                  borderColor: isDarkMode ? "rgba(0, 230, 118, 0.3)" : "rgba(0, 0, 0, 0.15)",
                  color: isDarkMode ? "#ffffff" : "#212529",
                  fontWeight: "500"
                }}
                placeholder="Create access key"
                {...register('userPassword', {
                  required: 'Password fields are mandatory configuration variables',
                  minLength: { value: 6, message: 'Security lengths must map equal or higher than 6 characters' }
                })}
              />
              <button 
                type="button" 
                className="input-group-text"
                onClick={() => setShowPassword(!showPassword)}
                style={{ 
                  borderLeft: 'none',
                  backgroundColor: isDarkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.05)", 
                  borderColor: isDarkMode ? "rgba(0, 230, 118, 0.3)" : "rgba(0, 0, 0, 0.15)", 
                  color: isDarkMode ? "#00E676" : "#00A846" 
                }}
              >
                <i className={`bi ${showPassword ? 'bi-eye-slash-fill' : 'bi-eye-fill'}`}></i>
              </button>
              {errors.userPassword && <div className="invalid-feedback fw-bold text-danger">{errors.userPassword.message as string}</div>}
            </div>
          </div>

          {/* Confirm Password */}
          <div className="mb-3">
            <label 
              className="form-label fw-semibold small"
              style={{ color: isDarkMode ? "#ffffff" : "#212529" }}
            >
              Confirm Password
            </label>
            <div className="input-group">
              <span 
                className="input-group-text border-end-0"
                style={{ 
                  backgroundColor: isDarkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.05)", 
                  color: isDarkMode ? "#00E676" : "#00A846", 
                  borderColor: isDarkMode ? "rgba(0, 230, 118, 0.3)" : "rgba(0, 0, 0, 0.15)" 
                }}
              >
                <i className="bi bi-check-all"></i>
              </span>
              <input
                type="password"
                className={`form-control border-start-0 ${errors.confirmPassword ? 'is-invalid' : ''}`}
                style={{
                  backgroundColor: isDarkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.05)",
                  borderColor: isDarkMode ? "rgba(0, 230, 118, 0.3)" : "rgba(0, 0, 0, 0.15)",
                  color: isDarkMode ? "#ffffff" : "#212529",
                  fontWeight: "500"
                }}
                placeholder="Repeat access key"
                {...register('confirmPassword', {
                  required: 'Please confirm security parameters entries',
                  validate: (val) => val === passwordValue || 'Cryptographic verification match failure, passwords do not match'
                })}
              />
              {errors.confirmPassword && <div className="invalid-feedback fw-bold text-danger">{errors.confirmPassword.message as string}</div>}
            </div>
          </div>

          {/* System Authorization Role */}
          <div className="mb-4">
            <label 
              className="form-label fw-semibold small"
              style={{ color: isDarkMode ? "#ffffff" : "#212529" }}
            >
              System Authorization Role
            </label>
            <div className="input-group">
              <span 
                className="input-group-text border-end-0"
                style={{ 
                  backgroundColor: isDarkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.05)", 
                  color: isDarkMode ? "#00E676" : "#00A846", 
                  borderColor: isDarkMode ? "rgba(0, 230, 118, 0.3)" : "rgba(0, 0, 0, 0.15)" 
                }}
              >
                <i className="bi bi-info-circle"></i>
              </span>
              <input 
                type="text" 
                className={`form-control border-start-0 ${errors.userRole ? 'is-invalid' : ''}`} 
                style={{
                  backgroundColor: isDarkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.05)",
                  borderColor: isDarkMode ? "rgba(0, 230, 118, 0.3)" : "rgba(0, 0, 0, 0.15)",
                  color: isDarkMode ? "#ffffff" : "#212529",
                  fontWeight: "500"
                }}
                placeholder="e.g., CUSTOMER or RETAILER" 
                {...register('userRole', { required: 'System node roles are mandatory parameters' })} 
              />
              {errors.userRole && <div className="invalid-feedback fw-bold text-danger">{errors.userRole.message as string}</div>}
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="btn w-100 fw-bold py-2 text-dark border-0 mb-3 shadow"
            style={{ 
              background: "linear-gradient(90deg, #AEEA00 0%, #00E676 100%)",
              boxShadow: "0 4px 15px rgba(0, 230, 118, 0.4)",
              opacity: (!isValid || loading) ? 0.65 : 1 
            }}
            disabled={!isValid || loading}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Provisioning Node Profile...
              </>
            ) : (
              <>
                Deploy Instance Account <i className="bi bi-plus-circle ms-1"></i>
              </>
            )}
          </button>
        </form>

        {/* Navigation to Login */}
        <div 
          className="text-center pt-2" 
          style={{ 
            borderTop: isDarkMode 
              ? "1px solid rgba(0, 230, 118, 0.2)" 
              : "1px solid rgba(0, 0, 0, 0.1)" 
          }}
        >
          <span 
            className="small opacity-75"
            style={{ color: isDarkMode ? "#ffffff" : "#444444" }}
          >
            Already registered an account layout configuration?{" "}
          </span>
          <Link 
            to="/login" 
            className="small fw-bold text-decoration-none ms-1" 
            style={{ color: isDarkMode ? "#AEEA00" : "#00A846" }}
          >
            Sign In
          </Link>
        </div>

      </div>
    </div>
  );
}

export default Register;