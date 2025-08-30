import { Card } from '../entities/Card';
import { CardService } from '../services/CardService';
import { CreateCardDto } from '../types/card.types';

export class DataSeeder {
  private cardService: CardService;

  constructor() {
    this.cardService = new CardService();
  }

  async seedCards(): Promise<void> {
    const existingCards = await this.cardService.getAllCards();
    if (existingCards.length > 0) {
      console.log('Cards already exist, skipping seed...');
      return;
    }

    const sampleCards: CreateCardDto[] = [
      {
        title: 'Healing Word',
        frontText: 'Level 1 Spell — Bonus Action\nRange: 60 ft\nA creature regains 1d4 + modifier HP.',
        backText: 'QUICK NOTES\nUse in emergencies to save allies.',
        category: 'Spell',
        level: '1',
        range: '60 ft',
        duration: 'Instantaneous'
      },
      {
        title: 'Inflict Wounds',
        frontText: 'Level 1 Spell — Melee\nMake a spell attack; on hit, 3d10 necrotic.',
        backText: 'QUICK NOTES\nHigh damage, but risky at melee range.',
        category: 'Spell',
        level: '1',
        range: 'Touch',
        duration: 'Instantaneous'
      },
      {
        title: 'Protection from Evil and Good',
        frontText: 'Level 1 Spell — Concentration\nProtects a willing creature against aberrations,\ncelestials, elementals, fey, fiends, and undead.',
        backText: 'QUICK NOTES\n- Disadvantage on attacks from listed types\n- Target cannot be charmed, frightened, or possessed',
        category: 'Spell',
        level: '1',
        range: 'Touch',
        duration: 'Concentration, up to 10 minutes'
      },
      {
        title: 'Fireball',
        frontText: 'Level 3 Evocation Spell\nRange: 150 feet\n8d6 fire damage to all creatures in 20-foot radius',
        backText: 'TACTICS\n- Great for clearing groups\n- Watch friendly fire\n- Dexterity save for half damage',
        category: 'Spell',
        level: '3',
        range: '150 feet',
        duration: 'Instantaneous'
      },
      {
        title: 'Longsword',
        frontText: 'Versatile Melee Weapon\n1d8 slashing (1d10 two-handed)\nRange: 5 feet',
        backText: 'PROPERTIES\n- Versatile (1d8/1d10)\n- Can be used with shield\n- Good balance of damage and defense',
        category: 'Weapon',
        level: '',
        range: '5 feet',
        duration: ''
      },
      {
        title: 'Shortbow',
        frontText: 'Simple Ranged Weapon\n1d6 piercing damage\nRange: 80/320 feet',
        backText: 'PROPERTIES\n- Ammunition (arrows)\n- Two-handed\n- Light and easy to use',
        category: 'Weapon',
        level: '',
        range: '80/320 feet',
        duration: ''
      }
    ];

    console.log('Seeding sample cards...');
    for (const cardData of sampleCards) {
      await this.cardService.createCard(cardData);
    }
    console.log(`Seeded ${sampleCards.length} cards successfully!`);
  }
}
