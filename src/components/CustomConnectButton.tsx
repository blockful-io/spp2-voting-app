import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useVotingPower } from '@/hooks/useVotingPower';
import { useAccount } from 'wagmi';
import { useState } from 'react';
import { InfoIcon } from 'lucide-react';

export function CustomConnectButton() {
  const { address, isConnected } = useAccount();
  const { data: votingPower, isLoading } = useVotingPower();
  const [showTooltip, setShowTooltip] = useState(false);

  // Format voting power to display with commas and 2 decimal places
  const formattedVp = votingPower ? votingPower.toLocaleString(undefined, { 
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }) : '0';

  return (
    <ConnectButton.Custom>
      {({
        account,
        chain,
        openAccountModal,
        openChainModal,
        openConnectModal,
        authenticationStatus,
        mounted,
      }) => {
        // Note: If your app doesn't use authentication, you
        // can remove all 'authenticationStatus' checks
        const ready = mounted && authenticationStatus !== 'loading';
        const connected =
          ready &&
          account &&
          chain &&
          (!authenticationStatus ||
            authenticationStatus === 'authenticated');

        return (
          <div
            {...(!ready && {
              'aria-hidden': true,
              'style': {
                opacity: 0,
                pointerEvents: 'none',
                userSelect: 'none',
              },
            })}
          >
            {(() => {
              if (!connected) {
                return (
                  <button 
                    onClick={openConnectModal} 
                    type="button"
                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200"
                  >
                    Connect Wallet
                  </button>
                );
              }

              if (chain.unsupported) {
                return (
                  <button 
                    onClick={openChainModal} 
                    type="button"
                    className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200"
                  >
                    Wrong network
                  </button>
                );
              }

              return (
                <div className="flex items-center gap-3">
                  {isConnected && (
                    <div 
                      className="relative flex items-center gap-1 bg-gray-800 py-1 px-3 rounded-md text-gray-200"
                      onMouseEnter={() => setShowTooltip(true)}
                      onMouseLeave={() => setShowTooltip(false)}
                    >
                      <span className="text-xs font-semibold">VP:</span>
                      <span className="text-sm">
                        {isLoading ? '...' : formattedVp}
                      </span>
                      <InfoIcon className="ml-1 w-3.5 h-3.5 text-gray-400" />
                      {showTooltip && (
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-1.5 bg-black text-white text-xs rounded-md shadow-lg whitespace-nowrap z-10">
                          ENS Voting Power for current proposal
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mt-1">
                            <div className="border-x-4 border-b-4 border-x-transparent border-b-black"></div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  <button
                    onClick={openAccountModal}
                    type="button"
                    className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200"
                  >
                    {account.ensAvatar && (
                      <img 
                        src={account.ensAvatar} 
                        alt={account.displayName} 
                        className="w-5 h-5 rounded-full"
                      />
                    )}
                    {account.displayName}
                  </button>
                </div>
              );
            })()}
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
} 