import { readFile, writeFile, mkdir } from "fs/promises";
import { Searcher } from "fast-fuzzy";
import YAML from "yaml";
import cardInfo from "../_data/CardInfo.json" assert { type: "json" };
import { CardInfo } from "./cardTypes.js";
import esMain from "es-main";
import Path from "path";
import { write } from "fs";

const ci: CardInfo = cardInfo;

const nameList = Object.entries(ci).map(([id, card]) => {
  return { id: id, name: card.name };
});

async function createDeckRedirect(
  decklistFilename: string,
  decklistIds: string[]
) {
  let decklistParams = new URLSearchParams();
  decklistIds.forEach((id) => {
    decklistParams.append("id", id);
  });
  decklistParams.set(
    "title",
    `${decklistFilename.replaceAll("_", " ")} — X X I L`
  );
  console.log(decklistParams.toString());

  const htmlDir = decklistFilename.replaceAll("_", "/");
  await mkdir(htmlDir, { recursive: true });
  const indexPath = Path.join(htmlDir, "index.html");
  const rootRelativePath = decklistFilename
    .split("_")
    .reduce((accumulator, _val) => {
      return accumulator + "../"; //traverse up 1 directory for each word
    }, "");
  await writeFile(
    indexPath,
    `<!DOCTYPE html>
<html>
  <head>
    <title>${decklistFilename} network</title>
    <meta http-equiv="refresh" content="0; url='${rootRelativePath}?${decklistParams.toString()}'" />
    <link rel="stylesheet" href="${rootRelativePath}_dist/bundle.css" />
    <link rel="icon" href="${rootRelativePath}favicon.ico" />
  </head>
  <body>
    <p id="redirect-text">Redirecting to network viewer...</p>
  </body>
</html>`,
    "utf-8"
  );

  console.log(`wrote to ${indexPath}`);
}

async function createDeckRedirectFromFile(deckPath: string) {
  const searcher = new Searcher(nameList, {
    keySelector: (x) => x.name,
  });

  const decklist = YAML.parse(await readFile(deckPath, "utf-8")) as string[];
  console.log("---");
  const decklistIds = decklist.map((line) => {
    const bestmatch = searcher.search(line)[0];
    console.log(`${line} -> ${bestmatch.name}`);
    return bestmatch.id;
  });
  console.log("---");

  const decklistFilename = Path.basename(deckPath, ".yml");
  createDeckRedirect(decklistFilename, decklistIds);
}

async function createDeckRedirectFromURLParams(
  urlParams: URLSearchParams,
  filenameToWrite: string
) {
  const cardIds = [...new Set(urlParams.getAll("id"))];
  createDeckRedirect(filenameToWrite, cardIds);
}

if (esMain(import.meta)) {
  if (process.argv.length > 2) {
    createDeckRedirectFromURLParams(
      new URLSearchParams(process.argv[2]),
      process.argv[3]
    );
  } else {
    await createDeckRedirectFromFile(process.argv[2]);
  }
}
