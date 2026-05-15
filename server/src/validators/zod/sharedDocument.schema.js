import { z } from 'zod';

export const sharedDocumentUploadSchema = z.object({
  documentType: z.enum(['passport', 'medical', 'visa', 'stamping', 'orientation', 'photo'], {
    errorMap: () => ({ message: "Invalid document type. Must be one of: passport, medical, visa, stamping, orientation, photo" })
  })
});
