import { describe, expect, it } from 'vitest';
import { OUTFITS } from '@data/outfits';
import { LOOKS } from './looks';
import { PLAYER_LOOK } from './player';
import { playerFigure, wardrobeKey, wearOf } from './wardrobe';

const base = LOOKS[PLAYER_LOOK]!;

describe('гардероб на фигуре', () => {
  it('у каждой вещи из магазина есть вид', () => {
    // Молчаливая дыра хуже пустого слота: вещь без вида покупается за
    // деньги и не меняет ничего на экране.
    for (const item of OUTFITS) expect(wearOf(item.id), item.id).toBeDefined();
  });

  it('пустой гардероб оставляет базовую внешность', () => {
    const figure = playerFigure({});
    expect(figure.outfit).toBe(base.outfit);
    expect(figure.hair).toBe(base.hair);
    expect(figure.colors).toEqual(base.colors);
  });

  it('куртка меняет форму верха и его цвет', () => {
    const figure = playerFigure({ top: 'jacket_leather' });
    expect(figure.outfit).toBe('jacket');
    expect(figure.colors.cloth).not.toBe(base.colors.cloth);
    // Низ и обувь не тронуты: слот меняет только своё.
    expect(figure.colors.legs).toBe(base.colors.legs);
  });

  it('слоты не затирают друг друга', () => {
    const figure = playerFigure({
      top: 'tee_black',
      bottom: 'jeans_worn',
      shoes: 'sneakers',
      accessory: 'chain_steel',
    });
    expect(figure.colors.cloth).toBe('#26262e');
    expect(figure.colors.legs).toBe('#4a5a7a');
    expect(figure.colors.shoes).toBe('#e8e6ee');
    expect(figure.accessory).toBe('necklace');
  });

  it('головной убор становится причёской-кепкой', () => {
    expect(playerFigure({ head: 'hat_felt' }).hair).toBe('cap');
  });

  it('отпечаток различает разное и совпадает у одинакового', () => {
    expect(wardrobeKey({ top: 'tee_black' })).toBe(wardrobeKey({ top: 'tee_black' }));
    expect(wardrobeKey({ top: 'tee_black' })).not.toBe(wardrobeKey({ top: 'shirt_satin' }));
    expect(wardrobeKey({})).not.toBe(wardrobeKey({ shoes: 'sneakers' }));
  });

  it('форма одежды и примета остаются из тех, что рисуются', () => {
    const shapes = new Set(['tee', 'tank', 'jacket', 'hoodie', 'suit', 'dress', 'crop', 'track', 'coat']);
    const extras = new Set(['none', 'headphones', 'glasses', 'shades', 'earrings', 'scarf', 'necklace', 'bag']);
    for (const item of OUTFITS) {
      const figure = playerFigure({ [item.slot]: item.id });
      expect(shapes.has(figure.outfit), `${item.id}: ${figure.outfit}`).toBe(true);
      expect(extras.has(figure.accessory), `${item.id}: ${figure.accessory}`).toBe(true);
    }
  });
});
