import type { DatabaseAdapter } from '../types/DatabaseAdapter';
import { getTableColumns } from '../utils/dbHelper';
import { mapDatabaseError } from '../utils/errorFunctions';

export const up = async (db: DatabaseAdapter) => {
  try {
    const cols = await getTableColumns(db, 'clients');
    if (cols.find(c => c.name === 'companyName')) return;

    await db.run(`ALTER TABLE clients ADD COLUMN "companyName" TEXT`);
    await db.run(`ALTER TABLE clients ADD COLUMN "country" TEXT`);
    await db.run(`ALTER TABLE clients ADD COLUMN "city" TEXT`);
    await db.run(`ALTER TABLE clients ADD COLUMN "state" TEXT`);
    await db.run(`ALTER TABLE clients ADD COLUMN "postalCode" TEXT`);
  } catch (error) {
    return { success: false, ...mapDatabaseError(error, db.type) };
  }
};
