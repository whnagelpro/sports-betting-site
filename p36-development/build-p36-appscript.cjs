"use strict";

const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const crypto = require("node:crypto");

const directory = __dirname;

const modules = [

  "game-status-normalizer.cjs",
  "schedule-status-display.cjs",
  "slate-date-engine.cjs",
  "slate-inventory.cjs",
  "slate-completion-evaluator.cjs",
  "slate-registry.cjs",
  "slate-storage.cjs",
  "slate-retention.cjs",
  "pipeline-initialization-gate.cjs",
  "pipeline-initialization-recovery.cjs",
  "initialization-journal.cjs",
  "initialization-coordinator.cjs"

];

console.log(
  "=== P36 D5 STEP 1A — UNIVERSAL APPS SCRIPT BUILD ==="
);

const sourceFiles = [
  "nba-appscript",
  "nhl-appscript",
  "mlb-appscript",
  "nfl-appscript"
];

const hash = value =>
  crypto.createHash("sha256")
    .update(value)
    .digest("hex");

const originalHashes = Object.fromEntries(
  sourceFiles.map(file => [
    file,
    hash(fs.readFileSync(file))
  ])
);

const definitions = new Set();

const expectedExports = new Set();

const sections = [];

for (const filename of modules) {

  const original = fs.readFileSync(
    path.join(directory,filename),
    "utf8"
  );

  const exported = original.match(
    /module\.exports\s*=\s*\{([\s\S]*?)\};/
  );

  if (!exported) {
    throw new Error(
      `Missing exports: ${filename}`
    );
  }

  exported[1]
    .split(",")
    .map(value => value.trim())
    .filter(Boolean)
    .forEach(name => {

      if (!/^\w+$/.test(name)) {
        throw new Error(
          `Unsupported export: ${name}`
        );
      }

      expectedExports.add(name);

    });

  const converted = original

    .replace(
      /^["']use strict["'];?\s*/m,
      ""
    )

    .replace(
      /\bconst\s*\{[\w\s,]+\}\s*=\s*require\(\s*["']\.\/[\w.-]+\.cjs["']\s*\);/g,
      ""
    )

    .replace(
      /module\.exports\s*=\s*\{[\s\S]*?\};/g,
      ""
    )

    .trim();

  if (
    /\brequire\s*\(/.test(converted) ||
    /\bmodule\.exports\b/.test(converted)
  ) {

    throw new Error(
      `Unconverted Node.js dependency: ${filename}`
    );

  }

  const functions = [

    ...converted.matchAll(
      /^function\s+(\w+)\s*\(/gm
    )

  ];

  for (const match of functions) {

    const name = match[1];

    if (definitions.has(name)) {

      throw new Error(
        `Duplicate function definition: ${name}`
      );

    }

    definitions.add(name);

  }

  sections.push(
    `// ===== ${filename} =====\n\n${converted}`
  );

  console.log(
    `PASS | Converted ${filename}`
  );

}

const bundle = [

  "// P36 UNIVERSAL GAME COMPLETION ENGINE",
  "// Generated automatically. Do not edit manually.",
  "",
  ...sections

].join("\n\n") + "\n";

const context = vm.createContext({});

new vm.Script(bundle).runInContext(context);

for (const name of expectedExports) {

  if (typeof context[name] !== "function") {

    throw new Error(
      `Missing bundled function: ${name}`
    );

  }

}

console.log(
  `PASS | All ${expectedExports.size} exports available`
);

for (const file of sourceFiles) {

  const source = fs.readFileSync(file,"utf8");

  for (const name of definitions) {

    const pattern = new RegExp(
      "\\bfunction\\s+" + name + "\\s*\\("
    );

    if (pattern.test(source)) {

      throw new Error(
        `Function collision: ${file} / ${name}`
      );

    }

  }

  new vm.Script(source + "\n\n" + bundle);

  console.log(
    `PASS | ${file} combined syntax and function collision check`
  );

}

const samples = {

  NBA:{
    status_state:"final",
    status:"Final"
  },

  NHL:{
    status_state:"final",
    game_state:"OFF"
  },

  MLB:{
    status_state:"final",
    status:"STATUS_FINAL"
  },

  NFL:{
    status_state:"final",
    status:"Final"
  }

};

for (const [league,game] of Object.entries(samples)) {

  const status =
    context.normalizeP36GameStatus_(league,game);

  const display =
    context.getP36ScheduleStatus_(league,game);

  if (
    status !== "COMPLETED" ||
    display !== "Final"
  ) {

    throw new Error(
      `Bundled status compatibility failure: ${league}`
    );

  }

  console.log(
    `PASS | ${league} bundled status execution`
  );

}

for (const file of sourceFiles) {

  if (
    hash(fs.readFileSync(file)) !==
    originalHashes[file]
  ) {

    throw new Error(
      `Existing source unexpectedly changed: ${file}`
    );

  }

}

const output = path.join(
  directory,
  "p36-universal-appscript.gs"
);

fs.writeFileSync(output,bundle,"utf8");

console.log("\n--- FINAL RESULTS ---");

console.log(`MODULES CONVERTED: ${modules.length}/12`);
console.log(`FUNCTION DEFINITIONS: ${definitions.size}`);
console.log(`EXPORTS VERIFIED: ${expectedExports.size}`);
console.log("NODE.JS DEPENDENCIES REMAINING: 0");
console.log("LEAGUE COMPATIBILITY: 4/4");
console.log(`BUNDLE BYTES: ${Buffer.byteLength(bundle,"utf8")}`);
console.log(`BUNDLE SHA256: ${hash(bundle)}`);
console.log("OUTPUT: p36-development/p36-universal-appscript.gs");
console.log("EXISTING APPS SCRIPTS MODIFIED: NO");
console.log("PRODUCTION MODIFIED: NO");
console.log("LIVE API REQUESTS: 0");
console.log("PIPELINE RESETS: 0");
console.log("PIPELINE EXECUTIONS: 0");
console.log("TRIGGER CHANGES: 0");
console.log("STATUS: PASS");
