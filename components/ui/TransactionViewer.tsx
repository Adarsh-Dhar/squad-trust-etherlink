'use client';

import React, { useState } from 'react';
import { 
  getTransactionData, 
  isValidTransactionHash, 
  formatTransactionValue,
  getTransactionType,
  SUPPORTED_CHAINS,
  type SupportedChainId 
} from '@/lib/proof/etherscan';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, ExternalLink, Copy, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface TransactionViewerProps {
  defaultTxHash?: string;
  defaultChainId?: SupportedChainId;
}

export function TransactionViewer({ defaultTxHash = '', defaultChainId = 1 }: TransactionViewerProps) {
  const [txHash, setTxHash] = useState(defaultTxHash);
  const [chainId, setChainId] = useState<SupportedChainId>(defaultChainId);
  const [loading, setLoading] = useState(false);
  const [transactionData, setTransactionData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!isValidTransactionHash(txHash)) {
      setError('Invalid transaction hash format');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await getTransactionData(txHash, chainId);
      setTransactionData(data);
      toast.success('Transaction data loaded successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch transaction data');
      toast.error('Failed to fetch transaction data');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const getStatusIcon = (status: string) => {
    if (status === '1') return <CheckCircle className="h-4 w-4 text-green-500" />;
    if (status === '0') return <XCircle className="h-4 w-4 text-red-500" />;
    return <AlertCircle className="h-4 w-4 text-yellow-500" />;
  };

  const getStatusText = (status: string) => {
    if (status === '1') return 'Success';
    if (status === '0') return 'Failed';
    return 'Unknown';
  };

  const getTransactionTypeInfo = () => {
    if (!transactionData) return null;
    
    const type = getTransactionType(transactionData);
    const typeColors = {
      'transfer': 'bg-blue-100 text-blue-800',
      'contract-interaction': 'bg-purple-100 text-purple-800',
      'token-transfer': 'bg-green-100 text-green-800',
      'unknown': 'bg-gray-100 text-gray-800',
    };

    return (
      <Badge className={typeColors[type]}>
        {type.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
      </Badge>
    );
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Transaction Viewer</h1>
        <p className="text-muted-foreground">
          View comprehensive transaction data across multiple chains using Etherscan V2 API
        </p>
      </div>

      {/* Search Form */}
      <Card>
        <CardHeader>
          <CardTitle>Search Transaction</CardTitle>
          <CardDescription>
            Enter a transaction hash to view detailed information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="chain">Chain</Label>
              <Select value={chainId.toString()} onValueChange={(value) => setChainId(Number(value) as SupportedChainId)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select chain" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(SUPPORTED_CHAINS).map(([id, name]) => (
                    <SelectItem key={id} value={id}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="txHash">Transaction Hash</Label>
              <div className="flex gap-2">
                <Input
                  id="txHash"
                  placeholder="0x..."
                  value={txHash}
                  onChange={(e) => setTxHash(e.target.value)}
                  className="flex-1"
                />
                <Button 
                  onClick={handleSearch} 
                  disabled={loading || !txHash}
                  className="min-w-[100px]"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading
                    </>
                  ) : (
                    'Search'
                  )}
                </Button>
              </div>
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Transaction Data */}
      {transactionData && (
        <div className="space-y-6">
          {/* Summary Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Transaction Summary</CardTitle>
                  <CardDescription>
                    {SUPPORTED_CHAINS[chainId]} • Block #{transactionData.transaction.blockNumber}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusIcon(transactionData.status.status)}
                  <Badge variant={transactionData.status.status === '1' ? 'default' : 'destructive'}>
                    {getStatusText(transactionData.status.status)}
                  </Badge>
                  {getTransactionTypeInfo()}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Transaction Hash</Label>
                  <div className="flex items-center gap-2">
                    <code className="text-sm bg-muted px-2 py-1 rounded">
                      {transactionData.transaction.hash.slice(0, 20)}...
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(transactionData.transaction.hash)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">From</Label>
                  <div className="flex items-center gap-2">
                    <code className="text-sm bg-muted px-2 py-1 rounded">
                      {transactionData.transaction.from.slice(0, 10)}...
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(transactionData.transaction.from)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">To</Label>
                  <div className="flex items-center gap-2">
                    <code className="text-sm bg-muted px-2 py-1 rounded">
                      {transactionData.transaction.to.slice(0, 10)}...
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(transactionData.transaction.to)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Value</Label>
                  <div className="text-sm font-medium">
                    {formatTransactionValue(transactionData.transaction.value)} ETH
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Gas Used</Label>
                  <div className="text-sm font-medium">
                    {parseInt(transactionData.receipt.gasUsed).toLocaleString()}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Gas Price</Label>
                  <div className="text-sm font-medium">
                    {formatTransactionValue(transactionData.transaction.gasPrice, 9)} Gwei
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Detailed Tabs */}
          <Tabs defaultValue="details" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="contract">Contract</TabsTrigger>
              <TabsTrigger value="transfers">Token Transfers</TabsTrigger>
              <TabsTrigger value="logs">Logs</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Transaction Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-muted-foreground">Nonce</Label>
                        <div className="text-sm">{parseInt(transactionData.transaction.nonce).toString()}</div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-muted-foreground">Block Hash</Label>
                        <div className="text-sm font-mono text-xs">
                          {transactionData.transaction.blockHash}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-muted-foreground">Transaction Index</Label>
                        <div className="text-sm">{parseInt(transactionData.transaction.transactionIndex).toString()}</div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-muted-foreground">Confirmations</Label>
                        <div className="text-sm">{transactionData.transaction.confirmations || 'Unknown'}</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="contract" className="space-y-4">
              {transactionData.contractData ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Contract Information</CardTitle>
                    <CardDescription>
                      {transactionData.contractData.contractName} • {transactionData.contractData.compilerVersion}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-muted-foreground">Contract Address</Label>
                          <div className="text-sm font-mono">{transactionData.contractData.contractAddress}</div>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-muted-foreground">License Type</Label>
                          <div className="text-sm">{transactionData.contractData.licenseType}</div>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-muted-foreground">Optimization</Label>
                          <div className="text-sm">{transactionData.contractData.optimization}</div>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-muted-foreground">EVM Version</Label>
                          <div className="text-sm">{transactionData.contractData.evmVersion}</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center text-muted-foreground">
                      No contract data available for this transaction
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="transfers" className="space-y-4">
              {transactionData.tokenTransfers.length > 0 ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Token Transfers ({transactionData.tokenTransfers.length})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {transactionData.tokenTransfers.map((transfer: any, index: number) => (
                        <div key={index} className="border rounded-lg p-4 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">{transfer.tokenSymbol}</Badge>
                              <span className="text-sm font-medium">{transfer.tokenName}</span>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {new Date(parseInt(transfer.timeStamp) * 1000).toLocaleString()}
                            </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">From: </span>
                              <span className="font-mono">{transfer.from}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">To: </span>
                              <span className="font-mono">{transfer.to}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Value: </span>
                              <span className="font-medium">
                                {parseInt(transfer.value) / Math.pow(10, parseInt(transfer.tokenDecimal))} {transfer.tokenSymbol}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center text-muted-foreground">
                      No token transfers found for this transaction
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="logs" className="space-y-4">
              {transactionData.logs.length > 0 ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Transaction Logs ({transactionData.logs.length})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {transactionData.logs.map((log: any, index: number) => (
                        <div key={index} className="border rounded-lg p-4 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="text-sm font-mono">{log.address}</div>
                            <Badge variant="outline">Log #{index + 1}</Badge>
                          </div>
                          <div className="space-y-1">
                            <div className="text-xs text-muted-foreground">Topics:</div>
                            {log.topics.map((topic: string, topicIndex: number) => (
                              <div key={topicIndex} className="text-xs font-mono bg-muted px-2 py-1 rounded">
                                {topicIndex === 0 ? `[${topicIndex}] ${topic}` : `[${topicIndex}] ${topic}`}
                              </div>
                            ))}
                          </div>
                          {log.data !== '0x' && (
                            <div className="space-y-1">
                              <div className="text-xs text-muted-foreground">Data:</div>
                              <div className="text-xs font-mono bg-muted px-2 py-1 rounded break-all">
                                {log.data}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center text-muted-foreground">
                      No logs found for this transaction
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
} 