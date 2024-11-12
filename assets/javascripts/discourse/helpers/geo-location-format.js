import { htmlSafe } from "@ember/template";
import Site from "discourse/models/site";
import { geoLocationFormat } from "../lib/location-utilities";

export default function _geoLocationFormat(geoLocation, opts) {
  return htmlSafe(
    geoLocationFormat(geoLocation, Site.currentProp("country_codes"), opts)
  );
}
