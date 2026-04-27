const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const isProduction = process.argv.includes('--production');

console.log(`Building extension (${isProduction ? 'production' : 'development'})...`);

// Create dist directory
const distDir = path.join(__dirname, '../dist');
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// Run TypeScript compiler
try {
  console.log('Compiling TypeScript...');
  execSync('npx tsc', { stdio: 'inherit' });
  console.log('✓ TypeScript compiled');
} catch (error) {
  console.error('✗ TypeScript compilation failed');
  process.exit(1);
}

// Copy static files
const filesToCopy = ['src/popup.html', 'src/styles.css'];

filesToCopy.forEach((file) => {
  const src = path.join(__dirname, '../', file);
  const dest = path.join(distDir, path.basename(file));

  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.log(`✓ Copied ${path.basename(file)}`);
  }
});

console.log('\n✓ Build complete!');
console.log(`  Output: ${distDir}`);
