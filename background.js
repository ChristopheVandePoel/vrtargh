// background.js (simple)
console.log("BACKGROUND SCRIPT LOADED");

// Alert when extension is installed
browser.runtime.onInstalled.addListener(() => {
  console.log("EXTENSION INSTALLED");
});