import { useNavigate } from "react-router-dom";

export function Customernavbar() {
  const navigate = useNavigate();
  return (
    <>
      <nav className="navbar navbar-expand-lg navbar-dark bg-dark py-2 shadow-sm border-bottom border-secondary border-opacity-25" style={{ backdropFilter: 'blur(10px)', position: 'sticky', top: 0, zIndex: 1050 }}>
        {/* 🌟 FIX: Changed 'container' to 'container-fluid px-4' to minimize dead margins on left & right */}
        <div className="container-fluid px-4 d-flex justify-content-between align-items-center">
          
          {/* Brand Logo perfectly aligned to the left */}
          <a className="navbar-brand fw-bold d-flex align-items-center m-0 p-0" href="#home">
            <img 
              src="/logo.png" 
              alt="ShopSmart Logo" 
              className="img-fluid"
              style={{ maxHeight: '42px', width: 'auto', objectFit: 'contain' }} 
            />
          </a>

          {/* Mobile Hamburger Toggle Trigger */}
          <button 
            className="navbar-toggler border-0 p-2 focus-none" 
            type="button" 
            data-bs-toggle="collapse" 
            data-bs-target="#navbarNav" 
            aria-controls="navbarNav" 
            aria-expanded="false" 
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon" style={{ width: '1.25rem', height: '1.25rem' }}></span>
          </button>

          <div className="collapse navbar-collapse" id="navbarNav">
            <ul className="navbar-nav ms-auto align-items-lg-center gap-1 pt-3 pt-lg-0 pe-1">
              <li className="nav-item">
                <a className="nav-link custom-nav-link px-3" href="/">
                  Home
                </a>
              </li>
              
              <li className="nav-item">
                <a className="nav-link custom-nav-link px-3" href="/myorders">
                  My Orders
                </a>
              </li>

              <li className="nav-item">
                <a className="nav-link custom-nav-link px-3" href="/profile">
                  Profile
                </a>
              </li>

              <li className="nav-item">
                <a className="nav-link px-3 loyalty-link fw-semibold" href="/loyaltypage">
                  My Loyalty Points
                </a>
              </li>
               <li className="nav-item">
                <a className="nav-link custom-nav-link px-3" href="/cart">
                  Cart
                </a>
              </li>

              <li className="nav-item">
                <a className="nav-link custom-nav-link px-3" href="#contact">
                  Contact Us
                </a>
              </li>

              {/* Mobile Separator Line */}
              <hr className="d-lg-none my-2 text-white-50" />

              {/* Premium Styled Call-to-Action Logout Button */}
              <li className="nav-item ms-lg-2">
                <button className="btn btn-outline-danger btn-sm px-4 rounded-pill fw-semibold transition-all" onClick={()=>{
                  navigate("/login")
                }}>
                  Logout
                </button>
              </li>
            </ul>
          </div>
        </div>
      </nav>

      {/* Embedded CSS Style Overrides */}
      <style>{`
        .custom-nav-link {
          color: rgba(255, 255, 255, 0.65) !important;
          font-weight: 500;
          font-size: 0.95rem;
          transition: all 0.2s ease-in-out;
          border-radius: 6px;
        }
        .custom-nav-link:hover {
          color: #ffffff !important;
          background-color: rgba(255, 255, 255, 0.08);
        }
        
        /* Premium Soft Gold Glow Accent for Loyalty Track Links */
        // .loyalty-link {
        //   color: #0aa41a !important;
        //   font-size: 0.95rem;
        //   transition: all 0.2s ease-in-out;
        //   border-radius: 6px;
        // }
        // .loyalty-link:hover {
        //   color: #ffe066 !important;
        //   background-color: rgba(255, 193, 7, 0.1);
        // }

        .btn-outline-danger {
          border-width: 1.5px;
          font-size: 0.9rem;
          transition: all 0.2s ease-in-out;
        }
        .btn-outline-danger:hover {
          background-color: #dc3545 !important;
          border-color: #dc3545 !important;
          color: #ffffff !important;
        }

        .focus-none:focus {
          box-shadow: none !important;
          outline: none !important;
        }
      `}</style>
    </>
  );
}
