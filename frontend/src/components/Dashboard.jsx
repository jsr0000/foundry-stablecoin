import React, { useState } from 'react';
import { ethers } from 'ethers';

const StablecoinDashboard = ({ account, balance, contract }) => {
  const [mintAmount, setMintAmount] = useState('');
  const [redeemAmount, setRedeemAmount] = useState('');
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [txPending, setTxPending] = useState(false);
  const [txStatus, setTxStatus] = useState('');

  const handleMint = async () => {
    if (!contract || !mintAmount) return;
    
    try {
      setTxPending(true);
      setTxStatus('Minting tokens...');
      
      // This assumes your contract has a mint function that requires collateral
      // Adjust according to your actual contract implementation
      const tx = await contract.mint(
        ethers.utils.parseUnits(mintAmount, 18),
        { value: ethers.utils.parseEther(mintAmount) }
      );
      
      setTxStatus('Transaction submitted. Waiting for confirmation...');
      await tx.wait();
      
      setTxStatus('Tokens minted successfully!');
      setMintAmount('');
      
      // Refresh balance
      const userBalance = await contract.balanceOf(account);
      setBalance(ethers.utils.formatUnits(userBalance, 18));
    } catch (err) {
      console.error(err);
      setTxStatus(`Error: ${err.message}`);
    } finally {
      setTxPending(false);
      setTimeout(() => setTxStatus(''), 5000);
    }
  };

  const handleRedeem = async () => {
    if (!contract || !redeemAmount) return;
    
    try {
      setTxPending(true);
      setTxStatus('Redeeming tokens...');
      
      // This assumes your contract has a redeem function
      // Adjust according to your actual contract implementation
      const tx = await contract.redeem(
        ethers.utils.parseUnits(redeemAmount, 18)
      );
      
      setTxStatus('Transaction submitted. Waiting for confirmation...');
      await tx.wait();
      
      setTxStatus('Tokens redeemed successfully!');
      setRedeemAmount('');
      
      // Refresh balance
      const userBalance = await contract.balanceOf(account);
      setBalance(ethers.utils.formatUnits(userBalance, 18));
    } catch (err) {
      console.error(err);
      setTxStatus(`Error: ${err.message}`);
    } finally {
      setTxPending(false);
      setTimeout(() => setTxStatus(''), 5000);
    }
  };

  return (
    <div className="dashboard-container">
      <div className="balance-card">
        <h2>Your Balance</h2>
        <div className="token-balance">
          <span className="currency-symbol">$</span>
          <span className="balance-amount">{parseFloat(balance).toFixed(2)}</span>
        </div>
        <p className="balance-usd">≈ ${parseFloat(balance).toFixed(2)} USD</p>
      </div>
      
      <div className="action-tabs">
        <div className="tab-headers">
          <button 
            className={`tab-btn ${currentTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setCurrentTab('dashboard')}
          >
            Dashboard
          </button>
          <button 
            className={`tab-btn ${currentTab === 'mint' ? 'active' : ''}`}
            onClick={() => setCurrentTab('mint')}
          >
            Mint
          </button>
          <button 
            className={`tab-btn ${currentTab === 'redeem' ? 'active' : ''}`}
            onClick={() => setCurrentTab('redeem')}
          >
            Redeem
          </button>
          <button 
            className={`tab-btn ${currentTab === 'stake' ? 'active' : ''}`}
            onClick={() => setCurrentTab('stake')}
          >
            Stake
          </button>
        </div>
        
        <div className="tab-content">
          {currentTab === 'dashboard' && (
            <div className="dashboard-tab">
              <div className="stats-row">
                <div className="stat-card">
                  <h3>Total Supply</h3>
                  <p>10,000,000</p>
                </div>
                <div className="stat-card">
                  <h3>Collateral Ratio</h3>
                  <p>150%</p>
                </div>
                <div className="stat-card">
                  <h3>APY</h3>
                  <p>5.2%</p>
                </div>
              </div>
              
              <div className="recent-transactions">
                <h3>Recent Transactions</h3>
                <div className="transaction-list">
                  <div className="transaction-item">
                    <div className="tx-type mint">Mint</div>
                    <div className="tx-amount">+100.00</div>
                    <div className="tx-date">Mar 6, 2025</div>
                  </div>
                  <div className="transaction-item">
                    <div className="tx-type redeem">Redeem</div>
                    <div className="tx-amount">-50.00</div>
                    <div className="tx-date">Mar 5, 2025</div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {currentTab === 'mint' && (
            <div className="mint-tab">
              <h3>Mint Tokens</h3>
              <p>Mint new stablecoins by providing collateral</p>
              
              <div className="input-group">
                <input
                  type="number"
                  placeholder="Amount to mint"
                  value={mintAmount}
                  onChange={(e) => setMintAmount(e.target.value)}
                  disabled={txPending}
                />
                <button 
                  className="action-button" 
                  onClick={handleMint}
                  disabled={!mintAmount || txPending}
                >
                  {txPending ? 'Processing...' : 'Mint Tokens'}
                </button>
              </div>
              
              {txStatus && <p className="tx-status">{txStatus}</p>}
              
              <div className="info-box">
                <p>Collateral required: {mintAmount ? `${parseFloat(mintAmount) * 1.5} ETH` : '0 ETH'}</p>
                <p>You will receive: {mintAmount ? `${mintAmount} StableFi tokens` : '0 StableFi tokens'}</p>
              </div>
            </div>
          )}
          
          {currentTab === 'redeem' && (
            <div className="redeem-tab">
              <h3>Redeem Tokens</h3>
              <p>Redeem your stablecoins for collateral</p>
              
              <div className="input-group">
                <input
                  type="number"
                  placeholder="Amount to redeem"
                  value={redeemAmount}
                  onChange={(e) => setRedeemAmount(e.target.value)}
                  disabled={txPending}
                />
                <button 
                  className="action-button" 
                  onClick={handleRedeem}
                  disabled={!redeemAmount || txPending || parseFloat(redeemAmount) > parseFloat(balance)}
                >
                  {txPending ? 'Processing...' : 'Redeem Tokens'}
                </button>
              </div>
              
              {txStatus && <p className="tx-status">{txStatus}</p>}
              
              <div className="info-box">
                <p>You will receive: {redeemAmount ? `${parseFloat(redeemAmount) / 1.5} ETH` : '0 ETH'}</p>
                <p>Maximum redeemable: {balance} StableFi tokens</p>
              </div>
            </div>
          )}
          
          {currentTab === 'stake' && (
            <div className="stake-tab">
              <h3>Stake Tokens</h3>
              <p>Stake your tokens to earn rewards</p>
              
              <div className="coming-soon">
                <img src="/api/placeholder/64/64" alt="Coming Soon" />
                <h4>Staking Coming Soon</h4>
                <p>This feature will be available in the next update</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StablecoinDashboard;