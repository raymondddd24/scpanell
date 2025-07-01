// api/create-panel.js
// Ini adalah serverless function yang akan berjalan di Vercel

// Untuk menggunakan `fetch` di Node.js (lingkungan serverless),
// Anda mungkin perlu menginstalnya jika belum ada di proyek Anda:
// npm install node-fetch
import fetch from 'node-fetch'; 

export default async function handler(req, res) {
  // Pastikan ini adalah metode GET karena API eksternal Anda menggunakan GET
  if (req.method !== 'GET') {
    return res.status(405).json({ status: false, message: 'Method Not Allowed. Only GET is supported.' });
  }

  // Ambil parameter dari query string yang dikirim oleh frontend
  const { username, ram, disk, cpu, hostingPackage, panelType, accessKey } = req.query;

  // --- VALIDASI SISI SERVER (PENTING!) ---
  // Anda harus mengatur VERCEL_WEBSITE_ACCESS_KEY di Vercel Dashboard Environment Variables.
  // Ini adalah validasi sisi server untuk 'accessKey' Anda.
  const WEBSITE_ACCESS_KEY_SERVER = process.env.VITE_WEBSITE_ACCESS_KEY; // Ambil dari Vercel Env Vars
  if (accessKey !== WEBSITE_ACCESS_KEY_SERVER) {
    return res.status(401).json({ status: false, message: 'Unauthorized: Invalid Access Key.' });
  }

  // Validasi parameter wajib
  if (!username || !ram || !disk || !cpu || !panelType || !hostingPackage) {
    return res.status(400).json({ status: false, message: 'Missing required parameters.' });
  }

  // --- Ambil Konfigurasi Sensitif dari Environment Variables Vercel ---
  // Variabel-variabel ini HARUS DIATUR di Vercel Dashboard Anda
  // (Project Settings -> Environment Variables)
  const PUBLIC_PANEL_DOMAIN = process.env.VITE_PUBLIC_PANEL_DOMAIN; 
  const PUBLIC_PANEL_PTLA = process.env.VITE_PUBLIC_PANEL_PTLA;
  const PUBLIC_PANEL_PTLC = process.env.VITE_PUBLIC_PANEL_PTLC;
  const PUBLIC_PANEL_EGG_ID = process.env.VITE_PUBLIC_PANEL_EGG_ID;
  const PUBLIC_PANEL_NEST_ID = process.env.VITE_PUBLIC_PANEL_NEST_ID;
  const PUBLIC_PANEL_LOC = process.env.VITE_PUBLIC_PANEL_LOC;

  const PRIVATE_PANEL_DOMAIN = process.env.VITE_PRIVATE_PANEL_DOMAIN;
  const PRIVATE_PANEL_PTLA = process.env.VITE_PRIVATE_PANEL_PTLA;
  const PRIVATE_PANEL_PTLC = process.env.VITE_PRIVATE_PANEL_PTLC;
  const PRIVATE_PANEL_EGG_ID = process.env.VITE_PRIVATE_PANEL_EGG_ID;
  const PRIVATE_PANEL_NEST_ID = process.env.VITE_PRIVATE_PANEL_NEST_ID;
  const PRIVATE_PANEL_LOC = process.env.VITE_PRIVATE_PANEL_LOC;

  const BASE_URL_PTERODACTYL_API_TEMPLATE = process.env.VITE_BASE_URL_PTERODACTYL_API;

  let currentPanelConfig;
  if (panelType === 'public') {
    currentPanelConfig = {
      domain: PUBLIC_PANEL_DOMAIN,
      ptla: PUBLIC_PANEL_PTLA,
      ptlc: PUBLIC_PANEL_PTLC,
      eggId: PUBLIC_PANEL_EGG_ID,
      nestId: PUBLIC_PANEL_NEST_ID,
      loc: PUBLIC_PANEL_LOC
    };
  } else if (panelType === 'private') {
    currentPanelConfig = {
      domain: PRIVATE_PANEL_DOMAIN,
      ptla: PRIVATE_PANEL_PTLA,
      ptlc: PRIVATE_PANEL_PTLC,
      eggId: PRIVATE_PANEL_EGG_ID,
      nestId: PRIVATE_PANEL_NEST_ID,
      loc: PRIVATE_PANEL_LOC
    };
  } else {
    return res.status(400).json({ status: false, message: 'Invalid panel type provided.' });
  }

  // Bangun URL API Pterodactyl menggunakan data dari request frontend dan variabel lingkungan aman
  const finalPteroApiUrl = BASE_URL_PTERODACTYL_API_TEMPLATE
    .replace('username=', `username=${encodeURIComponent(username)}`)
    .replace('ram=', `ram=${ram}`)
    .replace('disk=', `disk=${disk}`)
    .replace('cpu=', `cpu=${cpu}`)
    .replace('eggid=', `eggid=${currentPanelConfig.eggId}`)
    .replace('nestid=', `nestid=${currentPanelConfig.nestId}`)
    .replace('loc=', `loc=${currentPanelConfig.loc}`)
    .replace('domain=', `domain=${encodeURIComponent(currentPanelConfig.domain)}`)
    .replace('ptla=', `ptla=${currentPanelConfig.ptla}`) // <<< INI YANG AMAN DARI ENV VARS
    .replace('ptlc=', `ptlc=${currentPanelConfig.ptlc}`); // <<< INI YANG AMAN DARI ENV VARS

  try {
    const apiResponse = await fetch(finalPteroApiUrl);
    const apiData = await apiResponse.json();

    // Teruskan respons dari API Pterodactyl ke frontend
    if (apiResponse.ok && apiData.status) {
      res.status(200).json(apiData);
    } else {
      // Teruskan pesan error dari API eksternal, atau pesan default jika tidak ada
      res.status(apiResponse.status || 500).json(apiData || { status: false, message: 'Failed to create server via external API.' });
    }
  } catch (error) {
    console.error('Error in Vercel Serverless Function:', error);
    res.status(500).json({ status: false, message: `Internal Server Error: ${error.message}` });
  }
}