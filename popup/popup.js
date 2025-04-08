// popup/popup.js - Add "Restore" button for individual entries
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("addForm");
  const input = document.getElementById("newBlockedText");
  const list = document.getElementById("blockedTextsList");
  const restorePageBtn = document.getElementById("restorePageBtn");

  // Load and display current blocked texts
  loadBlockedTexts();

  // Handle form submission to add new blocked text
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const newText = input.value.trim();

    if (newText) {
      addBlockedText(newText);
      input.value = "";
    }
  });
  // Handle restore page button click
  restorePageBtn.addEventListener("click", () => {
    clearAllBlockedTexts();
    restorePage();
  });

  // Load blocked texts from storage and display them
  function loadBlockedTexts() {
    browser.storage.local
      .get("blockedTexts")
      .then((result) => {
        const blockedTexts = result.blockedTexts || [];
        renderBlockedTextsList(blockedTexts);
      })
      .catch((error) => {
        console.error("Error loading blocked texts:", error);
      });
  }

  // Add a new text to the blocked list
  function addBlockedText(text) {
    browser.storage.local
      .get("blockedTexts")
      .then((result) => {
        const blockedTexts = result.blockedTexts || [];

        // Check if text is already in the list
        if (!blockedTexts.includes(text)) {
          blockedTexts.push(text);

          // Save updated list
          return browser.storage.local.set({ blockedTexts });
        }
      })
      .then(() => {
        // Reload the list
        loadBlockedTexts();

        // Notify content scripts that the list has changed
        return browser.tabs.query({ active: true, currentWindow: true });
      })
      .then((tabs) => {
        if (tabs[0]) {
          return browser.tabs.sendMessage(tabs[0].id, {
            action: "updateBlockedTexts",
          });
        }
      })
      .catch((error) => {
        console.error("Error adding blocked text:", error);
      });
  }

  // Remove a text from the blocked list
  function removeBlockedText(text) {
    browser.storage.local
      .get("blockedTexts")
      .then((result) => {
        let blockedTexts = result.blockedTexts || [];
        blockedTexts = blockedTexts.filter((t) => t !== text);

        // Save updated list
        return browser.storage.local.set({ blockedTexts });
      })
      .then(() => {
        // Reload the list
        loadBlockedTexts();

        // Notify content scripts that the list has changed
        return browser.tabs.query({ active: true, currentWindow: true });
      })
      .then((tabs) => {
        if (tabs[0]) {
          return browser.tabs.sendMessage(tabs[0].id, {
            action: "updateBlockedTexts",
          });
        }
      })
      .catch((error) => {
        console.error("Error removing blocked text:", error);
      });
  }

  // Restore elements blocked by a specific text
  function restoreElementsForText(text) {
    removeBlockedText(text);
    browser.tabs
      .query({ active: true, currentWindow: true })
      .then((tabs) => {
        if (tabs[0]) {
          return browser.tabs.sendMessage(tabs[0].id, {
            action: "restoreText",
            text: text,
          });
        }
      })
      .catch((error) => {
        console.error(`Error restoring elements for text "${text}":`, error);
      });
  }

  // Clear all blocked texts
  function clearAllBlockedTexts() {
    browser.storage.local
      .set({ blockedTexts: [] })
      .then(() => {
        // Reload the list
        loadBlockedTexts();

        // Notify content scripts that the list has changed
        return browser.tabs.query({ active: true, currentWindow: true });
      })
      .then((tabs) => {
        if (tabs[0]) {
          return browser.tabs.sendMessage(tabs[0].id, {
            action: "updateBlockedTexts",
          });
        }
      })
      .catch((error) => {
        console.error("Error clearing blocked texts:", error);
      });
  }

  // Restore the page by removing all blocks
  function restorePage() {
    browser.tabs
      .query({ active: true, currentWindow: true })
      .then((tabs) => {
        if (tabs[0]) {
          return browser.tabs.sendMessage(tabs[0].id, {
            action: "restorePage",
          });
        }
      })
      .catch((error) => {
        console.error("Error restoring page:", error);
      });
  }

  // Render the list of blocked texts
  function renderBlockedTextsList(blockedTexts) {
    list.innerHTML = "";

    if (blockedTexts.length === 0) {
      list.innerHTML = "<p>No texts currently blocked.</p>";
      return;
    }

    blockedTexts.forEach((text) => {
      const item = document.createElement("div");
      item.className = "blocked-text-item";

      const textSpan = document.createElement("span");
      textSpan.textContent = text;

      const buttonContainer = document.createElement("div");
      buttonContainer.style.display = "flex";
      buttonContainer.style.gap = "5px";

      const restoreBtn = document.createElement("button");
      restoreBtn.className = "restore-btn";
      restoreBtn.textContent = "Restore";
      restoreBtn.style.backgroundColor = "#4CAF50";
      restoreBtn.style.color = "white";
      restoreBtn.style.border = "none";
      restoreBtn.style.borderRadius = "3px";
      restoreBtn.style.padding = "2px 5px";
      restoreBtn.style.cursor = "pointer";
      restoreBtn.addEventListener("click", () => restoreElementsForText(text));

      buttonContainer.appendChild(restoreBtn);

      item.appendChild(textSpan);
      item.appendChild(buttonContainer);
      list.appendChild(item);
    });
  }
});
