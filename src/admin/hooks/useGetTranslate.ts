import apiFetch from '@wordpress/api-fetch';
import { toast } from 'sonner';
import { UseEndPoints } from './api/endpoints';
import { __ } from '@wordpress/i18n';

interface Translation {
  original_text: string;
  translated_text: string;
  language_code: string;
  language_name: string;
}

interface TranslationData {
  prayer_names?: Translation[];
  gregorian_months?: Translation[];
  gregorian_numbers?: Translation[];
  hijra_months?: Translation[];
  hijra_numbers?: Translation[];
  activeLanguage?: Translation[];
  timetable_prayer?: Translation[];
  vertical_daily_prayer?: Translation[];
  day_names?: Translation[];
  [key: string]: Translation[] | undefined; // Allow dynamic keys
}

export const getAllTranslations = async (): Promise<TranslationData> => {
  const endpoint = UseEndPoints();

  try {
    const response = await apiFetch<TranslationData>({
      path: `${endpoint}/translations/`,
      method: 'GET',
    });

    if (response && typeof response === 'object') {
      return response;
    } else {
      toast.error(__('Invalid translation data received from the server.', 'fiveprayer'));
      return {};
    }
  } catch (error) {
    console.error('API Error:', error);
    toast.error(__('An error occurred while fetching translations.', 'fiveprayer'));
    return {};
  }
};
