// components/ConnectWallet.jsx
import React from 'react';

const ConnectWallet = ({ connectWallet, isLoading, error, isMetaMaskInstalled }) => {
  return (
    <div className="connect-wallet-container">
      <div className="connect-card">
        <img src="/placeholder-logo.png" alt="StableFi Logo" className="large-logo" />
        <h2>Welcome to StableFi</h2>
        <p>Connect your wallet to interact with the StableFi stablecoin protocol</p>
        
        <button 
          className="connect-button" 
          onClick={connectWallet} 
          disabled={isLoading || !isMetaMaskInstalled}
        >
          {isLoading ? 'Connecting...' : 'Connect Wallet'}
        </button>
        
        {error && <p className="error-message">{error}</p>}
        
        {!isMetaMaskInstalled && (
          <p className="metamask-suggestion">
            <a 
              href="https://metamask.io/download.html" 
              target="_blank" 
              rel="noopener noreferrer"
            >
              Download MetaMask
            </a> to interact with this application.
          </p>
        )}
        
        <div className="features">
          <div className="feature">
            <h3>Stable</h3>
            <p>Pegged 1:1 with USD</p>
          </div>
          <div className="feature">
            <h3>Secure</h3>
            <p>Fully collateralized</p>
          </div>
          <div className="feature">
            <h3>Decentralized</h3>
            <p>Community governed</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConnectWallet;