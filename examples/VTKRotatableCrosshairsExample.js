import React from 'react';
import { Component } from 'react';
import {
  View2D,
  getImageData,
  loadImageData,
  vtkSVGRotatableCrosshairsWidget,
  vtkInteractorStyleRotatableMPRCrosshairs,
  vtkInteractorStyleMPRWindowLevel,
} from '@vtk-viewport';
import { api as dicomwebClientApi } from 'dicomweb-client';
import vtkVolume from 'vtk.js/Sources/Rendering/Core/Volume';
import vtkVolumeMapper from 'vtk.js/Sources/Rendering/Core/VolumeMapper';
import './mpr.css'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faEyeSlash, faEye, faUndoAlt, faSearchPlus, faCrosshairs } from '@fortawesome/free-solid-svg-icons'

const url = 'http://192.168.222.101:8080/dcm4chee-arc/aets/AS_RECEIVED/rs';

function loadDataset(imageIds, displaySetInstanceUid) {
  const imageDataObject = getImageData(imageIds, displaySetInstanceUid);

  loadImageData(imageDataObject);
  return imageDataObject;
}

function createStudyImageIds(baseUrl, studySearchOptions, studyInstanceUID) {
  const SOP_INSTANCE_UID = '00080018';
  const SERIES_INSTANCE_UID = '0020000E';

  const client = new dicomwebClientApi.DICOMwebClient({ url });

  return new Promise((resolve, reject) => {
    client.retrieveStudyMetadata(studySearchOptions).then(instances => {
      const imageIds = instances.map(metaData => {
        const imageId =
          `wadors:` +
          baseUrl +
          '/studies/' +
          studyInstanceUID +
          '/series/' +
          metaData[SERIES_INSTANCE_UID].Value[0] +
          '/instances/' +
          metaData[SOP_INSTANCE_UID].Value[0] +
          '/frames/1';

        cornerstoneWADOImageLoader.wadors.metaDataManager.add(
          imageId,
          metaData
        );

        return imageId;
      });

      resolve(imageIds);
    }, reject);
  });
}

class VTKRotatableCrosshairsExample extends Component {
  state = {
    volumes: [],
    displayCrosshairs: true,
    crosshairsTool: true,
    studyUid: this.props.parentStudyUid,
    seriesUid: this.props.parentSeriesUid,
    slabThickness: 0
  };


  async componentDidMount() {
    this.apis = [];
    const studyInstanceUID = this.state.studyUid;
    const mrSeriesInstanceUID = this.state.seriesUid;
    const searchInstanceOptions = {
      studyInstanceUID,
    };
    const imageIds = await createStudyImageIds(url, searchInstanceOptions, studyInstanceUID);

    let ctImageIds = imageIds.filter(imageId =>
      imageId.includes(mrSeriesInstanceUID)
    );

    const ctImageDataObject = loadDataset(ctImageIds, 'ctDisplaySet');

    const onAllPixelDataInsertedCallback = () => {
      const ctImageData = ctImageDataObject.vtkImageData;

      const range = ctImageData
        .getPointData()
        .getScalars()
        .getRange();

      const mapper = vtkVolumeMapper.newInstance();
      const ctVol = vtkVolume.newInstance();
      const rgbTransferFunction = ctVol.getProperty().getRGBTransferFunction(0);

      mapper.setInputData(ctImageData);
      mapper.setMaximumSamplesPerRay(2000);
      rgbTransferFunction.setRange(range[0], range[1]);
      ctVol.setMapper(mapper);

      this.setState({
        volumes: [ctVol],
      });
    };

    ctImageDataObject.onAllPixelDataInserted(onAllPixelDataInsertedCallback);
  }

  storeApi = viewportIndex => {
    return api => {
      this.apis[viewportIndex] = api;

      window.apis = this.apis;

      const apis = this.apis;
      const renderWindow = api.genericRenderWindow.getRenderWindow();

      // Add rotatable svg widget
      api.addSVGWidget(
        vtkSVGRotatableCrosshairsWidget.newInstance(),
        'rotatableCrosshairsWidget'
      );

      const istyle = vtkInteractorStyleRotatableMPRCrosshairs.newInstance();

      // add istyle
      api.setInteractorStyle({
        istyle,
        configuration: {
          apis,
          apiIndex: viewportIndex,
        },
      });

      // set blend mode to MIP.
      const mapper = api.volumes[0].getMapper();
      if (mapper.setBlendModeToMaximumIntensity) {
        mapper.setBlendModeToMaximumIntensity();
      }

      api.setSlabThickness(0.1);

      renderWindow.render();

      // Its up to the layout manager of an app to know how many viewports are being created.
      if (apis[0] && apis[1] && apis[2]) {
        const api = apis[0];

        apis.forEach((api, index) => {
          api.svgWidgets.rotatableCrosshairsWidget.setApiIndex(index);
          api.svgWidgets.rotatableCrosshairsWidget.setApis(apis);
        });

        api.svgWidgets.rotatableCrosshairsWidget.resetCrosshairs(apis, 0);
      }
    };
  };

  handleSlabThicknessChange(evt) {
    const value = evt.target.value;
    const valueInMM = value / 10;
    const apis = this.apis;
    this.setState({ slabThickness: valueInMM })
    apis.forEach(api => {
      const renderWindow = api.genericRenderWindow.getRenderWindow();

      api.setSlabThickness(valueInMM);
      renderWindow.render();
    });
  }

  toggleTool = () => {
    let { crosshairsTool } = this.state;
    const apis = this.apis;
    crosshairsTool = !crosshairsTool;

    apis.forEach((api, apiIndex) => {
      let istyle;

      if (crosshairsTool) {
        istyle = vtkInteractorStyleRotatableMPRCrosshairs.newInstance();
      } else {
        istyle = vtkInteractorStyleMPRWindowLevel.newInstance();
      }

      // // add istyle
      api.setInteractorStyle({
        istyle,
        configuration: { apis, apiIndex },
      });
    });

    this.setState({ crosshairsTool });
  };

  toggleCrosshairs = () => {
    const { displayCrosshairs } = this.state;
    const apis = this.apis;

    const shouldDisplayCrosshairs = !displayCrosshairs;

    apis.forEach(api => {
      const { svgWidgetManager, svgWidgets } = api;
      svgWidgets.rotatableCrosshairsWidget.setDisplay(shouldDisplayCrosshairs);

      svgWidgetManager.render();
    });

    this.setState({ displayCrosshairs: shouldDisplayCrosshairs });
  };

  resetCrosshairs = () => {
    const apis = this.apis;

    apis.forEach(api => {
      api.resetOrientation();
    });

    // Reset the crosshairs
    apis[0].svgWidgets.rotatableCrosshairsWidget.resetCrosshairs(apis, 0);
  };

  render() {
    if (!this.state.volumes || !this.state.volumes.length) {
      return <div className="loading"><h4>Loading...</h4></div>;
    }

    return (
      <div className="row">
        <div className="container-fluid toolbar-series">

          <div className="btn-group-toolbar">
            <span className="toolbar-group">
              <button onClick={this.toggleCrosshairs} disabled={!this.state.displayCrosshairs} className="btn  btn-default">
                <span><FontAwesomeIcon icon={faEyeSlash} /></span>
                <div className="toolbar-icon-text">Hide Crosshairs</div>
              </button>
            </span>

            <span className="toolbar-group">
              <button onClick={this.toggleCrosshairs} disabled={this.state.displayCrosshairs} className="btn btn-default">
                <span><FontAwesomeIcon icon={faEye} /></span>
                <div className="toolbar-icon-text">Show Crosshairs</div>
              </button>
            </span>


            <span className="toolbar-group">
              <button onClick={this.toggleTool} disabled={!this.state.crosshairsTool} className="btn btn-default">
                <span><FontAwesomeIcon icon={faSearchPlus} /></span>
                <div className="toolbar-icon-text">WL/Zoom/Pan/Scroll</div>
              </button>
            </span>

            <span className="toolbar-group">
              <button onClick={this.toggleTool} disabled={this.state.crosshairsTool} className="btn  btn-default">
                <span><FontAwesomeIcon icon={faCrosshairs} /></span>
                <div className="toolbar-icon-text">Crosshair</div>
              </button>
            </span>

            <span className="toolbar-group">
              <button onClick={this.resetCrosshairs} className="btn  btn-default">
                <span><FontAwesomeIcon icon={faUndoAlt} /></span>
                <div className="toolbar-icon-text">Reset Crosshair</div>
              </button>
            </span>
            <div className="slab">
              <label htmlFor="set-slab-thickness" >SlabThickness: {this.state.slabThickness} mm </label>
              <input
                id="set-slab-thickness"
                type="range"
                name="points"
                min="1"
                max="2000"
                onChange={this.handleSlabThicknessChange.bind(this)}
              />
            </div>
          </div>
        </div>
        <div className="row cntr" >
          <div className="col-sm-4 viewer" >
            <View2D
              volumes={this.state.volumes}
              onCreated={this.storeApi(0)}
              orientation={{ sliceNormal: [0, 1, 0], viewUp: [0, 0, 1] }}
              showRotation={true}
            />
          </div>
          <div className="col-sm-4 viewer" >
            <View2D
              volumes={this.state.volumes}
              onCreated={this.storeApi(1)}
              orientation={{ sliceNormal: [1, 0, 0], viewUp: [0, 0, 1] }}
              showRotation={true}
            />
          </div>
          <div className="col-sm-4 viewer" >
            <View2D
              volumes={this.state.volumes}
              onCreated={this.storeApi(2)}
              orientation={{ sliceNormal: [0, 0, 1], viewUp: [0, -1, 0] }}
              showRotation={true}
            />
          </div>
        </div>
      </div>
    );
  }
}

export default VTKRotatableCrosshairsExample;
