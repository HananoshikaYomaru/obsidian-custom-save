import { Notice } from "obsidian";

export const createNotice = (
	message: string,
	duration?: number | undefined
): Notice => new Notice(`Custom Save: ${message}`, duration);

export const createNoticeWithColor = (
	message: string,
	color: string,
	duration?: number | undefined
): Notice => {
	const fragment = document.createDocumentFragment();
	fragment.createSpan({
		text: `Custom Save: ${message}`,
		attr: { style: `color: ${color}` },
	});
	return new Notice(fragment, duration);
};
