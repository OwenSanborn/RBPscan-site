import React from 'react';

function Citing() {
  return (
    <div className="container mt-6">
      <h1 className="title is-3 cite-header" style={{ color: "black", fontWeight: "bold" }}>
        Please cite as:
      </h1>
      <div className="content cite-content">

        <p className="cite-title" style={{ color: "#C00000", fontWeight: "bold" }}>
          RBPscan: A Quantitative, In Vivo Tool for Profiling RNA-Binding Protein Interactions
        </p>

        <p className="cite-authors" style={{ color: "black" }}>
          Dmitry A. Kretov*, Owen Sanborn, Thora McIssac, Elaine Park, Imrat, Samuel Wu, Daniel Cifuentes*
          </p>

        <p className="cite-equal-contribution" style={{ color: "black" }}>
          *Equal Contribution
        </p>

        <p className="cite-journal" style={{ color: "black" }}>
          BioRxrv 2025
        </p>
        <p className="cite-doi">
          <a
            href="https://doi.org/10.1101/2025.01.03.631239"
            target="_blank"
            rel="noopener noreferrer"
            className="cite-doi-link"
          >
            https://doi.org/10.1101/2025.01.03.631239
          </a>
        </p>
      </div>
    </div>
  );
}

export default Citing;

