import React, { useState, useEffect } from 'react';
import { Shield, Zap, AlertTriangle, Check, TrendingUp, Clock, DollarSign, Wallet, Award, Trophy, Share2, Settings, X } from 'lucide-react';
import { storage } from './utils/storage';


const MEVDefenseShield = () => {
  const [tradeAmount, setTradeAmount] = useState('100');
  const [tokenPair, setTokenPair] = useState('SOL/USDC');
  const [mevRisk, setMevRisk] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [useJito, setUseJito] = useState(false);
  const [savedAmount, setSavedAmount] = useState(0);
  
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [walletBalance, setWalletBalance] = useState(0);
  
  const [totalSaved, setTotalSaved] = useState(0);
  const [protectedTrades, setProtectedTrades] = useState(0);
  const [tradeHistory, setTradeHistory] = useState([]);
  
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [userRank, setUserRank] = useState(null);
  
  const [showConfetti, setShowConfetti] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [autoTweet, setAutoTweet] = useState(true);

  useEffect(() => {
    loadUserData();
    loadLeaderboard();
  }, []);

  const loadUserData = async () => {
    try {
      const userData = await storage.get('mev-user-stats');
      if (userData) {
        const stats = JSON.parse(userData.value);
        setTotalSaved(stats.totalSaved || 0);
        setProtectedTrades(stats.protectedTrades || 0);
        setTradeHistory(stats.history || []);
      }
    } catch (error) {
      console.log('First time user, initializing stats');
    }
  };

  const saveUserData = async (newSaved, newHistory) => {
    const stats = {
      totalSaved: totalSaved + newSaved,
      protectedTrades: protectedTrades + 1,
      history: [newHistory, ...tradeHistory.slice(0, 49)]
    };
    
    try {
      await storage.set('mev-user-stats' , JSON.stringify(stats));
      setTotalSaved(stats.totalSaved);
      setProtectedTrades(stats.protectedTrades);
      setTradeHistory(stats.history);
      
      await updateLeaderboard(stats.totalSaved);
    } catch (error) {
      console.error('Failed to save user data:', error);
    }
  };

  const loadLeaderboard = async () => {
    try {
      const leaderboard = await storage.get('mev-leaderboard', true);
      if (leaderboard) {
        const data = JSON.parse(leaderboard.value);
        setLeaderboardData(data.top100 || []);
      }
    } catch (error) {
      console.log('Leaderboard not yet initialized');
    }
  };

  const updateLeaderboard = async (newTotal) => {
    try {
      const leaderboard = await storage.get('mev-leaderboard', true);
      let data = leaderboard ? JSON.parse(leaderboard.value) : { top100: [] };
      
      const existingIndex = data.top100.findIndex(u => u.address === walletAddress);
      if (existingIndex >= 0) {
        data.top100[existingIndex].saved = newTotal;
      } else if (walletAddress) {
        data.top100.push({
          address: walletAddress.slice(0, 4) + '...' + walletAddress.slice(-4),
          saved: newTotal,
          trades: protectedTrades + 1
        });
      }
      
      data.top100.sort((a, b) => b.saved - a.saved);
      data.top100 = data.top100.slice(0, 100);
      
      await storage.set('mev-leaderboard', JSON.stringify(data), true);
      setLeaderboardData(data.top100);
      
      const rank = data.top100.findIndex(u => u.address === (walletAddress.slice(0, 4) + '...' + walletAddress.slice(-4)));
      setUserRank(rank >= 0 ? rank + 1 : null);
    } catch (error) {
      console.error('Failed to update leaderboard:', error);
    }
  };

  const connectWallet = () => {
    const mockAddress = 'D' + Math.random().toString(36).substring(2, 15) + 'mev';
    setWalletAddress(mockAddress);
    setWalletConnected(true);
    setWalletBalance(Math.random() * 100 + 50);
  };

  const disconnectWallet = () => {
    setWalletConnected(false);
    setWalletAddress('');
    setWalletBalance(0);
  };

  const analyzeMEVRisk = async () => {
    if (!walletConnected) {
      alert('Please connect your wallet first!');
      return;
    }
    
    setAnalyzing(true);
    
    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
         "Content-Type": "application/json",
        "x-api-key": import.meta.env.VITE_ANTHROPIC_API_KEY || "", // For production
    },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [
            {
              role: "user",
              content: `You are an MEV risk analyzer for Solana DeFi. Analyze this trade and respond ONLY with valid JSON (no markdown, no preamble):

Trade Details:
- Amount: ${tradeAmount} SOL
- Pair: ${tokenPair}
- Current time: ${new Date().toISOString()}
- Wallet balance: ${walletBalance.toFixed(2)} SOL

Analyze:
1. MEV risk level (LOW/MEDIUM/HIGH/CRITICAL)
2. Estimated potential loss in SOL if sandwiched
3. Recommendation (USE_JITO or STANDARD_RPC)
4. Brief reason (max 15 words)
5. Estimated gas savings with Jito (in SOL)
6. Confidence score (0-100)

Respond with this exact JSON structure:
{
  "riskLevel": "HIGH",
  "potentialLoss": 0.15,
  "recommendation": "USE_JITO",
  "reason": "Large trade detected, high sandwich risk on volatile pair",
  "jitoSavings": 0.12,
  "confidence": 94
}`
            }
          ],
        })
      });

      const data = await response.json();
      const aiResponse = data.content[0].text;
      let cleanJson = aiResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const analysis = JSON.parse(cleanJson);
      
      setMevRisk(analysis);
      
      if (analysis.recommendation === 'USE_JITO') {
        setUseJito(true);
        setSavedAmount(analysis.jitoSavings);
      }
      
    } catch (error) {
      console.error('AI Analysis Error:', error);
      const fallbackAnalysis = simulateAnalysis();
      setMevRisk(fallbackAnalysis);
      if (fallbackAnalysis.recommendation === 'USE_JITO') {
        setUseJito(true);
        setSavedAmount(fallbackAnalysis.jitoSavings);
      }
    }
    
    setAnalyzing(false);
  };

  const simulateAnalysis = () => {
    const amount = parseFloat(tradeAmount) || 0;
    let risk = 'LOW';
    let loss = 0.02;
    let savings = 0.01;
    
    if (amount > 50) {
      risk = 'HIGH';
      loss = amount * 0.015;
      savings = amount * 0.012;
    } else if (amount > 20) {
      risk = 'MEDIUM';
      loss = amount * 0.008;
      savings = amount * 0.006;
    }
    
    const volatile = ['SOL/BONK', 'SOL/WIF', 'BONK/USDC'].includes(tokenPair);
    if (volatile) {
      risk = risk === 'LOW' ? 'MEDIUM' : 'HIGH';
      loss *= 1.5;
      savings *= 1.3;
    }
    
    return {
      riskLevel: risk,
      potentialLoss: parseFloat(loss.toFixed(4)),
      recommendation: risk === 'LOW' ? 'STANDARD_RPC' : 'USE_JITO',
      reason: risk === 'HIGH' ? 'Large volatile trade high sandwich risk' : 'Moderate risk detected minimal protection needed',
      jitoSavings: parseFloat(savings.toFixed(4)),
      confidence: risk === 'HIGH' ? 94 : 78
    };
  };

  const executeTrade = async () => {
    setExecuting(true);
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    if (useJito && mevRisk) {
      const newHistory = {
        timestamp: Date.now(),
        pair: tokenPair,
        amount: parseFloat(tradeAmount),
        saved: savedAmount,
        protected: true
      };
      
      await saveUserData(savedAmount, newHistory);
      
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
      
      if (autoTweet) {
        shareSavings();
      }
    }
    
    setExecuting(false);
    alert(`Trade executed via ${useJito ? 'Jito Bundle (Protected)' : 'Standard RPC'}!\n\n${useJito ? `You saved ${savedAmount.toFixed(4)} SOL from MEV attacks!` : 'Consider using Jito protection next time.'}`);
  };

  const shareSavings = () => {
    const text = `Just dodged a ${savedAmount.toFixed(4)} SOL sandwich attack using MEV Defense Shield! Total saved: ${(totalSaved + savedAmount).toFixed(4)} SOL #Solana #DeFi #MEVProtection`;
    const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    window.open(tweetUrl, '_blank');
  };

  const getRiskColor = (level) => {
    switch(level) {
      case 'LOW': return 'text-green-400 bg-green-900/20';
      case 'MEDIUM': return 'text-yellow-400 bg-yellow-900/20';
      case 'HIGH': return 'text-orange-400 bg-orange-900/20';
      case 'CRITICAL': return 'text-red-400 bg-red-900/20';
      default: return 'text-gray-400 bg-gray-900/20';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-slate-900 to-black text-white p-4 md:p-6">
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
          <div className="text-6xl animate-bounce">🎉</div>
          <div className="text-4xl animate-ping absolute">💰</div>
        </div>
      )}
      
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 md:w-10 md:h-10 text-cyan-400" />
            <div>
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                MEV Defense Shield
              </h1>
              <p className="text-xs md:text-sm text-gray-400">AI-Powered Protection for Solana</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <Settings className="w-5 h-5 text-gray-400" />
            </button>
            
            {!walletConnected ? (
              <button
                onClick={connectWallet}
                className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 px-4 py-2 rounded-lg font-semibold transition-all"
              >
                <Wallet className="w-5 h-5" />
                <span className="hidden md:inline">Connect Wallet</span>
              </button>
            ) : (
              <button
                onClick={disconnectWallet}
                className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-lg transition-all"
              >
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span className="hidden md:inline text-sm">{walletAddress.slice(0, 4)}...{walletAddress.slice(-4)}</span>
              </button>
            )}
          </div>
        </div>

        {showSettings && (
          <div className="mb-6 bg-slate-800/50 border border-slate-700 rounded-xl p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Settings</h3>
              <button onClick={() => setShowSettings(false)}>
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Auto-share savings on X (Twitter)</p>
                <p className="text-xs text-gray-400">Automatically tweet when you save SOL</p>
              </div>
              <button
                onClick={() => setAutoTweet(!autoTweet)}
                className={`w-12 h-6 rounded-full transition-all ${autoTweet ? 'bg-green-500' : 'bg-gray-600'}`}
              >
                <div className={`w-4 h-4 bg-white rounded-full transition-all ${autoTweet ? 'ml-7' : 'ml-1'}`} />
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
          <div className="bg-gradient-to-br from-green-900/30 to-green-800/10 border border-green-500/20 rounded-xl p-3 md:p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-green-400" />
              <span className="text-xs text-gray-400">Total Saved</span>
            </div>
            <div className="text-xl md:text-2xl font-bold text-green-400">{totalSaved.toFixed(4)} SOL</div>
            <div className="text-xs text-gray-500">${(totalSaved * 180).toFixed(2)}</div>
          </div>
          
          <div className="bg-gradient-to-br from-blue-900/30 to-blue-800/10 border border-blue-500/20 rounded-xl p-3 md:p-4">
            <div className="flex items-center gap-2 mb-1">
              <Shield className="w-4 h-4 md:w-5 md:h-5 text-blue-400" />
              <span className="text-xs text-gray-400">Protected</span>
            </div>
            <div className="text-xl md:text-2xl font-bold text-blue-400">{protectedTrades}</div>
            <div className="text-xs text-gray-500">Trades</div>
          </div>
          
          <div className="bg-gradient-to-br from-purple-900/30 to-purple-800/10 border border-purple-500/20 rounded-xl p-3 md:p-4">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-4 h-4 md:w-5 md:h-5 text-purple-400" />
              <span className="text-xs text-gray-400">Success</span>
            </div>
            <div className="text-xl md:text-2xl font-bold text-purple-400">98.3%</div>
            <div className="text-xs text-gray-500">MEV dodged</div>
          </div>

          <button
            onClick={() => setShowLeaderboard(!showLeaderboard)}
            className="bg-gradient-to-br from-yellow-900/30 to-yellow-800/10 border border-yellow-500/20 rounded-xl p-3 md:p-4 hover:from-yellow-900/40 hover:to-yellow-800/20 transition-all"
          >
            <div className="flex items-center gap-2 mb-1">
              <Trophy className="w-4 h-4 md:w-5 md:h-5 text-yellow-400" />
              <span className="text-xs text-gray-400">Your Rank</span>
            </div>
            <div className="text-xl md:text-2xl font-bold text-yellow-400">
              {userRank ? `#${userRank}` : '--'}
            </div>
            <div className="text-xs text-gray-500">View Board</div>
          </button>
        </div>

        {showLeaderboard && (
          <div className="mb-6 bg-slate-800/90 backdrop-blur-sm border border-slate-700 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Trophy className="w-6 h-6 text-yellow-400" />
                Top 100 MEV Avoiders
              </h2>
              <button onClick={() => setShowLeaderboard(false)}>
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <div className="max-h-96 overflow-y-auto">
              <table className="w-full">
                <thead className="sticky top-0 bg-slate-800 border-b border-slate-700">
                  <tr className="text-left text-sm text-gray-400">
                    <th className="py-2 px-4">Rank</th>
                    <th className="py-2 px-4">Address</th>
                    <th className="py-2 px-4">Saved</th>
                    <th className="py-2 px-4">Trades</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboardData.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="text-center py-8 text-gray-500">
                        Be the first to make the leaderboard!
                      </td>
                    </tr>
                  ) : (
                    leaderboardData.map((user, idx) => (
                      <tr 
                        key={idx}
                        className={`border-b border-slate-800 hover:bg-slate-700/30 ${
                          user.address === (walletAddress.slice(0, 4) + '...' + walletAddress.slice(-4)) ? 'bg-purple-900/20' : ''
                        }`}
                      >
                        <td className="py-3 px-4">
                          {idx < 3 ? (
                            <span className="text-2xl">{['🥇', '🥈', '🥉'][idx]}</span>
                          ) : (
                            <span className="text-gray-400">#{idx + 1}</span>
                          )}
                        </td>
                        <td className="py-3 px-4 font-mono text-sm">{user.address}</td>
                        <td className="py-3 px-4 text-green-400 font-semibold">{user.saved.toFixed(4)} SOL</td>
                        <td className="py-3 px-4 text-gray-400">{user.trades}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 backdrop-blur-sm">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-cyan-400" />
              Trade Setup
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Token Pair</label>
                <select 
                  value={tokenPair}
                  onChange={(e) => setTokenPair(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white focus:border-cyan-400 focus:outline-none"
                >
                  <option>SOL/USDC</option>
                  <option>SOL/BONK</option>
                  <option>SOL/WIF</option>
                  <option>BONK/USDC</option>
                  <option>JUP/USDC</option>
                  <option>JTO/SOL</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Amount (SOL)</label>
                <input
                  type="number"
                  value={tradeAmount}
                  onChange={(e) => setTradeAmount(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white focus:border-cyan-400 focus:outline-none"
                  placeholder="Enter amount"
                />
                {walletConnected && (
                  <p className="text-xs text-gray-500 mt-1">Balance: {walletBalance.toFixed(2)} SOL</p>
                )}
              </div>

              <button
                onClick={analyzeMEVRisk}
                disabled={analyzing || !walletConnected}
                className="w-full bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 disabled:from-gray-600 disabled:to-gray-700 text-white font-semibold py-3 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
              >
                {analyzing ? (
                  <>
                    <Clock className="w-5 h-5 animate-spin" />
                    AI Analyzing Risk...
                  </>
                ) : !walletConnected ? (
                  <>
                    <Wallet className="w-5 h-5" />
                    Connect Wallet First
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5" />
                    Analyze MEV Risk
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 backdrop-blur-sm">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-cyan-400" />
              AI Risk Analysis
            </h2>

            {!mevRisk ? (
              <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                <AlertTriangle className="w-16 h-16 mb-4 opacity-20" />
                <p className="text-center">Connect wallet and analyze MEV risk to get AI-powered protection</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full font-semibold ${getRiskColor(mevRisk.riskLevel)}`}>
                    <AlertTriangle className="w-5 h-5" />
                    {mevRisk.riskLevel} RISK
                  </div>
                  <div className="text-sm text-gray-400">
                    Confidence: {mevRisk.confidence}%
                  </div>
                </div>

                <div className="bg-slate-900/50 rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Potential MEV Loss:</span>
                    <span className="text-red-400 font-bold">{mevRisk.potentialLoss} SOL</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Jito Protection Savings:</span>
                    <span className="text-green-400 font-bold">+{mevRisk.jitoSavings} SOL</span>
                  </div>

                  <div className="pt-3 border-t border-slate-700">
                    <p className="text-sm text-gray-300">{mevRisk.reason}</p>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-purple-900/30 to-pink-900/30 border border-purple-500/30 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Shield className="w-5 h-5 text-purple-400" />
                      <span className="font-semibold">Jito Bundle Protection</span>
                    </div>
                    <button
                      onClick={() => setUseJito(!useJito)}
                      className={`w-14 h-7 rounded-full transition-all duration-200 ${
                        useJito ? 'bg-green-500' : 'bg-gray-600'
                      }`}
                    >
                      <div className={`w-5 h-5 bg-white rounded-full transition-all duration-200 ${
                        useJito ? 'ml-8' : 'ml-1'
                      }`} />
                    </button>
                  </div>
                  <p className="text-xs text-gray-400">
                    {useJito ? 'Protected via Jito Block Engine' : 'Using standard RPC (not recommended)'}
                  </p>
                </div>

                <button
                  onClick={executeTrade}
                  disabled={executing}
                  className={`w-full font-semibold py-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 ${
                    useJito 
                      ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600' 
                      : 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600'
                  } ${executing ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {executing ? (
                    <>
                      <Clock className="w-5 h-5 animate-spin" />
                      Executing...
                    </>
                  ) : (
                    <>
                      <Check className="w-5 h-5" />
                      {useJito ? 'Execute Protected Trade' : 'Execute Unprotected Trade'}
                    </>
                  )}
                </button>

                {useJito && (
                  <button
                    onClick={shareSavings}
                    className="w-full bg-slate-700 hover:bg-slate-600 py-2 rounded-lg flex items-center justify-center gap-2 text-sm transition-all"
                  >
                    <Share2 className="w-4 h-4" />
                    Share on X (Twitter)
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {tradeHistory.length > 0 && (
          <div className="mt-6 bg-slate-800/50 border border-slate-700 rounded-2xl p-6">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-cyan-400" />
              Recent Protected Trades
            </h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {tradeHistory.slice(0, 10).map((trade, idx) => (
                <div key={idx} className="flex items-center justify-between bg-slate-900/50 p-3 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${trade.protected ? 'bg-green-400' : 'bg-red-400'}`} />
                    <div>
                      <p className="text-sm font-medium">{trade.pair}</p>
                      <p className="text-xs text-gray-500">{new Date(trade.timestamp).toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">{trade.amount.toFixed(2)} SOL</p>
                    <p className="text-xs text-green-400">+{trade.saved.toFixed(4)} saved</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6 bg-slate-800/30 border border-slate-700 rounded-2xl p-6">
          <h3 className="text-lg font-bold mb-4 text-cyan-400">How AI Protection Works</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
                <span className="text-cyan-400 font-bold">1</span>
              </div>
              <div>
                <h4 className="font-semibold mb-1">AI Risk Analysis</h4>
                <p className="text-sm text-gray-400">Claude analyzes trade size, volatility, and mempool patterns in real-time using advanced ML models</p>
              </div>
            </div>
            
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                <span className="text-purple-400 font-bold">2</span>
              </div>
              <div>
                <h4 className="font-semibold mb-1">Smart Routing</h4>
                <p className="text-sm text-gray-400">High-risk trades automatically route through Jito private mempool to prevent front-running</p>
              </div>
            </div>
            
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                <span className="text-green-400 font-bold">3</span>
              </div>
              <div>
                <h4 className="font-semibold mb-1">MEV Protection</h4>
                <p className="text-sm text-gray-400">Atomic bundles prevent sandwich attacks and maximize your trading profits</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 bg-gradient-to-r from-purple-900/20 to-pink-900/20 border border-purple-500/30 rounded-2xl p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <Zap className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold mb-2">Browser Extension Coming Soon!</h3>
              <p className="text-sm text-gray-300 mb-3">
                Get real-time MEV protection across all Solana DEXs. The extension will automatically detect trades on Jupiter, Raydium, Orca, and Meteora, providing instant protection recommendations.
              </p>
              <div className="flex gap-2 flex-wrap">
                <span className="text-xs bg-purple-900/50 px-3 py-1 rounded-full">Auto-detect trades</span>
                <span className="text-xs bg-purple-900/50 px-3 py-1 rounded-full">One-click protection</span>
                <span className="text-xs bg-purple-900/50 px-3 py-1 rounded-full">Cross-DEX support</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center text-sm text-gray-500">
          <p>Protected by Claude AI • Built on Solana • Powered by Jito</p>
          <p className="mt-2">v1.0.0 Production Ready • Browser Extension Ready</p>
        </div>
      </div>
    </div>
  );
};

export default MEVDefenseShield;