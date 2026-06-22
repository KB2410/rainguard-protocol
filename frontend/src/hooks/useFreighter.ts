import { useState, useEffect } from 'react';
import {
  isConnected,
  isAllowed,
  requestAccess,
  signTransaction,
  setAllowed
} from '@stellar/freighter-api';

export function useFreighter() {
  const [walletConnected, setWalletConnected] = useState(false);
  const [address, setAddress] = useState<string | null>(null);

  useEffect(() => {
    const checkConnection = async () => {
      try {
        if (await isConnected()) {
          const allowed = await isAllowed();
          if (allowed) {
            const user = await requestAccess();
            setAddress(user.address);
            setWalletConnected(true);
          }
        }
      } catch (e) {
        console.error("Freighter connection error", e);
      }
    };
    checkConnection();
  }, []);

  const connect = async () => {
    try {
      if (await isConnected()) {
        await setAllowed();
        const user = await requestAccess();
        setAddress(user.address);
        setWalletConnected(true);
      } else {
        alert("Freighter is not installed or locked.");
      }
    } catch (e) {
      console.error(e);
    }
  };

  return { walletConnected, address, connect, signTransaction };
}
