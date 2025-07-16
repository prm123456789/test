// handler.js

import chalk from 'chalk';

export async function handler({ messages }) {
  for (const msg of messages) {
    if (!msg.message) continue;

    const m = serializeMessage(msg);
    const body = m.text || '';
    const isGroup = m.key.remoteJid.endsWith('@g.us');
    const sender = m.key.fromMe ? conn.user.id : m.participant || m.key.remoteJid;
    const prefix = global.prefixes.find((p) => body.startsWith(p)) || '';
    const args = body.slice(prefix.length).trim().split(/\s+/);
    const command = args.shift()?.toLowerCase();

    if (!prefix || !command) continue;

    switch (command) {
      case 'ping':
        await conn.sendMessage(m.chat, { text: `Pong! 🏓` });
        break;

      case 'kick':
        if (!isGroup) return;
        if (!m.mentionedJid?.length) return conn.sendMessage(m.chat, { text: `Mentionne l'utilisateur à kick.` });
        await conn.groupParticipantsUpdate(m.chat, m.mentionedJid, 'remove');
        break;

      case 'kickall':
        if (!isGroup) return;
        const groupMetadata = await conn.groupMetadata(m.chat);
        const participants = groupMetadata.participants.map((p) => p.id).filter((id) => id !== conn.user.jid);
        await conn.groupParticipantsUpdate(m.chat, participants, 'remove');
        break;

      case 'tag':
        if (!isGroup) return;
        const meta = await conn.groupMetadata(m.chat);
        const mentions = meta.participants.map((p) => p.id);
        const textTag = args.join(' ') || '👥 Message à tous';
        await conn.sendMessage(m.chat, { text: textTag, mentions });
        break;

      case 'antilink':
        if (!isGroup) return;
        const chatSettings = global.db.data.chats[m.chat] || {};
        chatSettings.antilink = !chatSettings.antilink;
        global.db.data.chats[m.chat] = chatSettings;
        await conn.sendMessage(m.chat, { text: `✅ Antilink ${chatSettings.antilink ? 'activé' : 'désactivé'}.` });
        break;

      default:
        conn.sendMessage(m.chat, { text: `Commande inconnue: *${command}*.` });
    }
  }
}

// Helper pour simplifier l'accès au message
function serializeMessage(msg) {
  const m = {};
  m.key = msg.key;
  m.message = msg.message;
  m.chat = msg.key.remoteJid;
  m.fromMe = msg.key.fromMe;
  m.isGroup = m.chat.endsWith('@g.us');
  m.text = msg.message?.conversation
    || msg.message?.extendedTextMessage?.text
    || msg.message?.imageMessage?.caption
    || '';
  m.mentionedJid = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
  return m;
}
