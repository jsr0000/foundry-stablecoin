import React from 'react';
import { truncateAddress } from '../utils/helper.js';

const Navbar = ({ account }) => {
  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <img src="/public/leaf-svgrepo-com.svg" alt="StableFi Logo" className="logo" />
        <h1>LEAF</h1>
      </div>
      
      {/* <div className="navbar-menu">
        <a href="#dashboard" className="nav-link active">Dashboard</a>
        <a href="#mint" className="nav-link">Mint</a>
        <a href="#redeem" className="nav-link">Redeem</a>
        <a href="#stake" className="nav-link">Stake</a>
      </div> */}
      
      <div className="wallet-info">
        {account && (
          <div className="address-badge">
            <div className="address-dot"></div>
            <span>{truncateAddress(account)}</span>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;