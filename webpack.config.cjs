const path = require("path");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const devMode = process.env.NODE_ENV.trim() !== "production";

module.exports = {
  entry: [
    "./_src/index.ts",
    // "./_css/style.module.scss",
    // "~awesomplete/awesomplete.css",
  ],
  plugins: [new MiniCssExtractPlugin({ filename: "bundle.css" })],
  module: {
    rules: [
      {
        test: /\.ts?$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
      {
        test: /\.(sa|sc|c)ss$/i,
        use: [
          MiniCssExtractPlugin.loader,
          {
            loader: "css-loader",
            options: {
              modules: {
                localIdentName: "[local]",
              },
            },
          },
          "sass-loader",
        ],
      },
    ],
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js", ".css"],
    extensionAlias: {
      ".js": [".ts", ".js"],
      ".mjs": [".mts", ".mjs"],
    },
  },
  output: {
    filename: "bundle.js",
    path: path.resolve(__dirname, "_dist"),
  },
  devServer: {
    static: path.join(__dirname, "_dist"),
    compress: true,
    port: 4000,
  },
};
