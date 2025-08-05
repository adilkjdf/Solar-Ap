import React, { useState } from 'react';
import { X, HelpCircle, BarChart2 } from 'lucide-react';
import { PanFile } from '../../types/project';
import ModulePerformanceChart from './ModulePerformanceChart';

interface ModulePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  panFile: PanFile;
  fileName: string;
}

const DetailItem: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div className="flex justify-between items-center py-2 px-3 border-b last:border-b-0 bg-white hover:bg-gray-50">
    <span className="text-sm text-gray-600">{label}</span>
    <span className="text-sm font-medium text-gray-900 text-right">{value || 'N/A'}</span>
  </div>
);

const ModulePreviewModal: React.FC<ModulePreviewModalProps> = ({ isOpen, onClose, panFile, fileName }) => {
  const [chartType, setChartType] = useState<'current' | 'power'>('current');
  const [legendType, setLegendType] = useState<'irradiance' | 'temperature'>('irradiance');
  const [temperature, setTemperature] = useState(25);

  if (!isOpen) return null;

  const performanceData = [
    { irradiance: 1000, isc: 9.01, voc: 37.8, imp: 8.42, vmp: 30.9, power: 260.1, dPmp: -0.45, dVmp: -0.41, dVoc: -0.33 },
    { irradiance: 800, isc: 7.21, voc: 37.4, imp: 6.72, vmp: 30.9, power: 207.7, dPmp: -0.45, dVmp: -0.42, dVoc: -0.34 },
    { irradiance: 600, isc: 5.41, voc: 36.9, imp: 5.03, vmp: 30.8, power: 154.8, dPmp: -0.46, dVmp: -0.43, dVoc: -0.35 },
    { irradiance: 400, isc: 3.61, voc: 36.3, imp: 3.33, vmp: 30.5, power: 101.7, dPmp: -0.46, dVmp: -0.44, dVoc: -0.36 },
    { irradiance: 200, isc: 1.80, voc: 35.1, imp: 1.64, vmp: 29.8, power: 49.0, dPmp: -0.48, dVmp: -0.46, dVoc: -0.38 },
    { irradiance: 100, isc: 0.90, voc: 33.9, imp: 0.81, vmp: 28.8, power: 23.2, dPmp: -0.50, dVmp: -0.48, dVoc: -0.41 },
  ];

  const rawParameters = [
    { label: 'Module Characterization Type', value: 'PAN' },
    { label: 'Methodology', value: 'PAN File Coefficients' },
    { label: 'Reference Saturation Current, Ioref', value: panFile.I_o_ref ? `${panFile.I_o_ref} A` : 'N/A' },
    { label: 'Reference Photocurrent, Iphref', value: panFile.I_L_ref ? `${panFile.I_L_ref} A` : 'N/A' },
    { label: 'Module Quality Factor, γref', value: panFile.gamma_ref || 'N/A' },
    { label: 'Module Quality Factor Temp Dependence, μγ', value: panFile.mu_gamma ? `${panFile.mu_gamma} /°C` : 'N/A' },
    { label: 'Current Temperature Coefficient, μIsc', value: panFile.mu_Isc ? `${panFile.mu_Isc} mA/°C` : 'N/A' },
    { label: 'Series Resistance, Rs', value: panFile.R_s != null ? `${panFile.R_s} Ω` : 'N/A' },
    { label: 'Default Shunt Resistance, Rshunt(0)', value: panFile.R_sh_0 != null ? `${panFile.R_sh_0} Ω` : 'N/A' },
    { label: 'Reference Shunt Resistance, Rshunt(Gref)', value: panFile.R_sh_ref != null ? `${panFile.R_sh_ref} Ω` : 'N/A' },
    { label: 'Exponential Shunt Resistance Factor, β', value: panFile.R_sh_exp != null ? panFile.R_sh_exp : 'N/A' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-7xl max-h-[95vh] flex flex-col">
        <div className="p-4 border-b flex justify-between items-center flex-shrink-0">
          <h2 className="text-lg font-semibold text-gray-800">Module Preview: {fileName}</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100">
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-grow">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <div className="bg-gray-50 rounded-lg shadow-sm border">
                <div className="p-4 border-b bg-gray-100">
                  <h2 className="font-semibold text-gray-800">Module</h2>
                </div>
                <div className="divide-y">
                  <DetailItem label="Name" value={panFile.Model as string} />
                  <DetailItem label="Manufacturer" value={panFile.Manufacturer as string} />
                  <DetailItem label="Power" value={`${panFile.PNom} W`} />
                  <DetailItem label="Vmp" value={`${panFile.Vmp} V`} />
                  <DetailItem label="Voc" value={`${panFile.Voc} V`} />
                  <DetailItem label="Isc" value={`${panFile.Isc} A`} />
                  <DetailItem label="Imp" value={`${panFile.Imp} A`} />
                  <DetailItem label="Technology" value={`${panFile.Technol} (${panFile.NCelS} cells)`} />
                  <DetailItem label="Dimensions" value={`${panFile.Width}m x ${panFile.Height}m`} />
                  <DetailItem label="Temp Coefficient Pmax" value={`${panFile.muPmpReq}%/°C`} />
                  <DetailItem 
                    label="Temp Coefficient Voc" 
                    value={
                      (panFile.muVocSpec && panFile.Voc) 
                        ? `${(((panFile.muVocSpec as number / 1000) / (panFile.Voc as number)) * 100).toFixed(4)}%/°C`
                        : 'N/A'
                    }
                  />
                  <DetailItem 
                    label="Temp Coefficient Isc" 
                    value={
                      (panFile.mu_Isc && panFile.Isc) 
                        ? `${(((panFile.mu_Isc as number / 1000) / (panFile.Isc as number)) * 100).toFixed(4)}%/°C`
                        : 'N/A'
                    } 
                  />
                  <DetailItem label="Source" value={panFile.DataSource as string} />
                  <DetailItem label="Last Update" value={new Date().toLocaleString()} />
                </div>
              </div>
            </div>

            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-lg border">
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <BarChart2 className="w-5 h-5 mr-2 text-cyan-500" />
                    Modeled Performance
                  </h3>
                  <ModulePerformanceChart 
                    panData={panFile}
                    chartType={chartType}
                    legendType={legendType}
                    temperature={temperature}
                  />
                </div>
                <div className="p-4 border-t grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <h4 className="font-medium text-sm mb-2">Chart Type</h4>
                    <div className="flex flex-col space-y-1">
                      <label className="flex items-center text-sm"><input type="radio" name="chart-type" className="mr-2" value="current" checked={chartType === 'current'} onChange={(e) => setChartType(e.target.value as any)} /> Current</label>
                      <label className="flex items-center text-sm"><input type="radio" name="chart-type" className="mr-2" value="power" checked={chartType === 'power'} onChange={(e) => setChartType(e.target.value as any)} /> Power</label>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm mb-2">Legend</h4>
                    <div className="flex flex-col space-y-1">
                      <label className="flex items-center text-sm"><input type="radio" name="legend-type" className="mr-2" value="temperature" checked={legendType === 'temperature'} onChange={(e) => setLegendType(e.target.value as any)} /> Temperature</label>
                      <label className="flex items-center text-sm"><input type="radio" name="legend-type" className="mr-2" value="irradiance" checked={legendType === 'irradiance'} onChange={(e) => setLegendType(e.target.value as any)} /> Irradiance</label>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm mb-2">Cell Temperature</h4>
                    <input type="range" min="-10" max="75" value={temperature} onChange={(e) => setTemperature(Number(e.target.value))} className="w-full" />
                    <div className="text-center text-sm">{temperature} °C</div>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-xs text-gray-700 uppercase">
                      <tr>
                        <th className="px-4 py-2">Irradiance (W/m²)</th>
                        <th className="px-4 py-2">Isc (A)</th>
                        <th className="px-4 py-2">Voc (V)</th>
                        <th className="px-4 py-2">Imp (A)</th>
                        <th className="px-4 py-2">Vmp (V)</th>
                        <th className="px-4 py-2">Power (W)</th>
                        <th className="px-4 py-2">dPmp/dT (%/°C)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {performanceData.map(row => (
                        <tr key={row.irradiance} className="border-t">
                          <td className="px-4 py-2 font-medium">{row.irradiance}</td>
                          <td className="px-4 py-2">{row.isc.toFixed(2)}</td>
                          <td className="px-4 py-2">{row.voc.toFixed(1)}</td>
                          <td className="px-4 py-2">{row.imp.toFixed(2)}</td>
                          <td className="px-4 py-2">{row.vmp.toFixed(1)}</td>
                          <td className="px-4 py-2">{row.power.toFixed(1)}</td>
                          <td className="px-4 py-2">{row.dPmp.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-white rounded-lg border">
                <div className="p-4 border-b flex justify-between items-center">
                  <h3 className="text-md font-semibold">Raw Parameters</h3>
                  <button className="flex items-center space-x-1 text-sm text-gray-600 hover:text-gray-900">
                    <HelpCircle size={16} />
                    <span>Help</span>
                  </button>
                </div>
                <div>
                  {rawParameters.map(param => (
                    <DetailItem key={param.label} label={param.label} value={param.value} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModulePreviewModal;