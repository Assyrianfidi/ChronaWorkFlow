const fs = require('fs');
const path = require('path');
const tokensPath = path.join(__dirname, '../src/design-system/tokens.json');
const tokens = JSON.parse(fs.readFileSync(tokensPath, 'utf-8'));

const cssLines = [':root {'];
for (const [group, values] of Object.entries(tokens)) {
  if (typeof values === 'object' && !Array.isArray(values)) {
    for (const [key, inner] of Object.entries(values)) {
      if (typeof inner === 'object') {
        for (const [variant, value] of Object.entries(inner)) {
          cssLines.push(`  --${group}-${key}-${variant}: ${value};`);
        }
      } else {
        cssLines.push(`  --${group}-${key}: ${inner};`);
      }
    }
  }
}
cssLines.push('}');

fs.writeFileSync(path.join(__dirname, '../src/design-system/css-variables.css'), cssLines.join('\n'));

const themeTs = `// Auto-generated theme\nimport tokens from '../src/design-system/tokens.json';\n\nexport const theme = tokens;\nexport type Theme = typeof theme;\n`;
fs.writeFileSync(path.join(__dirname, '../src/design-system/theme.ts'), themeTs);

console.log('Design tokens processed.');
