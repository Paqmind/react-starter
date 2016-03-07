import Globalize from "globalize";
import {branch} from "baobab-react/decorators";
import React from "react";
import {Link} from "react-router";
import DocumentTitle from "react-document-title";
import api from "shared/api/monster";
import {statics} from "frontend/helpers/react";
import {indexRouter} from "frontend/router";
import state from "frontend/state";
import actions from "frontend/actions/monster";
import {ShallowComponent, DeepComponent, ItemLink, NotFound} from "frontend/components/common";


@statics({
  loadData: function() {
    let urlParams = state.select("url").get("params");
    return actions
      .loadItem(urlParams.id)
      .catch(error => {
        console.error(error);
        alertActions.addItem({
          message: "Failed to load Robot: " + error,
          category: "error",
        });
      });
  }
})
@branch({
  cursors: {
    havePendingRequests: ["UI", "monsters", "havePendingRequests"],
    item: ["UI", "monster", "currentItem"],
  }
})
export default class MonsterDetail extends DeepComponent {
  render() {
    let {havePendingRequests, item} = this.props;

    if (item) {
      return (
        <DocumentTitle title={"Detail " + item.name}>
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
                  <h1 className="nomargin-top">{item.name}</h1>
                  <dl>
                    <dt>Serial Number</dt>
                    <dd>{item.id}</dd>
                    <dt>Citizenship</dt>
                    <dd>{item.citizenship}</dd>
                    <dt>Birth Date</dt>
                    <dd>{Globalize.formatDate(item.birthDate)}</dd>
                  </dl>
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
            <ItemLink to="monster-edit" params={{id: item.id}} className="btn btn-orange" title="Edit">
              <span className="fa fa-edit"></span>
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
