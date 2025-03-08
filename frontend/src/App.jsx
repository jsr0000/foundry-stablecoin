// App.jsx
import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import './App.css';
import StablecoinABI from './contracts/StablecoinABI.json';

// Components
import Navbar from './components/Navbar.jsx';
import ConnectWallet from './components/ConnectWallet.jsx';
import StablecoinDashboard from './components/Dashboard.jsx';
import Footer from './components/Footer.jsx';

function App() {
  const [account, setAccount] = useState('');
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [contract, setContract] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isMetaMaskInstalled, setIsMetaMaskInstalled] = useState(false);

  // Replace with your deployed contract address
  const contractAddress = '0xEd9014597218ab886faA057B23E2bF9C0F9FbbfB';

  // Check if MetaMask is installed
  useEffect(() => {
    const checkMetaMaskInstalled = () => {
      if (window.ethereum) {
        setIsMetaMaskInstalled(true);
      } else {
        setIsMetaMaskInstalled(false);
        setError('Please install MetaMask to use this application');
      }
    };

    checkMetaMaskInstalled();
  }, []);

  const connectWallet = async () => {
    if (!isMetaMaskInstalled) {
      setError('Please install MetaMask');
      return;
    }

    try {
      setIsLoading(true);
      setError('');

      // This line explicitly requests MetaMask to open
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });

      if (accounts.length > 0) {
        // Create ethers provider and signer
        const web3Provider = new ethers.BrowserProvider(window.ethereum);
        const web3Signer = await web3Provider.getSigner();

        try {
          // Make sure to access the first array in the ABI structure
          const stablecoinContract = new ethers.Contract(
            contractAddress,
            StablecoinABI.abi[0], // Access the first array in the ABI structure
            web3Signer
          );

          setAccount(accounts[0]);
          setProvider(web3Provider);
          setSigner(web3Signer);
          setContract(stablecoinContract);
        } catch (contractError) {
          console.error("Contract initialization error:", contractError);
          // Still set the account even if contract fails
          setAccount(accounts[0]);
          setError(`Contract initialization error: ${contractError.message}`);
        }
      }
    } catch (err) {
      console.error("Wallet connection error:", err);
      if (err.code === 4001) {
        // User rejected the request
        setError('Connection rejected. Please approve the MetaMask connection.');
      } else {
        setError('Failed to connect wallet: ' + (err.message || 'Unknown error'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const disconnect = () => {
    setAccount('');
    setProvider(null);
    setSigner(null);
    setContract(null);
  };

  useEffect(() => {
    // Set up event listeners if MetaMask is installed
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length > 0) {
          connectWallet();
        } else {
          disconnect();
        }
      });

      window.ethereum.on('chainChanged', () => {
        window.location.reload();
      });

      // Clean up event listeners when component unmounts
      return () => {
        window.ethereum.removeListener('accountsChanged', connectWallet);
        window.ethereum.removeListener('chainChanged', () => {
          window.location.reload();
        });
      };
    }
  }, [isMetaMaskInstalled]);

  return (
    <div className="app">
      <Navbar account={account} />

      <main className="container">
        {!account ? (
          <ConnectWallet
            connectWallet={connectWallet}
            isLoading={isLoading}
            error={error}
            isMetaMaskInstalled={isMetaMaskInstalled}
          />
        ) : (
          <StablecoinDashboard
            account={account}
            contract={contract}
          />
        )}
      </main>

      <Footer />
    </div>
  );
}

export default App;