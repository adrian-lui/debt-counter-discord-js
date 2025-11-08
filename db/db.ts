import { StatementSync } from "node:sqlite";
import { DatabaseSync } from "node:sqlite";

const database = new DatabaseSync("db/debts.db");

export function createDb() {
  database.exec(`
  CREATE TABLE debts(
    userId TEXT PRIMARY KEY,
    debt INTEGER NOT NULL
    ) STRICT
    `);
}
export let insert: StatementSync;
export let update: StatementSync;
export let getDebts: StatementSync;
export let getDebtByUserId: StatementSync;

export function initDb() {
  insert = database.prepare("INSERT INTO debts (debt, userId) VALUES (?, ?)");
  update = database.prepare("UPDATE debts SET debt = ? WHERE userId = ?");
  getDebts = database.prepare("SELECT userId, debt FROM debts ORDER BY debt");
  getDebtByUserId = database.prepare("SELECT debt FROM debts WHERE userId = ?");
}
