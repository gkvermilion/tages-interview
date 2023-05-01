const { sortLargeFile } = require('./utils/sortUtil');
const fs = require('fs');

const INPUT_FILE = process.env.INPUT_FILE || './files/input.txt'; // Входной файл
const OUTPUT_FILE = process.env.OUTPUT_FILE || './output.txt'; // Выходной файл
const CHUNK_SIZE = process.env.CHUNK_SIZE || 15 * 1024 * 1024; // 500 * 1024 * 1024 = 500 мбайт

(async function main() {
    if (fs.existsSync(OUTPUT_FILE)) {
        fs.rm(OUTPUT_FILE, () => {
            console.log(`PREVIOUS ${OUTPUT_FILE} DELETED`);
        });
    }
    if (fs.existsSync('./temporary_files')) {
        fs.promises.rm('./temporary_files', { recursive: true }).then(() => {
            console.log('TMP FILES DELETED');
        })
    }
    console.log(`Main process ${process.pid} start with credentials: 
    \nINPUT FILE: ${INPUT_FILE} 
    \nOUTPUT FILE: ${OUTPUT_FILE} 
    \nCHUNK_SIZE: ${CHUNK_SIZE}`
    );
    await sortLargeFile(INPUT_FILE, OUTPUT_FILE, CHUNK_SIZE);
})().catch(error => console.log('ERROR', error));