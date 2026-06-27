import { DatabaseType } from '../enums/databaseType';
import type { DatabaseAdapter } from '../types/DatabaseAdapter';
import { getTableColumns } from '../utils/dbHelper';
import { mapDatabaseError } from '../utils/errorFunctions';

export const up = async (db: DatabaseAdapter) => {
  try {
    const cols = await getTableColumns(db, 'settings');
    const hasLlmApiUrl = cols.some(c => c.name === 'llmApiUrl');

    if (hasLlmApiUrl) {
      return;
    }

    if (db.type === DatabaseType.postgre) {
      await db.run(`ALTER TABLE settings ADD COLUMN IF NOT EXISTS "llmApiUrl" TEXT`);
      await db.run(`ALTER TABLE settings ADD COLUMN IF NOT EXISTS "llmApiKey" TEXT`);
      await db.run(`ALTER TABLE settings ADD COLUMN IF NOT EXISTS "llmModel" TEXT`);
    } else {
      await db.run(`ALTER TABLE settings ADD COLUMN "llmApiUrl" TEXT`);
      await db.run(`ALTER TABLE settings ADD COLUMN "llmApiKey" TEXT`);
      await db.run(`ALTER TABLE settings ADD COLUMN "llmModel" TEXT`);
    }
  } catch (error) {
    return { success: false, ...mapDatabaseError(error, db.type) };
  }
};
