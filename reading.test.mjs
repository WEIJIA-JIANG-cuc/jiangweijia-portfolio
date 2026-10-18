import test from 'node:test';
import assert from 'node:assert/strict';
import {readingRecord, badgeView} from './reading.js';
import {catalog} from './content.js';
import {assets} from './assets-manifest.js';
import {contentMarkup} from './content-view.js';

test('only the photography entrance renders the actual gallery', () => {
  const photo = readingRecord('Photography');
  assert.equal(photo.gallery, true);
  assert.match(contentMarkup(photo, assets), /photography-wall\/index\.html/);
  assert.equal(contentMarkup(readingRecord('Writing'), assets).includes('<iframe'), false);
  assert.equal(catalog.Photography.gallery, undefined);
});

test('all seven entrances have real summaries and unknown entrances cannot open', () => {
  for (const id of ['GameProduct','Photography','VibeCoding','Writing','Content','Experience','Contact']) {
    const record = readingRecord(id);
    assert.ok(record.entries.length > 0);
    assert.ok(record.intro.zh && record.intro.en);
  }
  assert.equal(readingRecord('toString'), null);
  assert.equal(readingRecord('Unknown'), null);
});

test('the hidden bird entrance renders the original badge without becoming a category', () => {
  const badge = readingRecord('Badge');
  assert.equal(badge.badge, true);
  assert.match(contentMarkup(badge, assets), /lanyard\/index\.html/);
  assert.equal(badge.intro, undefined);
  assert.doesNotMatch(contentMarkup(badge, assets), /这是作品集 1\.0 的个人联系工牌|My original contact card/);
  assert.equal(catalog.Badge, undefined);
});

test('badge views select each original face with a distinct accessible description', () => {
  const front = badgeView(assets.badge, 'front');
  const back = badgeView(assets.badge, 'back');
  assert.equal(front.src, './content/badge/card-front-C9qpXlWV.png');
  assert.equal(back.src, './content/badge/card-back-CaVBQkIx.png');
  assert.match(front.alt, /Front|正面/);
  assert.match(back.alt, /Back|背面/);
  assert.equal(badgeView({src:'javascript:alert(1)'}, 'front'), null);
});
