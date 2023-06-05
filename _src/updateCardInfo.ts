import { readFile, writeFile } from "fs/promises";
import fs from "fs";
import axios from "axios";
import { CardInfo, MdmCardInfoRoot, YpdCardInfoRoot } from "./cardTypes.js";
import git from "isomorphic-git";
import http from "isomorphic-git/http/node/index.js";
import {
  CARDINFO_PATH,
  MDM_CARDINFO_BASE_PATH,
  MDM_PAGE_SIZE,
  REMOTE_CARDINFO_PATH,
} from "./constants.js";
import { updateImages } from "./updateImages.js";
import esMain from "es-main";
import Bottleneck from "bottleneck";

export async function updateCardInfo() {
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

  // await Promise.all([
  //   git.add({ fs, dir: ".", filepath: CARDINFO_PATH }),
  //   git.add({ fs, dir: ".", filepath: VERSION_PATH }),
  // ]);

  // await git.commit({
  //   fs,
  //   dir: ".",
  //   message: `Update card data to ${versionResponse[0].last_update}`,
  //   author: { name: "updater", email: "no-reply@github.com" },
  // });

  // const token = process.env.GITHUB_TOKEN;
  // console.log("pushing update to repo.");

  // // const chars = [...token as string];
  // // chars.forEach((c, i) => console.log(`${i}: ${c}`));
  // // just printing the token gets it censored in the workflow history. neat!

  // let pushResult = await git.push({
  //   fs,
  //   http,
  //   dir: ".",
  //   remote: "origin",
  //   onAuth: () => ({ username: "github", password: token }),
  // }); // what isn't neat is the documentation for auth:
  // // https://isomorphic-git.org/docs/en/snippets#github-pages-deploy-script
  // // has the correct inputs but the wrong keys for onAuth
  // // https://isomorphic-git.org/docs/en/onAuth#oauth2-tokens
  // // is for a different kind of token, probably fine-grained access
  // // which annoyingly expire fast, pass
  // console.log(pushResult);

  // await updateImages();
}

if (esMain(import.meta)) {
  await updateCardInfo();
}
