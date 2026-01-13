import { Connection, Transaction, sendAndConfirmTransaction } from '@solana/web3.js';

// Jito Block Engine endpoints
export const JITO_ENDPOINTS = {
  mainnet: 'https://mainnet.block-engine.jito.wtf',
  devnet: 'https://dallas.devnet.block-engine.jito.wtf'
};

// Jito tip accounts (choose one randomly)
export const JITO_TIP_ACCOUNTS = [
  '96gYZGLnJYVFmbjzopPSU6QiEV5fGqZNyN9nmNhvrZU5',
  'HFqU5x63VTqvQss8hp11i4wVV8bD44PvwucfZ2bU7gRe',
  'Cw8CFyM9FkoMi7K7Crf6HNQqf4uEMzpKw6QNghXLvLkY',
  'ADaUMid9yfUytqMBgopwjb2DTLSokTSzL1zt6iGPaS49',
  'DfXygSm4jCyNCybVYYK6DwvWqjKee8pbDmJGcLWNDXjh',
  'ADuUkR4vqLUMWXxW9gh6D6L8pMSawimctcNZ5pGwDcEt',
  'DttWaMuVvTiduZRnguLF7jNxTgiMBZ1hyAumKUiL2KRL',
  '3AVi9Tg9Uo68tJfuvoKvqKNWKkC5wPdSSdeBnizKZ6jT'
];

export class JitoService {
  constructor(endpoint = JITO_ENDPOINTS.mainnet) {
    this.connection = new Connection(endpoint, 'confirmed');
  }

  // Get random tip account to reduce contention
  getRandomTipAccount() {
    return JITO_TIP_ACCOUNTS[Math.floor(Math.random() * JITO_TIP_ACCOUNTS.length)];
  }

  // Send transaction via Jito
  async sendJitoTransaction(transaction, signers, tipLamports = 10000) {
    try {
      // Add tip instruction to transaction
      const tipAccount = this.getRandomTipAccount();
      
      // Note: In production, you'd add the tip transfer instruction here
      // This is simplified - see full implementation in Jito docs
      
      const signature = await sendAndConfirmTransaction(
        this.connection,
        transaction,
        signers,
        {
          skipPreflight: false,
          commitment: 'confirmed',
        }
      );
      
      return signature;
    } catch (error) {
      console.error('Jito transaction failed:', error);
      throw error;
    }
  }

  // Send bundle (multiple transactions atomically)
  async sendBundle(transactions, tipLamports = 10000) {
    try {
      const response = await fetch(`${this.connection.rpcEndpoint}/api/v1/bundles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'sendBundle',
          params: [transactions] // Array of base58-encoded transactions
        })
      });
      
      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Bundle submission failed:', error);
      throw error;
    }
  }
}