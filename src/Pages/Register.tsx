import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import type { SubmitHandler } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

function Register(): React.JSX.Element {
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
    <div className="d-flex align-items-center justify-content-center min-vh-100 position-relative" style={{ background: 'linear-gradient(135deg, #E1F8FA, #EBF1FF)' }}>
      
      {/* ✅ ADDED: Floating Custom Toast Snackbar Element */}
      <div 
        className="toast-container position-fixed top-0 end-0 p-3" 
        style={{ zIndex: 1050, transform: showSnackbar ? 'translateY(0)' : 'translateY(-20px)', opacity: showSnackbar ? 1 : 0, transition: 'all 0.4s ease' }}
      >
        <div className="toast show align-items-center text-white border-0 shadow-lg" style={{ backgroundColor: '#0FAF62', borderRadius: '12px' }} role="alert">
          <div className="d-flex p-3">
            <div className="toast-body d-flex align-items-center gap-2 fw-semibold">
              <i className="bi bi-check-circle-fill fs-5"></i>
              {snackbarMsg}
            </div>
          </div>
        </div>
      </div>

      <div className="card p-4 shadow-lg border-0 bg-white m-3" style={{ width: '100%', maxWidth: '480px', borderRadius: '16px' }}>
        
        <div className="text-center mb-4">
          <div className="d-inline-flex align-items-center justify-content-center rounded-circle text-white mb-3" style={{ backgroundColor: '#3D22C1', width: '56px', height: '56px' }}>
            <i className="bi bi-person-plus-fill fs-3"></i>
          </div>
          <h3 className="fw-bold" style={{ color: '#121127' }}>Register Portal Node</h3>
          <p style={{ color: '#6B7280' }} className="small">Deploy credentials across the distributed cluster mesh</p>
        </div>

        {apiError && (
          <div className="alert alert-danger d-flex align-items-center gap-2 small fw-semibold border-0 py-2" role="alert">
            <i className="bi bi-exclamation-triangle-fill"></i>
            <div>{apiError}</div>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          
          {/* Operator Name */}
          <div className="mb-3">
            <label className="form-label fw-medium text-dark small">Operator Name</label>
            <div className="input-group">
              <span className="input-group-text bg-light border-end-0 text-muted"><i className="bi bi-person"></i></span>
              <input 
                type="text" 
                className={`form-control border-start-0 ${errors.userName ? 'is-invalid' : ''}`} 
                placeholder="Jane Doe" 
                {...register('userName', { required: 'Operator name is a mandatory field for registration' })} 
              />
              {errors.userName && <div className="invalid-feedback fw-medium">{errors.userName.message as string}</div>}
            </div>
          </div>

          {/* Corporate Email Address */}
          <div className="mb-3">
            <label className="form-label fw-medium text-dark small">Corporate Email Address</label>
            <div className="input-group">
              <span className="input-group-text bg-light border-end-0 text-muted"><i className="bi bi-envelope"></i></span>
              <input
                type="email"
                className={`form-control border-start-0 ${errors.userEmail ? 'is-invalid' : ''}`}
                placeholder="jane@shopsmart.com"
                {...register('userEmail', {
                  required: 'Email routes are mandatory parameters',
                  pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Incorrect layout formatting match for emails' }
                })}
              />
              {errors.userEmail && <div className="invalid-feedback fw-medium">{errors.userEmail.message as string}</div>}
            </div>
          </div>

          {/* Enter Password */}
          <div className="mb-3">
            <label className="form-label fw-medium text-dark small">Enter Password</label>
            <div className="input-group">
              <span className="input-group-text bg-light border-end-0 text-muted"><i className="bi bi-key"></i></span>
              <input
                type={showPassword ? 'text' : 'password'}
                className={`form-control border-start-0 border-end-0 ${errors.userPassword ? 'is-invalid' : ''}`}
                placeholder="Create access key"
                {...register('userPassword', {
                  required: 'Password fields are mandatory configuration variables',
                  minLength: { value: 6, message: 'Security lengths must map equal or higher than 6 characters' }
                })}
              />
              <button 
                type="button" 
                className="input-group-text bg-transparent text-muted"
                onClick={() => setShowPassword(!showPassword)}
                style={{ borderLeft: 'none' }}
              >
                <i className={`bi ${showPassword ? 'bi-eye-slash-fill' : 'bi-eye-fill'}`}></i>
              </button>
              {errors.userPassword && <div className="invalid-feedback fw-medium">{errors.userPassword.message as string}</div>}
            </div>
          </div>

          {/* Confirm Password */}
          <div className="mb-3">
            <label className="form-label fw-medium text-dark small">Confirm Password</label>
            <div className="input-group">
              <span className="input-group-text bg-light border-end-0 text-muted"><i className="bi bi-check-all"></i></span>
              <input
                type="password"
                className={`form-control border-start-0 ${errors.confirmPassword ? 'is-invalid' : ''}`}
                placeholder="Repeat access key"
                {...register('confirmPassword', {
                  required: 'Please confirm security parameters entries',
                  validate: (val) => val === passwordValue || 'Cryptographic verification match failure, passwords do not match'
                })}
              />
              {errors.confirmPassword && <div className="invalid-feedback fw-medium">{errors.confirmPassword.message as string}</div>}
            </div>
          </div>

          {/* System Authorization Role */}
          <div className="mb-4">
            <label className="form-label fw-medium text-dark small">System Authorization Role</label>
            <div className="input-group">
              <span className="input-group-text bg-light border-end-0 text-muted"><i className="bi bi-info-circle"></i></span>
              <input 
                type="text" 
                className={`form-control border-start-0 ${errors.userRole ? 'is-invalid' : ''}`} 
                placeholder="e.g., RETAILER_ADMIN" 
                {...register('userRole', { required: 'System node roles are mandatory parameters' })} 
              />
              {errors.userRole && <div className="invalid-feedback fw-medium">{errors.userRole.message as string}</div>}
            </div>
          </div>

          <button
            type="submit"
            className="btn w-100 fw-bold py-2 text-white border-0 mb-3"
            style={{ backgroundColor: '#3D22C1', opacity: (!isValid || loading) ? 0.75 : 1 }}
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

        <div className="text-center pt-2 border-top">
          <span className="small text-muted">Already registered an account layout configuration? </span>
          <Link to="/login" className="small fw-bold text-decoration-none" style={{ color: '#3D22C1' }}>Sign In</Link>
        </div>

      </div>
    </div>
  );
}

export default Register;
