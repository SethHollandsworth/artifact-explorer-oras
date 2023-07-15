const reg = document.querySelector(".artifactInputForm #registry input");
const repo = document.querySelector(".artifactInputForm #repository input");
const artifact = document.querySelector("#content_area");
const rows = document.querySelectorAll("#table_digest");

// function calls
async function displayArtifactContents() {
  try {
    document
      .getElementById("content_area")
      .scrollIntoView({ behavior: "smooth" });
    await ar.setContents({
      registry: `${reg.value}/`,
      repo: repo.value,
      tag: tag.value,
    });
    alterRightSide("manifestBlock");
    rsb.isReferrersPrepared = false;
    rsb.isBlobsPrepared = false;
  } catch (error) {
    console.error(error);
  }
}

function onSubmit(currentPage) {
  if (!reg.value || !repo.value || !tag.value) return;
  if (currentPage === "home") {
    window.location.href = `/artifact?image=${reg.value}/${repo.value}${
      !tagList || !tagList.includes(tag.value) ? "@" : ":"
    }${tag.value}`;
  } else if (currentPage === "artifact") {
    artifact.classList.remove("hide");
    artifact.classList.add("show");
    displayArtifactContents();
    const artifactUrl = `?image=${reg.value}/${repo.value}${
      !tagList || !tagList.includes(tag.value) ? "@" : ":"
    }${tag.value}`;
    window.history.pushState(
      {
        page: currentPage,
        artifactUrl: artifactUrl,
      },
      "",
      artifactUrl
    );
  }
}
// ends

// registry list dropdown javascript
const regList = [
  {
    name: "docker.io",
    image: "./static/images/registryImages/image1.svg",
  },
  {
    name: "gcr.io",
    image: "./static/images/registryImages/image2.svg",
  },
  {
    name: "zot.io",
    image: "./static/images/registryImages/image4.svg",
  },
  {
    name: "ghcr.io",
    image: "./static/images/registryImages/image6.svg",
  },
];
const regDropdown = document.querySelector(
  ".artifactInputForm .registryDropdown"
);

function showRegList() {
  regDropdown.classList.remove("hide");
  regDropdown.classList.add("show");
  updateRegList();
}

function updateRegList() {
  const filterList = regList.filter((item) =>
    item?.name.includes(reg.value || "")
  );
  if (!filterList.length) {
    regDropdown.innerHTML = "No match found";
    return;
  }
  let listItems = "";
  filterList.map(
    (item) =>
      (listItems += `<div data-name="${item.name}" class="items">
      <img src="${item.image}" />
      <p>${item.name}</p>
    </div>`)
  );
  regDropdown.innerHTML = listItems;
  document
    .querySelectorAll(".artifactInputForm .registryDropdown .items")
    ?.forEach((regElement) =>
      regElement.addEventListener("click", () => {
        reg.value = regElement.getAttribute("data-name");
        updateRegList();
      })
    );
}
// ends

// tag list javascript
const tag = document.querySelector(".artifactInputForm #digestortag input");
const tagListDropdown = document.querySelector(
  ".artifactInputForm .tagListDropdown"
);

let tagList = [];
let isRepoRegChanged = false;

function fetchTagList() {
  return new Promise((resolve, reject) => {
    tagListDropdown.innerHTML =
      '<div class="skeletonLoader"></div> <div class="skeletonLoader"></div><div class="skeletonLoader"></div>';
    const URL = `/api/tags?registry=${reg.value}/&name=${repo.value}`;
    fetch(URL)
      .then((res) => res.json())
      .then((data) => {
        tagList = data;
        updateTagList();
        resolve();
      })
      .catch((err) => {
        tagListDropdown.innerHTML = `
          <div class="error">
            <img src="./static/images/crossIcon.svg"/>
            <div>Failed to fetch tags</div>
          </div>
        `;
        reject(err);
      });
  });
}

function updateTagList() {
  const filterList = tagList.filter((item) => item.includes(tag.value || ""));
  if (!filterList.length) {
    tagListDropdown.innerHTML = `
    <div class="info">
      <img src="./static/images/infoIcon.svg"/>
      <div>No match found</div>
    </div>
    `;
    return;
  }
  let html = "";
  filterList.map((item) => (html += `<p class="tagListItem">${item}</p>`));

  tagListDropdown.innerHTML = html;
  isRepoRegChanged = false;
  document
    .querySelectorAll(".artifactInputForm .tagListDropdown p")
    ?.forEach((tagElement) =>
      tagElement.addEventListener("click", () => {
        tag.value = tagElement.innerHTML;
        updateTagList();
      })
    );
}

function listTags() {
  if (!repo.value || !reg.value) return;
  tagListDropdown.classList.remove("hide");
  tagListDropdown.classList.add("show");
  if (!tagList.length || isRepoRegChanged) {
    fetchTagList();
  } else {
    updateTagList();
  }
}

repo.addEventListener("change", () => (isRepoRegChanged = true));
reg.addEventListener("change", () => (isRepoRegChanged = true));
// ends

// Sidebar Javascript
const sidebarItems = document.querySelectorAll(
  "#content_area .main .leftSideBar ul li"
);

sidebarItems.forEach((item) => {
  item.addEventListener("click", () => {
    sidebarItems.forEach((item) => item.classList.remove("active"));
    item.classList.add("active");
  });
});

function alterRightSide(contentId) {
  const contentBlocks = document.querySelectorAll(
    "#content_area .main .rightContent .contentBlock"
  );
  const selectedContent = document.querySelector(
    `#content_area .main .rightContent #${contentId}`
  );

  for (let i = 0; i < contentBlocks.length; i++) {
    contentBlocks[i].classList.remove("active");
  }
  selectedContent.classList.add("active");
  if (contentId === "referrerBlock" && !rsb.isReferrersPrepared) {
    if (!reg.value || !repo.value || !tag.value) return;
    rsb.prepareReferrersBlock();
  }
}
// ends

// referrer Tree
function generateTree(treeData) {
  let html = "";
  treeData.forEach((node) => {
    html += `
      <li>
        <details>
          <summary>${node.ref.artifactType}</summary>
          <ul>
            <li id="digest"><a href="/artifact?image=${reg.value}/${
      repo.value
    }@${node.ref.digest}" target="_blank">${node.ref.digest}</a></li>
            ${node.nodes && generateTree(node.nodes)}
          </ul>
        </details>
      </li>
    `;
  });
  return html;
}
// ends

// right side javascript
function switchView(contentId, elementId, headClass) {
  const contentHeads = document.querySelectorAll(`#${elementId} .header .view`);
  const selectedHead = document.querySelector(
    `#${elementId} .header .${headClass}`
  );
  const contentBlocks = document.querySelectorAll(`#${elementId} .view-item`);
  const selectedContent = document.querySelector(`#${elementId} #${contentId}`);
  for (let i = 0; i < contentBlocks.length; i++) {
    contentBlocks[i].classList.remove("active");
  }
  for (let i = 0; i < contentHeads.length; i++) {
    contentHeads[i].classList.remove("active");
  }
  selectedContent.classList.add("active");
  selectedHead.classList.add("active");
}

function blockTemplate(title, table, json, views) {
  return `
    <div id=${views.id}>
    <div class="header">
    <h1>${title}</h1>
    <div class="ui tabular menu">
      <a class="item active view aa" onclick='switchView("table", "${views.id}", "aa")'>
        TABLE VIEW
      </a>
      <a class="item view bb" onclick='switchView("jsonV", "${views.id}","bb")'>
        JSON VIEW
      </a>
      <div class="item">
        <div class="ui primary button">DOWNLOAD</div>
      </div>
    </div>
    </div>
    ${table}
    ${json}
    </div>
  `;
}
class RightSideBlock {
  contructor() {
    this.isManifestPrepared = false;
    this.isReferrersPrepared = false;
    this.isBlobsPrepared = false;
  }

  prepareMetaData() {
    let inp = document.querySelectorAll("#content_area .metaData .ui input");
    inp[0].value = ar.Artifact ? ar.Artifact : "not available";
    inp[1].value = ar.Digest ? ar.Digest : "not available";
    inp[2].value = ar.MediaType ? ar.Manifests : "not available";
  }

  prepareManifestsBlock() {
    if (this.isManifestPrepared || (!ar.Manifests && !ar.Layers && !ar.Configs))
      return;

    const loader = document.querySelector(
      "#content_area .main .rightContent .loadingBlock"
    );
    const b1 = document.querySelector("#manifestBlock");
    b1.innerHTML = "";

    loader.classList.remove("spinner");
    loader.classList.add("loader");
    window.setTimeout(() => {
      loader.classList.remove("loader");
      loader.classList.add("spinner");

      if (ar.Manifests) {
        let records = "";
        ar.Manifests.forEach((item, ind) => {
          records += `
            <tr>
              <td colspan="2">${item.mediaType}</td>
              <td>${item.size}</td>
              <td colspan="3" id="digest">
              <div id="digest"> ${item.digest} </div>
              <img src="./static/images/copyIcon.svg" id="copyIcon">
              </td>
              <td colspan="2">${item.platform?.architecture}</td>
              <td>${item.platform?.os}</td>
            </tr>`;
        });
        const table = `
          <div class="view-item active" id="table">
          <table class="ui fixed single line celled table">
          <thead>
          <tr>
            <th scope="col" colspan="2">Mediatype</th>
            <th scope="col">Size</th>
            <th scope="col" colspan="3">Digest</th>
            <th scope="col" colspan="2">Architecture</th>
            <th scope="col">os</th>
          </tr>
          </thead>
          ${records}
          </table>
          </div>`;

        const JSONview = `
          <div class="view-item" id="jsonV">
          <pre>
            ${prettyPrintJson.toHtml({ Manifests: ar.Manifests })}
          </pre>
          </div>
        `;
        b1.innerHTML += blockTemplate("Content Manifests", table, JSONview, {
          id: "manifestTable",
        });

        const topBar = document.querySelectorAll(
          "#manifestTable .header .menu .view"
        );

        topBar?.forEach((item) => {
          item.addEventListener("click", () => {
            topBar?.forEach((item) => item.classList.remove("active"));
            item.classList.add("active");
          });
        });
        document
          .querySelectorAll("#manifestTable table #digest")
          .forEach((digest) =>
            digest.addEventListener("click", async function (event) {
              event.preventDefault();
              const artifactUrl = `?image=${reg.value}/${repo.value}${
                !tagList || !tagList.includes(tag.value) ? "@" : ":"
              }${tag.value}`;
              window.history.pushState(
                {
                  page: "artifact",
                  artifactUrl: artifactUrl,
                },
                "",
                artifactUrl
              );
              const d = digest.textContent.trim();
              tag.value = d;
              try {
                await fetchTagList();
                await displayArtifactContents();
              } catch (error) {
                console.error(error);
              }
            })
          );
      }

      if (ar.Layers) {
        let records = "";
        ar.Layers.forEach((item, ind) => {
          records += `
            <tr>
              <td colspan="2">${item.mediaType}</td>
              <td>${item.size}</td>
              <td colspan="4" id="digest">
              <div id="digest"> ${item.digest} </div>
              <img src="./static/images/copyIcon.svg" id="copyIcon">
              </td>
            </tr>`;
        });
        const table = `
          <div class="view-item active" id="table">
          <table class="ui fixed single line celled table">
          <thead>
          <tr>
            <th scope="col" colspan="2">Mediatype</th>
            <th scope="col">Size</th>
            <th scope="col" colspan="4">Digest</th>
          </tr>
          </thead>
          ${records}
          </table>
          </div>`;

        const JSONview = `
          <div class="view-item" id="jsonV">
          <pre>
            ${prettyPrintJson.toHtml({ Layers: ar.Layers })}
          </pre>
          </div>
        `;
        b1.innerHTML += blockTemplate("Layers", table, JSONview, {
          id: "layersTable",
        });

        const topBar = document.querySelectorAll(
          "#layersTable .header .menu .view"
        );

        topBar?.forEach((item) => {
          item.addEventListener("click", () => {
            topBar?.forEach((item) => item.classList.remove("active"));
            item.classList.add("active");
          });
        });
      }

      if (ar.Configs) {
        let Configs = [];
        if (!Array.isArray(ar.Configs)) {
          Configs.push(ar.Configs);
        } else {
          Configs = ar.Configs;
        }
        let records = "";
        Configs.forEach((item, ind) => {
          records += `
            <tr>
              <td colspan="2">${item.mediaType}</td>
              <td>${item.size}</td>
              <td colspan="4" id="digest">
              <div id="digest"> ${item.digest} </div>
              <img src="./static/images/copyIcon.svg" id="copyIcon">
              </td>
            </tr>`;
        });
        const table = `
          <div class="view-item active" id="table">
          <table class="ui fixed single line celled table">
          <thead>
          <tr>
            <th scope="col" colspan="2">Mediatype</th>
            <th scope="col">Size</th>
            <th scope="col" colspan="4">Digest</th>
          </tr>
          </thead>
          ${records}
          </table>
          </div>`;

        const JSONview = `
          <div class="view-item" id="jsonV">
          <pre>
            ${prettyPrintJson.toHtml({ Configs })}
          </pre>
          </div>
        `;
        b1.innerHTML += blockTemplate("Configs", table, JSONview, {
          id: "configsTable",
        });

        const topBar = document.querySelectorAll(
          "#configsTable .header .menu .view"
        );

        topBar?.forEach((item) => {
          item.addEventListener("click", () => {
            topBar?.forEach((item) => item.classList.remove("active"));
            item.classList.add("active");
          });
        });
      }
    }, 500);
  }

  async prepareReferrersBlock() {
    if (this.isReferrersPrepared) return;

    const loader = document.querySelector(
      "#content_area .main .rightContent .loadingBlock"
    );
    const treeView = document.getElementById("referrerBlock");
    treeView.innerHTML = "";

    loader.classList.remove("spinner");
    loader.classList.add("loader");
    try {
      await ar.setReferrers({
        registry: reg.value,
        repo: repo.value,
        tag: tag.value,
      });
      loader.classList.remove("loader");
      loader.classList.add("spinner");

      if (!ar.Referrers.length) {
        treeView.innerHTML = `
        <div class="info">
          <img src="./static/images/infoIcon.svg"/>
          <div>No referrers available</div>
        </div>
        `;
        return;
      }
      const JSONview = `
        <div class="view-item" id="jsonV">
          <pre>
            ${prettyPrintJson.toHtml({ Referrers: ar.Referrers })}
          </pre>
        </div>`;
      const treeV = `
      <div id="treeV" class="view-item active">
        <ul>${generateTree(ar.Referrers)}</ul>
      </div>`;
      treeView.innerHTML = `
      <div id="referrers">
        <div class="header">
        <h1>Referrers</h1>
        <div class="ui tabular menu">
          <a class="item active view aa" onclick='switchView("treeV", "referrers", "aa")'>
            TREE VIEW
          </a>
          <a class="item view bb" onclick='switchView("jsonV", "referrers", "bb")'>
            JSON VIEW
          </a>
          <div class="item">
            <div class="ui primary button">DOWNLOAD</div>
          </div>
        </div>
        </div>
        ${treeV}
        ${JSONview}
      </div>
      `;
      var treeNodes = document.getElementsByClassName("tree-node");

      Array.from(treeNodes).forEach(function (node) {
        var content = node.querySelector(".tree-content");
        var children = node.querySelector(".tree-children");

        if (children) {
          content.addEventListener("click", function () {
            node.classList.toggle("collapsed");
            children.style.display = node.classList.contains("collapsed")
              ? "none"
              : "block";
          });
        }
      });
    } catch (err) {
      treeView.innerHTML = `
      <div class="error">
        <img src="./static/images/crossIcon.svg"/>
        <div>Failed to fetch referrers</div>
      </div>
      `;
      rsb.isReferrersPrepared = false;
    }
  }

  prepareBlobsBlock() {
    if (this.isBlobsPrepared || (!ar.Layers && !ar.Configs)) return;
    // generate Table
    // create Views object for download and json view
    // generate Block from BlockTemplate
    // set into the DOM element
  }
}

let rsb = new RightSideBlock();
// ends

// artifact contents javascript
class Artifact {
  constructor() {
    this.Artifact = "";
    this.MediaType = "";
    this.Digest = "";
    this.Manifests = null;
    this.Configs = null;
    this.Layers = null;
    this.Blobs = null;
    this.Referrers = null;
  }

  async setContents(artifact) {
    const response = await fetch(
      `/api/artifact?registry=${artifact.registry}&name=${artifact.repo}&${
        !tagList || !tagList.includes(artifact.tag) ? "digest" : "tag"
      }=${artifact.tag}`
    );
    const data = await response.json();
    this.Artifact = data.Artifact;
    this.MediaType = data.MediaType;
    this.Configs = data.Configs;
    this.Manifests = data.Manifests;
    this.Layers = data.Layers;
    this.Digest = data.Digest;

    rsb.prepareMetaData();
    rsb.prepareManifestsBlock();
  }

  async setReferrers(artifact) {
    try {
      const response = await fetch(
        `/api/referrers?registry=${artifact.registry}/&name=${artifact.repo}&${
          !tagList || !tagList.includes(artifact.tag) ? "digest" : "tag"
        }=${artifact.tag}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch referrers");
      }

      const data = await response.json();
      this.Referrers = data;
      rsb.prepareReferrersBlock();
      rsb.isReferrersPrepared = true;
      return null;
    } catch (err) {
      return err;
    }
  }

  setBlobs() {
    this.Blobs = [...this.Configs, ...this.Layers];
  }
}

let ar = new Artifact();
// ends

// others
document.addEventListener("click", (event) => {
  const isOutsideTagList =
    tagListDropdown.contains(event.target) ||
    tag.contains(event.target) ||
    event.target.classList.contains("tagListItem");

  const isOutsideRegList =
    regDropdown.contains(event.target) ||
    reg.contains(event.target) ||
    event.target.classList.contains("regListItem");

  if (!isOutsideRegList) {
    regDropdown.classList.remove("show");
    regDropdown.classList.add("hide");
  }
  if (!isOutsideTagList) {
    tagListDropdown.classList.remove("show");
    tagListDropdown.classList.add("hide");
  }
});
window.addEventListener("popstate", async function (event) {
  if (event.state && event.state.page === "artifact") {
    const artifactUrl = event.state.artifactUrl;
    const searchParams = new URLSearchParams(artifactUrl);
    const image = searchParams.get("image");
    const regex = /^(.+?)\/(.+?)(?::|@)(.+)$/;
    const matches = image.match(regex);

    reg.value = matches[1];
    repo.value = matches[2];
    tag.value = matches[3];

    try {
      await fetchTagList();
      await displayArtifactContents();
    } catch (error) {
      console.error(error);
    }
  }
});

document.addEventListener("DOMContentLoaded", async function () {
  const pathname = window.location.pathname;
  const image = new URLSearchParams(window.location.search).get("image");

  if (!pathname.substring(pathname.lastIndexOf("/") + 1) || !image) return;
  const regex = /^(.+?)\/(.+?)(?::|@)(.+)$/;
  const matches = image.match(regex);

  reg.value = `${matches[1]}`;
  repo.value = matches[2];
  tag.value = matches[3];

  artifact.classList.remove("hide");
  artifact.classList.add("show");

  try {
    await fetchTagList();
    await displayArtifactContents();
  } catch (error) {
    console.error(error);
  }
});
// ends
