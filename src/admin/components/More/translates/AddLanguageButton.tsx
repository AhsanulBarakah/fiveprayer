/**
 * AddLanguageButton
 *
 * Collapsible form for adding a new language to translations.
 *
 * @module More/translates/AddLanguageButton
 */
import React from 'react';
import { useTranslationStore } from '../../../state/useTranslationStore';
import { __ } from '@wordpress/i18n';
import { FaPlus, FaTimes } from 'react-icons/fa';

interface Translation {
  original_text: string;
  translated_text: string;
  language_code: string;
  language_name: string;
}

type Props = {
  data: Translation[];
  handlerAddLangauge: (code: string, lan: string) => void;
  disabled: boolean;
};

const AddLanguageButton = (props: Props) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [code, setCode] = React.useState('');
  const [lan, setLan] = React.useState('');
  const { prayer_names, activeLanguage } = useTranslationStore();

  // Set initial values based on activeLanguage
  React.useEffect(() => {
    const activeLang = prayer_names.find((codes) => codes.language_code === activeLanguage);
    if (activeLang) {
      setCode(activeLang.language_code);
      setLan(activeLang.language_name);
    }
  }, [activeLanguage, prayer_names]);

  if (!isOpen) {
    return (
      <button
        type="button"
        disabled={props.disabled}
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 focus:outline-hidden focus:ring-2 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <FaPlus className="h-3 w-3" />
        {__('Add Language', 'fiveprayer')}
      </button>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 p-2">
      <input
        value={code}
        onInput={(e: React.FormEvent<HTMLInputElement>) =>
          setCode(e.currentTarget.value)
        }
        onChange={(e: React.FormEvent<HTMLInputElement>) =>
          setCode(e.currentTarget.value)
        }
        placeholder={__('Language Code: en', 'fiveprayer')}
        type="text"
        className="h-9 w-36 rounded-md border border-gray-200 bg-white px-3 text-sm transition focus:border-emerald-300 focus:outline-hidden focus:ring-1 focus:ring-emerald-200"
      />
      <input
        value={lan}
        onInput={(e: React.FormEvent<HTMLInputElement>) =>
          setLan(e.currentTarget.value)
        }
        onChange={(e: React.FormEvent<HTMLInputElement>) =>
          setLan(e.currentTarget.value)
        }
        placeholder={__('Language Name: English', 'fiveprayer')}
        type="text"
        className="h-9 w-40 rounded-md border border-gray-200 bg-white px-3 text-sm transition focus:border-emerald-300 focus:outline-hidden focus:ring-1 focus:ring-emerald-200"
      />
      <button
        type="button"
        disabled={props.disabled}
        onClick={() => props.handlerAddLangauge(code, lan)}
        className="h-9 rounded-md bg-emerald-600 px-3 text-sm font-medium text-white transition-colors hover:bg-emerald-700 focus:outline-hidden focus:ring-2 focus:ring-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {__('Add', 'fiveprayer')}
      </button>
      <button
        type="button"
        onClick={() => setIsOpen(false)}
        aria-label={__('Cancel', 'fiveprayer')}
        className="inline-flex h-9 w-9 items-center justify-center rounded-md text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-600 focus:outline-hidden"
      >
        <FaTimes className="h-3.5 w-3.5" />
      </button>
    </div>
  );
};

export default AddLanguageButton;
