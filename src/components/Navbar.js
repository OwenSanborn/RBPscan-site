import { Link } from "react-router-dom";

function Navbar() {
  return (
    <nav className="navbar is-white" style={{ borderBottom: "2px solid #ccc" }}>
      <div className="navbar-brand">
        {/* Clickable title linking back to home */}
        <Link to="/" className="navbar-item">
        <h1 className="is-size-1" style={{ color: "#C00000", fontWeight: "bold"}}>RBPscan</h1>
        </Link>
      </div>

      {/* Right side: Navigation links */}
      <div className="navbar-end">
        <Link to="/data" className="navbar-item ">Explore Data</Link>
        <Link to="/download" className="navbar-item ">Download</Link>
        <Link to="/protocols" className="navbar-item ">Protocols</Link>
        <Link to="/news" className="navbar-item ">News</Link>
        <Link to="/citing" className="navbar-item ">Citing</Link>
      </div>
    </nav>
  );
}

export default Navbar;
