import { readFile, writeFile } from "fs/promises";
import fs from "fs";
import fetch from "node-fetch";
import { CardInfo, YpdCardInfoRoot, YpdCardInfoVersionRoot } from "./cardTypes";
import git from "isomorphic-git";
import http from "isomorphic-git/http/node/index.js";
import {
  CARDINFO_PATH,
  VERSION_PATH,
  REMOTE_CARDINFO_PATH,
  REMOTE_VERSION_PATH,
} from "./constants";

let currentVersion;
try {
  currentVersion = (
    JSON.parse(await readFile(VERSION_PATH, "utf-8")) as YpdCardInfoVersionRoot
  )[0].database_version;
} catch (e: any) {
  console.log(`couldn't read local card info version\n${e.message}`);
  process.exit(1);
}

let versionResponse;
let remoteVersion;
try {
  versionResponse = (await (
    await fetch(REMOTE_VERSION_PATH)
  ).json()) as YpdCardInfoVersionRoot;
  remoteVersion = versionResponse[0].database_version;
} catch (e: any) {
  console.log(`couldn't read YGOProDeck card info version\n${e.message}`);
  process.exit(2);
}

console.log(
  `local version: v${currentVersion}\nYGOProDeck version: v${remoteVersion}`
);
if (currentVersion === remoteVersion || +currentVersion >= +remoteVersion) {
  console.log("nothing to do, exiting.");
  process.exit(0);
}

let cardInfoResponse: YpdCardInfoRoot;
try {
  cardInfoResponse = (await (
    await fetch(REMOTE_CARDINFO_PATH)
  ).json()) as YpdCardInfoRoot;
} catch (e: any) {
  console.log(`couldn't fetch YGOProDeck card info\n${e.message}`);
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
      atk: card.atk!,
      def: card.def!,
      level: card.level!,
    };
  });

console.log("saving to file.");
await writeFile(CARDINFO_PATH, JSON.stringify(cardInfo), "utf-8");
// leave version update as last thing
await writeFile(VERSION_PATH, JSON.stringify(versionResponse), "utf-8");

await Promise.all([
  git.add({ fs, dir: ".", filepath: CARDINFO_PATH }),
  git.add({ fs, dir: ".", filepath: VERSION_PATH }),
]);

await git.commit({
  fs,
  dir: ".",
  message: `Update card data to ${versionResponse[0].last_update}`,
  author: { name: "updater", email: "no-reply@github.com" },
});

const token = process.env.GITHUB_TOKEN;
console.log("pushing update to repo.");

// const chars = [...token as string];
// chars.forEach((c, i) => console.log(`${i}: ${c}`));
// just printing the token gets it censored in the workflow history. neat!

let pushResult = await git.push({
  fs,
  http,
  dir: ".",
  remote: "origin",
  onAuth: () => ({ username: "github", password: token }),
}); // what isn't neat is the documentation for auth:
// https://isomorphic-git.org/docs/en/snippets#github-pages-deploy-script
// has the correct inputs but the wrong keys for onAuth
// https://isomorphic-git.org/docs/en/onAuth#oauth2-tokens
// is for a different kind of token, probably fine-grained access
// which annoyingly expire fast, pass
console.log(pushResult);
