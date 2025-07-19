'use client';

import React from 'react';
import { InvestorSignatureWidget } from '@/components/signature/InvestorSignatureWidget';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { DollarSign, Target, Users, Shield } from 'lucide-react';

export default function InvestorDemoPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold tracking-tight">
            Investor Payment Signatures
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Cryptographically secure payment approval system for investors to sign project and milestone payments.
          </p>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <Shield className="h-8 w-8 text-primary" />
                <div>
                  <h3 className="font-semibold">Cryptographic Security</h3>
                  <p className="text-sm text-muted-foreground">All signatures are cryptographically verified</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <Users className="h-8 w-8 text-primary" />
                <div>
                  <h3 className="font-semibold">Multi-Signature</h3>
                  <p className="text-sm text-muted-foreground">Requires 50%+ of investors to approve</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <Target className="h-8 w-8 text-primary" />
                <div>
                  <h3 className="font-semibold">Milestone Payments</h3>
                  <p className="text-sm text-muted-foreground">Release funds upon milestone completion</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <DollarSign className="h-8 w-8 text-primary" />
                <div>
                  <h3 className="font-semibold">Project Funding</h3>
                  <p className="text-sm text-muted-foreground">Approve initial project funding rounds</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Demo Tabs */}
        <Tabs defaultValue="project" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="project">Project Payment</TabsTrigger>
            <TabsTrigger value="milestone">Milestone Payment</TabsTrigger>
          </TabsList>

          <TabsContent value="project" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Project Payment Widget */}
              <div>
                <h2 className="text-2xl font-semibold mb-4">Project Funding Payment</h2>
                <InvestorSignatureWidget
                  type="project"
                  id="demo-funding-1"
                  title="DeFi Protocol Development"
                  projectId="demo-project-1"
                  amount={50000}
                  currency="USDC"
                  onStatusChange={(status) => console.log('Project payment status:', status)}
                />
              </div>

              {/* Project Details */}
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5" />
                      Project Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Project Name</span>
                      <span className="font-medium">DeFi Protocol Development</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Funding Amount</span>
                      <span className="font-medium">50,000 USDC</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Investors</span>
                      <span className="font-medium">4 Total</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Required Signatures</span>
                      <span className="font-medium">3 (50%+)</span>
                    </div>
                    <div className="pt-2">
                      <Badge variant="outline" className="text-xs">
                        Initial Funding Round
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">How it Works</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary text-white text-xs flex items-center justify-center font-bold">1</div>
                      <p>Investors review the project deliverables and funding request</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary text-white text-xs flex items-center justify-center font-bold">2</div>
                      <p>Each investor cryptographically signs the payment approval using their wallet</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary text-white text-xs flex items-center justify-center font-bold">3</div>
                      <p>Once 50%+ of investors sign, the payment is automatically approved</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary text-white text-xs flex items-center justify-center font-bold">4</div>
                      <p>Funds are released to the project team</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="milestone" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Milestone Payment Widget */}
              <div>
                <h2 className="text-2xl font-semibold mb-4">Milestone Completion Payment</h2>
                <InvestorSignatureWidget
                  type="milestone"
                  id="demo-milestone-1"
                  title="Smart Contract Development"
                  projectId="demo-project-1"
                  amount={15000}
                  currency="USDC"
                  onStatusChange={(status) => console.log('Milestone payment status:', status)}
                />
              </div>

              {/* Milestone Details */}
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      Milestone Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Milestone Name</span>
                      <span className="font-medium">Smart Contract Development</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Payment Amount</span>
                      <span className="font-medium">15,000 USDC</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Investors</span>
                      <span className="font-medium">4 Total</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Required Signatures</span>
                      <span className="font-medium">3 (50%+)</span>
                    </div>
                    <div className="pt-2">
                      <Badge variant="outline" className="text-xs">
                        KPI: Deploy 3 smart contracts
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Milestone Verification</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary text-white text-xs flex items-center justify-center font-bold">1</div>
                      <p>Team completes the milestone deliverables</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary text-white text-xs flex items-center justify-center font-bold">2</div>
                      <p>Investors review the completed work and KPI achievements</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary text-white text-xs flex items-center justify-center font-bold">3</div>
                      <p>Investors sign the milestone payment approval</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary text-white text-xs flex items-center justify-center font-bold">4</div>
                      <p>Payment is released upon 50%+ approval</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Security Features */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Security Features
            </CardTitle>
            <CardDescription>
              Advanced cryptographic security ensures payment integrity
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h4 className="font-semibold">Cryptographic Verification</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• All signatures are cryptographically verified using elliptic curve cryptography</li>
                  <li>• Each signature is tied to a specific wallet address and cannot be forged</li>
                  <li>• Nonce protection prevents replay attacks</li>
                  <li>• Timestamp validation ensures temporal security</li>
                </ul>
              </div>
              <div className="space-y-3">
                <h4 className="font-semibold">Multi-Signature Protection</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Requires 50%+ of authorized investors to approve payments</li>
                  <li>• Prevents single points of failure or malicious actors</li>
                  <li>• Transparent audit trail of all signatures</li>
                  <li>• Real-time status updates and progress tracking</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 