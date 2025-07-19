import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { signIn, signOut, useSession } from 'next-auth/react';

export interface WalletState {
  address: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
}

export const useWallet = () => {
  const { data: session, status } = useSession();
  const [state, setState] = useState<WalletState>({
    address: null,
    isConnected: false,
    isConnecting: false,
    error: null,
  });

  useEffect(() => {
    if (session?.user?.walletAddress) {
      setState(prev => ({
        ...prev,
        address: session.user.walletAddress,
        isConnected: true,
      }));
    }
  }, [session]);

  const connectWallet = async () => {
    setState(prev => ({ ...prev, isConnecting: true, error: null }));

    try {
      // Check if MetaMask is installed
      if (!window.ethereum) {
        throw new Error('MetaMask is not installed. Please install MetaMask to continue.');
      }

      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      const address = accounts[0];
      if (!address) {
        throw new Error('No wallet address found.');
      }

      // Create a message to sign
      const message = `Sign this message to authenticate with SquadTrust.\n\nWallet: ${address}\nTimestamp: ${Date.now()}`;

      // Request signature
      const signature = await window.ethereum.request({
        method: 'personal_sign',
        params: [message, address],
      });

      // Sign in with NextAuth
      const result = await signIn('wallet', {
        walletAddress: address,
        signature,
        message,
        redirect: false,
      });

      if (result?.error) {
        throw new Error('Authentication failed. Please try again.');
      }

      setState(prev => ({
        ...prev,
        address,
        isConnected: true,
        isConnecting: false,
      }));

    } catch (error: any) {
      setState(prev => ({
        ...prev,
        error: error.message || 'Failed to connect wallet',
        isConnecting: false,
      }));
    }
  };

  const disconnectWallet = async () => {
    await signOut({ redirect: false });
    setState({
      address: null,
      isConnected: false,
      isConnecting: false,
      error: null,
    });
  };

  return {
    ...state,
    connectWallet,
    disconnectWallet,
    session,
    status,
  };
};

// Extend Window interface for TypeScript
declare global {
  interface Window {
    ethereum?: any;
  }
} 