import PocketBase from 'pocketbase';
import { env } from '$env/dynamic/public';

// ponytail: same origin in production (PocketBase serves the built app itself),
// PUBLIC_PB_URL only for `vite dev` against a separate PocketBase.
export const pb = new PocketBase(env.PUBLIC_PB_URL || undefined);
