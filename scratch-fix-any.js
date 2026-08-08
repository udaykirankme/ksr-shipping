const fs = require('fs');
const path = require('path');

function walk(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    const dirPath = path.join(dir, f);
    const isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walk(dirPath, callback) : callback(path.join(dir, f));
  });
}

walk('./src', (filePath) => {
  if (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;

    // Replace Promise<any> with Promise<unknown>
    if (content.includes('Promise<any>')) {
      content = content.replace(/Promise<any>/g, 'Promise<unknown>');
      changed = true;
    }

    // Replace data: any = null with data: unknown = null
    if (content.includes('let data: any = null;')) {
      content = content.replace('let data: any = null;', 'let data: unknown = null;');
      changed = true;
    }

    // Replace (req as any).user with (req as unknown as { user: any }).user
    if (content.includes('(req as any).user')) {
      content = content.replace(/\(req as any\)\.user/g, '(req as unknown as { user: { id: string, role: string } }).user');
      changed = true;
    }

    // Replace jwt.verify(token, JWT_SECRET) as any with jwt.verify(token, JWT_SECRET) as jwt.JwtPayload
    if (content.includes('jwt.verify(token, JWT_SECRET) as any')) {
      content = content.replace('jwt.verify(token, JWT_SECRET) as any', 'jwt.verify(token, JWT_SECRET) as jwt.JwtPayload');
      changed = true;
    }

    if (changed) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log('Fixed any in', filePath);
    }
  }
});
