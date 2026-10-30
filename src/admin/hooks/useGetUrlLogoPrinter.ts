import apiFetch from '@wordpress/api-fetch';
import { usePrinterExtraStore } from '../state/storePrinterExtra';
import { UseEndPoints } from './api/endpoints';


export const useGetUrlLogoPrinter = () => {
const {updateprinter_logo_url} = usePrinterExtraStore( ( state ) => state );
  const endpoint = UseEndPoints();

    const fetchPngUrl = async () => {
        try {
          const data:string = await apiFetch({ path: `${endpoint}/png-url` });
          updateprinter_logo_url(data);
        } catch (error) {
          console.error('Error fetching PNG URL:', error);
        }
      };
  
      return { fetchPngUrl };
    
}