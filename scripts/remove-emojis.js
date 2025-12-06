const fs = require('fs');
const path = require('path');

const files = [
    'README.md',
    'QUICK_RULES.md',
    'COMPLETE_BUSINESS_LOGIC.md',
    'API_FLOW_GUIDE.md'
];

const rootDir = 'c:\\Users\\Pawan Shetty\\OneDrive\\Desktop\\BizArena v1';

// Comprehensive emoji regex pattern
const emojiRegex = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1F018}-\u{1F270}\u{238C}-\u{2454}\u{20D0}-\u{20FF}\u{FE00}-\u{FE0F}]/gu;

files.forEach(file => {
    const filePath = path.join(rootDir, file);
    
    if (fs.existsSync(filePath)) {
        console.log(`Processing ${file}...`);
        
        let content = fs.readFileSync(filePath, 'utf8');
        
        // Remove emojis
        content = content.replace(emojiRegex, '');
        
        // Clean up double spaces
        content = content.replace(/  +/g, ' ');
        
        // Clean up lines that start with space after bullet
        content = content.replace(/^-\s+/gm, '- ');
        
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Completed ${file}`);
    } else {
        console.log(`File not found: ${filePath}`);
    }
});

console.log('\nEmoji removal complete!');
