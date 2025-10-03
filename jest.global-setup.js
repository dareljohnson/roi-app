module.exports = async () => {
  process.env.DATABASE_URL = 'file:./test.db';
  // Ensure Prisma uses test.db schema (push latest schema including new columns)
  const { execSync } = require('child_process');
  try {
    execSync('npx prisma db push', { stdio: 'inherit' });
  } catch (e) {
    console.error('Failed to push Prisma schema in global setup', e);
  }
};