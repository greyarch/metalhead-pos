import PocketBase from 'pocketbase';
import { env } from '$env/dynamic/public';
import { writable } from 'svelte/store';

// ponytail: same origin in production (PocketBase serves the built app itself),
// PUBLIC_PB_URL only for `vite dev` against a separate PocketBase.
export const pb = new PocketBase(env.PUBLIC_PB_URL || undefined);

/** Truthy while a user is logged in. Kept in sync with pb.authStore. */
export const authed = writable(pb.authStore.isValid);
pb.authStore.onChange(() => authed.set(pb.authStore.isValid));
