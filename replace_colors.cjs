const fs = require('fs');
const path = require('path');

function replaceInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;
  
  content = content.replace(/bg-zinc-900/g, 'bg-[#0e0e11]');
  content = content.replace(/bg-zinc-950/g, 'bg-[#0e0e11]');
  content = content.replace(/bg-zinc-800/g, 'bg-[#18181b]');
  content = content.replace(/bg-zinc-700/g, 'bg-white/10');
  content = content.replace(/text-zinc-100/g, 'text-gray-100');
  
  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${filePath}`);
  }
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== 'dist' && file !== '.git') {
        walkDir(fullPath);
      }
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      replaceInFile(fullPath);
    }
  }
}

walkDir('./packages');
walkDir('./src');
