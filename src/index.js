import React from "react";
import ReactDOM from "react-dom";
import Navbar from "./components/NavBar.jsx";
import Reader from "./views/Reader.jsx";
import Viewer from "./views/Viewer.jsx";

import "./assets/scss/index.scss";

const App = () => {
	const [viewerData, setViewerData] = React.useState({});
	
	return(
	<>
		<Navbar />
		{viewerData.file 
		?
			<Viewer viewerData={viewerData} />
		:
			<Reader setViewerData={setViewerData} />
		}
	</>
	);
}

ReactDOM.render(<App />, document.getElementById("root"));