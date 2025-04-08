// content-script.js - Add functionality to restore individual entries
console.log("[Text Blocker] Content script running");

// Variable to store blocked texts
let blockedTexts = [];

// Track blocked elements by the text that blocked them
const blockedElementsMap = new Map(); // Map<blockedText, Set<Elements>>

// Load blocked texts from storage
function loadBlockedTexts() {
  browser.storage.local
    .get("blockedTexts")
    .then((result) => {
      const oldBlockedTexts = [...blockedTexts]; // Store previous list
      blockedTexts = result.blockedTexts || [];
      console.log("[Text Blocker] Loaded blocked texts:", blockedTexts);

      // Find texts that were removed and restore their elements
      const removedTexts = oldBlockedTexts.filter(
        (text) => !blockedTexts.includes(text)
      );
      removedTexts.forEach((text) => {
        restoreElementsBlockedByText(text);
      });

      // Scan the page with the updated list
      findAndBlockElements();
    })
    .catch((error) => {
      console.error("[Text Blocker] Error loading blocked texts:", error);
    });
}

// Initialize by loading blocked texts
loadBlockedTexts();

// Listen for messages from the popup
browser.runtime.onMessage.addListener((message) => {
  if (message.action === "updateBlockedTexts") {
    console.log("[Text Blocker] Received update notification");
    loadBlockedTexts();
  } else if (message.action === "restorePage") {
    console.log("[Text Blocker] Restoring page");
    restorePage();
  } else if (message.action === "restoreText") {
    console.log(
      `[Text Blocker] Restoring elements for text: "${message.text}"`
    );
    restoreElementsBlockedByText(message.text);
  }
  return Promise.resolve({ success: true });
});

// Store original styles before blocking
const originalStyles = new Map();

function saveOriginalStyles(element) {
  if (!originalStyles.has(element)) {
    const styles = {
      backgroundColor: element.style.backgroundColor,
      color: element.style.color,
      visibility: element.style.visibility,
    };
    originalStyles.set(element, styles);
  }
}

function blockElement(element, blockedText) {
  // Save original styles first
  saveOriginalStyles(element);

  // Block the element
  element.style.backgroundColor = "black";
  element.style.color = "black";

  // Track this element as blocked by this text
  if (!blockedElementsMap.has(blockedText)) {
    blockedElementsMap.set(blockedText, new Set());
  }
  blockedElementsMap.get(blockedText).add(element);

  // Block child elements too
  element.querySelectorAll("*").forEach((el) => {
    saveOriginalStyles(el);
    el.style.backgroundColor = "black";
    el.style.color = "black";
    if (el.tagName === "IMG") {
      el.style.visibility = "hidden";
    }
    blockedElementsMap.get(blockedText).add(el);
  });
}

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

    // Check each blocked text
    for (const blockedText of blockedTexts) {
      if (nodeText.includes(blockedText.toLowerCase())) {
        console.log(
          `[Text Blocker] Found match: "${blockedText}" in "${nodeText.trim()}"`
        );

        // Find the parent li element
        let parent = textNode.parentElement;
        while (parent && parent.tagName !== "LI") {
          parent = parent.parentElement;
          if (!parent) break;
        }

        // If parent li exists, block it
        if (parent && parent.tagName === "LI") {
          blockElement(parent, blockedText);
          console.log(`[Text Blocker] Blocked element:`, parent);
        }

        // Only block once, even if multiple blocked texts match
        break;
      }
    }
  });
}

// Restore elements blocked by a specific text
function restoreElementsBlockedByText(text) {
  if (!blockedElementsMap.has(text)) {
    console.log(`[Text Blocker] No elements to restore for: "${text}"`);
    return;
  }

  const elements = blockedElementsMap.get(text);
  console.log(
    `[Text Blocker] Restoring ${elements.size} elements for: "${text}"`
  );

  elements.forEach((element) => {
    if (originalStyles.has(element)) {
      const styles = originalStyles.get(element);
      element.style.backgroundColor = styles.backgroundColor;
      element.style.color = styles.color;
      element.style.visibility = styles.visibility;
    }
  });

  // Clear the set
  blockedElementsMap.delete(text);
}

// Restore all page elements
function restorePage() {
  console.log("[Text Blocker] Restoring all page elements");

  // Restore each blocked element
  for (const elements of blockedElementsMap.values()) {
    elements.forEach((element) => {
      if (originalStyles.has(element)) {
        const styles = originalStyles.get(element);
        element.style.backgroundColor = styles.backgroundColor;
        element.style.color = styles.color;
        element.style.visibility = styles.visibility;
      }
    });
  }

  // Clear the map
  blockedElementsMap.clear();
  console.log("[Text Blocker] Page restored");
}

// Initial scan after DOM is loaded
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", findAndBlockElements);
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
    subtree: true,
  });
  console.log("[Text Blocker] Mutation observer started");
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", startObserver);
} else {
  startObserver();
}
