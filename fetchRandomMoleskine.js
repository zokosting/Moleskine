const fetch = require('node-fetch');
const fs = require('fs');

// --- Configuración ---
const GITHUB_REPO = "zokosting/Moleskine"; 
const BRANCH = "main"; 
// Token de GitHub (puedes usar el GITHUB_TOKEN nativo de las Actions)
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const OUTPUT_FILE = 'random_url.json'; 

async function fetchRandomGitHubItem() {
    if (!GITHUB_TOKEN || !GITHUB_REPO) {
        console.error("Error: Faltan las variables de entorno GITHUB_TOKEN o GITHUB_REPO.");
        process.exit(1);
    }

    // Usamos la API Git Trees para obtener la estructura completa sin límite de 1.000 elementos
    const apiURL = `https://api.github.com/repos/${GITHUB_REPO}/git/trees/${BRANCH}?recursive=1`;
    console.log(`- Consultando árbol de archivos en el repositorio: ${GITHUB_REPO}...`);

    const response = await fetch(apiURL, {
        headers: {
            'Authorization': `Bearer ${GITHUB_TOKEN}`,
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'Node-Fetch'
        }
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error en la API de GitHub: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    const htmlFiles = data.tree.filter(item => 
        item.type === 'blob' && 
        item.path.toLowerCase().endsWith('.html') && 
        item.path.toLowerCase() !== 'index.html'
    );

    console.log(`\nEncontrados ${htmlFiles.length} elementos válidos`);

    if (htmlFiles.length === 0) {
        throw new Error("No se encontraron elementos válidos en el repositorio para seleccionar.");
    }

    // Seleccionar uno aleatoriamente
    const randomIndex = Math.floor(Math.random() * htmlFiles.length);
    const randomItem = htmlFiles[randomIndex];

    // Construcción de la URL pública de GitHub Pages usando el path del archivo
    let targetUrl = `https://zokosting.github.io/Moleskine/${randomItem.path}`;

    // Crear el objeto JSON de salida
    const outputData = {
        url: targetUrl,
        title: randomItem.path.split('/').pop(), // Nombre del archivo sin la ruta
        timestamp: new Date().toISOString()
    };

    // Guardar en el archivo estático
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(outputData, null, 2), 'utf-8');
    
    console.log(`\n✅ URL aleatoria guardada en ${OUTPUT_FILE}: ${targetUrl}`);
}

fetchRandomGitHubItem().catch(err => {
    console.error(`\n❌ Proceso fallido:`, err.message);
    process.exit(1);
});