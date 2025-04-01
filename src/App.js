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

function App() {
  return (
    <React.StrictMode>
      <Router>
        <Navbar />
        <div className="container">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/citing" element={<Citing />} />
            <Route path="/protocols" element={<Protocols />} />
            <Route path="/news" element={<News />} />
            <Route path="/download" element={<Download />} />
            <Route path="/data" element={<Data />} />
          </Routes>
        </div>
        <Footer />
      </Router>
    </React.StrictMode>
  );
}


export default App;
