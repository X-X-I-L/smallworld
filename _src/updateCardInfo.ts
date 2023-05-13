import { readFile, writeFile } from "fs/promises";
import fs from "fs";
import fetch from "node-fetch";
import { CardInfo, YpdCardInfoRoot, YpdCardInfoVersionRoot } from "./cardTypes";
import git from "isomorphic-git";
import http from "isomorphic-git/http/node/index.js";

const DATA_PATH = "_data/CardInfo.json";
const MAPPING_PATH = "_data/NameMapping.json";
const VERSION_PATH = "_data/DbVer.json";

const REMOTE_DATA_PATH = new URL(
  "https://db.ygoprodeck.com/api/v7/cardinfo.php"
);
const REMOTE_VERSION_PATH = new URL(
  "https://db.ygoprodeck.com/api/v7/checkDBVer.php"
);

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
    await fetch(REMOTE_DATA_PATH)
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

let nameToIdMap: { [name: string]: string } = {};
Object.entries(cardInfo).forEach(([key, val]) => {
  nameToIdMap[val.name] = key;
});

console.log("saving to file.");
await Promise.all([
  writeFile(DATA_PATH, JSON.stringify(cardInfo), "utf-8"),
  writeFile(MAPPING_PATH, JSON.stringify(nameToIdMap), "utf-8"),
]);

// leave version update as last thing
await writeFile(VERSION_PATH, JSON.stringify(versionResponse), "utf-8");

await Promise.all([
  git.add({ fs, dir: ".", filepath: DATA_PATH }),
  git.add({ fs, dir: ".", filepath: MAPPING_PATH }),
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
