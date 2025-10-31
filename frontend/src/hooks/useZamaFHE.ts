import { useState, useEffect } from 'react';
import { initFhevm, createInstance } from '@zama-fhe/relayer-sdk';
import {
  ZAMA_RELAYER_URL,
  ZAMA_KMS_CONTRACT,
  ZAMA_ACL_CONTRACT,
  SEPOLIA_CHAIN_ID,
} from '../utils/constants';

export const useZamaFHE = () => {
  const [fhevmInstance, setFhevmInstance] = useState<any>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const initZama = async () => {
      try {
        console.log('Initializing Zama FHEVM...');
        await initFhevm();

        const instance = await createInstance({
          kmsContractAddress: ZAMA_KMS_CONTRACT,
          aclContractAddress: ZAMA_ACL_CONTRACT,
          relayerUrl: ZAMA_RELAYER_URL,
          gatewayChainId: SEPOLIA_CHAIN_ID,
        });

        setFhevmInstance(instance);
        setIsInitialized(true);
        console.log('Zama FHEVM initialized successfully');
      } catch (err: any) {
        console.error('Failed to initialize Zama FHEVM:', err);
        setError(err.message || 'Failed to initialize encryption system');
      }
    };

    initZama();
  }, []);

  const encryptAmount = async (amount: number, contractAddress: string, userAddress: string): Promise<{ handles: string[]; inputProof: string } | null> => {
    if (!fhevmInstance) {
      setError('Encryption system not initialized');
      return null;
    }

    try {
      const encryptedInput = fhevmInstance.createEncryptedInput(contractAddress, userAddress);
      encryptedInput.add64(BigInt(amount));
      const encrypted = await encryptedInput.encrypt();
      return encrypted;
    } catch (err: any) {
      console.error('Encryption error:', err);
      setError(err.message || 'Failed to encrypt amount');
      return null;
    }
  };

  const decryptAmount = async (
    contractAddress: string,
    encryptedValue: any
  ): Promise<string | null> => {
    if (!fhevmInstance) {
      setError('Decryption system not initialized');
      return null;
    }

    try {
      const decrypted = await fhevmInstance.decrypt(contractAddress, encryptedValue);
      return decrypted.toString();
    } catch (err: any) {
      console.error('Decryption error:', err);
      setError(err.message || 'Failed to decrypt amount');
      return null;
    }
  };

  return {
    fhevmInstance,
    isInitialized,
    error,
    encryptAmount,
    decryptAmount,
  };
};
