import { Link, Outlet } from 'react-router-dom';
import { Customernavbar } from './CustomerNavbar';

export function CustomerLayout() {
    return (
        <>
            {/* Page wrapper to hold the structured layout sandwich together */}
            <div className="d-flex flex-column min-vh-100 bg-light text-dark font-sans">

                {/* Fixed or Sticky Header Component Context */}
                <Customernavbar />

                {/* Dynamic Nested Route Content Workspace Container */}
                <main className="flex-grow-1 container-fluid px-4 py-4 m-0 fade-in-animation">
                    <Outlet />
                </main>

                {/* Enhanced Glassmorphic Structured Layout Footer */}
                <footer
                    className="bg-dark text-white-50 pt-5 pb-3 border-top border-secondary border-opacity-25"
                    style={{ backdropFilter: 'blur(12px)', backgroundColor: 'rgba(33, 37, 41, 0.95)' }}
                >
                    <div className="container-fluid px-4">
                        <div className="row g-4 mb-4">

                            {/* Column 1: Brand Info & Social Anchor Interactions */}
                            <div className="col-12 col-lg-4 text-start">
                                <span className="fw-bold fs-4 text-white letter-spacing-sm">
                                    Shop<span className="text-success">Smart</span>
                                </span>
                                <p className="small mt-2 pe-lg-5 text-white-50" style={{ fontSize: '0.88rem', lineHeight: '1.6' }}>
                                    Empowering independent local retailers with data-driven analytics and reward infrastructures to make community shopping smarter and more unified.
                                </p>
                                <div className="d-flex gap-3 mt-4">
                                    <a href="#facebook" className="footer-social-circle flex-center" aria-label="Facebook Link"><i className="bi bi-facebook"></i></a>
                                    <a href="#twitter" className="footer-social-circle flex-center" aria-label="Twitter Link"><i className="bi bi-twitter-x"></i></a>
                                    <a href="#instagram" className="footer-social-circle flex-center" aria-label="Instagram Link"><i className="bi bi-instagram"></i></a>
                                </div>
                            </div>

                            {/* Column 2: Mapped Vertical Navigation Links Stack */}
                            <div className="col-6 col-md-4 col-lg-2 text-start">
                                <h6 className="text-white fw-bold small text-uppercase mb-3 tracking-wider" style={{ fontSize: '0.8rem' }}>Navigation</h6>
                                <ul className="list-unstyled d-flex flex-column gap-2.5 m-0 p-0" style={{ fontSize: '0.92rem' }}>
                                    <li><Link to="/customer/home" className="footer-v-link">Explore Shops</Link></li>
                                    <li><Link to="/customer/orders" className="footer-v-link">Purchase History</Link></li>
                                    <li><Link to="/customer/profile" className="footer-v-link">Account Profile</Link></li>
                                </ul>
                            </div>

                            {/* Column 3: Mapped Rewards Tracker Stack */}
                            <div className="col-6 col-md-4 col-lg-3 text-start">
                                <h6 className="text-white fw-bold small text-uppercase mb-3 tracking-wider" style={{ fontSize: '0.8rem' }}>Rewards & Perks</h6>
                                <ul className="list-unstyled d-flex flex-column gap-2.5 m-0 p-0" style={{ fontSize: '0.92rem' }}>
                                    <li><Link to="/customer/loyalty" className="footer-v-link text-warning-hover"><i className="bi bi-award me-1"></i>My Loyalty Points</Link></li>
                                    <li><Link to="/customer/offers" className="footer-v-link">Personalized Offers</Link></li>
                                    <li><Link to="/customer/partners" className="footer-v-link">Partner Stores</Link></li>
                                </ul>
                            </div>

                            {/* Column 4: Contact Help Desk Info Stack */}
                            <div className="col-12 col-md-4 col-lg-3 text-start">
                                <h6 className="text-white fw-bold small text-uppercase mb-3 tracking-wider" style={{ fontSize: '0.8rem' }}>Support Desk</h6>
                                <ul className="list-unstyled d-flex flex-column gap-3 m-0 p-0" style={{ fontSize: '0.88rem' }}>
                                    <li className="d-flex align-items-start gap-2 text-white-50">
                                        <i className="bi bi-geo-alt text-success mt-0.5"></i>
                                        <span>Central Market Hub, IN</span>
                                    </li>
                                    <li className="d-flex align-items-center gap-2 text-white-50">
                                        <Link to="/customer/support" className="footer-v-link">
                                            <i className="bi bi-headset"></i> Customer Support
                                        </Link>
                                    </li>
                                    <li>
                                        <Link to="/customer/contact" className="footer-v-link d-inline-flex align-items-center gap-2 px-3 py-1.5 rounded bg-secondary bg-opacity-20 border border-secondary border-opacity-25 w-100 justify-content-center">
                                            <i className="bi bi-envelope-paper"></i>Open Support Ticket
                                        </Link>
                                    </li>
                                </ul>
                            </div>

                        </div>

                        {/* Lower Metadata Borderline Baseline */}
                        <div className="pt-3 mt-4 border-top border-secondary border-opacity-25 d-flex flex-column flex-sm-row align-items-center justify-content-between gap-2" style={{ fontSize: '0.82rem' }}>
                            <span className="text-white-50 opacity-75">
                                &copy; {new Date().getFullYear()} ShopSmart Inc. All rights reserved.
                            </span>
                            <div className="d-flex gap-3">
                                <a href="#privacy" className="footer-meta-link">Privacy Policy</a>
                                <a href="#terms" className="footer-meta-link">Terms of Service</a>
                            </div>
                        </div>
                    </div>
                </footer>
            </div>

            {/* Embedded Highly Optimized Performance CSS Style Overrides */}
            <style>{`
        /* Global Layout Core Tweaks */
        .font-sans { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
        .flex-center { display: flex; align-items: center; justify-content: center; }
        .letter-spacing-sm { letter-spacing: 0.5px; }
        .tracking-wider { letter-spacing: 1.2px; }
        .gap-2\\.5 { gap: 0.65rem; }
        
        /* Smooth Content Component Fade In */
        .fade-in-animation {
          animation: fadeIn 0.35s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* Vertical Navigation Link Item Specs */
        .footer-v-link {
          color: rgba(255, 255, 255, 0.6) !important;
          text-decoration: none;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          display: inline-block;
        }
        .footer-v-link:hover {
          color: #ffffff !important;
          transform: translateX(4px);
        }
        
        .text-warning-hover:hover {
          color: #ffc107 !important;
        }

        /* Premium Circular Social Icon Buttons */
        .footer-social-circle {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background-color: rgba(255, 255, 255, 0.05);
          color: rgba(255, 255, 255, 0.6);
          text-decoration: none;
          transition: all 0.2s ease-in-out;
          border: 1px solid rgba(255, 255, 255, 0.08);
        }
        .footer-social-circle:hover {
          background-color: #198754;
          color: #ffffff;
          border-color: #198754;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(25, 135, 84, 0.25);
        }

        /* Lower Baseline Meta Anchors */
        .footer-meta-link {
          color: rgba(255, 255, 255, 0.4);
          text-decoration: none;
          transition: color 0.2s ease-in-out;
        }
        .footer-meta-link:hover {
          color: rgba(255, 255, 255, 0.8);
        }
      `}</style>
        </>
    );
}
