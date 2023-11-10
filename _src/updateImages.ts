import cardInfo from "../_data/CardInfo.json" assert { type: "json" };
import { CardInfo } from "./cardTypes.js";
import fs from "fs";
import Bottleneck from "bottleneck";
import { IMAGES_DIRECTORY, REMOTE_IMAGES_DIRECTORY } from "./constants.js";
import axios from "axios";
import sharp from "sharp";
import git from "isomorphic-git";
import http from "isomorphic-git/http/node/index.js";
import esMain from "es-main";

export async function updateImages() {
  const ci = cardInfo as CardInfo;
  if (!fs.existsSync(IMAGES_DIRECTORY)) {
    fs.mkdirSync(IMAGES_DIRECTORY);
  }

  const limiter = new Bottleneck({
    reservoir: 9,
    reservoirRefreshAmount: 9,
    reservoirRefreshInterval: 1000,
  });

  let imagesDownloaded = 0;

  await Promise.all(
    Object.entries(ci).map(async ([id, card]) => {
      const path = `${IMAGES_DIRECTORY}${id}.jpg`;
      if (!fs.existsSync(path)) {
        await limiter.schedule(async () => {
          const remotePath = `${REMOTE_IMAGES_DIRECTORY}${id}.jpg`;
          axios
            .get(remotePath, {
              responseType: "arraybuffer",
            })
            .then((res) => {
              return sharp(res.data).resize(156).toFile(path);
            })
            .then(() => {
              return git.add({ fs, dir: ".", filepath: path });
            })
            .then(() => {
              imagesDownloaded++;
            })
            .catch((e) => {
              console.log(`couldn't download image for ${card.name}: ${e}`);
            });
        });
      }
    })
  );

  console.log(`downloaded ${imagesDownloaded} image(s)`);
  if (imagesDownloaded > 0) {
    await git.commit({
      fs,
      dir: ".",
      message: `Update image cache with ${imagesDownloaded} image(s)`,
      author: { name: "updater", email: "no-reply@github.com" },
    });

    const token = process.env.GITHUB_TOKEN;
    console.log("pushing update to repo.");

    let pushResult = await git.push({
      fs,
      http,
      dir: ".",
      remote: "origin",
      onAuth: () => ({ username: "github", password: token }),
    });
    console.log(pushResult);
  }
}

if (esMain(import.meta)) {
  await updateImages();
}
