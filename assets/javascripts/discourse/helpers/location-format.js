import { htmlSafe } from "@ember/template";
import { helperContext, registerRawHelper } from "discourse-common/lib/helpers";
import { locationFormat } from "../lib/location-utilities";
import Site from "discourse/models/site";

registerRawHelper("location-format", _locationFormat);
export default function _locationFormat(location, opts) {
  let siteSettings = helperContext().siteSettings;
  return htmlSafe(
    locationFormat(
      location,
      Site.currentProp("country_codes"),
      siteSettings.location_input_fields_enabled,
      siteSettings.location_input_fields,
      { ...opts }
    )
  );
}
