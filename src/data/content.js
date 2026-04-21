import extracted from './extracted.json';

export const CSS = extracted.css || '';
export const COVER_HTML = extracted.cover || '';
export const TOC_HTML = extracted.toc || '';

export const CONTENT = {};
(extracted.chapters || []).forEach(ch => {
  CONTENT[ch.id] = ch.content;
});

// Injeta o CSS do conteúdo no <head> uma única vez.
// O HTML de cover/toc/capítulos vem via dangerouslySetInnerHTML e precisa
// deste CSS para ser estilizado.
export function injectContentCSS() {
  if (!CSS || typeof document === 'undefined') return;
  if (document.getElementById('content-css')) return;
  const style = document.createElement('style');
  style.id = 'content-css';
  style.textContent = CSS;
  document.head.appendChild(style);
}
