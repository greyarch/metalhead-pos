import { writable } from 'svelte/store';

const stats = writable({ todayTotal: 0, todayRegister: 0, total: 0 });

export { stats };
