import extracted from './extracted.json';

export const CSS = extracted.css;
export const COVER_HTML = extracted.cover;
export const TOC_HTML = extracted.toc;

export const CONTENT = {};
extracted.chapters.forEach(ch => {
  CONTENT[ch.id] = ch.content;
});
