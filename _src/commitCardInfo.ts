import fs from "fs";
import git from "isomorphic-git";
import http from "isomorphic-git/http/node/index.js";
import esMain from "es-main";
import { BUNDLE_CSS_PATH, BUNDLE_JS_PATH, CARDINFO_PATH } from "./constants";

export async function commitCardInfo() {
  await git.add({ fs, dir: ".", filepath: CARDINFO_PATH });
  await git.add({ fs, dir: ".", filepath: BUNDLE_JS_PATH });
  await git.add({ fs, dir: ".", filepath: BUNDLE_CSS_PATH });

  if (
    (await git.status({ fs, dir: ".", filepath: CARDINFO_PATH })) !==
    "unmodified"
  ) {
    await git.commit({
      fs,
      dir: ".",
      message: `Update card data`,
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
  }
}

if (esMain(import.meta)) {
  await commitCardInfo();
}
