import React from 'react';
import { Share2, Twitter } from 'lucide-react';

export const SocialShare = ({ totalSaved, protectedTrades, rank }) => {
  const shareToTwitter = () => {
    const text = `🛡️ Just saved ${totalSaved.toFixed(4)} SOL from MEV attacks using MEV Defense Shield!\n\n📊 ${protectedTrades} protected trades\n${rank ? `🏆 Rank #${rank} on leaderboard` : ''}\n\n#Solana #DeFi #MEVProtection`;
    
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank', 'width=550,height=420');
  };

  const copyLink = () => {
    const link = `https://mev-defense-shield.vercel.app/?ref=${publicKey}`;
    navigator.clipboard.writeText(link);
    alert('Referral link copied!');
  };

  return (
    <div className="flex gap-2">
      <button
        onClick={shareToTwitter}
        className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded-lg transition-all"
      >
        <Twitter className="w-4 h-4" />
        Share on X
      </button>
      <button
        onClick={copyLink}
        className="flex items-center gap-2 bg-purple-500 hover:bg-purple-600 px-4 py-2 rounded-lg transition-all"
      >
        <Share2 className="w-4 h-4" />
        Copy Referral Link
      </button>
    </div>
  );
};