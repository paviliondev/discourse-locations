import { htmlSafe } from "@ember/template";
import { geoLocationFormat } from "../lib/location-utilities";
import Site from "discourse/models/site";

export default function _geoLocationFormat(geoLocation, opts) {
  return htmlSafe(
    geoLocationFormat(geoLocation, Site.currentProp("country_codes"), opts)
  );
}
