import { RouterProvider } from 'react-router/dom';
import * as React from 'react';
import { createRoot } from 'react-dom/client';
import { CustomRouter } from './admin/router/CustomRouter';
import './index.css';

// Suppress React key warnings in production
import './admin/utils/suppressWarnings';

// The plugin's admin page mounts into `#fiveprayer-admin-app`; the local
// harness still uses `#fiveprayer`. Its CSS is scoped to the `.fiveprayer`
// class the page puts on that container.
const container = document.getElementById('fiveprayer-admin-app')
	|| document.getElementById('fiveprayer') as HTMLElement | null;

const root = createRoot(container as HTMLElement);
root.render(
	<React.StrictMode>
		<RouterProvider 
		 router={CustomRouter} />
	</React.StrictMode>
);
