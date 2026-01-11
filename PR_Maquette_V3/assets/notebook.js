let NOTEBOOK = null;

function getCellSource(cell) {
  if (!cell || cell.source == null) return "";
  if (Array.isArray(cell.source)) return cell.source.join("");
  if (typeof cell.source === "string") return cell.source;
  return "";
}

// Rend Markdown → HTML (sécurisé)
function renderMarkdown(mdText) {
  // marked.parse() produit de l'HTML
  const rawHtml = window.marked.parse(mdText, {
    gfm: true,
    breaks: true
  });

  // Nettoie l'HTML pour éviter injections
  return window.DOMPurify.sanitize(rawHtml);
}

async function loadNotebook(url) {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Fetch failed (${res.status}) on ${url}`);
  return await res.json();
}

function renderNotebook(containerId, nb) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = "";

  if (!nb || !Array.isArray(nb.cells)) {
    container.innerHTML = "<p><em>Notebook non chargé.</em></p>";
    return;
  }

  nb.cells.forEach((cell, idx) => {
    const wrapper = document.createElement("div");
    wrapper.className = "cell " + (cell.cell_type || "unknown");

    const header = document.createElement("div");
    header.className = "cellHeader";
    header.textContent = `${String(cell.cell_type || "cell").toUpperCase()} #${idx + 1}`;
    wrapper.appendChild(header);

    const content = document.createElement("div");
    content.className = "cellContent";

    const text = getCellSource(cell);

    if (cell.cell_type === "markdown") {
      // ✅ Markdown rendu en HTML
      content.innerHTML = renderMarkdown(text);
      wrapper.classList.add("markdown");
    } else if (cell.cell_type === "code") {
      // Code en texte brut
      content.textContent = text;
      wrapper.classList.add("code");
    } else {
      content.textContent = text;
    }

    wrapper.appendChild(content);
    container.appendChild(wrapper);
  });
}

async function initNotebookPage() {
  const target = document.getElementById("notebook");
  if (!target) return; // pas une page notebook

  // Vérifie que les libs sont bien chargées
  if (!window.marked || !window.DOMPurify) {
    target.innerHTML = "<p><em>Erreur: marked.js ou DOMPurify n’est pas chargé.</em></p>";
    return;
  }

  try {
    NOTEBOOK = await loadNotebook("./assets/titanic-machine-learning-from-disaster.ipynb");
    renderNotebook("notebook", NOTEBOOK);
  } catch (err) {
    console.error(err);
    target.innerHTML = `<p><em>Erreur de chargement du notebook : ${err.message}</em></p>`;
  }
}

document.addEventListener("DOMContentLoaded", initNotebookPage);
