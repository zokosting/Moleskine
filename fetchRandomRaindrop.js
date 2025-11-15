const fetch = require('node-fetch');
const fs = require('fs');

// --- Configuración ---
// ID de la colección. Usa 0 para todos los Raindrops.
const COLLECTION_ID = 0; 
// Máximo de elementos por página permitido por Raindrop.io
const PER_PAGE = 50; 
// Obtener el token de las variables de entorno de GitHub Action
const RAINDROP_TOKEN = process.env.RAINDROP_TOKEN;
const OUTPUT_FILE = 'random_url.json'; 

async function fetchAllRaindrops() {
    if (!RAINDROP_TOKEN) {
        console.error("Error: La variable de entorno RAINDROP_TOKEN no está definida.");
        process.exit(1);
    }

    let allRaindrops = [];
    let page = 0;
    let hasMore = true;

    console.log("Iniciando la obtención de Raindrops. Paginación activa...");

    do {
        const url = `https://api.raindrop.io/rest/v1/raindrops/${COLLECTION_ID}?perpage=${PER_PAGE}&page=${page}`;
        
        console.log(`- Obteniendo página ${page}...`);

        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${RAINDROP_TOKEN}`
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Error en la API de Raindrop.io (Página ${page}): ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        
        // Agregar los elementos de esta página al array total
        allRaindrops = allRaindrops.concat(data.items);

        // Si la cantidad de elementos devueltos es menor que PER_PAGE, significa que es la última página.
        if (data.items.length < PER_PAGE) {
            hasMore = false;
        } else {
            page++;
        }

    } while (hasMore);

    console.log(`\n¡Obtenidos ${allRaindrops.length} Raindrops en total!`);

    if (allRaindrops.length === 0) {
        throw new Error("No se encontraron Raindrops para seleccionar.");
    }

    // 2. Seleccionar uno aleatoriamente
    const randomIndex = Math.floor(Math.random() * allRaindrops.length);
    const randomItem = allRaindrops[randomIndex];
    const randomUrl = randomItem.link;

    // 3. Crear el objeto JSON de salida
    const outputData = {
        url: randomUrl,
        title: randomItem.title,
        timestamp: new Date().toISOString()
    };

    // 4. Guardar en el archivo estático
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(outputData, null, 2), 'utf-8');
    
    console.log(`\n✅ URL aleatoria guardada en ${OUTPUT_FILE}: ${randomUrl}`);
}

fetchAllRaindrops().catch(err => {
    console.error(`\n❌ Proceso fallido:`, err.message);
    process.exit(1);
});