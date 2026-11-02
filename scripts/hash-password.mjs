/**
 * Tao bcrypt hash cho mat khau admin.
 * Dung:  npm run hash -- "matkhaucuaban"
 *
 * LUU Y QUAN TRONG: Next.js nap .env qua dotenv-expand, von coi `$` la
 * ky hieu tham chieu bien. Hash bcrypt luon chua `$` (vd `$2a$12$...`),
 * nen neu dan nguyen thi Next.js se thay `$2a`, `$12`... bang chuoi rong
 * va mat khau se khong bao gio khop. Vi vay script in ra ban DA ESCAPE.
 */
import bcrypt from 'bcryptjs';

const password = process.argv[2];

if (!password) {
  console.error('Thieu mat khau.\nDung: npm run hash -- "matkhaucuaban"');
  process.exit(1);
}
if (password.length < 8) {
  console.error('Mat khau nen dai it nhat 8 ky tu.');
  process.exit(1);
}

const hash = bcrypt.hashSync(password, 12);

console.log('\nDan nguyen dong duoi day vao .env.local:\n');
console.log('ADMIN_PASSWORD_HASH=' + hash.replace(/\$/g, '\\$'));
console.log('\n(Dau \\ truoc moi $ la bat buoc - Next.js can no de khong');
console.log(' hieu nham $2a, $12 la ten bien moi truong.)\n');
