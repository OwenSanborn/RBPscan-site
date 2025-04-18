import React, { useState } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import '../App.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, Title, Tooltip, Legend);

const Analysis = () => {
  const [files, setFiles] = useState([]);
  const [metadata, setMetadata] = useState([]);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [processingStatus, setProcessingStatus] = useState('');

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

  const handleFileUpload = (event) => {
    const uploadedFiles = Array.from(event.target.files);
    const validFiles = uploadedFiles.filter(file => file.name.endsWith('.ab1') && file.size <= 10 * 1024 * 1024);

    if (validFiles.length !== uploadedFiles.length) {
      setError('Some files are invalid. Please upload .ab1 files under 10MB.');
      return;
    }

    setFiles(validFiles);
    setMetadata(validFiles.map((file) => ({
      fileName: file.name,
      group: ''
    })));
    setError(null);
    setResults(null);
  };

  const handleMetadataChange = (index, field, value) => {
    const newMetadata = [...metadata];
    newMetadata[index][field] = value;
    setMetadata(newMetadata);
  };

  const processFiles = async () => {
    if (!metadata.length) return;

    setLoading(true);
    setError(null);
    setProcessingStatus('Uploading and analyzing files...');

    try {
      const formData = new FormData();
      files.forEach(file => formData.append('files', file));
      formData.append('guide_seq', '');

      const replicateCounts = {};
      const groups = metadata.map((meta) => {
        const group = meta.group.trim() || 'default';
        replicateCounts[group] = (replicateCounts[group] || 0) + 1;
        return group;
      });
      const replicates = groups.map((group, idx, arr) => {
        return arr.slice(0, idx + 1).filter(g => g === group).length.toString();
      });

      formData.append('groups', JSON.stringify(groups));
      formData.append('replicates', JSON.stringify(replicates));

      const response = await fetch(`${API_URL}/analyze`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Server error');
      }

      const data = await response.json();

      const grouped = data.reduce((acc, d) => {
        if (d.Error || isNaN(d.Mean_edit)) return acc;
        const group = d.Group || 'Unknown';
        if (!acc[group]) acc[group] = { total: 0, count: 0, samples: [] };
        acc[group].total += d.Mean_edit;
        acc[group].count++;
        acc[group].samples.push({ file: d.File, replicate: d.Replicate, value: d.Mean_edit });
        return acc;
      }, {});

      const labels = Object.keys(grouped);
      const maxEdit = Math.max(...data.map(d => d.Mean_edit || 0));
      const chartMax = Math.min(100, Math.ceil(maxEdit + 10));

      const groupMeans = labels.map(group => grouped[group].total / grouped[group].count);

      const replicatePoints = {
        label: 'Replicates',
        data: labels.flatMap((group, i) =>
          grouped[group].samples.map(s => ({
            x: labels[i],
            y: s.value
          }))
        ),
        type: 'scatter',
        backgroundColor: '#000',
        pointStyle: 'circle',
        radius: 4,
        order: 1
      };

      const barData = {
        label: 'Mean Editing (%)',
        data: groupMeans,
        backgroundColor: '#C00000',
        borderColor: '#C00000',
        borderWidth: 1,
        order: 2
      };

      setResults({
        labels,
        datasets: [barData, replicatePoints],
        rawData: data.map(d => ({
          file: d.File,
          group: d.Group,
          replicate: d.Replicate,
          value: d.Mean_edit
        })),
        chartMax
      });
    } catch (err) {
      console.error(err);
      setError(`Error: ${err.message}`);
    } finally {
      setLoading(false);
      setProcessingStatus('');
    }
  };

  const chartOptions = (maxY) => ({
    responsive: true,
    plugins: {
      legend: { display: false },
      title: { display: true, text: 'Editing by Group', color: '#C00000' },
    },
    scales: {
      x: {
        type: 'category',
        title: { display: true, text: 'Group' }
      },
      y: {
        beginAtZero: true,
        max: maxY,
        title: { display: true, text: 'Editing (%)' }
      }
    }
  });

  const exportToCSV = () => {
    if (!results) return;

    const rows = [["File", "Group", "Replicate", "Editing (%)"]];
    metadata.forEach((m, i) => {
      const result = results.rawData[i];
      const group = m.group.trim() || 'default';
      const replicate = metadata
        .slice(0, i + 1)
        .filter(meta => (meta.group.trim() || 'default') === group).length;

      rows.push([
        m.fileName,
        m.group,
        replicate.toString(),
        result?.value != null ? result.value.toFixed(2) : ''
      ]);
    });

    const csvContent = "data:text/csv;charset=utf-8," + rows.map(r => r.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.href = encodedUri;
    link.download = "sanger_results.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="container p-5">
      <h1 className="title is-3 has-text-black mb-4">Sanger Analysis</h1>

      <div className="field is-grouped mb-5" style={{ alignItems: 'center' }}>
        <div className="control is-flex is-align-items-center">
          <div className="file has-name is-rounded">
            <label className="file-label">
              <input
                className="file-input"
                type="file"
                accept=".ab1"
                multiple
                onChange={handleFileUpload}
              />
              <span className="file-cta" style={{ backgroundColor: '#C00000', color: 'white', borderRadius: '20px' }}>
                <span className="file-label">Select Files</span>
              </span>
              <span style={{ color: '#777', paddingLeft: '10px', alignSelf: 'center', display: 'inline-flex' }}>
                {files.length > 0 ? `${files.length} file(s)` : 'No files selected'}
              </span>
            </label>
          </div>
        </div>

        <div className="control">
          <button
            onClick={processFiles}
            className="button"
            style={{
              backgroundColor: '#C00000',
              color: 'white',
              borderRadius: '20px',
              padding: '10px 20px',
              border: 'none'
            }}
            disabled={loading}
          >
            {loading ? 'Processing...' : 'Analyze'}
          </button>
        </div>
      </div>

      {metadata.length > 0 && (
        <div className="columns" style={{ fontSize: '0.85rem' }}>
          <div className="column is-half">
            <table
              className="table is-bordered has-text-black"
              style={{
                backgroundColor: 'white',
                color: 'black',
                textAlign: 'center',
                verticalAlign: 'middle'
              }}
            >
              <thead style={{ backgroundColor: '#e8e8e8' }}>
                <tr>
                  <th style={{ color: 'black' }}>File</th>
                  <th style={{ color: 'black' }}>Group</th>
                  <th style={{ color: 'black' }}>Replicate</th>
                  <th style={{ color: 'black' }}>% Editing</th>
                </tr>
              </thead>
              <tbody style={{ backgroundColor: '#ffffff' }}>
                {metadata.map((meta, idx) => {
                  const group = meta.group.trim() || 'default';
                  const replicate = metadata
                    .slice(0, idx + 1)
                    .filter(m => (m.group.trim() || 'default') === group).length;

                  const editingVal = results?.rawData?.[idx]?.value?.toFixed(2) || '';

                  return (
                    <tr key={idx}>
                      <td style={{ color: 'black', verticalAlign: 'middle', textAlign: 'center' }}>{meta.fileName}</td>
                      <td>
                        <input
                          className="input is-small"
                          style={{
                            backgroundColor: 'white',
                            color: 'black',
                            textAlign: 'center',
                            padding: '2px 6px'
                          }}
                          value={meta.group}
                          onChange={e => handleMetadataChange(idx, 'group', e.target.value)}
                        />
                      </td>
                      <td style={{ color: 'black', verticalAlign: 'middle', textAlign: 'center' }}>{replicate}</td>
                      <td style={{ color: 'black', verticalAlign: 'middle', textAlign: 'center' }}>{editingVal}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {results && (
              <p style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>
                <a onClick={exportToCSV} style={{ cursor: 'pointer', color: '#C00000', textDecoration: 'underline' }}>
                  Export to CSV
                </a>
              </p>
            )}
          </div>

          {results && (
            <div className="column is-half" style={{ minHeight: '400px' }}>
              <Bar data={results} options={chartOptions(results.chartMax)} />
            </div>
          )}
        </div>
      )}

      {processingStatus && <p>{processingStatus}</p>}
      {error && <div className="has-text-danger">{error}</div>}
    </div>
  );
};

export default Analysis;
