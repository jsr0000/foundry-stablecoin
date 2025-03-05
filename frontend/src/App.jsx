import { useState } from 'react'
import './App.css'
import { BrowserProvider } from 'ethers'
import { ethers } from 'ethers'

let provider, signer;
export async function connectWallet() {
  try {
    // Check if Ethereum provider is available
    if (window.ethereum) {
      const provider = new BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      document.getElementById('status').innerText = `Connected: ${address}`;
    } else {
      document.getElementById('status').innerText = 'Please install MetaMask!';
    }
  } catch (error) {
    console.error(error);
    document.getElementById('status').innerText = 'Connection failed';
  }
}

export async function mintTokens() {
  try {
    // Add your minting logic here
    document.getElementById('status').innerText = 'Minting tokens...';
  } catch (error) {
    console.error(error);
    document.getElementById('status').innerText = 'Minting failed';
  }
}

export async function burnTokens() {
  try {
    // Add your burning logic here
    document.getElementById('status').innerText = 'Burning tokens...';
  } catch (error) {
    console.error(error);
    document.getElementById('status').innerText = 'Burning failed';
  }
}

export async function transferTokens() {
  try {
    // Add your transfer logic here
    document.getElementById('status').innerText = 'Transferring tokens...';
  } catch (error) {
    console.error(error);
    document.getElementById('status').innerText = 'Transfer failed';
  }
}

// Make functions available on the window object
window.connectWallet = connectWallet;
window.mintTokens = mintTokens;
window.burnTokens = burnTokens;
window.transferTokens = transferTokens;

console.log('Ethers version:', ethers.version);