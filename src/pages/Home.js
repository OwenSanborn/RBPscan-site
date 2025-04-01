import React from "react";
import RBPscanImage from "../assets/RBPscan_schematic.png"; // Import your image

function Home() {
  return (
    <div className="container mt-6 has-text-black">
      <div className="columns is-vcentered">
        {/* Left side: Text content */}
        <div className="column is-half">
          <h2 className="title is-3 has-text-black">What is RBPscan?</h2>
          <p className="content has-text-black">
            RNA-binding proteins (RBPs) are essential regulators of gene expression at 
            post-transcriptional level, yet obtaining quantitative insights into RBP-RNA 
            interactions in vivo remains a challenge. Here we developed RBPscan, a method 
            that integrates RNA editing with massively parallel reporter assays (MPRAs) 
            to profile RBP binding in vivo.
          </p>
          <p className="content has-text-black">
            RBPscan fuses the catalytic domain of ADAR to the RBP of interest, using RNA 
            editing of a recorder mRNA as a readout of binding events. We demonstrate 
            its utility in zebrafish embryos, human cells, and yeast, where it quantifies 
            binding strength, resolves dissociation constants, identifies high-specificity 
            motifs for a variety of RBPs, and links binding affinities to their impact 
            on mRNA stability.
          </p>
        </div>

        {/* Right side: Image */}
        <div className="column is-half has-text-centered">
          <img src={RBPscanImage} alt="RBPscan Illustration" className="image" />
        </div>
      </div>
    </div>
  );
}

export default Home;
