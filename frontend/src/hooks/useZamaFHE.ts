import { useState, useEffect } from 'react';
import { CONTRACT_ADDRESS } from '../utils/constants';

// Check if we're in demo mode
const DEMO_MODE = !CONTRACT_ADDRESS;

export const useZamaFHE = () => {
  const [fhevmInstance, setFhevmInstance] = useState<any>(null);
  const [isInitialized, setIsInitialized] = useState(DEMO_MODE); // Auto-initialize in demo mode
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (DEMO_MODE) {
      // Skip SDK initialization in demo mode
      console.log('Demo mode: Skipping Zama SDK initialization');
      return;
    }

    const initZama = async () => {
      try {
        console.log('Initializing Zama FHEVM...');
        
        console.log('Step 1: Importing SDK...');
        const sdk = await import('@zama-fhe/relayer-sdk/web');
        console.log('Step 2: SDK imported successfully', Object.keys(sdk));
        
        const { initSDK, createInstance, SepoliaConfig } = sdk;
        
        console.log('Step 3: Calling initSDK...');
        await initSDK();
        console.log('Step 4: initSDK completed');

        console.log('Step 5: Creating instance with SepoliaConfig...');
        const instance = await createInstance(SepoliaConfig);
        console.log('Step 6: Instance created successfully');

        setFhevmInstance(instance);
        setIsInitialized(true);
        console.log('Zama FHEVM initialized successfully');
      } catch (err: any) {
        console.error('Failed to initialize Zama FHEVM:', err);
        console.error('Error details:', {
          message: err?.message,
          stack: err?.stack,
          name: err?.name,
          cause: err?.cause
        });
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
