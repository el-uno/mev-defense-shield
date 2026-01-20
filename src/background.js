// MEV Defense Shield Background Script
console.log('MEV Defense Shield initialized')

// Safe Chrome API usage with error handling
chrome.runtime.onInstalled.addListener((details) => {
  console.log('Extension installed:', details.reason)
  
  // Initialize default settings
  try {
    chrome.storage.local.set({ 
      mevProtectionEnabled: true,
      savedSOL: 0,
      protectedTrades: 0
    })
  } catch (error) {
    console.error('Storage initialization error:', error)
  }
})

// Listen for messages from popup and content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Message received:', request)
  
  try {
    if (request.type === 'MEV_ANALYSIS') {
      // Handle MEV analysis requests
      sendResponse({ success: true, data: request.data })
    } else if (request.type === 'GET_STATS') {
      // Return current stats
      chrome.storage.local.get(['savedSOL', 'protectedTrades'], (result) => {
        sendResponse({ success: true, stats: result })
      })
      return true // Keep message channel open for async response
    } else {
      sendResponse({ success: false, error: 'Unknown message type' })
    }
  } catch (error) {
    console.error('Message handler error:', error)
    sendResponse({ success: false, error: error.message })
  }
  
  return true // Required for async sendResponse
})

// Handle extension icon click
chrome.action.onClicked.addListener((tab) => {
  console.log('Extension icon clicked on tab:', tab.id)
})

console.log('Background script loaded successfully')