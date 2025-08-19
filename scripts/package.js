const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

// Get target browser from command line arguments
const args = process.argv.slice(2);
const target = args[0]?.toLowerCase() || 'chrome'; // Default to chrome if no target specified

if (!['chrome', 'firefox'].includes(target)) {
    console.error('Error: Target must be either "chrome" or "firefox"');
    process.exit(1);
}

const projectRoot = path.resolve(__dirname, '..');
const packagedDir = path.join(projectRoot, 'packaged');
const zipFileName = `open-link-and-new-tab-next-to-current-${target}.zip`;
const zipFilePath = path.join(packagedDir, zipFileName);
const unzippedFolderPath = path.join(packagedDir, `open-link-and-new-tab-next-to-current-${target}`);
const sourceDir = path.join(projectRoot, `${target}/prod`);

// Verify source directory exists
if (!fs.existsSync(sourceDir)) {
    console.error(`Error: Source directory ${sourceDir} does not exist.`);
    console.error(`Make sure to run 'yarn build:${target}' first.`);
    process.exit(1);
}

// Create packaged directory if it doesn't exist
if (!fs.existsSync(packagedDir)) fs.mkdirSync(packagedDir, { recursive: true });

// Clean up existing files
if (fs.existsSync(zipFilePath)) fs.unlinkSync(zipFilePath);
if (fs.existsSync(unzippedFolderPath)) fs.rmSync(unzippedFolderPath, { recursive: true, force: true });
// Create a file to stream archive data to
const output = fs.createWriteStream(zipFilePath);
const archive = archiver('zip', {
    zlib: { level: 9 }, // Maximum compression
});

// Listen for all archive data to be written
output.on('close', () => {
    console.log(`${target.toUpperCase()} extension packaged successfully!`);
    console.log(`Archive created: ${archive.pointer()} total bytes`);
    console.log(`Zip file saved to: ${zipFilePath}`);
});

archive.on('warning', (err) => {
    if (err.code === 'ENOENT') {
        console.warn('Warning:', err);
    } else {
        throw err;
    }
});

archive.on('error', (err) => {
    console.error('Error during packaging:', err);
    throw err;
});

// Pipe archive data to the file
archive.pipe(output);

// Add the entire source directory contents to the zip
// Don't create a top-level directory in the zip
archive.directory(sourceDir, false);

// Finalize the archive
archive.finalize();

console.log(`Packaging ${target.toUpperCase()} extension from ${sourceDir}...`);
