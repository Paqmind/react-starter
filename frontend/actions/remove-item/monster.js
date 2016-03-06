import _removeItem from "frontend/actions/remove-item/index";
import state from "frontend/state";
import api from "shared/api/monster";
import {Monster} from "shared/types";


export default function removeItem(id) {
  let UICursor = state.select("UI", "monster");
  return _removeItem(UICursor, Monster, api, id);
}
