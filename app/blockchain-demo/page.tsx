import { BlockchainProjectExample } from "@/components/BlockchainProjectExample";

export default function BlockchainDemoPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            SquadTrust Blockchain Integration Demo
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            This demo showcases the blockchain integration for project creation. 
            Projects are first created on the SquadTrust smart contract, then stored in the database.
          </p>
        </div>
        
        <BlockchainProjectExample />
        
        <div className="mt-8 max-w-4xl mx-auto">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-blue-900 mb-4">
              How it works
            </h2>
            <div className="space-y-3 text-sm text-blue-800">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center text-blue-700 font-semibold text-xs">
                  1
                </div>
                <p>Connect your wallet using MetaMask or another Web3 wallet</p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center text-blue-700 font-semibold text-xs">
                  2
                </div>
                <p>Fill in the project details (title and description)</p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center text-blue-700 font-semibold text-xs">
                  3
                </div>
                <p>Click "Create Project on Blockchain" to initiate the transaction</p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center text-blue-700 font-semibold text-xs">
                  4
                </div>
                <p>The system creates the project on the SquadTrust smart contract</p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center text-blue-700 font-semibold text-xs">
                  5
                </div>
                <p>After transaction confirmation, the project is stored in the database</p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center text-blue-700 font-semibold text-xs">
                  6
                </div>
                <p>Both blockchain and database IDs are returned for future reference</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 