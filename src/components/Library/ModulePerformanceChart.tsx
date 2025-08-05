import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { PanFile } from '../../types/project';

interface ModulePerformanceChartProps {
  panData: PanFile;
  chartType: 'current' | 'power';
  legendType: 'irradiance' | 'temperature';
  temperature: number;
}

const ModulePerformanceChart: React.FC<ModulePerformanceChartProps> = ({ panData, chartType, legendType, temperature }) => {
  const T_REF = 25; // STC temperature in °C

  const calculatePerformance = (irradiance: number, temp: number) => {
    const {
      Isc, Voc, Imp, Vmp,
      mu_Isc, // in mA/°C from parser
      muVocSpec, // in mV/°C from parser
    } = panData as Record<string, number>;

    if ([Isc, Voc, Imp, Vmp, mu_Isc, muVocSpec].some(v => typeof v !== 'number' || isNaN(v))) {
      console.error("Chart calculation failed: Missing or invalid module parameters.", { Isc, Voc, Imp, Vmp, mu_Isc, muVocSpec });
      return [];
    }

    const Isc_ref = Isc;
    const Voc_ref = Voc;
    const Imp_ref = Imp;
    const Vmp_ref = Vmp;
    
    const G = irradiance;
    const G_ref = 1000;
    const dT = temp - T_REF;

    // Convert coefficients to standard units (A/°C and V/°C)
    const mu_Isc_A = mu_Isc / 1000;
    const mu_Voc_V = muVocSpec / 1000;

    const Isc_op = (Isc_ref + mu_Isc_A * dT) * (G / G_ref);
    const Voc_op = (Voc_ref + mu_Voc_V * dT) * Math.max(0.8, Math.log(G / G_ref * 9 + 1) / Math.log(10));
    const Imp_op = (Imp_ref + mu_Isc_A * dT) * (G / G_ref);
    const Vmp_op = (Vmp_ref + mu_Voc_V * dT) * Math.max(0.8, Math.log(G / G_ref * 9 + 1) / Math.log(10));

    const data = [];
    for (let v = 0; v <= Voc_op * 1.05; v += Voc_op / 20) {
      let i;
      if (v < Vmp_op) {
        i = Isc_op - (Isc_op - Imp_op) * (v / Vmp_op);
      } else {
        i = Imp_op * Math.pow(Math.max(0, (Voc_op - v) / (Voc_op - Vmp_op)), 2.5);
      }
      const current = Math.max(0, i);
      data.push({ voltage: v, current, power: current * v });
    }
    return data.sort((a, b) => a.voltage - b.voltage);
  };

  const irradiances = [1000, 800, 600, 400, 200];
  const temperatures = [-10, 0, 15, 25, 50, 75];
  const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#d0ed57', '#a4de6c'];

  const chartDataSets = legendType === 'irradiance'
    ? irradiances.map(g => calculatePerformance(g, temperature))
    : temperatures.map(t => calculatePerformance(1000, t));

  const legendValues = legendType === 'irradiance' ? irradiances : temperatures;
  const legendUnit = legendType === 'irradiance' ? 'W/m²' : '°C';

  if (chartDataSets.every(ds => ds.length === 0)) {
    return (
      <div className="flex items-center justify-center h-[400px] text-gray-500">
        Could not generate performance curve. Check module parameters in .PAN file.
      </div>
    );
  }

  const combinedData: any[] = [];
  const baseDataSet = chartDataSets.find(ds => ds.length > 0) || [];
  
  baseDataSet.forEach((point, i) => {
    const dataPoint: { voltage: number, [key: string]: number } = { voltage: point.voltage };
    chartDataSets.forEach((ds, index) => {
      if (ds[i]) {
        dataPoint[`value_${legendValues[index]}`] = ds[i][chartType];
      }
    });
    combinedData.push(dataPoint);
  });

  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart data={combinedData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="voltage" type="number" domain={[0, 'dataMax']} unit=" V" label={{ value: 'Voltage', position: 'insideBottomRight', offset: -5 }} />
        <YAxis unit={chartType === 'power' ? ' W' : ' A'} label={{ value: chartType === 'power' ? 'Power' : 'Current', angle: -90, position: 'insideLeft' }} />
        <Tooltip formatter={(value: number) => value.toFixed(2)} />
        <Legend />
        {legendValues.map((val, index) => (
          <Line
            key={val}
            type="monotone"
            dataKey={`value_${val}`}
            name={`${val} ${legendUnit}`}
            stroke={colors[index % colors.length]}
            dot={false}
            strokeWidth={2}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
};

export default ModulePerformanceChart;