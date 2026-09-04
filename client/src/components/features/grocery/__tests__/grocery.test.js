import { describe, expect, it } from 'vitest';

import { guessCategory } from '../guessCategory';
import {
  CATEGORY_BY_KEY,
  DEFAULT_CATEGORY,
  GROCERY_CATEGORIES,
  categoryOrder,
} from '../groceryCategories';
import {
  isGroceryNotification,
  presentNotification,
} from '../../../layout/notificationPresentation';

describe('aisle ordering', () => {
  it('puts produce first and "other" last, which is how a shop is walked', () => {
    expect(GROCERY_CATEGORIES[0].key).toBe('produce');
    expect(GROCERY_CATEGORIES[GROCERY_CATEGORIES.length - 1].key).toBe(DEFAULT_CATEGORY);
  });

  it('sorts categories by aisle, not alphabetically or by insertion', () => {
    const shuffled = ['beverages', 'produce', 'other', 'dairy_eggs'];
    expect([...shuffled].sort((a, b) => categoryOrder(a) - categoryOrder(b)))
      .toEqual(['produce', 'dairy_eggs', 'beverages', 'other']);
  });

  it('sorts an unknown key last instead of throwing', () => {
    expect(categoryOrder('not_a_category')).toBeGreaterThan(categoryOrder(DEFAULT_CATEGORY));
  });

  it('exposes an icon and colours for every category', () => {
    for (const category of GROCERY_CATEGORIES) {
      expect(CATEGORY_BY_KEY[category.key]).toBe(category);
      expect(category.icon).toBeTruthy();
      expect(category.tint).toMatch(/dark:/);
    }
  });

  it('has no duplicate keys', () => {
    const keys = GROCERY_CATEGORIES.map((category) => category.key);
    expect(new Set(keys).size).toBe(keys.length);
  });
});

describe('category guessing', () => {
  // The reported miss: "שוק" (a chicken drumstick) is a prefix of "שוקו", so a
  // first-substring-wins matcher filed chocolate milk under meat.
  it('does not let a short stem hijack a longer word', () => {
    expect(guessCategory('שוקו')).toBe('dairy_eggs');
    expect(guessCategory('שוק עוף')).toBe('meat_fish');
    expect(guessCategory('שוקולד')).toBe('snacks_sweets');
  });

  it('places common Hebrew groceries in their aisle', () => {
    const cases = {
      'מלפפון': 'produce',
      'עגבניות שרי': 'produce',
      'אבוקדו': 'produce',
      'חלב 3%': 'dairy_eggs',
      'יוגורט יווני': 'dairy_eggs',
      'ביצים L': 'dairy_eggs',
      'לחם אחיד': 'bakery',
      'פיתות': 'bakery',
      'חזה עוף': 'meat_fish',
      'סלמון': 'meat_fish',
      'אורז בסמטי': 'pantry',
      'שמן זית': 'pantry',
      'קפה': 'pantry',
      'גלידה': 'frozen',
      'במבה': 'snacks_sweets',
      'קוקה קולה': 'beverages',
      'מים מינרלים': 'beverages',
      'בירה': 'alcohol',
      'יין אדום': 'alcohol',
      'חיתולים': 'baby',
      'נייר טואלט': 'household',
      'אבקת כביסה': 'household',
      'צלחות חד פעמי': 'disposables',
      'משחת שיניים': 'personal_care',
      'שמפו': 'personal_care',
    };
    for (const [input, expected] of Object.entries(cases)) {
      expect([input, guessCategory(input)]).toEqual([input, expected]);
    }
  });

  it('handles an attached Hebrew prefix', () => {
    expect(guessCategory('הלחם')).toBe('bakery');
    expect(guessCategory('וחלב')).toBe('dairy_eggs');
  });

  it('handles English just as well', () => {
    expect(guessCategory('Greek yogurt')).toBe('dairy_eggs');
    expect(guessCategory('toilet paper')).toBe('household');
    expect(guessCategory('sparkling water')).toBe('beverages');
    expect(guessCategory('red wine')).toBe('alcohol');
    expect(guessCategory('Toothpaste')).toBe('personal_care');
  });

  it('prefers the more specific multi-word phrase', () => {
    expect(guessCategory('סבון כלים')).toBe('household');
    expect(guessCategory('סבון')).toBe('personal_care');
    expect(guessCategory('שמן זית')).toBe('pantry');
  });

  it('returns null rather than guessing wildly', () => {
    expect(guessCategory('')).toBeNull();
    expect(guessCategory('x')).toBeNull();
    expect(guessCategory('זרנוק גינה')).toBeNull();
  });

  it('never returns a key the schema would reject', () => {
    const valid = new Set(GROCERY_CATEGORIES.map((c) => c.key));
    const samples = [
      'שוקו', 'חלב', 'לחם', 'בירה', 'צלחות חד פעמי', 'מלפפון',
      'toothpaste', 'beer', 'nonsense zzz', '',
    ];
    for (const sample of samples) {
      const guess = guessCategory(sample);
      if (guess !== null) expect(valid.has(guess)).toBe(true);
    }
  });
});

describe('notification presentation', () => {
  const t = (key, options = {}) => {
    // Stand-in for the translation store: returns the key plus its params so a
    // test can see both that the right key was asked for and that data reached it.
    const params = Object.entries(options)
      .filter(([name]) => name !== 'fallback')
      .map(([name, value]) => `${name}=${value}`)
      .join(',');
    return params ? `${key}[${params}]` : key;
  };

  it('recognises the grocery notification types', () => {
    expect(isGroceryNotification('grocery_invite')).toBe(true);
    expect(isGroceryNotification('grocery_trip_completed')).toBe(true);
    expect(isGroceryNotification('bank_sync_failed')).toBe(false);
    expect(isGroceryNotification(undefined)).toBe(false);
  });

  it('renders grocery text from translations, not from the stored strings', () => {
    const presented = presentNotification({
      type: 'grocery_invite',
      title: 'Shared grocery list invitation',
      body: 'Hananel invited you to a shared grocery list',
      data: { inviterName: 'Hananel', token: 'abc', link: '/grocery/invite/abc' },
    }, t);

    expect(presented.title).toBe('notifications.grocery_invite.title');
    expect(presented.body).toContain('notifications.grocery_invite.body');
    expect(presented.body).toContain('inviterName=Hananel');
    expect(presented.link).toBe('/grocery/invite/abc');
  });

  it('falls back to the grocery list when a notification carries no link', () => {
    const presented = presentNotification({ type: 'grocery_trip_completed', data: {} }, t);
    expect(presented.link).toBe('/grocery');
  });

  it('leaves unknown types showing their stored text', () => {
    const presented = presentNotification({
      type: 'bank_sync_failed',
      title: 'Sync failed',
      body: 'Yahav could not be reached',
      data: { link: '/bank-sync' },
    }, t);

    expect(presented.title).toBe('Sync failed');
    expect(presented.body).toBe('Yahav could not be reached');
    expect(presented.link).toBe('/bank-sync');
  });

  it('refuses an off-site link planted in notification data', () => {
    const presented = presentNotification({
      type: 'bank_sync_failed',
      title: 'x',
      body: 'y',
      data: { link: 'https://evil.example/steal' },
    }, t);

    expect(presented.link).toBeNull();
  });
});
