import {contains, curry, forEach, reduce, reject} from "ramda";
import ajax from "frontend/ajax";
import state from "frontend/state";
import api from "shared/api/robot";


// Cursor, Api, id -> Maybe item
function removeItem(UICursor, api, id) {
  console.debug(api.singular + `.removeItem()`);

  let DBCursor = state.select("DB", UICursor.get("DBCursorName"));

  // Optimistic update
  let oldItem = DBCursor.get(id);
  let UIListCursors = state.select("UI").get();
  let oldListIds = reduce((memo, key) => {
    if (UIListCursors[key].DBCursorName == UICursor.get("DBCursorName") && UIListCursors[key].ids &&
        contains(id, UIListCursors[key].ids)) {
      memo[key] = UIListCursors[key].ids;
    }
    return memo;
  }, {}, Object.keys(UIListCursors));

  // Unset id in item cursor
  UICursor.set("id", null);


  // Remove id from pagination, where it presents
  forEach(key => {
    let cursor = state.select("UI", key);
    cursor.set("ids", reject(_id => _id == id, oldListIds[key]));
  }, Object.keys(oldListIds));


  // Remove item from DB
  DBCursor.unset(id);

  return ajax.delete(api.itemUrl.replace(":id", id))
    .then(response => {
      if (response.status.startsWith("2")) {
        return oldItem;
      } else {
        // Rollback
        UICursor.set("id", id);
        forEach(key => {
          let cursor = state.select("UI", key);
          cursor.set("ids", oldListIds[key]);
        }, Object.keys(oldListIds));
        DBCursor.set(id, oldItem);
        throw Error(response.statusText);
      }
    });
}

export default curry(removeItem);
