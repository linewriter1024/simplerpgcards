import { DataSource } from "typeorm";
import { Card } from "../entities/Card";
import { StatBlock } from "../entities/StatBlock";
import { StatBlockImage } from "../entities/StatBlockImage";
import { Mini } from "../entities/Mini";
import { MiniSheet } from "../entities/MiniSheet";

export const AppDataSource = new DataSource({
  type: "sqlite",
  database: process.env.SRC_DATABASE_PATH || "rpg_cards.db",
  synchronize: true,
  logging: process.env.NODE_ENV === "development",
  entities: [Card, StatBlock, StatBlockImage, Mini, MiniSheet],
  migrations: ["src/migrations/*.ts"],
  subscribers: ["src/subscribers/*.ts"],
});
