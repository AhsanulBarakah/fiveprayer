/**
 * CSV Import Dialog Component
 *
 * Modal dialog for importing custom prayer timetable data via CSV file.
 * Parses CSV to JSON and posts to the timetable API endpoint.
 * Displays loading spinner during import.
 *
 * @module ui/Dialog
 */
import React from 'react';
import { usePostTimeTable } from '../../hooks/usePostTimeTable';
import { __ } from '@wordpress/i18n';

type Props = {
    // React 19 types the ref of `useRef<HTMLDialogElement>(null)` as nullable.
    dialogRef: React.RefObject<HTMLDialogElement | null>;
};

const Dialog = (props: Props) => {
    const { appendDataPost } = usePostTimeTable();
    const [CSVJSON, setCSVJSON] = React.useState<object[]>([]);
    const [isLoading, setIsLoading] = React.useState(false);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const CheckFile = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (files && files[0].type.split('/')[1] === 'csv') {
            ConvertCSVToJSON(files[0]);
        } else {
            alert(__('Please choose a CSV file', 'fiveprayer'));
        }
    };

    const ConvertCSVToJSON = (csv: Blob) => {
        const reader = new FileReader();
        reader.readAsText(csv);
        reader.onload = () => {
            const text = reader.result as string;
            let lines: string[] = [];
            const linesArray = text.split('\n');
            linesArray.forEach((e) => {
                const row = e.replace(/[\s]+[,]+|[,]+[\s]+/g, ',').trim();
                lines.push(row);
            });

            lines.splice(lines.length - 1, 1);
            const result = [];
            const headers = lines[0].replace(/['"]+/g, '').split(',');
            for (let i = 1; i < lines.length; i++) {
                const obj: Record<string, any> = {};
                const currentline = lines[i].replace(/['"]+/g, '').split(',');
                for (let j = 0; j < headers.length; j++) {
                    obj[headers[j]] = currentline[j];
                }
                result.push(obj);
            }
            setCSVJSON(result);
        };
    };

    const handleImport = async () => {
        if (Object.keys(CSVJSON).length > 0) {
            setIsLoading(true);
            try {
                await new Promise<void>((resolve) => {
                    appendDataPost(CSVJSON);
                    resolve();
                });

                setTimeout(() => {
                    props.dialogRef.current?.close();
                    if (fileInputRef.current) {
                        fileInputRef.current.value = ''; // Clear file input
                    }
                }, 2000);
            } catch (error) {
                console.error('Import failed:', error);
            } finally {
                setIsLoading(false);
            }
        }
    };

    return (
        <dialog ref={props.dialogRef}>
            <div className='p-5 flex flex-col gap-4'>
                <div className='flex flex-col gap-2'>
                    <div>{__('Please Upload CSV File', 'fiveprayer')}</div>
                    <input ref={fileInputRef} onChange={CheckFile} type="file" accept='text/csv' />
                </div>
                <div className='text-sm text-gray-600'>
                    <p>{__('If you are uploading a custom timetable, please bear in mind:', 'fiveprayer')}</p>
                    <ul className='list-disc pl-5 mt-2'>
                        <li>{__('You cannot use all settings except the month selection options.', 'fiveprayer')}</li>
                        <li>{__('Do not press "Generate Calendar" as it will mess up your custom timetable.', 'fiveprayer')}</li>
                        <li>{__('You can still use Hijri and Ramadan settings. When changing these settings, do not forget to save them.', 'fiveprayer')}</li>
                    </ul>
                </div>
                <div className='flex justify-between'>
                    <button 
                        onClick={handleImport} 
                        className='bg-green-500 px-6 py-3 text-white flex items-center justify-center gap-2 disabled:bg-green-300' 
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <>
                                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>{__('Importing...', 'fiveprayer')}</>
                        ) : (
                            'Import'
                        )}
                    </button>
                    <button 
                        className='bg-red-500 px-6 py-3 text-white' 
                        onClick={() => {
                            props.dialogRef.current?.close();
                            if (fileInputRef.current) {
                                fileInputRef.current.value = ''; // Clear file input
                            }
                        }}
                    >{__('Close', 'fiveprayer')}</button>
                </div>
            </div>
        </dialog>
    );
};

export default Dialog;