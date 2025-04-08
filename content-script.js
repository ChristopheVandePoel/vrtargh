// content-script.js
console.log("[Text Blocker] Content script running");

// Variable to store blocked texts
let blockedTexts = [];

// Load blocked texts from storage
function loadBlockedTexts() {
  browser.storage.local.get('blockedTexts')
    .then(result => {
      blockedTexts = result.blockedTexts || [];
      console.log("[Text Blocker] Loaded blocked texts:", blockedTexts);
      
      // Scan the page with the updated list
      findAndBlockElements();
    })
    .catch(error => {
      console.error("[Text Blocker] Error loading blocked texts:", error);
    });
}

// Initialize by loading blocked texts
loadBlockedTexts();

// Listen for messages from the popup
browser.runtime.onMessage.addListener((message) => {
  if (message.action === 'updateBlockedTexts') {
    console.log("[Text Blocker] Received update notification");
    loadBlockedTexts();
  }
  return Promise.resolve({ success: true });
});

function findAndBlockElements() {
  // Skip if no texts to block
  if (blockedTexts.length === 0) {
    console.log("[Text Blocker] No texts to block");
    return;
  }
  
  console.log("[Text Blocker] Scanning for blocked texts");
  
  // Collect all text nodes
  const textNodes = [];
  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    null,
    false
  );

  let node;
  while ((node = walker.nextNode())) {
    textNodes.push(node);
  }

  // Find nodes containing any of the blocked texts
  textNodes.forEach((textNode) => {
    if (!textNode.nodeValue) return;
    
    const nodeText = textNode.nodeValue.toLowerCase();
    const matchedText = blockedTexts.find(blockedText => 
      nodeText.includes(blockedText.toLowerCase())
    );
    
    if (matchedText) {
      console.log(`[Text Blocker] Found match: "${matchedText}" in "${nodeText.trim()}"`);
      
      // Find the parent li element
      let parent = textNode.parentElement;
      while (parent && parent.tagName !== 'LI') {
        parent = parent.parentElement;
        if (!parent) break;
      }

      // If parent li exists, block it
      if (parent && parent.tagName === 'LI') {
        parent.style.backgroundColor = "black";
        parent.style.color = "black";
        parent.querySelectorAll('*').forEach(el => {
          el.style.backgroundColor = "black";
          el.style.color = "black";
          if (el.tagName === 'IMG') {
            el.style.visibility = "hidden";
          }
        });
        console.log(`[Text Blocker] Blocked element:`, parent);
      }
    }
  });
}

// Initial scan after DOM is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', findAndBlockElements);
} else {
  findAndBlockElements();
}

// Scan again after a delay for dynamic content
setTimeout(findAndBlockElements, 2000);

// Setup observer for future content changes
const observer = new MutationObserver(() => {
  findAndBlockElements();
});

// Start observing once the DOM is loaded
function startObserver() {
  observer.observe(document.body, { 
    childList: true, 
    subtree: true 
  });
  console.log("[Text Blocker] Mutation observer started");
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startObserver);
} else {
  startObserver();
}