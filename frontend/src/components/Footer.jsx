import React from 'react';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-section">
          <h3>StableFi</h3>
          <p>A decentralized stablecoin protocol built on Ethereum</p>
        </div>
        
        <div className="footer-section">
          <h3>Resources</h3>
          <a href="#docs">Documentation</a>
          <a href="#github">GitHub</a>
          <a href="#audit">Audit Report</a>
        </div>
        
        <div className="footer-section">
          <h3>Community</h3>
          <a href="#discord">Discord</a>
          <a href="#twitter">Twitter</a>
          <a href="#telegram">Telegram</a>
        </div>
      </div>
      
      <div className="footer-bottom">
        <p>&copy; 2025 StableFi. All rights reserved.</p>
      </div>
    </footer>
  );
};
export default Footer;