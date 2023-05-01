const fs = require('fs');
const { Heap } = require('heap-js');
const path = require('path');

const sortChunkAndSaveToFile = async (chunk, directory) => {
    const heap = new Heap((a, b) => a.localeCompare(b));
    for (const line of chunk) {
        heap.push(line);
    }
    let sortedLines = [];
    while (heap.size() > 0) {
        sortedLines.push(heap.pop());
    }
    const sortedChunk = sortedLines.join('\n');
    const tempFilename = path.join(directory, `temp_chunk_${Math.random().toString().substring(2, 8)}.txt`);
    await new Promise((resolve, reject) => {
        const filePromise = fs.promises.writeFile(tempFilename, sortedChunk, 'utf8');
        filePromise.then(() => {
            console.log(`Sorted chunk saved to ${tempFilename}`);
            resolve(tempFilename);
        });
        filePromise.catch((error) => {
            console.log(`Error writing file: ${error}`);
            reject(error);
        });
    });
    return tempFilename;
}

const mergeSortedFiles = async (sortedFiles, mergedFilename) => {
    const sortedChunks = [];
    for (const sortedFile of sortedFiles) {
        const sortedChunk = await fs.promises.readFile(sortedFile, 'utf8');
        sortedChunks.push(sortedChunk.split('\n'));
        await fs.promises.unlink(sortedFile);
    }
    const mergedChunks = [];
    while (sortedChunks.length > 0) {
        const smallestChunk = sortedChunks.reduce((smallest, current) => {
            if (current.length < smallest.length) {
                return current;
            }
            return smallest;
        });
        const smallestIndex = sortedChunks.indexOf(smallestChunk);
        for (let i = 0; i < smallestChunk.length; i++) {
            mergedChunks.push(smallestChunk[i]);
        }
        sortedChunks.splice(smallestIndex, 1);
    }
    await fs.promises.writeFile(mergedFilename, mergedChunks.join('\n'), 'utf8');
}

const sortLargeFile = async (filename, mergedFilename, chunkSize) => {
    const fileSize = (await fs.promises.stat(filename)).size;
    const chunks = Math.ceil(fileSize / chunkSize);
    let tempFolderCreated = false;
    let tempSortedFiles = [];
    let mergeInProgress = false;
    let chunkProcessed = 0;
    const fileStream = fs.createReadStream(filename, { highWaterMark: chunkSize });
    fileStream.on('data', async (chunk) => {
        const lines = chunk.toString().split('\n');
        const directory = './temporary_files';
        if (!tempFolderCreated && !fs.existsSync(directory)) {
            fs.mkdirSync(directory);
            tempFolderCreated = true;
        }
        const tempSortedFile = await sortChunkAndSaveToFile(lines, directory);
        tempSortedFiles.push(tempSortedFile);
        chunkProcessed++;
        if (chunkProcessed === chunks) {
            console.log('Starting merge');
            mergeInProgress = true;
            await mergeSortedFiles(tempSortedFiles, mergedFilename);
            if (fs.existsSync(directory)) {
                fs.readdir(directory, (error, files) => {
                    if (error) {
                        console.log(`Error reading files: ${error}`);
                    } else {
                        files.forEach((file) => {
                            fs.unlinkSync(path.join(directory, file));
                        });
                        fs.rmdirSync(directory);
                    }
                });
            }
        }
    });
    fileStream.on('error', (error) => {
        console.log(`Error reading file: ${error}`);
        throw error;
    });
    fileStream.on('end', async () => {
        if (!mergeInProgress) {
            console.log('No chunks to merge, sorting complete');
            fileStream.close();
        }
    });
}

module.exports = { sortLargeFile };