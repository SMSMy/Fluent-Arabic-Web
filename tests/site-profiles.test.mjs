/**
 * tests/site-profiles.test.mjs — اختبارات مطابقة الـ profiles الجديدة
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createDom, loadLibs } from './helpers.mjs';

const { window } = createDom('<html><body></body></html>');
const FluentRTL = loadLibs(window);
const siteProfiles = FluentRTL.siteProfiles;

test('Grok: grok.com و grok.x.ai', () => {
  assert.equal(siteProfiles.getProfile('grok.com').id, 'grok');
  assert.equal(siteProfiles.getProfile('www.grok.com').id, 'grok');
  assert.equal(siteProfiles.getProfile('grok.x.ai').id, 'grok');
  assert.equal(siteProfiles.getProfile('grok.com').streaming, true);
});

test('AI Studio: aistudio.google.com و makersuite.google.com', () => {
  assert.equal(siteProfiles.getProfile('aistudio.google.com').id, 'aistudio');
  assert.equal(siteProfiles.getProfile('makersuite.google.com').id, 'aistudio');
});

test('DeepSeek Harness: 127.0.0.1 و localhost', () => {
  assert.equal(siteProfiles.getProfile('127.0.0.1').id, 'dsh');
  assert.equal(siteProfiles.getProfile('localhost').id, 'dsh');
});

test('Copilot / Discord / Notion', () => {
  assert.equal(siteProfiles.getProfile('copilot.microsoft.com').id, 'copilot');
  assert.equal(siteProfiles.getProfile('www.copilot.microsoft.com').id, 'copilot');
  assert.equal(siteProfiles.getProfile('discord.com').id, 'discord');
  assert.equal(siteProfiles.getProfile('canary.discord.com').id, 'discord');
  assert.equal(siteProfiles.getProfile('notion.so').id, 'notion');
  assert.equal(siteProfiles.getProfile('www.notion.so').id, 'notion');
});

test('المواقع القديمة لا تزال تعمل', () => {
  assert.equal(siteProfiles.getProfile('chatgpt.com').id, 'chatgpt');
  assert.equal(siteProfiles.getProfile('chat.openai.com').id, 'chatgpt');
  assert.equal(siteProfiles.getProfile('claude.ai').id, 'claude');
  assert.equal(siteProfiles.getProfile('gemini.google.com').id, 'gemini');
  assert.equal(siteProfiles.getProfile('web.whatsapp.com').id, 'whatsapp');
  assert.equal(siteProfiles.getProfile('github.com').id, 'github');
});

test('موقع غير معروف → null', () => {
  assert.equal(siteProfiles.getProfile('unknown-site.example'), null);
});

test('Grok CSS: plaintext للنصوص و LTR للكود', () => {
  const grok = siteProfiles.getProfile('grok.com');
  assert.match(grok.css, /unicode-bidi:\s*plaintext/);
  assert.match(grok.css, /direction:\s*ltr/);
  assert.match(grok.css, /\.response-content-markdown/);
});

test('DSH CSS: يستهدف data-chat-flow-kind و md-code-block و backdrop', () => {
  const dsh = siteProfiles.getProfile('127.0.0.1');
  assert.match(dsh.css, /data-chat-flow-kind="assistant-step"/);
  assert.match(dsh.css, /\.md-code-block/);
  assert.match(dsh.css, /textarea\[data-phase\]/);
  assert.match(dsh.css, /data-input-backdrop/);
  assert.match(dsh.css, /\.gdEzaW_bubble/); // #41: فقاعة المستخدم بقاعدة عامة
});

test('AI Studio profile يغطي بنية composer الحية (ms-prompt-box)', () => {
  const aistudio = siteProfiles.getProfile('aistudio.google.com');
  assert.match(aistudio.css, /ms-prompt-box textarea/); // #42: مؤكد من البنية الحية
  assert.match(aistudio.css, /textarea\[formcontrolname="promptText"\]/);
  assert.match(aistudio.css, /ms-cmark-node/);
  assert.match(aistudio.css, /main p/); // شبكة الأمان العامة
});

test('كل profiles البث الحي عليها streaming: true', () => {
  for (const host of ['chatgpt.com', 'claude.ai', 'gemini.google.com', 'grok.com', 'aistudio.google.com', 'copilot.microsoft.com', 'discord.com', '127.0.0.1']) {
    const p = siteProfiles.getProfile(host);
    assert.equal(p.streaming, true, `${host} يجب أن يكون streaming`);
  }
});
