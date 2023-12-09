import { writable } from 'svelte/store';
 
const stats = writable({today: 0, total: 0});
 
export { stats };