import config from "./indexnow.config.json";
import { absoluteUrl } from "./seo";

export const INDEXNOW_KEY = config.key;
export const INDEXNOW_ENDPOINT = config.endpoint;
export const INDEXNOW_KEY_PATH = `/${INDEXNOW_KEY}.txt`;
export const INDEXNOW_KEY_LOCATION = absoluteUrl(INDEXNOW_KEY_PATH);
