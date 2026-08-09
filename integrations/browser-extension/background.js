// Classic script (not an ES module) — loads identically as a Chrome MV3
// service worker and a Firefox MV3 background script.
const api = typeof browser !== 'undefined' ? browser : chrome;

api.runtime.onInstalled.addListener(() => {
  api.contextMenus.create({
    id: 'visora-render-selection',
    title: 'Render with Visora',
    contexts: ['selection'],
  });
});

api.contextMenus.onClicked.addListener((info) => {
  if (info.menuItemId !== 'visora-render-selection' || !info.selectionText) return;

  // Stash the selection for popup.js to pick up, then open the popup as
  // a standalone window. The toolbar action.openPopup() API only works
  // reliably from a genuine user gesture on the action button itself in
  // some browsers, not from a context menu callback — a plain window is
  // the one approach that behaves the same in both Chrome and Firefox.
  api.storage.local.set({ pendingSelection: info.selectionText }).then(() => {
    api.windows.create({
      url: api.runtime.getURL('popup.html'),
      type: 'popup',
      width: 380,
      height: 560,
    });
  });
});
