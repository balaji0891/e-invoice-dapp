import React from 'react';
import { formatAddress } from '../utils/helpers';

interface WalletConnectProps {
  account: string;
  isConnected: boolean;
  isCorrectNetwork: boolean;
  error: string;
  onConnect: () => void;
  onDisconnect: () => void;
  onSwitchNetwork: () => void;
}

export const WalletConnect: React.FC<WalletConnectProps> = ({
  account,
  isConnected,
  isCorrectNetwork,
  error,
  onConnect,
  onDisconnect,
  onSwitchNetwork,
}) => {
  return (
    <div className="flex items-center gap-4">
      {error && (
        <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
          {error}
        </div>
      )}

      {isConnected && !isCorrectNetwork && (
        <button
          onClick={onSwitchNetwork}
          className="btn-danger text-sm"
        >
          Switch to Sepolia
        </button>
      )}

      {isConnected ? (
        <div className="flex items-center gap-3">
          <div className="bg-green-100 text-green-700 px-4 py-2 rounded-lg font-medium text-sm">
            {formatAddress(account)}
          </div>
          <button onClick={onDisconnect} className="btn-secondary text-sm">
            Disconnect
          </button>
        </div>
      ) : (
        <button onClick={onConnect} className="btn-primary">
          Connect Wallet
        </button>
      )}
    </div>
  );
};
