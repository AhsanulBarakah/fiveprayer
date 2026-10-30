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
  vertical_daily_prayer?: Translation[];
  timetable_prayer?: Translation[];
  day_names?: Translation[];
  extra_info?: Translation[];
  activeLanguage?: Translation[] | { language_code: string }[];
}

export const sendTranslations = async (translations: TranslationData) => {
  const endpoint = UseEndPoints();
  try {
    // Send the translations to the backend
    const response = await apiFetch<{ success: boolean; message: string }>({
      path: endpoint + '/translations/',
      method: 'POST',
      data: translations,
    });

    if (response.success) {
      toast.success(response.message);
    } else {
      toast.error(__('Failed to save translations.', 'fiveprayer'));
    }
  } catch (error) {
    console.error('API Error:', error);
    toast.error(__('An error occurred while sending translations.', 'fiveprayer'));
  }
};