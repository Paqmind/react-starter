import _removeItem from "frontend/actions/remove-item/index";
import state from "frontend/state";
import api from "shared/api/robot";
import {Robot} from "shared/types";


export default function removeItem(id) {
  let UICursor = state.select("UI", "robot");
  return _removeItem(UICursor, Robot, api, id);
}
