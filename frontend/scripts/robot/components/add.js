// IMPORTS =========================================================================================
let result = require("lodash.result");
let isArray = require("lodash.isarray");
let isPlainObject = require("lodash.isplainobject");
let isEmpty = require("lodash.isempty");
let merge = require("lodash.merge");
let debounce = require("lodash.debounce");
let flatten = require("lodash.flatten");
let Class = require("classnames");
let Joi = require("joi");
let React = require("react");
let ReactRouter = require("react-router");
let {Link} = ReactRouter;
let DocumentTitle = require("react-document-title");
let Validators = require("shared/robot/validators");
let Loading = require("frontend/common/components/loading");
let Error = require("frontend/common/components/error");
let NotFound = require("frontend/common/components/notfound");
let State = require("frontend/state");
let addRobot = require("frontend/robot/actions/add");

// HELPERS =========================================================================================
function flattenAndResetTo(obj, to, path) {
  path = path || "";
  return Object.keys(obj).reduce(function (memo, key) {
    if (isPlainObject(obj[key])) {
      Object.assign(memo, flattenAndResetTo(obj[key], to, path + key+ "."));
    } else {
      memo[path + key] = to;
    }
    return memo;
  }, {});
}

function validate(joiSchema, data, key) {
  joiSchema = joiSchema || {};
  data = data || {};
  let joiOptions = {
    abortEarly: false,
    allowUnknown: true,
  };
  let errors = formatErrors(Joi.validate(data, joiSchema, joiOptions));
  if (key === undefined) {
    return Object.assign(
      flattenAndResetTo(joiSchema, []),
      errors
    );
  } else {
    let result = {};
    result[key] = errors[key] || [];
    return result;
  }
}

function formatErrors(joiResult) {
  if (joiResult.error !== null) {
    return joiResult.error.details.reduce(function (memo, detail) {
      if (!Array.isArray(memo[detail.path])) {
        memo[detail.path] = [];
      }
      memo[detail.path].push(detail.message);
      return memo;
    }, {});
  } else {
    return {};
  }
}

// COMPONENTS ======================================================================================
export default React.createClass({
  mixins: [ReactRouter.State, State.mixin],

  cursors() {
    return {
      robots: ["robots"],
    }
  },

  render() {
    let {models, loading, loadError} = this.state.cursors.robots;
    return (
      <Form models={models} loading={loading} loadError={loadError}/>
    );
  }
});

let Form = React.createClass({
  getInitialState() {
    return {
      model: {
        name: undefined,
        assemblyDate: undefined,
        manufacturer: undefined,
      },
    }
  },

  validatorTypes() {
    return Validators.model;
  },

  validatorData() {
    return this.state.model;
  },

  validate: function (key) {
    let schema = result(this, "validatorTypes") || {};
    let data = result(this, "validatorData") || this.state;
    let nextErrors = merge({}, this.state.errors, validate(schema, data, key), function (a, b) {
      return isArray(b) ? b : undefined;
    });
    return new Promise((resolve, reject) => {
      this.setState({
        errors: nextErrors
      }, () => resolve(this.isValid(key)));
    });
  },

  handleChangeFor: function (key) {
    return function handleChange(event) {
      event.persist();
      let model = this.state.model;
      model[key] = event.currentTarget.value;
      this.setState({model: model});
      this.validateDebounced(key);
    }.bind(this);
  },

  validateDebounced: debounce(function validateDebounced(key) {
    return this.validate(key);
  }, 500),

  handleReset(event) {
    event.preventDefault();
    event.persist();
    this.setState({
      model: Object.assign({}, this.getInitialState().model),
    });
  },

  handleSubmit(event) {
    event.preventDefault();
    event.persist();
    this.validate().then(isValid => {
      if (isValid) {
        // TODO replace with React.findDOMNode at #0.13.0
        addRobot({
          name: this.refs.name.getDOMNode().value,
          assemblyDate: this.refs.assemblyDate.getDOMNode().value,
          manufacturer: this.refs.manufacturer.getDOMNode().value,
        });
      } else {
        alert("Can't submit form with errors");
      }
    });
  },

  getValidationMessages: function (key) {
    let errors = this.state.errors || {};
    if (isEmpty(errors)) {
      return [];
    } else {
      if (key === undefined) {
        return flatten(Object.keys(errors).map(function (error) {
          return errors[error] || [];
        }));
      } else {
        return errors[key] || [];
      }
    }
  },

  isValid: function (key) {
    return isEmpty(this.getValidationMessages(key));
  },

  render() {
    let {models, loading, loadError} = this.props;
    let model = this.state.model;

    if (loading) {
      return <Loading/>;
    } else if (loadError) {
      return <Error loadError={loadError}/>;
    } else {
      return (
        <DocumentTitle title={"Add Robot"}>
          <div>
            <div id="page-actions">
              <div className="container">
                <div className="btn-group btn-group-sm pull-left">
                  <Link to="robot-index" className="btn btn-gray-light" title="Back to list">
                    <span className="fa fa-arrow-left"></span>
                    <span className="hidden-xs margin-left-sm">Back to list</span>
                  </Link>
                </div>
              </div>
            </div>
            <section className="container margin-top-lg">
              <div className="row">
                <div className="col-xs-12 col-sm-9">
                  <h1 className="nomargin-top">Add Robot</h1>
                  <form onSubmit={this.handleSubmit}>
                    <fieldset>
                      <div className={Class({
                        "form-group": true,
                        "required": (this.validatorTypes().name._flags.presence == "required"),
                        "error": !this.isValid("name"),
                      })}>
                        <label htmlFor="name">Name</label>
                        <input type="text" onBlur={this.validate.bind(this, "name")} onChange={this.handleChangeFor("name")} className="form-control" id="name" ref="name" value={model.name}/>
                        <div className={Class({
                          "help": true,
                          "error": !this.isValid("name"),
                        })}>
                          {this.getValidationMessages("name").map(message => <span key="">{message}</span>)}
                        </div>
                      </div>

                      <div className={Class({
                        "form-group": true,
                        "required": (this.validatorTypes().assemblyDate._flags.presence == "required"),
                        "error": !this.isValid("assemblyDate")
                      })}>
                        <label htmlFor="assemblyDate">Assembly Date</label>
                        <input type="text" onBlur={this.validate.bind(this, "assemblyDate")} onChange={this.handleChangeFor("assemblyDate")} className="form-control" id="assemblyDate" ref="assemblyDate" value={model.assemblyDate}/>
                        <div className={Class({
                          "help": true,
                          "error": !this.isValid("assemblyDate"),
                        })}>
                          {this.getValidationMessages("assemblyDate").map(message => <span key="">{message}</span>)}
                        </div>
                      </div>

                      <div className={Class({
                        "form-group": true,
                        "required": (this.validatorTypes().manufacturer._flags.presence == "required"),
                        "error": !this.isValid("manufacturer")
                      })}>
                        <label htmlFor="manufacturer">Manufacturer</label>
                        <input type="text" onBlur={this.validate.bind(this, "manufacturer")} onChange={this.handleChangeFor("manufacturer")} className="form-control" id="manufacturer" ref="manufacturer" value={model.manufacturer}/>
                        <div className={Class({
                          "help": true,
                          "error": !this.isValid("manufacturer"),
                        })}>
                          {this.getValidationMessages("manufacturer").map(message => <span key="">{message}</span>)}
                        </div>
                      </div>
                    </fieldset>
                    <div className="btn-group">
                      <button className="btn btn-default" type="button" onClick={this.handleReset}>Reset</button>
                      <button className="btn btn-primary" disabled={!this.isValid()} type="submit">Submit</button>
                    </div>
                  </form>
                </div>
              </div>
            </section>
          </div>
        </DocumentTitle>
      );
    }
  }
});

/*
<TextInput label="Name" placeholder="Name" id="model.name" form={this}/>
<TextInput label="Assembly Date" placeholder="Assembly Date" id="model.assemblyDate" form={this}/>
<TextInput label="Manufacturer" placeholder="Manufacturer" id="model.manufacturer" form={this}/>
*/
