import React from 'react';
import { isRouteErrorResponse, useRouteError } from 'react-router';
import { __ } from '@wordpress/i18n';


export default function ErrorPage() {
	const error = useRouteError();
  if (isRouteErrorResponse(error)) {
    return (
      <div>
        <h1>{__('Oops!', 'fiveprayer')}</h1>
        <h2>{error.status}</h2>
        <p>{error.statusText}</p>
        {error.data?.message && <p>{error.data.message}</p>}
      </div>
    );
  } else {
    return <div>{__('Oops', 'fiveprayer')}</div>;
  }
}
