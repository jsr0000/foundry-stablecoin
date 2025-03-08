import React from 'react';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-section">
          <h3>Leaf</h3>
          <p>A decentralized stablecoin protocol built on Ethereum Sepolia (Not Production)</p>
        </div>
        
        <div className="footer-section">
          <h3>Resources</h3>
          <a href="https://github.com/jsr0000/foundry-stablecoin">GitHub</a>
        </div>
        
        <div className="footer-section">
          <h3>Builder</h3>
          <a href="https://www.linkedin.com/in/josh-regnart-567651239/">LinkedIn</a>
          <a href="https://github.com/jsr0000">Github</a>
        </div>
      </div>
      
      <div className="footer-bottom">
        <p>&copy; 2025 Leaf. All rights reserved.</p>
      </div>
    </footer>
  );
};
export default Footer;