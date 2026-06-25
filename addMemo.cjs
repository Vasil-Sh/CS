var fs = require('fs');

var files = [
  { path: 'src/components/StatCard.tsx', reactImport: "import { type ReactNode, useState, memo } from 'react';", noReact: false },
  { path: 'src/components/MiniDonut.tsx', reactImport: "import { memo } from 'react';", noReact: true },
  { path: 'src/components/StrategyKpiCard.tsx', reactImport: "import { memo } from 'react';", noReact: true },
];

// Files that don't import from 'react' — add import { memo }
var noReactFiles = [
  'src/components/BalanceChart.tsx',
  'src/components/PeriodComparison.tsx',
  'src/components/BetTable.tsx',
];

files.forEach(function(f) {
  var c = fs.readFileSync(f.path, 'utf-8');
  if (f.noReact) {
    // Add import { memo } at the top
    c = "import { memo } from 'react';\n" + c;
  } else {
    c = c.replace("import { type ReactNode, useState } from 'react';", f.reactImport);
  }
  
  // Wrap: export default function Name → const NameMemo = memo(function Name
  c = c.replace(/export default function (\w+)/, function(m, name) {
    return 'const ' + name + 'Memo = memo(function ' + name;
  });
  
  // Add closing wrapper at the end — find the last standalone '}' and add `); export default ...;`
  var lines = c.split('\n');
  var lastLine = lines[lines.length - 1];
  if (lastLine.trim() === '}') {
    lines.pop(); // remove last }
    lines.push(');');
    lines.push('');
    // Extract the memo name
    var mm = c.match(/const (\w+)Memo/);
    if (mm) lines.push('export default ' + mm[1] + 'Memo;');
  }
  
  fs.writeFileSync(f.path, lines.join('\n'), 'utf-8');
  console.log(f.path + ' OK');
});

// Handle files WITHOUT any 'react' import
noReactFiles.forEach(function(path) {
  var c = fs.readFileSync(path, 'utf-8');
  // Add import at top
  c = "import { memo } from 'react';\n" + c;
  
  c = c.replace(/export default function (\w+)/, function(m, name) {
    return 'const ' + name + 'Memo = memo(function ' + name;
  });
  
  var lines = c.split('\n');
  var lastLine = lines[lines.length - 1];
  if (lastLine.trim() === '}') {
    lines.pop();
    lines.push(');');
    lines.push('');
    var mm = c.match(/const (\w+)Memo/);
    if (mm) lines.push('export default ' + mm[1] + 'Memo;');
  }
  
  fs.writeFileSync(path, lines.join('\n'), 'utf-8');
  console.log(path + ' OK');
});

console.log('ALL DONE');
