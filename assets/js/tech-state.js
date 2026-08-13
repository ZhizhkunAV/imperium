(function () {
  const STORAGE_KEY = 'gameResearchedTech';

  const branchOrder = {
    military: ['tactics', 'gladius', 'pilum', 'cavalry'],
    peaceful: ['roads', 'masonry', 'forge', 'colosseum'],
    root: ['farming'],
  };

  const defaultResearched = ['farming'];

  function load() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (!Array.isArray(saved)) return [...defaultResearched];
      const merged = [...defaultResearched];
      saved.forEach((id) => {
        if (!merged.includes(id)) merged.push(id);
      });
      return merged;
    } catch {
      return [...defaultResearched];
    }
  }

  function save(list) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent('tech-state-changed'));
    try {
      if (window.parent && window.parent !== window) {
        window.parent.postMessage({ type: 'tech-state-changed' }, '*');
      }
    } catch (_) { /* ignore */ }
  }

  function getBranch(techId) {
    for (const [branch, order] of Object.entries(branchOrder)) {
      if (order.includes(techId)) return branch;
    }
    return null;
  }

  function getResearched() {
    return load();
  }

  function isResearched(techId) {
    return load().includes(techId);
  }

  function isAvailable(techId) {
    if (isResearched(techId)) return false;
    const branch = getBranch(techId);
    if (!branch || branch === 'root') return false;
    const order = branchOrder[branch];
    const idx = order.indexOf(techId);
    if (idx <= 0) return true;
    return isResearched(order[idx - 1]);
  }

  function isLocked(techId) {
    if (branchOrder.root.includes(techId)) return false;
    return !isResearched(techId) && !isAvailable(techId);
  }

  function setResearched(techId, researched) {
    if (branchOrder.root.includes(techId) && !researched) return;

    let list = load();
    const branch = getBranch(techId);

    if (researched) {
      if (!list.includes(techId)) list.push(techId);
    } else if (branch) {
      const order = branchOrder[branch];
      const idx = order.indexOf(techId);
      list = list.filter((id) => !order.slice(idx).includes(id));
    } else {
      list = list.filter((id) => id !== techId);
    }

    save(list);
  }

  window.TechState = {
    branchOrder,
    getResearched,
    isResearched,
    isAvailable,
    isLocked,
    setResearched,
  };
})();
