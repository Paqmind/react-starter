import api from "shared/api/monster";
import {Monster} from "shared/types";
import {parseAs} from "shared/parsers";
import state from "frontend/state";
import ajax from "frontend/ajax";

let dataCursor = state.select(api.plural);
let itemsCursor = dataCursor.select("items");

// Id -> Promise Monster
export default function fetchItem(id) {
  console.debug(api.plural + `.fetchItem(${id})`);

  return ajax.get(api.itemUrl.replace(":id", id))
    .then(response => {
      if (response.status.startsWith("2")) {
        let data = response.data.data;
        let item = parseAs(Monster, data);
        itemsCursor.set(id, item);
        return item;
      } else {
        return undefined;
      }
    });
}
