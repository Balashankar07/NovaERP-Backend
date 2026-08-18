const fs = require('fs');
const path = require('path');

function findMissingImports(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            findMissingImports(fullPath);
        } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
            const content = fs.readFileSync(fullPath, 'utf8');
            if (content.includes('useEffect(') || content.includes('useEffect<')) {
                const importRegex = /import\s+{[^}]*useEffect[^}]*}\s+from\s+['"]react['"]/;
                const defaultImportRegex = /import\s+React.*from\s+['"]react['"]/;
                
                if (!importRegex.test(content) && !(defaultImportRegex.test(content) && content.includes('React.useEffect'))) {
                    console.log(`Missing useEffect import in: ${fullPath}`);
                }
            }
        }
    }
}

findMissingImports('e:/Nova/NovaERP/src');
