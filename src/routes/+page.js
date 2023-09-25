
import { authUser } from '$lib/stores/auth';
import { redirect } from '@sveltejs/kit';

export const load = async () => {
    const unsubscribe = authUser.subscribe((user) => {
        console.log('user', user)
        if (!user) {
            throw redirect(302, '/login');
        }
    });

    unsubscribe();

    return {};
};