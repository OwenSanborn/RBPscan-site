import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import { Scatter } from 'react-chartjs-2';
import { Chart as ChartJS, LinearScale, PointElement, LineElement, Tooltip, Legend } from 'chart.js';

// Register ChartJS components
ChartJS.register(LinearScale, PointElement, LineElement, Tooltip, Legend);

const DataVisualization = () => {
  const [data, setData] = useState([]);
  const [proteinOptions, setProteinOptions] = useState([]);
  const [selectedProtein, setSelectedProtein] = useState("Pum1");
  const [filteredData, setFilteredData] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [species, setSpecies] = useState("");

  useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      try {
        const response = await fetch('/rbp_data.csv');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const csvText = await response.text();
        Papa.parse(csvText, {
          header: true,
          dynamicTyping: true,
          complete: (result) => {
            if (mounted) {
              if (result.errors.length > 0) {
                setError('Parsing errors occurred. Check console for details.');
                setLoading(false);
                return;
              }

              const validData = result.data.filter(row => 
                row && 
                row.Protein && 
                row.Mean_protein != null && 
                row.Mean_adar != null
              );

              if (validData.length === 0) {
                setError('No valid data found in CSV');
              }

              setData(validData);
              const proteins = [...new Set(validData.map(row => row.Protein))];
              setProteinOptions(proteins);

              const initialFiltered = validData.filter(row => row.Protein === "Pum1");
              setFilteredData(initialFiltered);
              if (initialFiltered.length > 0) {
                const speciesCode = initialFiltered[0].Species;
                setSpecies(speciesCode === 'dre' ? 'Zebrafish' : speciesCode === 'hsa' ? 'Human' : speciesCode);
              }
              setLoading(false);
            }
          },
          error: (err) => {
            if (mounted) {
              setError('Error parsing CSV: ' + err.message);
              setLoading(false);
            }
          }
        });
      } catch (err) {
        if (mounted) {
          setError('Error fetching data: ' + err.message);
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      mounted = false;
    };
  }, []);

  const handleProteinChange = (event) => {
    const protein = event.target.value;
    setSelectedProtein(protein);
    if (!protein) {
      setFilteredData([]);
      setSpecies("");
    } else {
      const filtered = data.filter(row => row.Protein === protein);
      setFilteredData(filtered);
      if (filtered.length > 0) {
        const speciesCode = filtered[0].Species;
        setSpecies(speciesCode === 'dre' ? 'Zebrafish' : speciesCode === 'hsa' ? 'Human' : speciesCode);
      } else {
        setSpecies("");
      }
    }
  };

  const isSignificant = (row) => {
    const sig = row.Significant;
    return sig === true || (typeof sig === 'string' && sig.toLowerCase() === 'true');
  };

  const significantPoints = filteredData.filter(row => isSignificant(row));
  const nonSignificantPoints = filteredData.filter(row => !isSignificant(row));

  const chartData = {
    datasets: [
      {
        label: 'Non-Significant',
        data: nonSignificantPoints.map(row => ({
          x: row.Mean_protein,
          y: row.Mean_adar
        })),
        backgroundColor: 'grey',
        pointRadius: 5,
        order: 1,
      },
      {
        label: 'Significant',
        data: significantPoints.map(row => ({
          x: row.Mean_protein,
          y: row.Mean_adar
        })),
        backgroundColor: '#C00000',
        pointRadius: 5,
        order: 0,
      }
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: { 
        beginAtZero: true,
        title: {
          display: true,
          text: `Mean Percent Editing ${selectedProtein || 'Pum1'}`
        }
      },
      y: { 
        beginAtZero: true,
        title: {
          display: true,
          text: 'Mean Percent Editing AdarCD'
        }
      }
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context) => {
            const datasetIndex = context.datasetIndex;
            const dataArray = datasetIndex === 0 ? nonSignificantPoints : significantPoints;
            const point = dataArray[context.dataIndex];
            return `Motif: ${point.Motif}, Protein: ${point.Protein}`;
          }
        }
      }
    }
  };

  return (
    <div className="container">
      {error && <div style={{ color: 'red' }}>{error}</div>}

      <div className="select" style={{ marginTop: '20pt' }}>
        <select 
          value={selectedProtein} 
          onChange={handleProteinChange}
          style={{ 
            backgroundColor: '#C00000',
            color: 'white',
            borderRadius: '20px', // Rounded corners
            padding: '5px 10px',  // Optional: improves appearance
            border: 'none'        // Optional: cleaner look
          }}
        >
          <option value="">--Select a Protein--</option>
          {proteinOptions.map((protein) => (
            <option key={protein} value={protein}>
              {protein}
            </option>
          ))}
        </select>
      </div>

      {species && (
        <div style={{ position: 'absolute', top: '75px', left: '15px' }}>
          Species: {species}
        </div>
      )}

      {loading ? (
        <p>Loading data...</p>
      ) : filteredData.length > 0 ? (
        <div style={{ height: '500px', width: '100%', marginTop: '40px' }}>
          <Scatter data={chartData} options={chartOptions} />
        </div>
      ) : (
        <p style={{ marginTop: '40px' }}>
          {selectedProtein ? 'No data for selected protein' : 'Please select a protein'}
        </p>
      )}
    </div>
  );
};

export default DataVisualization;