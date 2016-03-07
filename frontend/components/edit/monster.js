import {clone, map} from "ramda";
import Globalize from "globalize";
import Class from "classnames";
import {branch} from "baobab-react/decorators";
import React from "react";
import {Link} from "react-router";
import DocumentTitle from "react-document-title";
import {debounce, hasValues} from "shared/helpers/common";
import {statics} from "frontend/helpers/react";
import actions from "frontend/actions/monster";
import alertActions from "frontend/actions/alert";
import {ShallowComponent, DeepComponent, ItemLink, NotFound} from "frontend/components/common";
import {indexRouter} from "frontend/router";
import state from "frontend/state";


let validateFormDebounced = debounce(key => {
  actions.validateEditForm(key).catch(err => null);
}, 500);

@statics({
  loadData: () => {
    let urlParams = state.select("url").get("params");
    actions
      .loadItem(urlParams.id)
      .then((item) => {
        let UICursor = state.select("UI", "monster");
        UICursor.get("id", item.id);
        UICursor.set("editForm", item);
        actions.resetEditForm(item);
      })
      .catch(error => {
        console.error(error);
        alertActions.addItem({
          message: "Failed to load Monster: " + error,
          category: "error",
        });
      });
  }
})
@branch({
  cursors: {
    havePendingRequests: ["UI", "monsters", "havePendingRequests"],
    item: ["UI",  "monster", "currentItem"],
    form: ["UI",  "monster", "editForm"],
    errors: ["UI",  "monster", "editFormErrors"],
  },
})
export default class MonsterEdit extends DeepComponent {
  handleBlur(key) {
    actions.validateEditForm(key).catch(err => null);
  }

  handleChange(key, data) {
    actions.updateEditForm(key, data);
    validateFormDebounced(key);
  }

  handleSubmit() {
    actions
      .validateEditForm("")
      .then(() => {
        return actions.editItem();
      })
      .then((item) => {
        alertActions.addItem({
          message: "Monster edited with id: " + item.id,
          category: "success",
        });
      })
      .catch(error => {
        console.error(error);
        alertActions.addItem({
          message: "Failed to edit Monster: " + error,
          category: "error",
        });
      });
  }

  handleReset() {
    let UICursor = state.select("UI", "monster");
    let model = UICursor.get("currentItem");
    actions.resetEditForm(model);
  }

  render() {
    let {havePendingRequests, item, form, errors} = this.props;

    if (item) {
      return (
        <DocumentTitle title={"Edit " + form.name}>
          <div>
            <Actions {...this.props}/>
            <section className="container margin-top-lg">
              <div className="row">
                <div className="col-xs-12 col-sm-3">
                  <div className="thumbnail">
                    <img src={"http://robohash.org/" + item.id + "?set=set2&size=200x200"} width="200px" height="200px"/>
                  </div>
                </div>
                <div className="col-xs-12 col-sm-9">
                  <h1 className="nomargin-top">{form.name}</h1>
                  <fieldset>
                    <div className={Class("form-group", {
                      required: false,
                      error: Boolean(errors.name),
                    })}>
                      <label htmlFor="name">Name</label>
                      <input type="text"
                        value={form.name}
                        onBlur={() => this.handleBlur("name")}
                        onChange={event => this.handleChange("name", event.currentTarget.value)}
                        id="name" ref="name"
                        className="form-control"/>
                      <div className={Class("help", {
                        error: Boolean(errors.name),
                      })}>
                        {map(message => <span key="">{message}</span>, [errors.name])}
                      </div>
                    </div>

                    <div className={Class("form-group", {
                      required: false,
                      error: Boolean(errors.citizenship),
                    })}>
                      <label htmlFor="citizenship">Citizenship</label>
                      <input type="text"
                        value={form.citizenship}
                        onBlur={() => this.handleBlur("citizenship")}
                        onChange={event => this.handleChange("citizenship", event.currentTarget.value)}
                        id="citizenship" ref="citizenship"
                        className="form-control"/>
                      <div className={Class("help", {
                        error: Boolean(errors.citizenship),
                      })}>
                        {map(message => <span key="">{message}</span>, [errors.citizenship])}
                      </div>
                    </div>

                    <div className={Class("form-group", {
                      required: false,
                      error: Boolean(errors.birthDate),
                    })}>
                      <label htmlFor="birthDate">Birth Date</label>
                      <input type="text"
                        value={form.birthDate}
                        onBlur={() => this.handleBlur("birthDate")}
                        onChange={event => this.handleChange("birthDate", event.currentTarget.value)}
                        id="birthDate" ref="birthDate"
                        className="form-control"/>
                      <div className={Class("help", {
                        error: Boolean(errors.birthDate),
                      })}>
                        {map(message => <span key="">{message}</span>, [errors.birthDate])}
                      </div>
                    </div>
                  </fieldset>
                  <div className="btn-group">
                    <button className="btn btn-default" type="button" onClick={() => this.handleReset()}>Reset</button>
                    <button className="btn btn-primary" type="button" onClick={() => this.handleSubmit()} disabled={hasValues(errors)}>Submit</button>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </DocumentTitle>
      );
    } else if (havePendingRequests) {
      return null;
    } else {
      return <NotFound/>;
    }
  }
}

class Actions extends ShallowComponent {
  handleRemove(id) {
    return actions
      .removeItem(id)
      .then((item) => {
        alertActions.addItem({
          message: "Monster removed with id: " + item.id,
          category: "success",
        });
        indexRouter.transitionTo("monster-index");
      })
      .catch(error => {
        console.error(error);
        alertActions.addItem({
          message: "Failed to remove Monster: " + error,
          category: "error",
        });
      });
  }

  render() {
    let {item} = this.props;

    return (
      <div className="actions">
        <div className="container">
          <div className="btn-group btn-group-sm pull-left">
            <Link to="monster-index" className="btn btn-gray-light" title="Back to list">
              <span className="fa fa-arrow-left"></span>
              <span className="hidden-xs margin-left-sm">Back to list</span>
            </Link>
          </div>
          <div className="btn-group btn-group-sm pull-right">
            <Link to="monster-add" className="btn btn-sm btn-green" title="Add">
              <span className="fa fa-plus"></span>
            </Link>
            <ItemLink to="monster-detail" params={{id: item.id}} className="btn btn-blue" title="Detail">
              <span className="fa fa-eye"></span>
            </ItemLink>
            <a className="btn btn-red" title="Remove" onClick={() => this.handleRemove(item.id)}>
              <span className="fa fa-times"></span>
            </a>
          </div>
        </div>
      </div>
    );
  }
}
