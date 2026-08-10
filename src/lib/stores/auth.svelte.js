import { pb } from '$lib/pb.js';

/** Truthy while a user is logged in. Kept in sync with pb.authStore. */
export const auth = $state({ ok: pb.authStore.isValid });

pb.authStore.onChange(() => (auth.ok = pb.authStore.isValid));
