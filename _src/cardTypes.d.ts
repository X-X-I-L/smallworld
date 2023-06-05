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
  misc_info: YpdMiscInfo[];
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

export interface YpdMiscInfo {
  beta_name?: string;
  views: number;
  viewsweek: number;
  upvotes: number;
  downvotes: number;
  formats: string[];
  tcg_date?: string;
  ocg_date?: string;
  konami_id?: number;
  has_effect: number;
  beta_id?: number;
  treated_as?: string;
  staple?: string;
  question_atk?: number;
  question_def?: number;
}

export interface YpdBanlistInfo {
  ban_tcg?: string;
  ban_ocg?: string;
  ban_goat?: string;
}

// ---

export type MdmCardInfoRoot = MdmCard[];

export interface MdmCard {
  _id: string;
  monsterType: string[];
  popRank: number;
  name: string;
  konamiID?: string;
  type: string;
  level?: number;
  race: string;
  attribute?: string;
  atk?: number;
  def?: number;
  description: string;
  linkArrows: string[];
  deckTypes: string[];
  obtain: MdmObtain[];
  rarity?: string;
  release?: string;
  ocgRelease?: string;
  tcgRelease?: string;
  floodgate?: boolean;
  scale?: number;
  linkRating?: number;
  generic?: boolean;
  isUpdated?: boolean;
  banStatus?: string;
  alternateArt?: boolean;
  tcgBanStatus?: string;
  ocgBanStatus?: string;
  handtrap?: boolean;
  nameRelease?: string;
}

export interface MdmObtain {
  source: MdmSource;
  amount: number;
  type: string;
}

export interface MdmSource {
  _id: string;
  name: string;
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
  atk: string;
  def: string;
  level: number;
  popRank: number;
}

export interface CardNode extends CardInfoEntry, Omit<Node, "level"> {}
