var React = require('react/addons');
var Router = require('react-router');
var Radial = require('./Radial.react.js');
var SetupVirtualBox = require('../stores/drivers/SetupVirtualBox');
var RetinaImage = require('react-retina-image');
var Header = require('./Header.react');
var Util = require('../utils/Util');
var metrics = require('../utils/MetricsUtil');

var Setup = React.createClass({
  mixins: [ Router.Navigation ],
  getInitialState: function () {
    return {
      progress: 0,
      name: '',
    };
  },
  componentWillMount: function () {
    SetupVirtualBox.on(SetupVirtualBox.PROGRESS_EVENT, this.update);
    SetupVirtualBox.on(SetupVirtualBox.STEP_EVENT, this.update);
    SetupVirtualBox.on(SetupVirtualBox.ERROR_EVENT, this.update);
  },
  componentDidMount: function () {
    this.update();
  },
  componentDidUnmount: function () {
    SetupVirtualBox.removeListener(SetupVirtualBox.PROGRESS_EVENT, this.update);
    SetupVirtualBox.removeListener(SetupVirtualBox.STEP_EVENT, this.update);
    SetupVirtualBox.removeListener(SetupVirtualBox.ERROR_EVENT, this.update);
  },
  handleCancelRetry: function () {
    metrics.track('Setup Retried', {
      from: 'cancel'
    });
    SetupVirtualBox.retry();
  },
  handleErrorRetry: function () {
    metrics.track('Setup Retried', {
      from: 'error',
      removeVM: false
    });
    SetupVirtualBox.retry(false);
  },
  handleErrorRemoveRetry: function () {
    metrics.track('Setup Retried', {
      from: 'error',
      removeVM: true
    });
    SetupVirtualBox.retry(true);
  },
  handleOpenWebsite: function () {
    Util.exec(['open', 'https://www.virtualbox.org/wiki/Downloads']);
  },
  update: function () {
    if (this.isMounted()) {
      //console.log("Mounted FOO")
      this.setState({
        progress: SetupVirtualBox.percent(),
        step: SetupVirtualBox.step(),
        error: SetupVirtualBox.error(),
        cancelled: SetupVirtualBox.cancelled()
      });
    } else {
      //console.log("Not mounted FOO!" + JSON.stringify(this))
    }
  },
  renderContents: function () {
    var img = 'virtualbox.png';
    if (SetupVirtualBox.step().name === 'init' || SetupVirtualBox.step().name === 'start') {
      img = 'boot2docker.png';
    }
    return (
      <div className="contents">
        <RetinaImage src={img} checkIfRetinaImgExists={false}/>
        <div className="detail">
          <Radial progress={this.state.progress} thick={true} gray={true}/>
        </div>
      </div>
    );
  },
  renderStep: function () {
    return (
      <div className="setup">
        <Header hideLogin={true}/>
        <div className="setup-content">
          <div className="image">
            {this.renderContents()}
          </div>
          <div className="desc">
            <div className="content">
              <h4>Step {SetupVirtualBox.number()} out of {SetupVirtualBox.stepCount()}</h4>
              <h1>{SetupVirtualBox.step().title}</h1>
              <p>{SetupVirtualBox.step().message}</p>
            </div>
          </div>
        </div>
      </div>
    );
  },
  renderCancelled: function () {
    return (
      <div className="setup">
        <Header hideLogin={true}/>
        <div className="setup-content">
          <div className="image">
            {this.renderContents()}
          </div>
          <div className="desc">
            <div className="content">
              <h4>Setup Cancelled</h4>
              <h1>Couldn&#39;t Install Requirements</h1>
              <p>Kitematic didn&#39;t receive the administrative privileges required to install or upgrade VirtualBox &amp; Docker.</p>
              <p>Please click retry. If VirtualBox is not installed, you can download &amp; install it manually from the <a onClick={this.handleOpenWebsite}>official Oracle website</a>.</p>
              <p><button className="btn btn-action" onClick={this.handleCancelRetry}>Retry</button></p>
            </div>
          </div>
        </div>
      </div>
    );
  },
  renderError: function () {
    return (
      <div className="setup">
        <Header hideLogin={true}/>
        <div className="setup-content">
          <div className="image">
            <div className="contents">
              <RetinaImage src="install-error.png" checkIfRetinaImgExists={false}/>
              <div className="detail">
              </div>
            </div>
          </div>
          <div className="desc">
            <div className="content">
              <h4>Setup Error</h4>
              <h1>We&#39;re Sorry!</h1>
              <p>There seems to have been an unexpected error with Kitematic:</p>
              <p className="error">{this.state.error.message || this.state.error}</p>
              <p className="setup-actions">
                <button className="btn btn-action" onClick={this.handleErrorRetry}>Retry Setup</button>
                <button className="btn btn-action" onClick={this.handleErrorRemoveRetry}>Delete VM and Retry Setup</button>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  },
  render: function () {
    if (this.state.cancelled) {
      return this.renderCancelled();
    } else if (this.state.error) {
      return this.renderError();
    } else if (SetupVirtualBox.step()) {
      return this.renderStep();
    } else {
      return false;
    }
  }
});

module.exports = Setup;
