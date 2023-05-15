import { Node } from "vis-network";

// auto-generated from their respective endpoint JSONs
export interface YpdCardInfoRoot {
  data: YpdCard[];
}

export interface YpdCard {
  id: number;
  name: string;
  type: string;
  frameType: string;
  desc: string;
  race: string;
  archetype?: string;
  card_sets?: YpdCardSet[];
  card_images?: YpdCardImage[];
  card_prices?: YpdCardPrice[];
  atk?: number;
  def?: number;
  level?: number;
  attribute?: string;
  scale?: number;
  linkval?: number;
  linkmarkers?: string[];
  banlist_info?: YpdBanlistInfo;
}

export interface YpdCardSet {
  set_name: string;
  set_code: string;
  set_rarity: string;
  set_rarity_code: string;
  set_price: string;
}

export interface YpdCardImage {
  id: number;
  image_url: string;
  image_url_small: string;
  image_url_cropped: string;
}

export interface YpdCardPrice {
  cardmarket_price: string;
  tcgplayer_price: string;
  ebay_price: string;
  amazon_price: string;
  coolstuffinc_price: string;
}

export interface YpdBanlistInfo {
  ban_tcg?: string;
  ban_ocg?: string;
  ban_goat?: string;
}

export type YpdCardInfoVersionRoot = YpdCardInfoVersion[];

export interface YpdCardInfoVersion {
  database_version: string;
  last_update: string;
}

// ---

export interface CardInfo {
  [id: string]: CardInfoEntry;
}

export interface CardInfoEntry {
  // id: number
  name: string;
  attribute: string;
  type: string;
  atk: number;
  def: number;
  level: number;
}

export interface CardNode extends CardInfoEntry, Omit<Node, "level"> {}
