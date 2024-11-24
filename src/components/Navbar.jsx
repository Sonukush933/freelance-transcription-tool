import React from "react";
import { useNavigate } from "react-router-dom";
import "./style.css";

const Navbar = () => {
  const navigate = useNavigate();

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div
          className="navbar-logo"
          onClick={() => navigate("/")}
        
        >
         <img src="https://png.pngtree.com/png-clipart/20230319/original/pngtree-freelancer-logos-png-image_8996932.png" alt="" />
        </div>
        <ul className="navbar-links">
          <li>
            <button
              onClick={() => navigate("/")}
              className="navbar-button"
            >
              Home
            </button>
          </li>
          <li>
            <button
              onClick={() => navigate("/SpeechPage")}
              className="navbar-button"
            >
              Try Demo
            </button>
          </li>
      
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;
