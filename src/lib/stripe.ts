import Stripe from "stripe";
import config from "../config/index.js";

const configKey = config.stripe_secret_key;


export const stripe = new Stripe(configKey, {
  apiVersion: "2026-07-29.dahlia",
});
