// Sample KPI templates for different project types
export const SAMPLE_KPI_TEMPLATES = [
  {
    name: "DeFi Launch",
    category: "DEVELOPMENT",
    difficulty: "HARD",
    description: "Standard KPIs for DeFi protocol launches",
    kpis: [
      {
        metric: "TVL",
        target: 1000000,
        unit: "USD",
        source: "DefiLlama",
        description: "Total Value Locked in protocol"
      },
      {
        metric: "Audit Score",
        target: 10,
        unit: "/10",
        source: "CertiK",
        description: "Security audit score"
      },
      {
        metric: "Unique Users",
        target: 1000,
        unit: "users",
        source: "Analytics",
        description: "Number of unique protocol users"
      }
    ]
  },
  {
    name: "NFT Collection Launch",
    category: "GROWTH",
    difficulty: "MEDIUM",
    description: "KPIs for NFT collection launches",
    kpis: [
      {
        metric: "Mint Price",
        target: 0.1,
        unit: "ETH",
        source: "Contract",
        description: "Mint price per NFT"
      },
      {
        metric: "Collection Size",
        target: 10000,
        unit: "NFTs",
        source: "Contract",
        description: "Total number of NFTs in collection"
      },
      {
        metric: "Floor Price",
        target: 0.2,
        unit: "ETH",
        source: "OpenSea",
        description: "Floor price on secondary market"
      }
    ]
  },
  {
    name: "DAO Governance",
    category: "COMMUNITY",
    difficulty: "MEDIUM",
    description: "KPIs for DAO governance and community",
    kpis: [
      {
        metric: "Token Holders",
        target: 500,
        unit: "holders",
        source: "Etherscan",
        description: "Number of unique token holders"
      },
      {
        metric: "Vote Participation",
        target: 50,
        unit: "%",
        source: "Snapshot",
        description: "Percentage of token holders voting"
      },
      {
        metric: "Proposals Created",
        target: 10,
        unit: "proposals",
        source: "Snapshot",
        description: "Number of governance proposals"
      }
    ]
  },
  {
    name: "Funding Round",
    category: "FUNDING",
    difficulty: "HARD",
    description: "KPIs for fundraising rounds",
    kpis: [
      {
        metric: "Amount Raised",
        target: 500000,
        unit: "USD",
        source: "Investment Platform",
        description: "Total amount raised in funding round"
      },
      {
        metric: "Investors",
        target: 20,
        unit: "investors",
        source: "Investment Platform",
        description: "Number of unique investors"
      },
      {
        metric: "Valuation",
        target: 10000000,
        unit: "USD",
        source: "Investment Platform",
        description: "Company valuation after round"
      }
    ]
  },
  {
    name: "Security Audit",
    category: "SECURITY",
    difficulty: "HARD",
    description: "KPIs for security audits and testing",
    kpis: [
      {
        metric: "Test Coverage",
        target: 90,
        unit: "%",
        source: "GitHub Actions",
        description: "Code test coverage percentage"
      },
      {
        metric: "Critical Issues",
        target: 0,
        unit: "issues",
        source: "Audit Report",
        description: "Number of critical security issues"
      },
      {
        metric: "Audit Score",
        target: 9,
        unit: "/10",
        source: "Audit Firm",
        description: "Overall security audit score"
      }
    ]
  },
  {
    name: "Partnership Development",
    category: "PARTNERSHIP",
    difficulty: "MEDIUM",
    description: "KPIs for business development and partnerships",
    kpis: [
      {
        metric: "Partnerships",
        target: 5,
        unit: "partnerships",
        source: "Business Development",
        description: "Number of strategic partnerships"
      },
      {
        metric: "Integration Partners",
        target: 10,
        unit: "integrations",
        source: "Technical Documentation",
        description: "Number of platform integrations"
      },
      {
        metric: "Joint Revenue",
        target: 100000,
        unit: "USD",
        source: "Financial Reports",
        description: "Revenue from partnership activities"
      }
    ]
  }
];

export function getTemplateByCategory(category: string) {
  return SAMPLE_KPI_TEMPLATES.filter(template => template.category === category);
}

export function getTemplateByDifficulty(difficulty: string) {
  return SAMPLE_KPI_TEMPLATES.filter(template => template.difficulty === difficulty);
} 