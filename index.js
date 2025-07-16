// index.js
// index.js

process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '1';
import './config.js';
import { createRequire } from 'module';
import { platform } from 'process';
import { Low, JSONFile } from 'lowdb';
import lodash from 'lodash';
const { chain } = lodash;
import yargs from 'yargs';
import cfonts from 'cfonts';
import chalk from 'chalk';
import { makeWASocket, fetchLatestBaileysVersion, useMultiFileAuthState, makeCacheableSignalKeyStore, jidNormalizedUser, DisconnectReason } from '@whiskeysockets/baileys';
import { protoType, serialize } from './lib/simple.js';
import NodeCache from 'node-cache';
import pino from 'pino';
import readline from 'readline';
import fs from 'fs';
import path from 'path';
import { Boom } from '@hapi/boom';
import { fileURLToPath } from 'url';

// Fonctions globales
global.__filename = function (pathURL = import.meta.url, rmPrefix = platform !== 'win32') {
  return rmPrefix ? /file:\/\/\//.test(pathURL) ? fileURLToPath(pathURL) : pathURL : new URL(pathURL).toString();
};
global.__dirname = function (pathURL) {
  return path.dirname(global.__filename(pathURL, true));
};
global.__require = createRequire(import.meta.url);

async function main() {
  protoType();
  serialize();

  global.db = new Low(new JSONFile('./database.json'));
  global.DATABASE = global.db;
  global.loadDatabase = async function () {
    if (global.db.data) return;
    await global.db.read();
    global.db.data ||= { users: {}, chats: {}, settings: {} };
    global.db.chain = chain(global.db.data);
  };
  await global.loadDatabase();

  const opts = yargs(process.argv.slice(2)).exitProcess(false).parse();
  global.opts = opts;

  cfonts.say('INCONNU XD BOT', {
    font: 'block',
    align: 'center',
    colors: ['cyan'],
  });
  cfonts.say(`Developed By • INCONNU BOY TECH`, {
    font: 'console',
    align: 'center',
    colors: ['blueBright'],
  });

  const { state, saveCreds } = await useMultiFileAuthState('./sessions');
  const { version } = await fetchLatestBaileysVersion();
  const msgRetryCounterCache = new NodeCache();

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const question = (text) => new Promise((resolve) => rl.question(text, resolve));

  // Gestion QR/Code pairing
  let option = process.argv.includes('qr') ? '1' : process.argv.includes('code') ? '2' : null;
  if (!option && !fs.existsSync('./sessions/creds.json')) {
    do {
      option = await question(chalk.green('1. Connexion QR\n2. Connexion Code 8 chiffres\n--> '));
    } while (!/^[1-2]$/.test(option));
  }
  rl.close();

  const conn = makeWASocket({
    logger: pino({ level: 'silent' }),
    printQRInTerminal: option === '1',
    browser: ['Ubuntu', 'Chrome', '110.0.0.0'],
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys),
    },
    version,
    msgRetryCounterCache,
    getMessage: async (key) => {
      const jid = jidNormalizedUser(key.remoteJid);
      const msg = await global.store?.loadMessage(jid, key.id);
      return msg?.message || '';
    },
  });

  global.conn = conn;

  conn.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect } = update;
    if (update.qr && option === '1') console.log(chalk.yellow('❐ Scannez le QR Code'));
    if (connection === 'open') console.log(chalk.green('✅ Connecté avec succès'));
    if (connection === 'close') {
      const reason = new Boom(lastDisconnect?.error)?.output?.statusCode;
      if (reason === DisconnectReason.loggedOut) {
        console.log(chalk.red('❌ Session supprimée. Relancez pour vous reconnecter.'));
      } else {
        console.log(chalk.red('❌ Déconnecté, reconnexion...'));
        process.exit();
      }
    }
  });
  conn.ev.on('creds.update', saveCreds);

  const handlerModule = await import('./handler.js');
  conn.ev.on('messages.upsert', handlerModule.handler.bind(conn));
}

// Appel de la fonction principale
main().catch(console.error);
