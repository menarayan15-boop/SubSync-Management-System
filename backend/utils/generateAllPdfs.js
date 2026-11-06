import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { resourcesCatalog } from '../data/resourcesCatalog.js';
import { generateResourcePdf } from '../services/pdfGeneratorService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const STORAGE_DIR = path.join(__dirname, '../uploads/resources');

async function buildAllPdfs() {
  console.log('========================================================');
  console.log(`🚀 Generating ${resourcesCatalog.length} Publication-Grade PDFs...`);
  console.log(`📁 Destination directory: ${STORAGE_DIR}`);
  console.log('========================================================\n');

  if (!fs.existsSync(STORAGE_DIR)) {
    fs.mkdirSync(STORAGE_DIR, { recursive: true });
  }

  let count = 0;
  for (const res of resourcesCatalog) {
    process.stdout.write(`[${res.id}/${resourcesCatalog.length}] Generating "${res.title}"... `);
    try {
      const filePath = await generateResourcePdf(res);
      const stats = fs.statSync(filePath);
      const sizeMb = (stats.size / (1024 * 1024)).toFixed(2);
      console.log(`DONE (${sizeMb} MB)`);
      count++;
    } catch (err) {
      console.error(`FAILED:`, err.message);
    }
  }

  console.log('\n========================================================');
  console.log(`✅ Successfully generated ${count} / ${resourcesCatalog.length} PDFs!`);
  console.log('========================================================\n');
}

buildAllPdfs();
