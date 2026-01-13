import { Connection, PublicKey } from '@solana/web3.js';

export class MempoolMonitor {
  constructor(connection) {
    this.connection = connection;
    this.subscriptions = new Map();
  }

  // Monitor pending transactions for sandwich attacks
  async monitorAddress(address, callback) {
    try {
      const publicKey = new PublicKey(address);
      
      // Subscribe to account changes
      const subscriptionId = this.connection.onAccountChange(
        publicKey,
        (accountInfo, context) => {
          callback({
            slot: context.slot,
            accountInfo,
            timestamp: Date.now()
          });
        },
        'confirmed'
      );
      
      this.subscriptions.set(address, subscriptionId);
      return subscriptionId;
    } catch (error) {
      console.error('Failed to monitor address:', error);
      throw error;
    }
  }

  // Monitor program logs for MEV activity
  async monitorProgramLogs(programId, callback) {
    try {
      const publicKey = new PublicKey(programId);
      
      const subscriptionId = this.connection.onLogs(
        publicKey,
        (logs, context) => {
          // Analyze logs for MEV patterns
          const mevActivity = this.detectMEVPatterns(logs);
          if (mevActivity) {
            callback(mevActivity);
          }
        },
        'confirmed'
      );
      
      this.subscriptions.set(programId, subscriptionId);
      return subscriptionId;
    } catch (error) {
      console.error('Failed to monitor program logs:', error);
      throw error;
    }
  }

  // Detect sandwich attack patterns
  detectMEVPatterns(logs) {
    // Look for rapid buy-sell patterns
    const signatures = logs.logs.filter(log => 
      log.includes('Program log: Instruction: Swap') ||
      log.includes('Transfer')
    );
    
    if (signatures.length >= 3) {
      return {
        type: 'potential_sandwich',
        confidence: 0.75,
        signatures: logs.signature,
        timestamp: Date.now()
      };
    }
    
    return null;
  }

  // Unsubscribe from monitoring
  async unsubscribe(identifier) {
    const subscriptionId = this.subscriptions.get(identifier);
    if (subscriptionId) {
      await this.connection.removeAccountChangeListener(subscriptionId);
      this.subscriptions.delete(identifier);
    }
  }

  // Cleanup all subscriptions
  async cleanup() {
    for (const [key, subscriptionId] of this.subscriptions) {
      await this.connection.removeAccountChangeListener(subscriptionId);
    }
    this.subscriptions.clear();
  }
}