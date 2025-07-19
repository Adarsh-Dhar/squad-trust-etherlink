# Dispute Resolution System

SquadTrust implements an automated dispute resolution system that ensures disputes are handled within a 14-day timeframe. The system automatically resolves or ignores disputes that exceed this period, maintaining system integrity and preventing disputes from lingering indefinitely.

## Overview

The dispute resolution system provides:
- **Automatic Expiration**: Disputes are automatically resolved or ignored after 14 days
- **Manual Resolution**: Admins can manually resolve or reject disputes
- **Real-time Monitoring**: Track dispute status, expiration dates, and statistics
- **Configurable Timeframes**: Adjustable auto-resolution and auto-ignore periods
- **Audit Trail**: Complete history of all dispute actions and timestamps

## System Architecture

### Core Components

#### 1. DisputeResolutionSystem Class
Located in `lib/dispute/index.ts`, this class handles all dispute-related operations:

```typescript
export class DisputeResolutionSystem {
  // Configuration
  private config: DisputeResolutionConfig;
  
  // Core methods
  async getDisputes(options): Promise<Dispute[]>
  async getDisputeStats(): Promise<DisputeStats>
  async createDispute(data): Promise<Dispute>
  async resolveDispute(id): Promise<Dispute>
  async rejectDispute(id): Promise<Dispute>
  async autoResolveExpiredDisputes(): Promise<AutoResolveResult>
  async autoIgnoreExpiredDisputes(): Promise<AutoIgnoreResult>
}
```

#### 2. Configuration
The system uses a configurable timeframe system:

```typescript
interface DisputeResolutionConfig {
  autoResolveDays: number;    // Default: 14 days
  autoIgnoreDays: number;     // Default: 14 days
  checkIntervalHours: number;  // Default: 24 hours
}
```

#### 3. Database Schema
The dispute system uses the existing `Dispute` model with status tracking:

```sql
model Dispute {
  id          String        @id @default(cuid())
  title       String
  description String
  status      DisputeStatus @default(PENDING)
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt
}

enum DisputeStatus {
  PENDING
  RESOLVED
  REJECTED
}
```

## API Endpoints

### Core Dispute Management

#### GET /api/disputes
Fetch all disputes with optional filtering:
```typescript
// Query parameters
{
  status?: "PENDING" | "RESOLVED" | "REJECTED";
  limit?: number;
  offset?: number;
  includeExpired?: boolean;
}
```

#### POST /api/disputes
Create a new dispute:
```typescript
{
  title: string;
  description: string;
}
```

#### PATCH /api/disputes/:id/resolve
Manually resolve a dispute:
```typescript
// No body required
```

#### PATCH /api/disputes/:id/reject
Manually reject a dispute:
```typescript
{
  reason?: string;
}
```

### Auto-Resolution System

#### GET /api/disputes/auto-resolve
Get dispute statistics and system information:
```typescript
// Response
{
  stats: DisputeStats;
  expiringDisputes: Dispute[];
  config: DisputeResolutionConfig;
}
```

#### POST /api/disputes/auto-resolve
Trigger automatic dispute resolution:
```typescript
{
  action: "resolve" | "ignore" | "both";
}
```

## Automatic Resolution Logic

### Auto-Resolve Process
1. **Daily Check**: System checks for expired disputes every 24 hours
2. **Expiration Criteria**: Disputes older than 14 days are considered expired
3. **Resolution Action**: Expired disputes are automatically marked as "RESOLVED"
4. **Ignore Action**: Alternative action to mark expired disputes as "REJECTED"

### Implementation
```typescript
async autoResolveExpiredDisputes() {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - this.config.autoResolveDays);

  const expiredDisputes = await prisma.dispute.findMany({
    where: {
      status: 'PENDING',
      createdAt: { lt: cutoffDate }
    }
  });

  // Update all expired disputes to RESOLVED
  const updatePromises = expiredDisputes.map(dispute =>
    prisma.dispute.update({
      where: { id: dispute.id },
      data: { status: 'RESOLVED', updatedAt: new Date() }
    })
  );

  return Promise.all(updatePromises);
}
```

## Frontend Integration

### Disputes Page Features
The disputes page (`app/disputes/page.tsx`) includes:

1. **Statistics Dashboard**: Real-time dispute statistics
2. **Auto-Resolution Button**: Manual trigger for expired dispute processing
3. **Expiration Tracking**: Visual indicators for dispute expiration
4. **Manual Actions**: Resolve and reject buttons for pending disputes
5. **Status Badges**: Color-coded status indicators

### Expiration Display
```typescript
const getExpirationInfo = (dispute: Dispute) => {
  if (dispute.status !== "PENDING") return null;
  
  const daysUntilExpiry = disputeUtils.getDaysUntilExpiry(dispute, 14);
  const isExpired = disputeUtils.isExpired(dispute, 14);
  
  if (isExpired) {
    return <span className="text-red-500 text-sm">Expired</span>;
  }
  
  if (daysUntilExpiry <= 3) {
    return <span className="text-orange-500 text-sm">{daysUntilExpiry} days left</span>;
  }
  
  return <span className="text-muted-foreground text-sm">{daysUntilExpiry} days left</span>;
};
```

## Scheduled Execution

### Manual Script Execution
Run the auto-resolution script manually:
```bash
npm run dispute:auto-resolve
```

### Cron Job Setup
For production environments, set up a daily cron job:
```bash
# Add to crontab (runs daily at 2 AM)
0 2 * * * cd /path/to/squadtrust && npm run dispute:auto-resolve
```

### Script Output
The script provides detailed logging:
```
🔄 Starting dispute auto-resolution process...
📊 Current dispute statistics: { total: 10, pending: 3, resolved: 5, rejected: 2 }
✅ Auto-resolve result: { resolved: 2, message: "Auto-resolved 2 expired disputes" }
❌ Auto-ignore result: { ignored: 0, message: "No expired disputes to auto-ignore" }
⚠️  Disputes expiring in the next 3 days: 1
   - Payment Issue (ID: clx123)
📊 Updated dispute statistics: { total: 10, pending: 1, resolved: 7, rejected: 2 }
✅ Dispute auto-resolution process completed successfully!
```

## Configuration

### System Configuration
Modify the dispute resolution timeframe:

```typescript
import { disputeSystem } from '@/lib/dispute';

// Update configuration
disputeSystem.updateConfig({
  autoResolveDays: 21,    // Change to 21 days
  autoIgnoreDays: 21,     // Change to 21 days
  checkIntervalHours: 12,  // Check every 12 hours
});
```

### Environment Variables
Add to your `.env` file:
```env
# Dispute Resolution Configuration
DISPUTE_AUTO_RESOLVE_DAYS=14
DISPUTE_AUTO_IGNORE_DAYS=14
DISPUTE_CHECK_INTERVAL_HOURS=24
```

## Monitoring and Analytics

### Dispute Statistics
Track system performance with comprehensive statistics:

```typescript
interface DisputeStats {
  total: number;        // Total disputes
  pending: number;      // Currently pending
  resolved: number;     // Manually resolved
  rejected: number;     // Manually rejected
  autoResolved: number; // Auto-resolved
  autoIgnored: number;  // Auto-ignored
}
```

### Expiring Disputes
Monitor disputes approaching expiration:
```typescript
const expiringDisputes = await disputeSystem.getExpiringDisputes(3); // 3 days warning
```

## Best Practices

### 1. Regular Monitoring
- Check dispute statistics weekly
- Monitor expiring disputes daily
- Review auto-resolution logs

### 2. Manual Intervention
- Review disputes before they expire
- Use manual resolution for complex cases
- Document rejection reasons

### 3. System Maintenance
- Run auto-resolution script daily
- Monitor system performance
- Update configuration as needed

### 4. User Communication
- Notify users of approaching expiration
- Provide clear status updates
- Maintain transparency in resolution process

## Troubleshooting

### Common Issues

1. **Disputes Not Auto-Resolving**
   - Check if the script is running
   - Verify database connectivity
   - Review configuration settings

2. **Incorrect Expiration Dates**
   - Verify timezone settings
   - Check system clock
   - Review date calculation logic

3. **Performance Issues**
   - Monitor database query performance
   - Consider indexing on createdAt field
   - Implement pagination for large datasets

### Debug Mode
Enable detailed logging:
```typescript
// In lib/dispute/index.ts
console.log('Processing dispute:', dispute.id, 'created:', dispute.createdAt);
```

## Future Enhancements

### Planned Features
1. **Email Notifications**: Alert users of approaching expiration
2. **Escalation System**: Route disputes to different handlers
3. **Analytics Dashboard**: Advanced dispute analytics
4. **Custom Rules**: Configurable resolution rules per dispute type
5. **Integration APIs**: Connect with external dispute resolution services

### API Extensions
- Webhook notifications for dispute status changes
- Bulk dispute operations
- Advanced filtering and search
- Export functionality for dispute data

This dispute resolution system ensures that all disputes are handled efficiently within the 14-day timeframe, maintaining system integrity and providing a fair, automated resolution process. 