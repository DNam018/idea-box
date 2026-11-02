/**
 * Kiem tra mot mat khau co khop ADMIN_PASSWORD_HASH trong .env.local khong.
 * Dung:  npm run verify -- "matkhaubandangthu"
 */
import fs from 'node:fs';
import bcrypt from 'bcryptjs';

const password = process.argv[2];
if (!password) {
  console.error('Dung: npm run verify -- "matkhaubandangthu"');
  process.exit(1);
}

let env;
try {
  env = fs.readFileSync('.env.local', 'utf8');
} catch {
  console.error('Khong tim thay .env.local o thu muc hien tai.');
  process.exit(1);
}

const email = env.match(/^ADMIN_EMAIL=(.*)$/m)?.[1]?.trim();
const raw = env.match(/^ADMIN_PASSWORD_HASH=(.*)$/m)?.[1]?.trim();

if (!raw) {
  console.error('ADMIN_PASSWORD_HASH dang trong trong .env.local');
  process.exit(1);
}

// Bo dau escape de so sanh dung hash goc
const hash = raw.replace(/\\\$/g, '$');

console.log('\nEmail dang nhap : ' + (email || '(chua dat)'));
console.log('Hash da escape  : ' + (raw.includes('\\$')
  ? 'CO - dung dinh dang cho Next.js'
  : 'CHUA - chay lai `npm run hash` va dan lai, neu khong Next.js se doc sai'));
console.log('Mat khau        : ' + (bcrypt.compareSync(password, hash)
  ? 'KHOP - dung mat khau nay de dang nhap'
  : 'KHONG KHOP - chay lai: npm run hash -- "matkhaumoi"') + '\n');
