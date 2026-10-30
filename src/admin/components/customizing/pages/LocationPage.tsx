/**
 * LocationPage
 *
 * Form page for configuring the mosque's geographic location settings.
 *
 * @module customizing/pages/LocationPage
 */
import * as React from "react";
import InputText from "../InputText";
import { useLocationStore } from "../../../state/storeLocation";
import { usePostMeta } from "../../../hooks/usePostMeta";
import { __ } from '@wordpress/i18n';

type Location = {
  id?: string;
  country: string | undefined;
  city: string | undefined;
  lat: string | undefined;
  lng: string | undefined;
};

const LocationPage = () => {
  const { customLocationData } = useLocationStore((state) => state);
  let inputCountry = React.useRef<HTMLInputElement>(null);
  let inputCity = React.useRef<HTMLInputElement>(null);
  let inputLat = React.useRef<HTMLInputElement>(null);
  let inputLng = React.useRef<HTMLInputElement>(null);

  const [IsEditing, setIsEditing] = React.useState({ status: false, editId: "" });
  const { appendDataPost } = usePostMeta();
  const [isSaving, setIsSaving] = React.useState(false);

  const [location, setLocation] = React.useState<Location>({ country: "", city: "", lat: "", lng: "" });
  const [locationEdit, setLocationEdit] = React.useState<Location>({ id: "", country: "", city: "", lat: "", lng: "" });

  const resetInput = () => {
    setLocationEdit({ id: "", country: "", city: "", lat: "", lng: "" });
    setLocation({ country: "", city: "", lat: "", lng: "" });
    inputCity.current!.value = "";
    inputCountry.current!.value = "";
    inputLat.current!.value = "";
    inputLng.current!.value = "";
    setIsEditing({ status: false, editId: "" });
  };

  const updateInput = () => {
    inputCity.current!.value = locationEdit.city ?? "";
    inputCountry.current!.value = locationEdit.country ?? "";
    inputLat.current!.value = locationEdit.lat ?? "";
    inputLng.current!.value = locationEdit.lng ?? "";
  };

  const changeHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
    let { name, value } = e.target;
    setLocation((prev) => ({ ...prev, [name]: value }));
    setLocationEdit({
      id: locationEdit?.id,
      country: inputCountry?.current?.value,
      city: inputCity?.current?.value,
      lat: inputLat?.current?.value,
      lng: inputLng?.current?.value,
    });
  };

  const handleAddLocation = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (isSaving) return;
    setIsSaving(true);
    let list: Location[] = [];
    const isEdit = inputCountry.current && inputCity.current && inputLat.current && inputLng.current && IsEditing.status;

    if (isEdit) {
      const updateOneReturnAll = (customLocationData?.value as Location[]).map((item: Location) => {
        if (item.id === locationEdit.id) {
          return { ...item, country: inputCountry?.current?.value, city: inputCity?.current?.value, lat: inputLat?.current?.value, lng: inputLng?.current?.value };
        }
        return item;
      });
      await appendDataPost({ meta: "location_list", value: updateOneReturnAll });
    } else {
      if (customLocationData.value?.length !== undefined && customLocationData?.id !== "" && location.country !== "" && location.city !== "" && location.lat !== "" && location.lng !== "") {
        (customLocationData?.value as Location[]).forEach((item: Location) => list.push(item));
        list.push({ ...location, id: new Date().getTime().toString() });
        await appendDataPost({ meta: "location_list", value: list });
      } else if (location.country !== "" && location.city !== "" && location.lat !== "" && location.lng !== "") {
        list.push({ ...location, id: new Date().getTime().toString() });
        await appendDataPost({ meta: "location_list", value: list });
      }
      if (customLocationData?.value?.[0]?.method === "" && location.country !== "" && location.city !== "" && location.lat !== "" && location.lng !== "") {
        list.push({ ...location, id: new Date().getTime().toString() });
        await appendDataPost({ meta: "location_list", value: list });
      }
    }
    setIsSaving(false);
    resetInput();
  };

  const handleEditOne = (e: React.MouseEvent<HTMLParagraphElement>) => {
    const id = e.currentTarget.id;
    const custom = (customLocationData?.value as Location[])?.find((item) => item.id === id);
    setLocationEdit({ id: custom?.id, country: custom?.country, city: custom?.city, lat: custom?.lat, lng: custom?.lng });
    setIsEditing({ status: true, editId: id });
  };

  const handleDeleteOne = (e: React.MouseEvent<HTMLParagraphElement>) => {
    const id = e.currentTarget.id;
    const list = (customLocationData?.value as Location[])?.filter((item) => item.id !== id);
    appendDataPost({ meta: "location_list", value: list });
  };

  React.useEffect(() => {
    const hasData = locationEdit.city !== "" && locationEdit.country !== "" && locationEdit.lat !== "" && locationEdit.lng !== "" && locationEdit.id !== "";
    if (hasData) updateInput();
  }, [locationEdit]);

  const locations = (customLocationData?.value as Location[]) || [];

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{__('Custom Location', 'fiveprayer')}</h1>
        <p className="text-sm text-gray-500 mt-1">{__('Add custom locations for prayer time calculations', 'fiveprayer')}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Add Form */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
            <div className="px-5 py-4 bg-gray-50 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                  <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-gray-900">{IsEditing.status ? "Edit Location" : "Add Location"}</h2>
                  <p className="text-xs text-gray-500">{IsEditing.status ? "Update the location details below" : "Enter location coordinates"}</p>
                </div>
              </div>
            </div>
            <div className="p-5 space-y-3">
              <InputText onChange={changeHandler} type="text" placeholder={__('Country', 'fiveprayer')} name="country" refs={inputCountry} value={locationEdit?.country} />
              <InputText onChange={changeHandler} type="text" placeholder={__('City', 'fiveprayer')} name="city" refs={inputCity} value={locationEdit?.city} />
              <div className="grid grid-cols-2 gap-3">
                <InputText onChange={changeHandler} type="text" placeholder={__('Latitude', 'fiveprayer')} name="lat" refs={inputLat} value={locationEdit?.lat} />
                <InputText onChange={changeHandler} type="text" placeholder={__('Longitude', 'fiveprayer')} name="lng" refs={inputLng} value={locationEdit?.lng} />
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  onClick={(e) => handleAddLocation(e)}
                  disabled={isSaving}
                  className={`flex-1 text-sm font-medium px-4 py-2.5 rounded-lg transition-colors focus:outline-hidden ${
                    isSaving
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-green-700 text-white hover:bg-green-800'
                  }`}
                >
                  {isSaving ? 'Saving...' : IsEditing.status ? 'Update' : 'Add Location'}
                </button>
                {IsEditing.status && (
                  <button
                    onClick={resetInput}
                    className="text-sm font-medium px-4 py-2.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors focus:outline-hidden"
                  >{__('Cancel', 'fiveprayer')}</button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Location List */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
            <div className="px-5 py-4 bg-gray-50 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                    <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-gray-900">{__('Saved Locations', 'fiveprayer')}</h2>
                    <p className="text-xs text-gray-500">{locations.length} {locations.length === 1 ? 'location' : 'locations'}{__(' saved', 'fiveprayer')}</p>
                  </div>
                </div>
              </div>
            </div>

            {locations.length === 0 ? (
              <div className="px-5 py-12 text-center">
                <svg className="mx-auto h-10 w-10 text-gray-300" fill="none" viewBox="0 0 24 24" strokeWidth="1" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                </svg>
                <p className="mt-3 text-sm text-gray-500">{__('No locations saved yet', 'fiveprayer')}</p>
                <p className="text-xs text-gray-400 mt-1">{__('Add a location using the form', 'fiveprayer')}</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {locations.map((custom) => (
                  <div
                    key={custom?.id}
                    className={`px-5 py-3 flex items-center justify-between transition-colors ${
                      custom?.id === IsEditing.editId ? 'bg-amber-50' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-medium text-gray-500">
                        {custom.country?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{custom.city}</p>
                        <p className="text-xs text-gray-500">{custom.country} &middot; {custom.lat}, {custom.lng}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={handleEditOne as any}
                        id={custom?.id}
                        className="px-3 py-1.5 text-xs font-medium text-amber-700 bg-amber-50 rounded-lg hover:bg-amber-100 transition-colors focus:outline-hidden"
                      >{__('Edit', 'fiveprayer')}</button>
                      <button
                        onClick={handleDeleteOne as any}
                        id={custom?.id}
                        className="px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 rounded-lg hover:bg-red-100 transition-colors focus:outline-hidden"
                      >{__('Delete', 'fiveprayer')}</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LocationPage;
