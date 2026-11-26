import { Navigate, Route, Router, useNavigate, type RouteSectionProps } from '@solidjs/router'
import { lazy, onCleanup } from 'solid-js'
import { useToolLocations } from './tools'
import { useApp, ViewerAppContext, type ViewerApp } from './ViewerApp'

// each tool is its own chunk: the browser does not load the engine
const ViewerTool = lazy(() => import('../viewer/ViewerTool'))
const BrowserTool = lazy(() => import('../browser/BrowserTool'))
const DataTool = lazy(() => import('../data/DataTool'))

/**
 * The tools of the app, one route each, below the base of the app. The state of a tool is in the query parameters,
 * the Data tool has its family in the path (`/data/<family>?key=…`).
 */
export function App(props: { app: ViewerApp }) {
  return (
    <ViewerAppContext.Provider value={props.app}>
      <Router base={props.app.base} root={AppRoot}>
        <Route path="/viewer" component={ViewerTool} />
        <Route path="/browser" component={BrowserTool} />
        <Route path="/data/:family?" component={DataTool} />
        {/* old links (`/?level=…`) open the viewer with their parameters */}
        <Route path="*" component={ToViewer} />
      </Router>
    </ViewerAppContext.Provider>
  )
}

/**
 * The root of the router, around every route
 */
function AppRoot(props: RouteSectionProps) {
  useToolLocations()
  onCleanup(useApp().connectRouter(useNavigate()))
  return <>{props.children}</>
}

function ToViewer() {
  return <Navigate href={({ location }) => `/viewer${location.search}`} />
}
