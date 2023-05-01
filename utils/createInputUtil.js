const crypto = require('crypto');
const fs = require('fs');

const stream = fs.createWriteStream('./files/input.txt');

for (let i = 0; i < (20 * 1024 * 1024); i++) {
    const randomString = crypto.randomBytes(5).toString('hex');
    stream.write(`${randomString}\n`);
}

stream.close();