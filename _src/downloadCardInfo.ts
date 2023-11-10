import { readFile, writeFile } from "fs/promises";
import axios from "axios";
import { CardInfo, MdmCardInfoRoot, YpdCardInfoRoot } from "./cardTypes.js";
import {
  CARDINFO_PATH,
  MDM_CARDINFO_BASE_PATH,
  MDM_PAGE_SIZE,
  REMOTE_CARDINFO_PATH,
} from "./constants.js";
import esMain from "es-main";
import Bottleneck from "bottleneck";

export async function downloadCardInfo() {
  let cardInfoResponse: YpdCardInfoRoot;
  try {
    cardInfoResponse = (await axios.get(REMOTE_CARDINFO_PATH))
      .data as YpdCardInfoRoot;
  } catch (e: any) {
    console.error(`couldn't fetch YGOProDeck card info\n${e.message}`);
    process.exit(3);
  }

  console.log("creating new card information db");
  let cardInfo: CardInfo = {};
  cardInfoResponse.data
    .filter((card) => {
      return /^(?:normal|effect|ritual)(?:_pendulum)?$/.test(card.frameType);
    })
    .forEach((card) => {
      cardInfo[card.id] = {
        name: card.name,
        attribute: card.attribute!,
        type: card.race,
        atk: card.misc_info[0]?.question_atk ? "?" : String(card.atk!),
        def: card.misc_info[0]?.question_def ? "?" : String(card.def!),
        level: card.level!,
        popRank: 1e20,
      };
    });

  const limiter = new Bottleneck({
    reservoir: 1,
    reservoirRefreshAmount: 1,
    reservoirRefreshInterval: 1000,
  });

  let mdmCollectionCount = 0;
  try {
    mdmCollectionCount = (
      await axios.get(`${MDM_CARDINFO_BASE_PATH}?collectionCount=true`)
    ).data;
  } catch (e: any) {
    console.error(`couldn't fetch MDM's card count\n${e.message}`);
    process.exit(4);
  }

  await Promise.all(
    Array.from(
      { length: Math.ceil(mdmCollectionCount / MDM_PAGE_SIZE) },
      async (_, i) => {
        const pageId = i + 1;
        await limiter
          .schedule(async () => {
            const cards = (
              await axios.get(
                `${MDM_CARDINFO_BASE_PATH}?limit=${MDM_PAGE_SIZE}&page=${pageId}`
              )
            ).data as MdmCardInfoRoot;
            cards.forEach((card) => {
              if (card.konamiID && card.konamiID in cardInfo) {
                cardInfo[card.konamiID].popRank = Math.min(card.popRank, 1e20);
              }
            });
            console.log(
              `fetched MDM cards ${i * MDM_PAGE_SIZE + 1}-${Math.min(
                (i + 1) * MDM_PAGE_SIZE,
                mdmCollectionCount
              )}`
            );
          })
          .catch((e) => {
            console.error(`couldn't fetch MDM page ${pageId}\n${e.message}`);
            process.exit(5);
          });
      }
    )
  );

  console.log("saving to file.");
  await writeFile(CARDINFO_PATH, JSON.stringify(cardInfo), "utf-8");
}

if (esMain(import.meta)) {
  await downloadCardInfo();
}
