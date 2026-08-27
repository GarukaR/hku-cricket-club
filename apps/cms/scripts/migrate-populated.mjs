// Run the migrations a deploy has not seen yet, the way the deploy will run
// them: against a database that already has rows in it.
//
// The check this strengthens migrated an *empty* database, which cannot catch
// the one failure every schema change is capable of. `ALTER TABLE ... ADD
// COLUMN ... NOT NULL` succeeds on an empty table and fails on a populated one,
// so the pipeline went green and the deploy went red — with the site's own
// build fine and nothing in CI to point at.
//
//   1. Apply every migration production already has.
//   2. Put a row in every table.
//   3. Apply the migrations this branch adds. This is the check.
//   4. Take the rows out again.
//
// Step 4 matters as much as the rest: CI starts a real CMS afterwards and the
// site's build reads it, and an empty record is what proves the homepage still
// renders between seasons (docs/cms.md). The fixture exists for the length of
// one ALTER TABLE and no longer.
//
// Nothing about the *content* of the rows matters, which is why they are
// invented here from the schema rather than written down. A fixture that lists
// columns by hand goes stale in the same commit that adds one; this reads the
// catalogue and fills whatever it finds, so a collection added next year is
// covered without anybody remembering to come back to it.
//
//   npm run migrate:populated --workspace @hkucc/cms
//
// It loads the CMS's own config, so it wants the CMS's environment. Against
// docker-compose, DATABASE_URL is postgres://hkucc:hkucc@localhost:5433/hkucc.

import { execFileSync, spawn } from "node:child_process";
import fs from "node:fs";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";

import pg from "pg";

const CMS = path.resolve(import.meta.dirname, "..");
const MIGRATIONS_DIR = path.join(CMS, "src", "migrations");
const INDEX = path.join(MIGRATIONS_DIR, "index.ts");

/**
 * Payload's own CLI, resolved rather than assumed to be on PATH. `bin.js` sits
 * at the root of the package and is not in its `exports`, so the way in is the
 * main entry point — `<root>/dist/index.js` — and up two.
 */
const PAYLOAD_BIN = path.resolve(
  createRequire(import.meta.url).resolve("payload"),
  "../..",
  "bin.js",
);

const say = (message) => console.log(`\n> ${message}`);

// ---------------------------------------------------------------- the branch

/**
 * The migrations this branch adds, and everything after them.
 *
 * "And everything after them" is load-bearing. Migrations are ordered by their
 * timestamped names, so holding back a *changed* one without also holding back
 * its successors would apply a migration whose tables do not exist yet.
 */
function heldBack() {
  const baseRef = process.env.MIGRATE_BASE_REF?.trim() || "origin/main";

  let base;
  try {
    base = git("merge-base", baseRef, "HEAD");
  } catch {
    throw new Error(
      [
        `Cannot work out what production already has: no commit in common with "${baseRef}".`,
        "",
        "This needs real history — in CI, actions/checkout with fetch-depth: 0;",
        "locally, usually `git fetch origin main`. Set MIGRATE_BASE_REF to",
        "compare against something else.",
      ].join("\n"),
    );
  }

  // Tracked changes, and untracked files as well. `git diff` cannot see a file
  // that has never been added, and a migration `payload migrate:create` wrote
  // thirty seconds ago is exactly that — which is to say, this check would have
  // been silent at the one moment somebody most wants to run it. In CI the
  // files are always committed and only the first list matters; locally the
  // second is the whole point.
  const changed = [
    ...git("diff", "--name-only", base, "--", MIGRATIONS_DIR).split("\n"),
    ...git(
      "ls-files",
      "--others",
      "--exclude-standard",
      "--",
      MIGRATIONS_DIR,
    ).split("\n"),
  ]
    .map((line) => path.basename(line.trim()))
    .filter((name) => name.endsWith(".ts") && name !== "index.ts");

  if (changed.length === 0) return { base, names: [] };

  const cutoff = changed.sort()[0];
  return { base, names: migrationFiles().filter((name) => name >= cutoff) };
}

/** Every migration on disk, in the order Payload will run them. */
function migrationFiles() {
  return fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((name) => name.endsWith(".ts") && name !== "index.ts")
    .sort();
}

function git(...args) {
  return execFileSync("git", args, { cwd: CMS, encoding: "utf8" }).trim();
}

// ------------------------------------------------------------- the migrating

/**
 * Run something with the named migrations out of the way.
 *
 * Payload's migrate CLI reads the *directory*, so holding a migration back
 * means moving its file out of it. `index.ts` has to follow: it is what
 * `payload.config.ts` imports, and an import of a file that is not there stops
 * the config loading at all.
 *
 * If this is ever interrupted between the two, `git checkout -- src/migrations`
 * puts it back.
 */
async function withoutMigrations(names, run) {
  const aside = fs.mkdtempSync(path.join(os.tmpdir(), "hkucc-migrations-"));
  const held = names.map((name) => ({
    from: path.join(MIGRATIONS_DIR, name),
    to: path.join(aside, name),
  }));
  const index = fs.readFileSync(INDEX, "utf8");

  for (const file of held) fs.renameSync(file.from, file.to);
  fs.writeFileSync(INDEX, indexFor(migrationFiles()));

  try {
    return await run();
  } finally {
    for (const file of held) fs.renameSync(file.to, file.from);
    fs.writeFileSync(INDEX, index);
    fs.rmSync(aside, { recursive: true, force: true });
  }
}

/** The shape `payload migrate:create` writes, for the files that remain. */
function indexFor(names) {
  const stem = (name) => name.replace(/\.ts$/, "");
  return [
    ...names.map((name) => `import * as m_${stem(name)} from './${stem(name)}';`),
    "",
    "export const migrations = [",
    ...names.map((name) =>
      [
        "  {",
        `    up: m_${stem(name)}.up,`,
        `    down: m_${stem(name)}.down,`,
        `    name: '${stem(name)}',`,
        "  },",
      ].join("\n"),
    ),
    "];",
    "",
  ].join("\n");
}

function migrate() {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [PAYLOAD_BIN, "migrate"], {
      cwd: CMS,
      stdio: "inherit",
    });
    child.on("error", reject);
    child.on("exit", (code) =>
      code === 0
        ? resolve()
        : reject(new Error(`payload migrate exited with ${code}`)),
    );
  });
}

// --------------------------------------------------------------- the fixture

/**
 * One row in every table, built from whatever the schema currently says is
 * required. Returns the tables it touched.
 */
async function seed(client) {
  const tables = await orderedTables(client);
  const required = await requiredColumns(client);
  const foreignKeys = await notNullForeignKeys(client);
  const enums = await enumLabels(client);
  const ids = new Map();

  for (const table of tables) {
    const columns = required.get(table) ?? [];
    const values = columns.map(
      (column) =>
        ids.get(foreignKeys.get(`${table}.${column.name}`)) ??
        invent(column, enums),
    );

    const { rows } = await client.query(
      columns.length === 0
        ? `INSERT INTO "${table}" DEFAULT VALUES RETURNING *`
        : `INSERT INTO "${table}" (${columns.map((c) => `"${c.name}"`).join(", ")})` +
          ` VALUES (${columns.map((_, i) => `$${i + 1}`).join(", ")}) RETURNING *`,
      values,
    );
    if (rows[0]?.id !== undefined) ids.set(table, rows[0].id);
  }

  return tables;
}

/** A value of the right type. Any value of the right type will do. */
function invent(column, enums) {
  const labels = enums.get(column.type);
  if (labels) return labels[0];

  if (/^(int|numeric|float|money|serial)/.test(column.type)) return 0;
  if (column.type === "bool") return false;
  if (/^(timestamp|date|time)/.test(column.type)) return new Date();
  if (/^json/.test(column.type)) return "{}";
  return "ci";
}

/**
 * Tables in an order that satisfies their NOT NULL foreign keys — a Match
 * cannot be inserted before the Team it belongs to. Nullable foreign keys are
 * left null, which is also what keeps Payload's own join tables from forming a
 * cycle.
 */
async function orderedTables(client) {
  const { rows: all } = await client.query(`
    SELECT c.relname AS name
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
     WHERE n.nspname = 'public'
       AND c.relkind = 'r'
       AND c.relname <> 'payload_migrations'
  `);

  const foreignKeys = await notNullForeignKeys(client);
  const needs = new Map(all.map(({ name }) => [name, new Set()]));
  for (const [column, target] of foreignKeys) {
    const table = column.slice(0, column.lastIndexOf("."));
    if (table !== target) needs.get(table)?.add(target);
  }

  const ordered = [];
  const placed = new Set();
  // Bounded by the number of tables: a cycle would otherwise spin here, and
  // saying which tables are stuck is more use than hanging.
  for (let pass = 0; pass <= all.length && placed.size < all.length; pass++) {
    for (const { name } of all) {
      if (placed.has(name)) continue;
      if ([...needs.get(name)].every((dependency) => placed.has(dependency))) {
        ordered.push(name);
        placed.add(name);
      }
    }
  }

  if (placed.size < all.length) {
    const stuck = all.map((t) => t.name).filter((name) => !placed.has(name));
    throw new Error(
      `No order satisfies these tables' foreign keys: ${stuck.join(", ")}`,
    );
  }

  return ordered;
}

/** Columns that must be given a value: NOT NULL, no default, not an identity. */
async function requiredColumns(client) {
  const { rows } = await client.query(`
    SELECT c.relname AS "table", a.attname AS "column", t.typname AS "type"
      FROM pg_attribute a
      JOIN pg_class c ON c.oid = a.attrelid
      JOIN pg_namespace n ON n.oid = c.relnamespace
      JOIN pg_type t ON t.oid = a.atttypid
      LEFT JOIN pg_attrdef d ON d.adrelid = c.oid AND d.adnum = a.attnum
     WHERE n.nspname = 'public'
       AND c.relkind = 'r'
       AND a.attnum > 0
       AND NOT a.attisdropped
       AND a.attnotnull
       AND d.adbin IS NULL
       AND a.attidentity = ''
     ORDER BY a.attnum
  `);

  const byTable = new Map();
  for (const row of rows) {
    byTable.set(row.table, [
      ...(byTable.get(row.table) ?? []),
      { name: row.column, type: row.type },
    ]);
  }
  return byTable;
}

/** `table.column` -> the table it points at, for NOT NULL foreign keys only. */
async function notNullForeignKeys(client) {
  const { rows } = await client.query(`
    SELECT c.relname AS "table", a.attname AS "column", f.relname AS "target"
      FROM pg_constraint k
      JOIN pg_class c ON c.oid = k.conrelid
      JOIN pg_class f ON f.oid = k.confrelid
      JOIN pg_namespace n ON n.oid = c.relnamespace
      JOIN pg_attribute a ON a.attrelid = c.oid AND a.attnum = k.conkey[1]
     WHERE k.contype = 'f'
       AND n.nspname = 'public'
       AND array_length(k.conkey, 1) = 1
       AND a.attnotnull
  `);
  return new Map(rows.map((r) => [`${r.table}.${r.column}`, r.target]));
}

/** Enum type name -> its labels, in order. The first is as good as any. */
async function enumLabels(client) {
  const { rows } = await client.query(`
    SELECT t.typname AS "type", e.enumlabel AS "label"
      FROM pg_type t
      JOIN pg_enum e ON e.enumtypid = t.oid
     ORDER BY e.enumsortorder
  `);

  const byType = new Map();
  for (const row of rows) {
    byType.set(row.type, [...(byType.get(row.type) ?? []), row.label]);
  }
  return byType;
}

// ------------------------------------------------------------------- the run

if (!process.env.DATABASE_URL) {
  console.error(
    "DATABASE_URL is not set. Against docker-compose that is\n" +
      "  postgres://hkucc:hkucc@localhost:5433/hkucc",
  );
  process.exit(1);
}

const { base, names } = heldBack();

if (names.length === 0) {
  say(
    `No migration is new since ${base.slice(0, 7)}, so there is nothing here to exercise.` +
      "\n  Applying what there is, so the database is ready for the rest of the job.",
  );
  await migrate();
  process.exit(0);
}

say(
  `Held back, because production has not run ${names.length === 1 ? "it" : "them"} either:\n` +
    names.map((name) => `    ${name}`).join("\n"),
);

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
let seeded = [];

try {
  say("Applying the migrations production already has.");
  await withoutMigrations(names, migrate);

  say("Putting a row in every table.");
  seeded = await seed(client);
  console.log(`  ${seeded.length} tables.`);

  say("Applying this branch's migrations against them. This is the check.");
  try {
    await migrate();
  } catch (failure) {
    // Payload prints the whole failing statement, which for a generated
    // migration is several screens of CREATE TABLE. Say the short version
    // afterwards, where it is the last thing in the log.
    console.error(
      [
        "",
        "A migration this branch adds does not survive a database with rows in it.",
        "Production's has rows in it. Read the Postgres error above — the usual",
        "one is:",
        "",
        '  column "x" of relation "y" contains null values',
        "",
        "which is `payload migrate:create` generating a bare NOT NULL column. The",
        "fix is to hand-edit the migration into three steps: add the column",
        "nullable, fill it, then ALTER COLUMN ... SET NOT NULL. There is a worked",
        "example in 20260825_070906_player_appearance.ts.",
      ].join("\n"),
    );
    throw failure;
  }
} finally {
  if (seeded.length > 0) {
    say("Taking the rows out again, so the CMS starts with an empty record.");
    await client.query(
      `TRUNCATE TABLE ${seeded.map((t) => `"${t}"`).join(", ")} RESTART IDENTITY CASCADE`,
    );
  }
  await client.end();
}
