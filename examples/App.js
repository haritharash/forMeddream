/* eslint-disable react/prop-types */
import React, { Component } from 'react';
import { BrowserRouter as Router, Route, Link, Switch } from 'react-router-dom';
import VTKBasicExample from './VTKBasicExample.js';
import VTKFusionExample from './VTKFusionExample.js';
import VTKMPRPaintingExample from './VTKMPRPaintingExample.js';
import VTKCornerstonePaintingSyncExample from './VTKCornerstonePaintingSyncExample.js';
import VTKLoadImageDataExample from './VTKLoadImageDataExample.js';
import VTKCrosshairsExample from './VTKCrosshairsExample.js';
import VTKRotatableCrosshairsExample from './VTKRotatableCrosshairsExample.js';
import VTKMPRRotateExample from './VTKMPRRotateExample.js';
import VTKVolumeRenderingExample from './VTKVolumeRenderingExample.js';
import Meddream from './meddream.js'
// function LinkOut({ href, text }) {
//   return (
//     <a href={href} target="_blank" rel="noopener noreferrer">
//       {text}
//     </a>
//   );
// }

// function ExampleEntry({ title, url, text, screenshotUrl }) {
//   return (
//     <div>
//       <h5>
//         <Link to={url}>{title}</Link>
//       </h5>
//       <p>{text}</p>
//       <hr />
//     </div>
//   );
// }

function Index(props) {

  let path = props.location.pathname
  let studyUid = new URLSearchParams(props.location.search).get("studyuid")
  let seriesUid = new URLSearchParams(props.location.search).get("seriesuid")

  if (path == "/mpr") {

    return <VTKRotatableCrosshairsExample parentStudyUid={studyUid} parentSeriesUid={seriesUid} />
  }
  if (path == "/volume") {

    return <VTKVolumeRenderingExample parentStudyUid={studyUid} parentSeriesUid={seriesUid} />
  } else {
    // return <Meddream />
    return <h1>No Preview Available</h1>
  }

}


function AppRouter() {
  console.warn('approuter');

  // TODO: There is definitely a better way to do this
  const basic = () => Example({ children: <VTKBasicExample /> });
  const fusion = () => Example({ children: <VTKFusionExample /> });
  const painting = () => Example({ children: <VTKMPRPaintingExample /> });
  const loadImage = () => Example({ children: <VTKLoadImageDataExample /> });
  const synced = () =>
    Example({ children: <VTKCornerstonePaintingSyncExample /> });
  const crosshairs = () => Example({ children: <VTKCrosshairsExample /> });
  const rotatableCrosshairs = () =>
    Example({ children: <VTKRotatableCrosshairsExample /> });
  const rotateMPR = () => Example({ children: <VTKMPRRotateExample /> });
  const volumeRendering = () =>
    Example({ children: <VTKVolumeRenderingExample /> });

  return (
    <Router>
      <Switch>
        <Route exact path="/" component={Index} />
        {/* <Route exact path="/basic/" render={basic} />
        <Route exact path="/fusion/" render={fusion} />
        <Route exact path="/painting" render={painting} />
        <Route exact path="/cornerstone-sync-painting" render={synced} />
        <Route exact path="/crosshairs" render={crosshairs} />
        <Route
          exact
          path="/rotatable-crosshairs"
          render={rotatableCrosshairs}
        />
        <Route exact path="/rotate" render={rotateMPR} />
        <Route exact path="/volume-rendering" render={volumeRendering} />
        <Route exact path="/cornerstone-load-image-data" render={loadImage} /> */}
        <Route exact component={Index} />
      </Switch>
    </Router>
  );
}

export default class App extends Component {
  render() {
    return <AppRouter />;
  }
}
