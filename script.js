require('dotenv').config()
const fetch = require('node-fetch')
const fs = require('fs')


let allProjects = []

// Ambil data dari localStorage atau fetch dari file JSON
if (localStorage.getItem("projects")) {
  allProjects = JSON.parse(localStorage.getItem("projects"))
  renderProjects(allProjects)
} else {
  fetch('projects.json')
    .then(res => res.json())
    .then(data => {
      allProjects = data
      saveProjects()
      renderProjects(allProjects)
    })
    .catch(err => {
      document.getElementById('project-list').innerHTML = '<p>Gagal memuat project.</p>'
      console.error(err)
    })
}

function saveProjects() {
  localStorage.setItem("projects", JSON.stringify(allProjects))
}

// Developer Mode login/logout
function activateDev() {
  if (localStorage.getItem("devMode") === "true") {
    localStorage.removeItem("devMode")
    document.getElementById("form-add").style.display = "none"
    document.getElementById("dev-btn").innerText = "🔐 Masuk Developer Mode"
    alert("🔓 Anda telah keluar dari Developer Mode")
    renderProjects(allProjects)
  } else {
    const pass = prompt("Masukkan kode developer:")
    if (pass === "Erlangga Developer") {
      localStorage.setItem("devMode", "true")
      document.getElementById("form-add").style.display = "block"
      document.getElementById("dev-btn").innerText = "🔓 Keluar Developer Mode"
      alert("✅ Developer mode aktif. Silakan tambah/edit project!")
      renderProjects(allProjects)
    } else {
      alert("❌ Kode salah!")
    }
  }
}

// Load theme & dev mode saat halaman dibuka
window.addEventListener('DOMContentLoaded', () => {
  if (localStorage.getItem("devMode") === "true") {
    document.getElementById("form-add").style.display = "block"
    document.getElementById("dev-btn").innerText = "🔓 Keluar Developer Mode"
  } else {
    document.getElementById("form-add").style.display = "none"
  }

  const saved = localStorage.getItem("theme") || "dark"
  document.body.dataset.theme = saved
})

// Toggle dark/light theme
function toggleTheme() {
  const current = document.body.dataset.theme || "dark"
  const next = current === "dark" ? "light" : "dark"
  document.body.dataset.theme = next
  localStorage.setItem("theme", next)
}

// Push Josn Biar Otomatis
async function uploadToGitHub(newData) {
  const token = process.env.GITHUB_TOKEN;
  const owner = process.env.GITHUB_OWNER;
  const repo = process.env.GITHUB_REPO;
  const path = process.env.GITHUB_PATH;

  try {
    // Ambil SHA terakhir dari file
    const get = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
      headers: { Authorization: `token ${token}` }
    });
    const json = await get.json();
    const sha = json.sha;

    // Encode isi file jadi base64
    const base64Data = btoa(unescape(encodeURIComponent(JSON.stringify(newData, null, 2))));

    // Kirim update ke GitHub
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
      method: "PUT",
      headers: {
        Authorization: `token ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message: "🔄 Update from Web",
        content: base64Data,
        sha
      })
    });

    if (res.ok) {
      alert("✅ Berhasil diupload ke GitHub!");
    } else {
      const error = await res.json();
      console.error("❌ Gagal upload:", error);
      alert("❌ Upload gagal. Lihat console log.");
    }
  } catch (e) {
    console.error("❌ Error:", e);
    alert("❌ Error saat upload ke GitHub.");
  }
}
// Tampilkan semua project
function renderProjects(projects) {
  const container = document.getElementById('project-list')
  container.innerHTML = ''
  const devMode = localStorage.getItem("devMode") === "true"

  projects.forEach((project, index) => {
    const div = document.createElement('div')
    div.className = 'project-card'
    div.innerHTML = `
      ${project.image ? `<img src="${project.image}" alt="Preview" style="width:100%;border-radius:8px;">` : ''}
      <h2>${project.title}</h2>
      <p>${project.desc}</p>
      <small><i>Kategori: ${project.category}</i></small>
      <div class="buttons">
        ${project.github ? `<a href="${project.github}" target="_blank">GitHub</a>` : ''}
        ${project.demo ? `<a href="${project.demo}" target="_blank">Demo</a>` : ''}
        ${project.whatsapp ? `<a href="https://wa.me/${project.whatsapp}" target="_blank" class="wa-btn">WhatsApp</a>` : ''}
        ${devMode ? `
          <button onclick="editProject(${index})">✏️ Edit</button>
          <button onclick="deleteProject(${index})" class="del-btn">🗑️ Hapus</button>
        ` : ''}
      </div>
    `
    container.appendChild(div)
  })
}

// Hapus project
function deleteProject(index) {
  if (!confirm("Yakin mau hapus project ini?")) return
  allProjects.splice(index, 1)
  saveProjects()
  renderProjects(allProjects)
  uploadToGitHub(allProjects);
  alert("🗑️ Project berhasil dihapus!")
}

// Tambah project baru
function addProject() {
  const title = document.getElementById('title').value.trim()
  const desc = document.getElementById('desc').value.trim()
  const category = document.getElementById('category').value.trim()
  const github = document.getElementById('github').value.trim()
  const demo = document.getElementById('demo').value.trim()
  const image = document.getElementById('image')?.value.trim()
  const whatsapp = document.getElementById('whatsapp')?.value.trim()

  if (!title || !desc || !category) {
    return alert("❗ Harap isi semua kolom yang wajib!")
  }

  const newProject = { title, desc, category, github, demo, image, whatsapp }

  allProjects.unshift(newProject)
  saveProjects()
  renderProjects(allProjects)
  uploadToGitHub(allProjects);
  
  document.getElementById('title').value = ''
  document.getElementById('desc').value = ''
  document.getElementById('category').value = ''
  document.getElementById('github').value = ''
  document.getElementById('demo').value = ''
  if (document.getElementById('image')) document.getElementById('image').value = ''
  if (document.getElementById('whatsapp')) document.getElementById('whatsapp').value = ''

  alert("✅ Project berhasil ditambahkan!")
}

// Edit project
function editProject(index) {
  const project = allProjects[index]
  document.getElementById('title').value = project.title
  document.getElementById('desc').value = project.desc
  document.getElementById('category').value = project.category
  document.getElementById('github').value = project.github
  document.getElementById('demo').value = project.demo
  if (document.getElementById('image')) document.getElementById('image').value = project.image || ''
  if (document.getElementById('whatsapp')) document.getElementById('whatsapp').value = project.whatsapp || ''

  window.scrollTo({ top: 0, behavior: "smooth" })

  const addBtn = document.querySelector('#form-add button')
  addBtn.textContent = '💾 Simpan Perubahan'
  addBtn.onclick = () => updateProject(index)
}

// Simpan perubahan
function updateProject(index) {
  const title = document.getElementById('title').value.trim()
  const desc = document.getElementById('desc').value.trim()
  const category = document.getElementById('category').value.trim()
  const github = document.getElementById('github').value.trim()
  const demo = document.getElementById('demo').value.trim()
  const image = document.getElementById('image')?.value.trim()
  const whatsapp = document.getElementById('whatsapp')?.value.trim()

  if (!title || !desc || !category) {
    return alert("❗ Semua kolom wajib diisi!")
  }

  allProjects[index] = { title, desc, category, github, demo, image, whatsapp }
  saveProjects()
  renderProjects(allProjects)
  uploadToGitHub(allProjects)
  document.getElementById('title').value = ''
  document.getElementById('desc').value = ''
  document.getElementById('category').value = ''
  document.getElementById('github').value = ''
  document.getElementById('demo').value = ''
  if (document.getElementById('image')) document.getElementById('image').value = ''
  if (document.getElementById('whatsapp')) document.getElementById('whatsapp').value = ''

  const addBtn = document.querySelector('#form-add button')
  addBtn.textContent = 'Tambah'
  addBtn.onclick = addProject

  alert("✅ Project berhasil diperbarui!")
}

// Filter berdasarkan kategori
function filterCategory(category) {
  if (category === 'All') {
    renderProjects(allProjects)
  } else {
    const filtered = allProjects.filter(p => p.category.toLowerCase() === category.toLowerCase())
    renderProjects(filtered)
  }
}

// === RAIN EFFECT ===
window.addEventListener("DOMContentLoaded", () => {
  const canvas = document.createElement('canvas');
  canvas.id = 'rain-canvas';
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  let drops = [];
  for (let i = 0; i < 300; i++) {
    drops.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      length: Math.random() * 20 + 10,
      speed: Math.random() * 4 + 4
    });
  }

  function drawRain() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = 'rgba(0, 217, 255, 0.5)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i < drops.length; i++) {
      let d = drops[i];
      ctx.moveTo(d.x, d.y);
      ctx.lineTo(d.x, d.y + d.length);
    }
    ctx.stroke();
    updateRain();
  }

  function updateRain() {
    for (let i = 0; i < drops.length; i++) {
      let d = drops[i];
      d.y += d.speed;
      if (d.y > canvas.height) {
        d.y = -d.length;
        d.x = Math.random() * canvas.width;
      }
    }
  }

  function animateRain() {
    drawRain();
    requestAnimationFrame(animateRain);
  }

  animateRain();

  window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  });
});
