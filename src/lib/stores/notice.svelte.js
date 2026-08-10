/**
 * One-off message for the strip at the top of the screen, replacing the alert()
 * boxes: those stop the till dead until someone taps OK, which during service
 * means the next order waits on a dialog nobody read.
 *
 * @type {{flash: {text: string, tone: 'bad'|'ok'}|null}}
 */
export const notice = $state({ flash: null });

let timer;

/**
 * Good news clears itself; bad news does not. A failed sale or an unprinted
 * receipt has to be dealt with, so it stays on screen until it is dismissed or
 * something else goes wrong.
 *
 * @param {string} text
 * @param {'bad'|'ok'} [tone]
 */
export function notify(text, tone = 'bad') {
	clearTimeout(timer);
	notice.flash = { text, tone };
	if (tone === 'ok') timer = setTimeout(() => (notice.flash = null), 6000);
}

export function clearNotice() {
	clearTimeout(timer);
	notice.flash = null;
}
