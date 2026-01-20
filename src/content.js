// MEV Defense Shield Content Script
console.log('MEV Defense Shield content script loaded')

// Detect Solana wallet
const detectSolanaWallet = () => {
  if (window.solana || window.phantom) {
    console.log('✅ Solana wallet detected')
    return true
  }
  return false
}

// Detect Jupiter swap interface
const detectJupiterSwap = () => {
  const swapButton = document.querySelector('[data-testid="swap-button"], button[type="submit"]')
  if (swapButton && window.location.href.includes('jup.ag')) {
    console.log('🔍 Detected swap button on Jupiter')
    injectMEVWarning(swapButton)
  }
}

// Inject MEV protection warning
const injectMEVWarning = (swapButton) => {
  if (!swapButton || swapButton.dataset.mevProtected) return
  
  swapButton.dataset.mevProtected = 'true'
  
  const warning = document.createElement('div')
  warning.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #10b981;
    color: white;
    padding: 12px 20px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 600;
    z-index: 10000;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  `
  warning.innerHTML = '🛡️ MEV Defense Shield Active'
  document.body.appendChild(warning)
  
  setTimeout(() => warning.remove(), 3000)
}

// Initialize detection
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    detectSolanaWallet()
    detectJupiterSwap()
  })
} else {
  detectSolanaWallet()
  detectJupiterSwap()
}

// Watch for DOM changes
const observer = new MutationObserver(() => {
  detectJupiterSwap()
})

observer.observe(document.body, {
  childList: true,
  subtree: true
})