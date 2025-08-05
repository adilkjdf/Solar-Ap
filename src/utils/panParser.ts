import { PanFile } from '../types/project';

// A mapping of common PAN file keys (and their lowercase variants) to a standardized key format.
const KEY_ALIASES: { [key: string]: string } = {
  'model': 'Model',
  'manufacturer': 'Manufacturer',
  'technol': 'Technol',
  'ncels': 'NCelS',
  'ncelp': 'NCelP',
  'ndiode': 'NDiode',
  'pnom': 'PNom',
  'pnomtollow': 'PNomTolLow',
  'pnomtolup': 'PNomTolUp',
  'isc': 'Isc',
  'voc': 'Voc',
  'imp': 'Imp',
  'vmp': 'Vmp',
  'muisc': 'mu_Isc', // This is in mA/°C from the file
  'muvocspec': 'muVocSpec', // This is in mV/°C from the file
  'mupmpreq': 'muPmpReq',
  'gamma': 'gamma_ref',
  'mugamma': 'mu_gamma',
  'rserie': 'R_s',
  'rshunt': 'R_sh_ref',
  'rp_0': 'R_sh_0',
  'rp_exp': 'R_sh_exp',
  'width': 'Width',
  'height': 'Height',
  'datasource': 'DataSource',
  'i_l_ref': 'I_L_ref',
  'i_o_ref': 'I_o_ref',
  'r_sh_ref': 'R_sh_ref',
  'r_s': 'R_s',
};

export const parsePanFile = (content: string): PanFile => {
  const data: PanFile = {};
  const lines = content.split('\n');

  let currentRemarks: string[] = [];
  let inRemarks = false;

  lines.forEach(line => {
    line = line.trim();
    if (!line || line.startsWith('//') || line.startsWith('PVObject_') || line.startsWith('End of PVObject')) {
      return;
    }

    if (line.startsWith('Remarks, Count=')) {
      inRemarks = true;
      return;
    }

    if (line.startsWith('End of Remarks')) {
      inRemarks = false;
      data['Remarks'] = currentRemarks.join('\n');
      return;
    }

    if (inRemarks) {
      const remarkMatch = line.match(/^Str_\d+=(.*)/);
      if (remarkMatch && remarkMatch[1]) {
        currentRemarks.push(remarkMatch[1]);
      }
      return;
    }

    const parts = line.split('=');
    if (parts.length >= 2) {
      const rawKey = parts[0].trim().toLowerCase();
      const key = KEY_ALIASES[rawKey] || parts[0].trim(); // Use standardized key or original
      const value = parts.slice(1).join('=').trim();
      
      const numValue = parseFloat(value);
      data[key] = isNaN(numValue) || value.trim() !== numValue.toString() ? value : numValue;
    }
  });

  return data;
};