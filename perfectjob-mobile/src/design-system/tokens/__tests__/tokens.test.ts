import {
  radius, spacing, colors, typography, shadows,
} from '@/design-system/tokens';

describe('design-system tokens', () => {
  it('radius exposes the documented keys', () => {
    expect(radius.xs).toBe(2);
    expect(radius.sm).toBe(6);
    expect(radius.md).toBe(8);
    expect(radius.lg).toBe(12);
    expect(radius.xl).toBe(14);
    expect(radius.xxl).toBe(16);
    expect(radius.pill).toBe(9999);
    expect(radius.avatar).toBe(48);
  });

  it('shadows exposes three elevation recipes', () => {
    expect(shadows.card.shadowColor).toBe(colors.neutral[900]);
    expect(shadows.card.elevation).toBe(2);
    expect(shadows.sheet.elevation).toBe(4);
    expect(shadows.fab.shadowColor).toBe(colors.primary[500]);
  });

  it('typography exposes lineHeight', () => {
    expect(typography.lineHeight.tight).toBe(20);
    expect(typography.lineHeight.normal).toBe(24);
    expect(typography.lineHeight.relaxed).toBe(28);
    expect(typography.lineHeight.loose).toBe(32);
    expect(typography.lineHeight.display).toBe(40);
  });

  it('spacing scale matches the documented values', () => {
    expect(spacing[0]).toBe(0);
    expect(spacing[1]).toBe(4);
    expect(spacing[4]).toBe(16);
    expect(spacing[5]).toBe(20);
    expect(spacing[6]).toBe(24);
  });

  it('palette includes brand colors', () => {
    expect(colors.primary[500]).toBeDefined();
    expect(colors.neutral[100]).toBeDefined();
    expect(colors.error.DEFAULT).toBeDefined();
  });
});
