/* --- 1. THE WORKER FUNCTIONS --- */

// Handle logo switching based on theme
function changeLogo() {
  const logoElement = document.querySelector(".md-header__button > img");
  if (!logoElement) return;
  const colorScheme = document.body.dataset.mdColorScheme;
  const path = colorScheme === "default" ? "/assets/logo.png" : "/assets/logo_dark_mode.png";
  if (logoElement.getAttribute("src") !== path) {
    logoElement.setAttribute("src", path);
  }
}

// Handle the Related Topics injection
async function injectRelatedTopics() {
  const tagElements = document.querySelectorAll(".md-tag");
  if (tagElements.length === 0) return;

  const currentTags = Array.from(tagElements).map(t => t.innerText.trim());
  const oldBanner = document.getElementById("related-topics");
  if (oldBanner) oldBanner.remove();

  try {
    const response = await fetch('/related_content.json?v=' + Date.now());
    if (!response.ok) throw new Error('JSON not found');
    const tagMap = await response.json();

    const currentPath = window.location.pathname;
    let seenUrls = new Set([currentPath]); 

    let selectedLinks = [];
    let added;
    let iteration = 0;
    do {
      added = false;
      for (const tag of currentTags) {
        const pool = tagMap[tag] || [];
        const match = pool.find(p => !seenUrls.has(p.url));
        if (match && selectedLinks.length < 10) {
          selectedLinks.push(match);
          seenUrls.add(match.url);
          added = true;
        }
      }
      iteration++;
    } while (added && selectedLinks.length < 10 && iteration < 20);

    if (selectedLinks.length > 0) renderRelatedBanner(selectedLinks);
  } catch (e) {
    console.warn("Related topics could not be loaded:", e);
  }
}

function renderRelatedBanner(topics) {
  const mainContent = document.querySelector(".md-content__inner");
  if (!mainContent || document.getElementById("related-topics")) return;

  const container = document.createElement('details');
  container.id = 'related-topics';
  container.className = "admonition tip";
  container.open = true;
  
  const listItems = topics.map((t) => {
    return `<li><a href="${t.url}">${t.title}</a></li>`;
  }).join('');

  container.innerHTML = `
    <summary>Learn more</summary>
    <ul>
      ${listItems}
    </ul>
  `;
  mainContent.appendChild(container);
}

// Capabilities Dynamic Tabs
async function injectCapabilitiesTabs() {
  const container = document.getElementById("dynamic-capabilities-tabs");
  if (!container || !window.location.pathname.includes("/pronovix-capabilities/")) return;

  try {
    const response = await fetch('/related_content.json?v=' + Date.now());
    if (!response.ok) throw new Error('JSON not found');
    const tagMap = await response.json();

    const categories = [
      { id: "recipes", tag: "Recipe", label: "Recipes" },
      { id: "px-core-modules", tag: "PX Core module", label: "PX Core modules" },
      { id: "prototype-modules", tag: "Prototype module", label: "Prototype modules" },
      { id: "zg-base", tag: "ZG base", label: "ZG base" },
      { id: "open-source-zg", tag: "Open-source ZG", label: "Open-source ZG" }
    ];

    let inputs = "";
    let labels = "";
    let blocks = "";

    categories.forEach((cat, index) => {
      const isChecked = index === 0 ? 'checked="checked"' : "";
      const pages = tagMap[cat.tag] || [];
      
      inputs += `<input ${isChecked} id="${cat.id}" name="__tabbed_1" type="radio">`;
      labels += `<label for="${cat.id}"><a href="#${cat.id}" tabindex="-1">${cat.label}</a></label>`;
      
      const listContent = pages.length > 0 
        ? `<ul>${pages.map(p => `<li><a href="${p.url}">${p.title}</a></li>`).join('')}</ul>`
        : `<p>No items found for this category.</p>`;
        
      blocks += `<div class="tabbed-block">${listContent}</div>`;
    });

    container.innerHTML = `
      <div class="tabbed-set tabbed-alternate" data-tabs="1:5">
        ${inputs}
        <div class="tabbed-labels tabbed-labels--linked">${labels}</div>
        <div class="tabbed-content">${blocks}</div>
      </div>
    `;

    const tabLabels = container.querySelectorAll('.tabbed-labels label');
    if (tabLabels.length > 0) {
      tabLabels.forEach((label, i) => {
        label.addEventListener('click', () => {
          const radioInputs = container.querySelectorAll('input[type="radio"]');
          if (radioInputs[i]) radioInputs[i].checked = true;
        });
      });
    }

  } catch (e) {
    console.error("Capabilities Tab injection failed:", e);
    container.innerHTML = "<p><em>Unable to load dynamic capabilities list.</em></p>";
  }
}

/* --- 2. INITIALIZATION FLOW --- */

function initAll() {
  changeLogo();
  injectRelatedTopics();
  injectCapabilitiesTabs();
  
  // Modal creation
  if (!document.getElementById("imageModal")) {
    const modalHTML = `
      <div id="imageModal" class="modal" style="display:none;">
        <span class="close">&times;</span>
        <img class="modal-content" id="fullImg">
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    const modalElement = document.getElementById("imageModal");
    modalElement.onclick = function() { this.style.display = "none"; };
  }
}

/* --- 3. EVENT LISTENERS & OBSERVERS --- */

// Standard load
document.addEventListener("DOMContentLoaded", initAll);

// Support for Material's "Instant Loading"
if (typeof document.subscribe === "function") {
  document.subscribe(() => {
    initAll();
  });
}

// Theme change observer
const themeObserver = new MutationObserver(() => changeLogo());
themeObserver.observe(document.body, { attributes: true, attributeFilter: ['data-md-color-scheme'] });

// Modal Click Listener
document.addEventListener('click', (e) => {
  // Only trigger if it's an image, not in the modal already, and not the header logo
  if (e.target.tagName === 'IMG' && !e.target.closest('#imageModal') && !e.target.closest('.md-header')) {
    const modal = document.getElementById("imageModal");
    const modalImg = document.getElementById("fullImg");
    
    if (modal && modalImg) {
      modal.style.display = "block";
      modalImg.src = e.target.src;
    }
  }
});