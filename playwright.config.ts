import {defineConfig} from '@playwright/test';
export default defineConfig({testDir:'tests/browser',timeout:180000,workers:1,retries:0,use:{browserName:'chromium',baseURL:'http://127.0.0.1:4173',trace:'retain-on-failure'},webServer:{command:'npx vite --host 127.0.0.1 --port 4173 --strictPort',url:'http://127.0.0.1:4173',timeout:90000,reuseExistingServer:false}});
