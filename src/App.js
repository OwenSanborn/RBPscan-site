import React from 'react'; // Import React for JSX to work
import 'bulma/css/bulma.min.css';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import Citing from "./pages/Citing"; 
import Protocols from "./pages/Protocols"; 
import News from "./pages/News"; 
import Download from "./pages/Download"; 
import Data from "./pages/Data"; 
import Analysis from "./pages/Analysis"; 

function App() {
  return (
    <React.StrictMode>
      <Router>
        <Navbar />
        <div className="container">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/Data" element={<Data />} />
            <Route path="/Analysis" element={<Analysis />} />
            <Route path="/Citing" element={<Citing />} />
            <Route path="/Protocols" element={<Protocols />} />
            <Route path="/News" element={<News />} />
            <Route path="/Download" element={<Download />} />
          </Routes>
        </div>
        <Footer />
      </Router>
    </React.StrictMode>
  );
}


export default App;
