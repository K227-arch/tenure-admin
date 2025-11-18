import { db } from '@/lib/db';
import { twoFactorAuth } from '@/lib/db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { hashCode } from '@/lib/utils/2fa';

async function debugCode() {
  const adminId = parseInt(process.argv[2]);
  const code = process.argv[3];

  if (!adminId || !code) {
    console.log('Usage: tsx scripts/debug-2fa-code.ts <adminId> <code>');
    process.exit(1);
  }

  console.log('\n=== Debugging 2FA Code ===');
  console.log('Admin ID:', adminId);
  console.log('Code entered:', code);
  console.log('Code hash:', hashCode(code));

  // Get latest code for admin
  const codeRecord = await db
    .select()
    .from(twoFactorAuth)
    .where(and(eq(twoFactorAuth.adminId, adminId), eq(twoFactorAuth.used, false)))
    .orderBy(desc(twoFactorAuth.createdAt))
    .limit(1);

  if (!codeRecord || codeRecord.length === 0) {
    console.log('\n❌ No unused code found for this admin');
    
    // Check all codes
    const allCodes = await db
      .select()
      .from(twoFactorAuth)
      .where(eq(twoFactorAuth.adminId, adminId))
      .orderBy(desc(twoFactorAuth.createdAt))
      .limit(5);
    
    console.log('\nLast 5 codes for this admin:');
    allCodes.forEach((c, i) => {
      console.log(`${i + 1}. ID: ${c.id}, Used: ${c.used}, Attempts: ${c.attempts}, Expires: ${c.expiresAt}, Created: ${c.createdAt}`);
    });
    
    process.exit(1);
  }

  const record = codeRecord[0];
  console.log('\n✅ Code record found:');
  console.log('ID:', record.id);
  console.log('Code hash in DB:', record.code);
  console.log('Used:', record.used);
  console.log('Attempts:', record.attempts);
  console.log('Expires at:', record.expiresAt);
  console.log('Created at:', record.createdAt);
  console.log('Is expired:', new Date() > new Date(record.expiresAt));
  console.log('Hash matches:', hashCode(code) === record.code);

  if (record.attempts >= 3) {
    console.log('\n❌ Too many attempts');
  }

  if (new Date() > new Date(record.expiresAt)) {
    console.log('\n❌ Code is expired');
  }

  if (hashCode(code) === record.code) {
    console.log('\n✅ Code is valid!');
  } else {
    console.log('\n❌ Code does not match');
  }

  process.exit(0);
}

debugCode().catch(console.error);
