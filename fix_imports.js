const fs = require('fs');
const path = require('path');

function fixImports(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            fixImports(fullPath);
        } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            if (content.includes('useEffect(') || content.includes('useEffect<')) {
                const importRegex = /import\s+{[^}]*useEffect[^}]*}\s+from\s+['"]react['"]/;
                const defaultImportRegex = /import\s+React.*from\s+['"]react['"]/;
                
                if (!importRegex.test(content) && !(defaultImportRegex.test(content) && content.includes('React.useEffect'))) {
                    console.log(`Fixing useEffect import in: ${fullPath}`);
                    
                    // Try to find existing react import
                    const existingReactImport = /import\s+{([^}]+)}\s+from\s+['"]react['"]/;
                    if (existingReactImport.test(content)) {
                        content = content.replace(existingReactImport, (match, p1) => {
                            return `import { ${p1.trim()}, useEffect } from "react"`;
                        });
                    } else {
                        // Add new import at the top
                        content = `import { useEffect } from "react";\n` + content;
                    }
                    
                    fs.writeFileSync(fullPath, content, 'utf8');
                }
            }
        }
    }
}

fixImports('e:/Nova/NovaERP/src/pages');
