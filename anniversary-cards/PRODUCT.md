# Product

## Register

brand

## Users

Two people: Netanel (husband, admin) and Almog Ester (wife, user). Hebrew-native, Israeli timezone. They use the app together as a shared experience — Netanel curates cards from real photos of their life together, Almog collects and discovers them. Primary context: casual, intimate, often on mobile. They are each other's only audience.

## Product Purpose

A holographic card-collecting app built as a 10th wedding anniversary gift. Real photos from their shared decade become Pokémon-style holographic cards. They earn ♥ hearts by completing daily tasks, spend hearts to open packs of 5 cards, and build a shared album of 100 slots. The product is the gift — it exists to make a decade of memories feel precious, collectible, and worth celebrating together.

## Brand Personality

Intimate. Precious. Celebratory.
The tone is warm and personal, not playful or gamey. Every interaction should feel like handling something real and valuable — not a mobile game, not a toy. The gold and silver are not decorative; they signify that these memories have weight.

## Anti-references

- Generic gacha / mobile card games (too loud, too many particles, too many notifications)
- Purple / violet UI (explicitly removed; user confirmed black/gold/silver only)
- Anything that feels like a template or a generic SaaS dashboard
- Busy layouts with too many competing CTAs

## Design Principles

1. **Memories deserve weight.** Every card, every slot, every reveal should feel like handling something real. Animation and flair serve the moment; they never trivialize it.
2. **Two people, one screen.** The app is a shared space, not a solo experience. Design for the moment when they open it together.
3. **Gold earns its place.** Gold is reserved for what matters — the anniversary hero, the legendary tier, primary actions. When everything is gold, nothing is.
4. **RTL is native, not bolted on.** Hebrew text, logical properties, RTL flow throughout. Never a translated afterthought.
5. **Quiet confidence.** The UI should be beautiful without trying hard. Restraint over spectacle except at the moments that deserve spectacle (pack opening, anniversary screen).

## Accessibility & Inclusion

- WCAG AA minimum contrast on all text
- `prefers-reduced-motion` respected — all animations have fallbacks
- Touch targets ≥ 44px on all interactive elements (primary mobile usage)
- Hebrew RTL throughout (dir="rtl", logical properties)
- Israel timezone (UTC+3) for daily resets
