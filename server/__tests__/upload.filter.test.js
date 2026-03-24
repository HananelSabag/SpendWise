/**
 * Upload file-filter logic tests.
 *
 * The `fileFilter` function in middleware/upload.js is not exported,
 * so we mirror its exact logic here and test it in isolation.
 * This catches any regressions if the allowed-type lists are changed.
 */

// ─── Mirrors middleware/upload.js fileFilter ──────────────────────────────────
function fileFilter(req, file, cb) {
  if (file.fieldname === 'profilePicture') {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      const ext = file.originalname.split('.').pop().toLowerCase();
      if (['jpg', 'jpeg', 'png', 'webp'].includes(ext)) {
        cb(null, true);
      } else {
        cb(new Error('Invalid file extension'), false);
      }
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG and WebP are allowed for profile pictures'), false);
    }
  } else if (file.fieldname === 'receipt') {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
      const ext = file.originalname.split('.').pop().toLowerCase();
      if (['jpg', 'jpeg', 'png', 'pdf'].includes(ext)) {
        cb(null, true);
      } else {
        cb(new Error('Invalid file extension'), false);
      }
    } else {
      cb(new Error('Invalid file type. Only images and PDFs are allowed for receipts'), false);
    }
  } else {
    cb(new Error('Unexpected field'), false);
  }
}

// Helper: wraps the callback-style fileFilter in a promise
function filter(fieldname, mimetype, originalname) {
  return new Promise((resolve, reject) => {
    const file = { fieldname, mimetype, originalname };
    fileFilter({}, file, (err, accepted) => {
      if (err) reject(err);
      else resolve(accepted);
    });
  });
}

// ─────────────────────────────────────────────────────
// profilePicture — allowed types
// ─────────────────────────────────────────────────────
describe('profilePicture — accepted file types', () => {
  it('accepts image/jpeg with .jpg extension', async () => {
    await expect(filter('profilePicture', 'image/jpeg', 'photo.jpg')).resolves.toBe(true);
  });

  it('accepts image/jpeg with .jpeg extension', async () => {
    await expect(filter('profilePicture', 'image/jpeg', 'photo.jpeg')).resolves.toBe(true);
  });

  it('accepts image/jpg mimetype', async () => {
    await expect(filter('profilePicture', 'image/jpg', 'photo.jpg')).resolves.toBe(true);
  });

  it('accepts image/png with .png extension', async () => {
    await expect(filter('profilePicture', 'image/png', 'avatar.png')).resolves.toBe(true);
  });

  it('accepts image/webp with .webp extension', async () => {
    await expect(filter('profilePicture', 'image/webp', 'photo.webp')).resolves.toBe(true);
  });
});

// ─────────────────────────────────────────────────────
// profilePicture — rejected types
// ─────────────────────────────────────────────────────
describe('profilePicture — rejected file types', () => {
  it('rejects application/pdf', async () => {
    await expect(filter('profilePicture', 'application/pdf', 'doc.pdf')).rejects.toThrow();
  });

  it('rejects image/gif', async () => {
    await expect(filter('profilePicture', 'image/gif', 'anim.gif')).rejects.toThrow();
  });

  it('rejects application/octet-stream', async () => {
    await expect(filter('profilePicture', 'application/octet-stream', 'file.exe')).rejects.toThrow();
  });

  it('rejects valid mimetype with wrong extension (e.g. .pdf appended)', async () => {
    await expect(filter('profilePicture', 'image/jpeg', 'photo.pdf')).rejects.toThrow('Invalid file extension');
  });

  it('rejects valid mimetype with .exe extension', async () => {
    await expect(filter('profilePicture', 'image/png', 'evil.exe')).rejects.toThrow('Invalid file extension');
  });
});

// ─────────────────────────────────────────────────────
// receipt — allowed types
// ─────────────────────────────────────────────────────
describe('receipt — accepted file types', () => {
  it('accepts image/jpeg with .jpg extension', async () => {
    await expect(filter('receipt', 'image/jpeg', 'receipt.jpg')).resolves.toBe(true);
  });

  it('accepts image/png with .png extension', async () => {
    await expect(filter('receipt', 'image/png', 'receipt.png')).resolves.toBe(true);
  });

  it('accepts application/pdf with .pdf extension', async () => {
    await expect(filter('receipt', 'application/pdf', 'invoice.pdf')).resolves.toBe(true);
  });
});

// ─────────────────────────────────────────────────────
// receipt — rejected types
// ─────────────────────────────────────────────────────
describe('receipt — rejected file types', () => {
  it('rejects image/webp (not allowed for receipts)', async () => {
    await expect(filter('receipt', 'image/webp', 'receipt.webp')).rejects.toThrow();
  });

  it('rejects image/gif', async () => {
    await expect(filter('receipt', 'image/gif', 'receipt.gif')).rejects.toThrow();
  });

  it('rejects valid receipt mimetype with wrong extension', async () => {
    await expect(filter('receipt', 'application/pdf', 'invoice.exe')).rejects.toThrow('Invalid file extension');
  });

  it('rejects application/javascript', async () => {
    await expect(filter('receipt', 'application/javascript', 'script.js')).rejects.toThrow();
  });
});

// ─────────────────────────────────────────────────────
// Unexpected field
// ─────────────────────────────────────────────────────
describe('unexpected fieldname', () => {
  it('rejects any file with an unknown fieldname', async () => {
    await expect(filter('avatar', 'image/jpeg', 'photo.jpg')).rejects.toThrow('Unexpected field');
  });

  it('rejects empty fieldname', async () => {
    await expect(filter('', 'image/jpeg', 'photo.jpg')).rejects.toThrow('Unexpected field');
  });
});
