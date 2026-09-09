#!/usr/bin/env node

const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const docsDir = path.join(root, 'docs');

function runJson(args) {
  const output = execFileSync('logseq', [
    ...args,
    '--root-dir', root,
    '--output', 'json',
  ], { cwd: root, maxBuffer: 64 * 1024 * 1024 });
  const result = JSON.parse(output.toString());
  if (result.status !== 'ok') {
    throw new Error(result.error?.message || 'Logseq CLI request failed');
  }
  return result.data;
}

function slug(value) {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[^\p{Letter}\p{Number}]+/gu, '-')
    .replace(/^-+|-+$/g, '') || 'page';
}

function isSystemPage(page) {
  const ident = String(page['db/ident'] || '');
  return ident.startsWith('logseq.') || ident.startsWith('block/') || ident.startsWith('file/');
}

function publicTree(value) {
  if (Array.isArray(value)) return value.map(publicTree);
  if (!value || typeof value !== 'object') return value;
  const hiddenKeys = new Set([
    'logseq.property.user/email',
    'logseq.property.user/name',
    'logseq.property.user/avatar',
    'logseq.property.agent/session-id',
  ]);
  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => !hiddenKeys.has(key))
      .map(([key, child]) => [key, publicTree(child)]),
  );
}

function graphKey(name) {
  return slug(name);
}

function main() {
  fs.mkdirSync(docsDir, { recursive: true });
  fs.mkdirSync(path.join(docsDir, 'assets'), { recursive: true });

  const graphList = runJson(['graph', 'list']);
  const graphs = [];

  for (const name of graphList.graphs) {
    const pages = runJson(['list', 'page', '--graph', name]).items
      .filter((page) => page['block/title'] && !isSystemPage(page));

    const pageItems = [];
    for (const page of pages) {
      const shown = runJson([
        'show',
        '--graph', name,
        '--page', page['block/title'],
        '--level', '99',
        '--page-hierarchy', 'false',
        '--linked-references', 'false',
      ]).root;
      pageItems.push({
        id: page['db/id'],
        title: page['block/title'],
        name: page['block/name'] || page['block/title'],
        tree: publicTree(shown || page),
      });
    }

    pageItems.sort((a, b) => a.title.localeCompare(b.title, 'zh-Hans'));
    graphs.push({ name, key: graphKey(name), pages: pageItems });
  }

  const payload = {
    generatedAt: new Date().toISOString(),
    graphs,
  };
  fs.writeFileSync(path.join(docsDir, 'data.json'), JSON.stringify(payload));

  const assetSource = path.join(root, 'graphs', 'Knowledge', 'assets');
  if (fs.existsSync(assetSource)) {
    for (const file of fs.readdirSync(assetSource)) {
      fs.copyFileSync(path.join(assetSource, file), path.join(docsDir, 'assets', file));
    }
  }

  fs.writeFileSync(path.join(docsDir, '.nojekyll'), '');
  console.log(`Published ${graphs.reduce((total, graph) => total + graph.pages.length, 0)} pages across ${graphs.length} graphs.`);
}

main();
