/**
 * Simple script to check if required files exist
 */

const fs = require('fs');
const path = require('path');

console.log('Current Directory:', __dirname);
console.log('\nFiles in directory:');

try {
  const files = fs.readdirSync(__dirname);
  files.forEach(file => {
    const stats = fs.statSync(path.join(__dirname, file));
    console.log(`- ${file} (${stats.isDirectory() ? 'directory' : 'file'}, ${stats.size} bytes)`);
  });
  
  // Check for specific files
  console.log('\nChecking for specific files:');
  const requiredFiles = [
    'index.html',
    'test-world-map-renderer.bundle.js',
    'temp-world-test.html',
    'test-world-map-system.js',
    'webpack.world-test.config.js'
  ];
  
  requiredFiles.forEach(file => {
    const exists = fs.existsSync(path.join(__dirname, file));
    console.log(`- ${file}: ${exists ? 'EXISTS' : 'MISSING'}`);
  });
} catch (error) {
  console.error('Error checking files:', error);
}
