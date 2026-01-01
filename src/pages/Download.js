function Download() {
  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = '/tools/rbpscan/rbp_data.csv';
    link.download = 'rbp_data.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="container" style={{ marginTop: '40px' }}>
      <h1 className="title is-2">Download</h1>
      <div className="content">
        <p className="mb-5">
          Download the complete RBPscan dataset containing RNA-binding protein interaction data.
        </p>
        <button
          onClick={handleDownload}
          className="button is-large"
          style={{
            backgroundColor: '#C00000',
            color: 'white',
            fontWeight: 'bold'
          }}
        >
          Download RBPscan Dataset (CSV)
        </button>
      </div>
    </div>
  );
}

export default Download;
  