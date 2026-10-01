#!/usr/bin/env node
/**
 * Prüft relative Verweise in allen Markdown-Dateien dieses Skills.
 * ================================================================
 *
 * Ein toter Verweis ist ein Fehler, kein Schönheitsproblem — genau wie im
 * Muster `project-blueprint`. Dieses Skript bricht mit Exit-Code 1 ab, wenn:
 *
 *   1. ein relativer Link (`(references/x.md)`) auf eine fehlende Datei zeigt,
 *   2. eine Datei unter `references/` existiert, aber in `SKILL.md` NIRGENDS
 *      erwähnt wird (niemand würde sie beim Arbeiten finden).
 *
 * Ohne Abhängigkeiten (nur Node-Standardbibliothek), damit es überall läuft.
 */

import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/** Alle .md-Dateien unterhalb von ROOT (ohne node_modules). */
function mdFiles(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry === '.git') continue;
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) out.push(...mdFiles(full));
    else if (entry.toLowerCase().endsWith('.md')) out.push(full);
  }
  return out;
}

/** Relative Links aus Markdown-Inhalt ziehen: alles in `(...)`, ohne http(s) und Anker. */
function relativeLinks(md) {
  const links = [];
  const re = /\]\(([^)]+)\)/g;
  let m;
  while ((m = re.exec(md))) {
    const target = m[1].trim().split('#')[0].trim();
    if (!target) continue;
    if (/^(https?:|mailto:|tel:)/i.test(target)) continue;
    links.push(target);
  }
  return links;
}

const errors = [];

// 1. Tote Verweise
for (const file of mdFiles(ROOT)) {
  const md = readFileSync(file, 'utf8');
  for (const link of relativeLinks(md)) {
    const abs = resolve(dirname(file), link);
    if (!existsSync(abs)) {
      errors.push(`${file.replace(ROOT + '\\', '').replace(ROOT + '/', '')}: toter Verweis → ${link}`);
    }
  }
}

// 2. Jede references/*.md muss in SKILL.md erwähnt sein
const skillPath = join(ROOT, 'SKILL.md');
if (existsSync(skillPath)) {
  const skill = readFileSync(skillPath, 'utf8');
  const refDir = join(ROOT, 'references');
  if (existsSync(refDir)) {
    for (const entry of readdirSync(refDir)) {
      if (!entry.toLowerCase().endsWith('.md')) continue;
      if (!skill.includes(entry)) {
        errors.push(`SKILL.md: references/${entry} existiert, wird aber nirgends verlinkt.`);
      }
    }
  }
}

if (errors.length > 0) {
  console.error('Verweis-Pruefung FEHLGESCHLAGEN:\n');
  for (const e of errors) console.error('  - ' + e);
  process.exit(1);
}

console.log('Verweis-Pruefung OK: keine toten Verweise, alle Referenzen verlinkt.');
