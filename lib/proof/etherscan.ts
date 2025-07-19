// Etherscan V2 API Types and Configuration
export interface EtherscanConfig {
  apiKey: string;
  baseUrl?: string;
  chainId?: number;
}

export interface TransactionData {
  hash: string;
  nonce: string;
  blockHash: string;
  blockNumber: string;
  transactionIndex: string;
  from: string;
  to: string;
  value: string;
  gas: string;
  gasPrice: string;
  input: string;
  contractAddress?: string;
  cumulativeGasUsed: string;
  gasUsed: string;
  logs: Log[];
  status: string;
  confirmations: string;
  timestamp: string;
}

export interface Log {
  address: string;
  topics: string[];
  data: string;
  blockNumber: string;
  transactionHash: string;
  transactionIndex: string;
  blockHash: string;
  logIndex: string;
  removed: boolean;
}

export interface ContractData {
  contractAddress: string;
  contractName: string;
  compilerVersion: string;
  optimization: string;
  sourceCode: string;
  abi: string;
  constructorArguments: string;
  evmVersion: string;
  library: string;
  licenseType: string;
  proxy: string;
  implementation: string;
  swarmSource: string;
}

export interface TokenTransfer {
  blockNumber: string;
  timeStamp: string;
  hash: string;
  nonce: string;
  blockHash: string;
  from: string;
  contractAddress: string;
  to: string;
  value: string;
  tokenName: string;
  tokenSymbol: string;
  tokenDecimal: string;
  transactionIndex: string;
  gas: string;
  gasPrice: string;
  gasUsed: string;
  cumulativeGasUsed: string;
  input: string;
  confirmations: string;
}

export interface EtherscanApiResponse<T> {
  status: string;
  message: string;
  result: T;
}

// Default configuration
const DEFAULT_CONFIG: EtherscanConfig = {
  apiKey: process.env.ETHERSCAN_API_KEY || '',
  baseUrl: 'https://api.etherscan.io/v2/api',
  chainId: 1, // Ethereum mainnet
};

// Supported chains for V2 API
export const SUPPORTED_CHAINS = {
  1: 'Ethereum Mainnet',
  10: 'Optimism',
  56: 'BNB Smart Chain',
  137: 'Polygon',
  42161: 'Arbitrum One',
  8453: 'Base',
  534352: 'Scroll',
  81457: 'Blast',
  11155111: 'Sepolia Testnet',
  80001: 'Mumbai Testnet',
} as const;

export type SupportedChainId = keyof typeof SUPPORTED_CHAINS;

/**
 * Etherscan V2 API Client
 */
export class EtherscanClient {
  private config: EtherscanConfig;

  constructor(config?: Partial<EtherscanConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Build API URL with parameters
   */
  private buildUrl(params: Record<string, string | number>): string {
    const url = new URL(this.config.baseUrl!);
    url.searchParams.set('chainid', this.config.chainId!.toString());
    url.searchParams.set('apikey', this.config.apiKey);
    
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value.toString());
    });

    return url.toString();
  }

  /**
   * Make API request
   */
  private async makeRequest<T>(params: Record<string, string | number>): Promise<T> {
    const url = this.buildUrl(params);
    
    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data: EtherscanApiResponse<T> = await response.json();
      
      if (data.status === '0') {
        throw new Error(`Etherscan API error: ${data.message}`);
      }
      
      return data.result;
    } catch (error) {
      console.error('Etherscan API request failed:', error);
      throw error;
    }
  }

  /**
   * Get transaction details by hash
   */
  async getTransactionByHash(txHash: string): Promise<TransactionData> {
    return this.makeRequest<TransactionData>({
      module: 'proxy',
      action: 'eth_getTransactionByHash',
      txhash: txHash,
    });
  }

  /**
   * Get transaction receipt by hash
   */
  async getTransactionReceipt(txHash: string): Promise<TransactionData> {
    return this.makeRequest<TransactionData>({
      module: 'proxy',
      action: 'eth_getTransactionReceipt',
      txhash: txHash,
    });
  }

  /**
   * Get transaction status (success/failed)
   */
  async getTransactionStatus(txHash: string): Promise<{ status: string }> {
    return this.makeRequest<{ status: string }>({
      module: 'transaction',
      action: 'gettxreceiptstatus',
      txhash: txHash,
    });
  }

  /**
   * Get contract source code and ABI
   */
  async getContractSource(contractAddress: string): Promise<ContractData> {
    return this.makeRequest<ContractData>({
      module: 'contract',
      action: 'getsourcecode',
      address: contractAddress,
    });
  }

  /**
   * Get token transfers for a transaction
   */
  async getTokenTransfers(txHash: string): Promise<TokenTransfer[]> {
    return this.makeRequest<TokenTransfer[]>({
      module: 'account',
      action: 'tokentx',
      txhash: txHash,
    });
  }

  /**
   * Get internal transactions
   */
  async getInternalTransactions(txHash: string): Promise<TransactionData[]> {
    return this.makeRequest<TransactionData[]>({
      module: 'account',
      action: 'txlistinternal',
      txhash: txHash,
    });
  }

  /**
   * Get transaction logs
   */
  async getTransactionLogs(txHash: string): Promise<Log[]> {
    return this.makeRequest<Log[]>({
      module: 'logs',
      action: 'getLogs',
      txhash: txHash,
    });
  }

  /**
   * Get comprehensive transaction data
   */
  async getComprehensiveTransactionData(txHash: string): Promise<{
    transaction: TransactionData;
    receipt: TransactionData;
    status: { status: string };
    contractData?: ContractData;
    tokenTransfers: TokenTransfer[];
    internalTransactions: TransactionData[];
    logs: Log[];
  }> {
    try {
      const [
        transaction,
        receipt,
        status,
        tokenTransfers,
        internalTransactions,
        logs,
      ] = await Promise.all([
        this.getTransactionByHash(txHash),
        this.getTransactionReceipt(txHash),
        this.getTransactionStatus(txHash),
        this.getTokenTransfers(txHash),
        this.getInternalTransactions(txHash),
        this.getTransactionLogs(txHash),
      ]);

      // Get contract data if transaction involves a contract
      let contractData: ContractData | undefined;
      if (transaction.to && transaction.to !== '0x') {
        try {
          contractData = await this.getContractSource(transaction.to);
        } catch (error) {
          // Contract might not be verified or might not exist
          console.warn('Could not fetch contract data:', error);
        }
      }

      return {
        transaction,
        receipt,
        status,
        contractData,
        tokenTransfers,
        internalTransactions,
        logs,
      };
    } catch (error) {
      console.error('Failed to get comprehensive transaction data:', error);
      throw error;
    }
  }

  /**
   * Parse transaction input data using ABI
   */
  parseTransactionInput(inputData: string, abi?: string): any {
    if (!abi || inputData === '0x') {
      return null;
    }

    try {
      // This would require ethers.js or similar library to parse ABI
      // For now, return the raw input data
      return {
        rawInput: inputData,
        methodId: inputData.slice(0, 10),
        parameters: inputData.slice(10),
      };
    } catch (error) {
      console.error('Failed to parse transaction input:', error);
      return null;
    }
  }

  /**
   * Get transaction summary
   */
  getTransactionSummary(data: {
    transaction: TransactionData;
    receipt: TransactionData;
    status: { status: string };
    contractData?: ContractData;
    tokenTransfers: TokenTransfer[];
    internalTransactions: TransactionData[];
  }): {
    hash: string;
    status: string;
    from: string;
    to: string;
    value: string;
    gasUsed: string;
    gasPrice: string;
    totalCost: string;
    blockNumber: string;
    timestamp: string;
    isContractInteraction: boolean;
    contractName?: string;
    tokenTransfersCount: number;
    internalTransactionsCount: number;
  } {
    const { transaction, receipt, status, contractData, tokenTransfers, internalTransactions } = data;
    
    const gasUsed = receipt.gasUsed || '0';
    const gasPrice = transaction.gasPrice || '0';
    const totalCost = (BigInt(gasUsed) * BigInt(gasPrice)).toString();
    
    return {
      hash: transaction.hash,
      status: status.status,
      from: transaction.from,
      to: transaction.to,
      value: transaction.value,
      gasUsed,
      gasPrice,
      totalCost,
      blockNumber: transaction.blockNumber,
      timestamp: transaction.timestamp || '',
      isContractInteraction: transaction.to !== '0x' && transaction.input !== '0x',
      contractName: contractData?.contractName,
      tokenTransfersCount: tokenTransfers.length,
      internalTransactionsCount: internalTransactions.length,
    };
  }
}

/**
 * Utility function to create Etherscan client with default configuration
 */
export function createEtherscanClient(chainId?: SupportedChainId): EtherscanClient {
  return new EtherscanClient({
    chainId: chainId || 1,
  });
}

/**
 * Utility function to get transaction data for a specific chain
 */
export async function getTransactionData(
  txHash: string,
  chainId: SupportedChainId = 1
): Promise<ReturnType<EtherscanClient['getComprehensiveTransactionData']>> {
  const client = createEtherscanClient(chainId);
  return client.getComprehensiveTransactionData(txHash);
}

/**
 * Utility function to validate transaction hash format
 */
export function isValidTransactionHash(hash: string): boolean {
  return /^0x([A-Fa-f0-9]{64})$/.test(hash);
}

/**
 * Utility function to format transaction value from wei to ether
 */
export function formatTransactionValue(value: string, decimals: number = 18): string {
  const wei = BigInt(value);
  const ether = Number(wei) / Math.pow(10, decimals);
  return ether.toFixed(6);
}

/**
 * Utility function to get transaction type
 */
export function getTransactionType(data: {
  transaction: TransactionData;
  contractData?: ContractData;
  tokenTransfers: TokenTransfer[];
}): 'transfer' | 'contract-interaction' | 'token-transfer' | 'unknown' {
  const { transaction, contractData, tokenTransfers } = data;
  
  if (tokenTransfers.length > 0) {
    return 'token-transfer';
  }
  
  if (contractData && transaction.input !== '0x') {
    return 'contract-interaction';
  }
  
  if (transaction.value !== '0x0' && transaction.input === '0x') {
    return 'transfer';
  }
  
  return 'unknown';
}
