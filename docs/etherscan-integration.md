# Etherscan V2 API Integration

This project includes a comprehensive integration with Etherscan's V2 API for fetching transaction data across multiple blockchain networks.

## Features

- **Multi-chain Support**: Query data from 50+ supported chains with a single API key
- **Comprehensive Transaction Data**: Get detailed transaction information including:
  - Transaction details and receipt
  - Contract source code and ABI (if verified)
  - Token transfers
  - Internal transactions
  - Transaction logs
- **Modern UI**: Beautiful React component with Tailwind CSS styling
- **Type Safety**: Full TypeScript support with comprehensive type definitions

## Setup

### 1. Environment Variables

Add your Etherscan API key to your `.env` file:

```env
ETHERSCAN_API_KEY=your_api_key_here
```

### 2. Supported Chains

The integration supports the following chains:

- **1**: Ethereum Mainnet
- **10**: Optimism
- **56**: BNB Smart Chain
- **137**: Polygon
- **42161**: Arbitrum One
- **8453**: Base
- **534352**: Scroll
- **81457**: Blast
- **11155111**: Sepolia Testnet
- **80001**: Mumbai Testnet

## Usage

### Basic Usage

```typescript
import { getTransactionData, createEtherscanClient } from '@/lib/proof/etherscan';

// Get transaction data for Ethereum mainnet
const transactionData = await getTransactionData('0x...', 1);

// Create client for specific chain
const client = createEtherscanClient(42161); // Arbitrum
const data = await client.getComprehensiveTransactionData('0x...');
```

### React Component

```tsx
import { TransactionViewer } from '@/components/ui/TransactionViewer';

// Use the component
<TransactionViewer 
  defaultTxHash="0x..." 
  defaultChainId={1} 
/>
```

### API Endpoint

The integration includes a REST API endpoint:

```
GET /api/etherscan/transaction/[hash]?chainId=1
```

Example response:
```json
{
  "success": true,
  "data": {
    "transaction": { ... },
    "receipt": { ... },
    "status": { "status": "1" },
    "contractData": { ... },
    "tokenTransfers": [ ... ],
    "internalTransactions": [ ... ],
    "logs": [ ... ]
  },
  "chainId": 1,
  "chainName": "Ethereum Mainnet"
}
```

## API Methods

### EtherscanClient Class

#### `getTransactionByHash(txHash: string)`
Get basic transaction details.

#### `getTransactionReceipt(txHash: string)`
Get transaction receipt with gas usage and status.

#### `getTransactionStatus(txHash: string)`
Get transaction success/failure status.

#### `getContractSource(contractAddress: string)`
Get verified contract source code and ABI.

#### `getTokenTransfers(txHash: string)`
Get all token transfers in the transaction.

#### `getInternalTransactions(txHash: string)`
Get internal transactions (contract calls).

#### `getTransactionLogs(txHash: string)`
Get transaction event logs.

#### `getComprehensiveTransactionData(txHash: string)`
Get all transaction data in a single call.

### Utility Functions

#### `isValidTransactionHash(hash: string)`
Validate transaction hash format.

#### `formatTransactionValue(value: string, decimals: number)`
Convert wei to ether with specified decimals.

#### `getTransactionType(data)`
Determine transaction type (transfer, contract-interaction, token-transfer, unknown).

## UI Components

### TransactionViewer

A complete React component that provides:

- **Search Interface**: Chain selection and transaction hash input
- **Transaction Summary**: Key transaction details with status indicators
- **Detailed Tabs**: 
  - **Details**: Basic transaction information
  - **Contract**: Contract source code and metadata (if verified)
  - **Token Transfers**: ERC-20 token transfers
  - **Logs**: Event logs and topics

## Error Handling

The integration includes comprehensive error handling:

- Invalid transaction hash format
- Unsupported chain IDs
- API rate limiting
- Network errors
- Contract verification status

## Rate Limiting

Etherscan API has rate limits:
- Free tier: 5 calls/second
- Pro tier: 10 calls/second

The client includes built-in error handling for rate limit exceeded errors.

## Examples

### Fetch Transaction Data

```typescript
import { getTransactionData } from '@/lib/proof/etherscan';

try {
  const data = await getTransactionData('0x1234...', 1);
  console.log('Transaction status:', data.status.status);
  console.log('Gas used:', data.receipt.gasUsed);
  console.log('Token transfers:', data.tokenTransfers.length);
} catch (error) {
  console.error('Failed to fetch transaction:', error);
}
```

### Use in React Component

```tsx
import { TransactionViewer } from '@/components/ui/TransactionViewer';

export default function MyPage() {
  return (
    <div>
      <h1>Transaction Explorer</h1>
      <TransactionViewer 
        defaultTxHash="0x1234..."
        defaultChainId={42161} // Arbitrum
      />
    </div>
  );
}
```

### Custom Client Configuration

```typescript
import { EtherscanClient } from '@/lib/proof/etherscan';

const client = new EtherscanClient({
  apiKey: 'your_custom_key',
  chainId: 137, // Polygon
  baseUrl: 'https://api.etherscan.io/v2/api'
});

const data = await client.getComprehensiveTransactionData('0x...');
```

## Migration from V1

The V2 API provides several improvements:

1. **Single API Key**: Use one key for all supported chains
2. **Unified Endpoints**: Same endpoints work across all chains
3. **Better Performance**: Optimized for multi-chain applications
4. **Enhanced Features**: More comprehensive transaction data

To migrate from V1, simply update the base URL and add the `chainid` parameter to your requests.

## Troubleshooting

### Common Issues

1. **API Key Not Set**: Ensure `ETHERSCAN_API_KEY` is in your environment variables
2. **Invalid Chain ID**: Use only supported chain IDs from the `SUPPORTED_CHAINS` object
3. **Rate Limiting**: Implement exponential backoff for production applications
4. **Contract Not Verified**: Contract data will be undefined for unverified contracts

### Debug Mode

Enable debug logging by setting the environment variable:

```env
DEBUG_ETHERSCAN=true
```

This will log all API requests and responses to the console.

## Contributing

When adding new features:

1. Update TypeScript interfaces in `lib/proof/etherscan.ts`
2. Add new methods to the `EtherscanClient` class
3. Update the React component if needed
4. Add tests for new functionality
5. Update this documentation

## License

This integration is part of the SquadTrust project and follows the same license terms. 