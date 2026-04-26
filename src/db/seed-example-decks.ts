import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { and, eq, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";
import { cardsTable, decksTable } from "./schema";

type Card = {
  front: string;
  back: string;
};

type DeckSeed = {
  title: string;
  description: string;
  cards: Card[];
};

const USER_ID = "user_3CrbYCruGF85yjYZTPdv3DIEmAK";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is missing in environment variables");
}

const sql = neon(process.env.DATABASE_URL);
const db = drizzle({
  client: sql,
  schema: { decksTable, cardsTable },
});

const deckSeeds: DeckSeed[] = [
  {
    title: "Spanish From English Basics",
    description:
      "Beginner-friendly English to Spanish vocabulary and daily-use phrases.",
    cards: [
      { front: "Hello", back: "Hola" },
      { front: "Good morning", back: "Buenos dias" },
      { front: "Good night", back: "Buenas noches" },
      { front: "Please", back: "Por favor" },
      { front: "Thank you", back: "Gracias" },
      { front: "Sorry", back: "Lo siento" },
      { front: "Yes", back: "Si" },
      { front: "No", back: "No" },
      { front: "How are you?", back: "Como estas?" },
      { front: "I am fine", back: "Estoy bien" },
      { front: "What is your name?", back: "Como te llamas?" },
      { front: "My name is...", back: "Me llamo..." },
      { front: "Where is the bathroom?", back: "Donde esta el bano?" },
      { front: "How much does it cost?", back: "Cuanto cuesta?" },
      { front: "I do not understand", back: "No entiendo" },
    ],
  },
  {
    title: "Indian History Q and A",
    description:
      "Core Indian history questions with concise answers for quick revision.",
    cards: [
      {
        front: "Who founded the Maurya Empire?",
        back: "Chandragupta Maurya founded the Maurya Empire around 322 BCE.",
      },
      {
        front: "Who was Ashoka?",
        back: "Ashoka was a Mauryan emperor known for embracing Buddhism after the Kalinga War.",
      },
      {
        front: "Which battle in 1526 established Mughal rule in India?",
        back: "The First Battle of Panipat (1526).",
      },
      {
        front: "Who built the Taj Mahal?",
        back: "Mughal emperor Shah Jahan built the Taj Mahal.",
      },
      {
        front: "Who was the founder of the Delhi Sultanate?",
        back: "Qutb-ud-din Aibak is regarded as its founder in 1206.",
      },
      {
        front: "Which European trading company first established a factory at Surat in 1613?",
        back: "The English East India Company.",
      },
      {
        front: "What was the main cause of the Revolt of 1857?",
        back: "Multiple causes, including military grievances, annexation policies, and cultural-religious tensions.",
      },
      {
        front: "Who was known as the Rani of Jhansi during the Revolt of 1857?",
        back: "Rani Lakshmibai.",
      },
      {
        front: "When was the Indian National Congress founded?",
        back: "1885.",
      },
      {
        front: "Who gave the call 'Do or Die' in 1942?",
        back: "Mahatma Gandhi during the Quit India Movement.",
      },
      {
        front: "What was the partition year of British India?",
        back: "1947.",
      },
      {
        front: "Who became independent India's first Prime Minister?",
        back: "Jawaharlal Nehru.",
      },
      {
        front: "In which year did the Constitution of India come into effect?",
        back: "1950 (on 26 January).",
      },
      {
        front: "Who was known as the 'Iron Man of India'?",
        back: "Sardar Vallabhbhai Patel.",
      },
      {
        front: "What was the capital of the Vijayanagara Empire?",
        back: "Hampi (Vijayanagara).",
      },
    ],
  },
];

async function main() {
  const titles = deckSeeds.map((deck) => deck.title);

  const existingDecks = await db
    .select({ id: decksTable.id, title: decksTable.title })
    .from(decksTable)
    .where(and(eq(decksTable.userId, USER_ID), inArray(decksTable.title, titles)));

  const existingTitleSet = new Set(existingDecks.map((deck) => deck.title));

  for (const deckSeed of deckSeeds) {
    if (existingTitleSet.has(deckSeed.title)) {
      console.log(`Skipped existing deck: ${deckSeed.title}`);
      continue;
    }

    const [createdDeck] = await db
      .insert(decksTable)
      .values({
        userId: USER_ID,
        title: deckSeed.title,
        description: deckSeed.description,
      })
      .returning({ id: decksTable.id });

    await db.insert(cardsTable).values(
      deckSeed.cards.map((card) => ({
        deckId: createdDeck.id,
        front: card.front,
        back: card.back,
      }))
    );

    console.log(
      `Created deck: ${deckSeed.title} with ${deckSeed.cards.length} cards.`
    );
  }

  console.log("Example deck seeding complete.");
}

main().catch((error) => {
  console.error("Failed to seed example decks:", error);
  process.exit(1);
});
