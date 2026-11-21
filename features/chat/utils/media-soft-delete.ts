/**
 * Generates a soft-deleted file name by appending `_copy_<number>`.
 * Handles collisions if `_copy_1` already exists in existingNames.
 *
 * Example:
 * "document.pdf" -> "document_copy_1.pdf"
 * "document_copy_1.pdf" -> "document_copy_2.pdf"
 */
export function generateSoftDeleteFileName(fileName: string, existingNames: string[] = []): string {
	if (!fileName) return `file_copy_1`;

	const lastDotIndex = fileName.lastIndexOf('.');
	const extension = lastDotIndex !== -1 ? fileName.slice(lastDotIndex) : '';
	const baseNameWithoutExt = lastDotIndex !== -1 ? fileName.slice(0, lastDotIndex) : fileName;

	// Remove any pre-existing _copy_<number> suffix
	const cleanBase = baseNameWithoutExt.replace(/_copy_\d+$/, '');

	let count = 1;
	let candidate = `${cleanBase}_copy_${count}${extension}`;

	while (existingNames.includes(candidate)) {
		count += 1;
		candidate = `${cleanBase}_copy_${count}${extension}`;
	}

	return candidate;
}
