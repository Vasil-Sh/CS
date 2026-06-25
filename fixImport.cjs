var fs = require('fs');
var c = fs.readFileSync('d:/github/mathciq/src/pages/Analytics.tsx', 'utf-8');
var find = "import { useRiskMetrics } from '@/hooks/useRiskMetrics';\r\nimport {";
var replace = "import { useRiskMetrics } from '@/hooks/useRiskMetrics';\r\nimport { toast } from 'sonner';\r\nimport {";
c = c.replace(find, replace);
fs.writeFileSync('d:/github/mathciq/src/pages/Analytics.tsx', c, 'utf-8');
console.log('ok');
