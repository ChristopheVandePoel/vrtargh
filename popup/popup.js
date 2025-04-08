// popup/popup.js
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('addForm');
    const input = document.getElementById('newBlockedText');
    const list = document.getElementById('blockedTextsList');
    
    // Load and display current blocked texts
    loadBlockedTexts();
    
    // Handle form submission to add new blocked text
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const newText = input.value.trim();
      
      if (newText) {
        addBlockedText(newText);
        input.value = '';
      }
    });
    
    // Load blocked texts from storage and display them
    function loadBlockedTexts() {
      browser.storage.local.get('blockedTexts')
        .then(result => {
          const blockedTexts = result.blockedTexts || [];
          renderBlockedTextsList(blockedTexts);
        })
        .catch(error => {
          console.error('Error loading blocked texts:', error);
        });
    }
    
    // Add a new text to the blocked list
    function addBlockedText(text) {
      browser.storage.local.get('blockedTexts')
        .then(result => {
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
        .then(tabs => {
          if (tabs[0]) {
            return browser.tabs.sendMessage(tabs[0].id, { action: 'updateBlockedTexts' });
          }
        })
        .catch(error => {
          console.error('Error adding blocked text:', error);
        });
    }
    
    // Remove a text from the blocked list
    function removeBlockedText(text) {
      browser.storage.local.get('blockedTexts')
        .then(result => {
          let blockedTexts = result.blockedTexts || [];
          blockedTexts = blockedTexts.filter(t => t !== text);
          
          // Save updated list
          return browser.storage.local.set({ blockedTexts });
        })
        .then(() => {
          // Reload the list
          loadBlockedTexts();
          
          // Notify content scripts that the list has changed
          return browser.tabs.query({ active: true, currentWindow: true });
        })
        .then(tabs => {
          if (tabs[0]) {
            return browser.tabs.sendMessage(tabs[0].id, { action: 'updateBlockedTexts' });
          }
        })
        .catch(error => {
          console.error('Error removing blocked text:', error);
        });
    }
    
    // Render the list of blocked texts
    function renderBlockedTextsList(blockedTexts) {
      list.innerHTML = '';
      
      if (blockedTexts.length === 0) {
        list.innerHTML = '<p>No texts currently blocked.</p>';
        return;
      }
      
      blockedTexts.forEach(text => {
        const item = document.createElement('div');
        item.className = 'blocked-text-item';
        
        const textSpan = document.createElement('span');
        textSpan.textContent = text;
        
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.textContent = 'Delete';
        deleteBtn.addEventListener('click', () => removeBlockedText(text));
        
        item.appendChild(textSpan);
        item.appendChild(deleteBtn);
        list.appendChild(item);
      });
    }
  });