/**
 * Plainer wording for Payload's own buttons and messages, via the official
 * `i18n.translations` override (deep-merged over Payload's English strings).
 * Only keys that exist in @payloadcms/translations 3.90 are listed.
 */
export const adminTranslations = {
  en: {
    authentication: {
      login: 'Log in',
      logout: 'Log out',
      account: 'Your account',
      changePassword: 'Change password',
      forceUnlock: 'Unlock account',
    },
    general: {
      createNew: 'Add new',
      createNewLabel: 'Add new {{label}}',
      createdAt: 'Added',
      updatedAt: 'Last changed',
      lastModified: 'Last changed',
      noResults: 'No {{label}} yet, or none match your search.',
      noResultsDescription: 'Nothing here yet, or nothing matches your search.',
      // Shown after "Publish changes", and after Save where there are no drafts (Site settings, Images).
      updatedSuccessfully: 'Saved. It will be live on your website within seconds.',
      payloadSettings: 'Preferences',
      // Empty cells in lists read "<No Title (optional)>" by default.
      noLabel: '—',
    },
    fields: {
      chooseFromExisting: 'Choose from library',
    },
    upload: {
      selectFile: 'Choose a file',
      fileName: 'File',
      pasteURL: 'Paste a link',
      // Shown after the word "or".
      dragAndDrop: 'drag a file here',
    },
    version: {
      saveDraft: 'Save draft',
      changed: 'Unpublished changes',
      draftHasPublishedVersion: 'Draft (a published version is live)',
      lastSavedAgo: 'Draft saved {{distance}} ago',
      autosavedSuccessfully: 'Draft saved.',
      draftSavedSuccessfully: 'Draft saved. Press “Publish changes” when you’re ready to put it live.',
      revertToPublished: 'Discard unpublished changes',
      aboutToRevertToPublished:
        'This throws away your unpublished changes and goes back to what is live on the website now. Are you sure?',
      versions: 'History',
      restoreThisVersion: 'Bring back this version',
      restoreAsDraft: 'Bring back as a draft',
    },
  },
}
